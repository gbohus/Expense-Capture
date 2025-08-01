/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @description NetSuite LLM integration for AI NS Expense Capture system
 */

define(['N/llm', 'N/log', 'N/search', './AINS_LIB_Common'],
function(llm, log, search, commonLib) {

    const CONSTANTS = commonLib.CONSTANTS;

    /**
     * Process OCR data using NetSuite LLM to format expense information
     * @param {Object} ocrData - Raw OCR data from OCI Document Understanding
     * @param {Object} options - Processing options
     * @param {Array} [options.expenseCategories] - Available expense categories
     * @returns {Object} Structured expense data formatted by LLM
     * @note Model is configured via script parameter LLM_MODEL (e.g., 'COHERE_COMMAND_R')
     */
    function processExpenseDataWithLLM(ocrData, options = {}) {
        const trackingId = commonLib.generateTrackingId();

        try {
            commonLib.logOperation('processExpenseDataWithLLM_start', {
                trackingId: trackingId,
                hasOcrData: !!ocrData,
                ocrDataKeys: ocrData ? Object.keys(ocrData) : []
            });

            // Get expense categories if not provided
            const expenseCategories = options.expenseCategories || commonLib.getExpenseCategories();

            // Build chat-based prompt with OCR data and categories
            const promptData = buildExpenseProcessingPrompt(ocrData, expenseCategories);

                                    // Get model from script parameter (try both Map/Reduce and Scheduled Script parameter names)
            let modelFromParam = commonLib.getScriptParameter(CONSTANTS.SCRIPT_PARAMS.LLM_MODEL, null);
            if (!modelFromParam) {
                modelFromParam = commonLib.getScriptParameter(CONSTANTS.SCRIPT_PARAMS.SS_LLM_MODEL, null);
            }

            // Configure LLM parameters
            const llmOptions = {
                // Use concatenated prompt for NetSuite LLM compatibility
                // (NetSuite may not support chat history format yet)
                prompt: promptData.concatenatedPrompt,
                modelFamily: getLLMModelFamily(modelFromParam),
                modelParameters: {
                    maxTokens: 1000, // Increased for thinking block + JSON response
                    temperature: 0.1,
                    topK: 3,
                    topP: 0.7,
                    frequencyPenalty: 0.2,
                    presencePenalty: 0
                }
            };

            // TODO: When NetSuite supports chat history format, uncomment below:
            // if (llm.supportsChatHistory) {
            //     llmOptions.messages = promptData.chatHistory;
            //     delete llmOptions.prompt;
            // }

            // Add documents if available for RAG
            const documents = createDocumentsFromOCRData(ocrData);
            if (documents.length > 0) {
                llmOptions.documents = documents;
            }

            // Call NetSuite LLM
            const response = llm.generateText(llmOptions);

            // Debug logging for LLM response
            log.debug('processExpenseDataWithLLM', `Raw LLM response: ${response.text}`);

            // Parse and validate LLM response
            const parsedData = parseExpenseDataFromLLMResponse(response.text, expenseCategories);

            // Debug logging for parsed data
            log.debug('processExpenseDataWithLLM', `Parsed LLM data: ${JSON.stringify(parsedData)}`);

            const finalData = parsedData;

            commonLib.logOperation('processExpenseDataWithLLM_success', {
                trackingId: trackingId,
                hasVendor: !!finalData.vendor,
                hasAmount: !!finalData.amount,
                hasDate: !!finalData.date,
                hasCategory: !!finalData.categoryId,
                confidence: finalData.confidence,
                modelUsed: response.model
            });

            return {
                success: true,
                trackingId: trackingId,
                expenseData: finalData,
                rawLLMResponse: response.text,
                rawLLMRequest: promptData.concatenatedPrompt,
                chatHistory: promptData.chatHistory, // For future chat-based API support
                model: response.model,
                citations: response.citations || []
            };

        } catch (error) {
            commonLib.logOperation('processExpenseDataWithLLM_error', {
                trackingId: trackingId,
                error: error.message
            }, 'error');

            return {
                success: false,
                trackingId: trackingId,
                error: commonLib.formatErrorMessage(error),
                rawError: error
            };
        }
    }

    /**
     * Build comprehensive prompt for expense processing using chat-based format
     * @param {Object} ocrData - OCR extracted data
     * @param {Array} expenseCategories - Available expense categories
     * @returns {Object} Chat history array with system and user messages
     */
    function buildExpenseProcessingPrompt(ocrData, expenseCategories) {
        const categoryList = expenseCategories.map(cat =>
            `${cat.id}: ${cat.name}${cat.description ? ` (${cat.description})` : ''}`
        ).join('\n');

        // System message - establishes role and rules
        const systemMessageContent = `### ROLE & GOAL
You are an automated expense processing system for NetSuite, designed to act as an expert financial controller. Your primary goal is to analyze raw OCR data from receipts and extract structured, audit-ready expense data with extreme precision and business acumen.

### CORE INSTRUCTIONS
1.  **Analyze the User's Input**: The user will provide raw OCR data and a list of valid expense categories.
2.  **Think Step-by-Step**: Before generating the final JSON, you MUST first perform a step-by-step analysis within a <thinking> block. This is your internal scratchpad and is a mandatory first step.
    -   **Vendor Identification**: Scrutinize the OCR data to find the true merchant name. State which text you are selecting and why you are ignoring payment processors (e.g., "SQ *", "Stripe").
    -   **Amount Extraction**: Identify all monetary values. Select the final, all-inclusive total (including tax and tip). State which value you've chosen and why.
    -   **Date Determination**: Find all dates. Select the most plausible transaction date and format it as YYYY-MM-DD.
    -   **Categorization Logic**: Based on the vendor and line-item details, determine the most fitting category from the provided list. Justify your choice.
    -   **Confidence Assessment**: Based on the clarity of the data, determine a confidence score using the scale below and briefly justify it.
3.  **Generate Final JSON**: After your analysis in the <thinking> block, construct the final JSON object. This object must be the *only* thing you output after the <thinking> block.

### EXTRACTION & BUSINESS RULES

**Vendor Analysis:**
-   **PRIORITIZE**: The most prominent, recognizable business name.
-   **IGNORE**: Payment gateways ("SQ *", "PYMT", "Stripe"), POS system names ("Toast", "Square"), and generic terminal IDs.
-   **FALLBACK**: If no clear name exists, use the most descriptive text available from the top of the receipt.

**Amount Intelligence:**
-   **TARGET**: The "Grand Total", "Total", "Amount Paid", or the largest, final figure.
-   **INCLUDE**: All taxes, tips, and service charges.
-   **DISREGARD**: Currency symbols (£, $, €) or commas in the number. Parse only the numeric value.

**Date Precision:**
-   **TARGET**: The primary transaction or purchase date.
-   **FORMAT**: Strictly YYYY-MM-DD.

**Smart Categorization:**
-   **PRIMARY CUE**: The vendor's industry (e.g., "Home Depot" -> "Building Supplies").
-   **SECONDARY CUE**: Analyze line-item descriptions for keywords. A receipt from "Shell" listing "SNACKS" and "DRINK" should be categorized as "Meals", not "Fuel".
-   **HIERARCHY**: Always prefer the most specific category available. If unsure between two, choose the more general parent category if available.

**Description Generation:**
-   Create a concise, professional summary (3-6 words).
-   Format: "[Vendor Name] [Primary Item/Purpose]" (e.g., "Starbucks Coffee Meeting", "Uber ride to airport").

### OUTPUT REQUIREMENTS

**1. Thinking Scratchpad (MANDATORY):**
First, output your internal monologue inside a <thinking> block.
<thinking>
[Your step-by-step analysis and reasoning goes here.]
</thinking>

**2. Final JSON Object (STRICTLY a single JSON object):**
After the thinking block, you MUST return ONLY the JSON object below. Do not add any other text or explanations. Ensure all fields are populated. Do not use null or empty strings.

{
    "vendor": "string",
    "amount": number,
    "date": "string (YYYY-MM-DD)",
    "categoryId": "string (Exact ID from list)",
    "description": "string (3-6 words)",
    "confidence": number (0.0-1.0),
    "reasoning": "string (Client-facing summary of your choices)"
}

**CONFIDENCE SCALE (0.0 - 1.0):**
-   **0.9 - 1.0 (High):** All data is perfectly clear and unambiguous.
-   **0.7 - 0.8 (Good):** Most data is clear, but one field required minor interpretation.
-   **0.5 - 0.6 (Medium):** Significant ambiguity in one or more fields, but a logical choice was made.
-   **0.3 - 0.4 (Low):** Key data is unclear or inferred from poor quality OCR. A best-effort guess was made.`;

        // User message - contains the specific data to analyze
        const confidenceGuidance = buildConfidenceGuidanceSection(ocrData);
        const userMessageContent = `### DATA FOR ANALYSIS

**1. EXTRACTED OCR DATA:**
\`\`\`json
${JSON.stringify(ocrData, null, 2)}
\`\`\`

${confidenceGuidance ? `**2. DATA CONFIDENCE GUIDANCE:**
${confidenceGuidance}

` : ''}**${confidenceGuidance ? '3' : '2'}. AVAILABLE EXPENSE CATEGORIES:**
\`\`\`
${categoryList}
\`\`\`

Begin your analysis. First, provide your reasoning inside the <thinking> block, then provide the final JSON object.`;

        // Return chat history format for better LLM performance
        return {
            chatHistory: [
                {
                    role: "system",
                    content: systemMessageContent
                },
                {
                    role: "user",
                    content: userMessageContent
                }
            ],
            // Also return concatenated version for compatibility with single-prompt APIs
            concatenatedPrompt: `${systemMessageContent}\n\n### USER REQUEST:\n${userMessageContent}`
        };
    }

    /**
     * Build confidence guidance section for LLM prompt
     * @param {Object} ocrData - Enhanced OCR data with confidence guidance
     * @returns {string} Confidence guidance section
     */
    function buildConfidenceGuidanceSection(ocrData) {
        if (!ocrData.confidenceGuidance) {
            return '';
        }

        const { highConfidenceFields, lowConfidenceFields, fieldReliability } = ocrData.confidenceGuidance;

        let guidance = 'DATA CONFIDENCE GUIDANCE:\n';

        if (highConfidenceFields.length > 0) {
            guidance += `HIGH CONFIDENCE FIELDS (reliable): ${highConfidenceFields.join(', ')}\n`;
        }

        if (lowConfidenceFields.length > 0) {
            guidance += `LOW CONFIDENCE FIELDS (verify carefully): ${lowConfidenceFields.join(', ')}\n`;
        }

        // Add field-specific reliability notes
        if (Object.keys(fieldReliability).length > 0) {
            guidance += 'FIELD RELIABILITY:\n';
            Object.entries(fieldReliability).forEach(([field, reliability]) => {
                guidance += `- ${field}: ${reliability} confidence\n`;
            });
        }

        guidance += '\nPROCESSING INSTRUCTIONS:\n';
        guidance += '- Prioritize high confidence fields when they conflict with low confidence fields\n';
        guidance += '- Use fallback text analysis for missing or low confidence structured fields\n';
        guidance += '- Adjust your overall confidence score based on data reliability\n';

        return guidance;
    }

    /**
     * Create documents from OCR data for RAG processing
     * @param {Object} ocrData - OCR data
     * @returns {Array} Array of document objects for LLM
     */
    function createDocumentsFromOCRData(ocrData) {
        const documents = [];

        try {
            if (ocrData && typeof ocrData === 'object') {
                // Create document from structured OCR data
                documents.push(llm.createDocument({
                    id: "ocr_data",
                    data: JSON.stringify(ocrData, null, 2)
                }));

                // If there's raw text data, create a separate document
                if (ocrData.rawText || ocrData.extractedText) {
                    documents.push(llm.createDocument({
                        id: "raw_text",
                        data: ocrData.rawText || ocrData.extractedText
                    }));
                }
            }
        } catch (error) {
            log.error('createDocumentsFromOCRData', `Error creating documents: ${error.message}`);
        }

        return documents;
    }

    /**
     * Extract JSON from LLM response that includes thinking blocks
     * @param {string} responseText - Raw LLM response
     * @returns {string} Extracted JSON string
     */
    function extractJSONFromThinkingResponse(responseText) {
        try {
            // Check if response contains thinking blocks
            if (responseText.includes('<thinking>') && responseText.includes('</thinking>')) {
                // Extract everything after the closing thinking tag
                const thinkingEndIndex = responseText.lastIndexOf('</thinking>');
                if (thinkingEndIndex !== -1) {
                    let jsonPart = responseText.substring(thinkingEndIndex + '</thinking>'.length).trim();

                    // If the JSON is wrapped in code blocks, extract it
                    const jsonBlockMatch = jsonPart.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                    if (jsonBlockMatch) {
                        return jsonBlockMatch[1].trim();
                    }

                    // Look for the first JSON object in the text
                    const jsonMatch = jsonPart.match(/(\{[\s\S]*?\})/);
                    if (jsonMatch) {
                        return jsonMatch[1].trim();
                    }

                    return jsonPart;
                }
            }

            // If no thinking blocks, try to extract JSON directly
            const jsonBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (jsonBlockMatch) {
                return jsonBlockMatch[1].trim();
            }

            // Look for the first JSON object in the text
            const jsonMatch = responseText.match(/(\{[\s\S]*?\})/);
            if (jsonMatch) {
                return jsonMatch[1].trim();
            }

            return responseText;

        } catch (error) {
            log.debug('extractJSONFromThinkingResponse', `Error extracting JSON: ${error.message}`);
            return responseText; // Fallback to original text
        }
    }

    /**
     * Parse expense data from LLM response
     * @param {string} responseText - LLM response text
     * @param {Array} expenseCategories - Available expense categories for validation
     * @returns {Object} Parsed expense data
     */
    function parseExpenseDataFromLLMResponse(responseText, expenseCategories) {
        try {
            // Clean response text (remove any markdown formatting)
            let cleanResponse = responseText.trim();

            // Extract JSON from thinking block format
            cleanResponse = extractJSONFromThinkingResponse(cleanResponse);

            // Remove code block markers if present
            cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

            // Try to parse JSON
            const parsedData = JSON.parse(cleanResponse);

            // Debug logging for raw parsed data
            log.debug('parseExpenseDataFromLLMResponse', `Raw parsed JSON: ${JSON.stringify(parsedData)}`);
            log.debug('parseExpenseDataFromLLMResponse', `Raw categoryId from LLM: "${parsedData.categoryId}" (type: ${typeof parsedData.categoryId})`);

            // Validate required fields
            const requiredFields = ['vendor', 'amount', 'date', 'categoryId', 'description', 'confidence'];
            const validation = commonLib.validateRequiredFields(parsedData, requiredFields);

            if (!validation.isValid) {
                throw new Error(`Missing required fields: ${validation.missingFields.join(', ')}`);
            }

            // Validate and format data
            const formattedData = {
                vendor: validateAndFormatVendor(parsedData.vendor),
                amount: validateAndFormatAmount(parsedData.amount),
                date: validateAndFormatDate(parsedData.date),
                categoryId: validateAndFormatCategory(parsedData.categoryId, expenseCategories),
                description: validateAndFormatDescription(parsedData.description),
                confidence: validateAndFormatConfidence(parsedData.confidence)
            };

            return formattedData;

        } catch (error) {
            log.error('parseExpenseDataFromLLMResponse', `Error parsing LLM response: ${error.message}`);

            // Return fallback data structure
            return {
                vendor: 'Unknown Vendor',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                categoryId: getDefaultCategoryId(expenseCategories),
                description: 'Expense requiring manual review',
                confidence: 0.1
            };
        }
    }

    /**
     * Validate and format vendor name
     * @param {string} vendor - Raw vendor value
     * @returns {string} Formatted vendor name
     */
    function validateAndFormatVendor(vendor) {
        if (!vendor || typeof vendor !== 'string') {
            return 'Unknown Vendor';
        }

        return vendor.trim().substring(0, 100); // Limit length
    }

    /**
     * Validate and format amount
     * @param {number|string} amount - Raw amount value
     * @returns {number} Formatted amount
     */
    function validateAndFormatAmount(amount) {
        const numAmount = parseFloat(amount);

        if (isNaN(numAmount) || numAmount <= 0) {
            return 0;
        }

        return Math.round(numAmount * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Validate and format date
     * @param {string} date - Raw date value
     * @returns {string} Formatted date in YYYY-MM-DD format
     */
    function validateAndFormatDate(date) {
        try {
            // Try to parse the date
            const parsedDate = new Date(date);

            if (isNaN(parsedDate.getTime())) {
                throw new Error('Invalid date');
            }

            // Return in YYYY-MM-DD format
            return parsedDate.toISOString().split('T')[0];

        } catch (error) {
            // Default to today's date
            return new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Validate and format expense category
     * @param {string} categoryId - Raw category ID
     * @param {Array} expenseCategories - Available categories
     * @returns {string} Valid category ID
     */
    function validateAndFormatCategory(categoryId, expenseCategories) {
        // Debug logging
        log.debug('validateAndFormatCategory', `Input categoryId: "${categoryId}" (type: ${typeof categoryId})`);
        log.debug('validateAndFormatCategory', `Available categories: ${JSON.stringify(expenseCategories.map(c => ({id: c.id, name: c.name, idType: typeof c.id})))}`);

        if (!categoryId || !expenseCategories || expenseCategories.length === 0) {
            log.debug('validateAndFormatCategory', 'Returning default category due to missing categoryId or expenseCategories');
            return getDefaultCategoryId(expenseCategories);
        }

        // Check if provided category ID exists
        const category = expenseCategories.find(cat => String(cat.id) === String(categoryId));
        log.debug('validateAndFormatCategory', `Direct ID match for "${String(categoryId)}": ${category ? `Found ${category.name}` : 'Not found'}`);

        if (category) {
            log.debug('validateAndFormatCategory', `Returning matched category ID: ${String(categoryId)}`);
            return String(categoryId);
        }

        // Try to find by name (case insensitive)
        const categoryByName = expenseCategories.find(cat =>
            cat.name.toLowerCase() === String(categoryId).toLowerCase()
        );
        log.debug('validateAndFormatCategory', `Name match for "${String(categoryId)}": ${categoryByName ? `Found ${categoryByName.name} (ID: ${categoryByName.id})` : 'Not found'}`);

        if (categoryByName) {
            log.debug('validateAndFormatCategory', `Returning category ID by name match: ${categoryByName.id}`);
            return categoryByName.id;
        }

        // Default to first available category
        const defaultCategoryId = getDefaultCategoryId(expenseCategories);
        log.debug('validateAndFormatCategory', `No match found, returning default category ID: ${defaultCategoryId}`);
        return defaultCategoryId;
    }

    /**
     * Validate and format description
     * @param {string} description - Raw description
     * @returns {string} Formatted description
     */
    function validateAndFormatDescription(description) {
        if (!description || typeof description !== 'string') {
            return 'Business Expense';
        }

        return description.trim().substring(0, 500); // Limit length
    }

    /**
     * Validate and format confidence score
     * @param {number|string} confidence - Raw confidence value
     * @returns {number} Formatted confidence between 0 and 1
     */
    function validateAndFormatConfidence(confidence) {
        const numConfidence = parseFloat(confidence);

        if (isNaN(numConfidence)) {
            return 0.5; // Default medium confidence
        }

        // Ensure between 0 and 1
        return Math.max(0, Math.min(1, numConfidence));
    }



    /**
     * Get default category ID from available categories
     * @param {Array} expenseCategories - Available categories
     * @returns {string} Default category ID
     */
    function getDefaultCategoryId(expenseCategories) {
        if (!expenseCategories || expenseCategories.length === 0) {
            return '1'; // Fallback ID
        }

        // Look for common default categories
        const defaultNames = ['general', 'miscellaneous', 'other', 'business'];

        for (let defaultName of defaultNames) {
            const category = expenseCategories.find(cat =>
                cat.name.toLowerCase().includes(defaultName)
            );
            if (category) {
                return category.id;
            }
        }

        // Return first available category
        return expenseCategories[0].id;
    }

    /**
     * Get LLM model family from enum string name
     * @param {string} modelEnumName - Model enum name (e.g., 'COHERE_COMMAND_R')
     * @returns {string} LLM model family constant
     * @throws {Error} If model enum name is not supported
     */
    function getLLMModelFamily(modelEnumName) {
        if (!modelEnumName) {
            throw new Error('Model enum name is required. Please set the LLM_MODEL script parameter.');
        }

        const enumName = modelEnumName.toUpperCase();

        switch (enumName) {
            case 'COHERE_COMMAND_R':
                return llm.ModelFamily.COHERE_COMMAND_R;
            case 'COHERE_COMMAND_R_PLUS':
                return llm.ModelFamily.COHERE_COMMAND_R_PLUS;
            case 'COHERE_COMMAND_A':
                return llm.ModelFamily.COHERE_COMMAND_A;
            case 'META_LLAMA':
                return llm.ModelFamily.META_LLAMA;
            case 'META_LLAMA_VISION':
                return llm.ModelFamily.META_LLAMA_VISION;
            case 'COHERE_EMBED_ENGLISH':
                return llm.ModelFamily.COHERE_EMBED_ENGLISH;
            case 'COHERE_EMBED_MULTILINGUAL':
                return llm.ModelFamily.COHERE_EMBED_MULTILINGUAL;
            case 'COHERE_EMBED_ENGLISH_LIGHT':
                return llm.ModelFamily.COHERE_EMBED_ENGLISH_LIGHT;
            case 'COHERE_EMBED_MULTILINGUAL_LIGHT':
                return llm.ModelFamily.COHERE_EMBED_MULTILINGUAL_LIGHT;
            case 'OPENAI_GPT':
                return llm.ModelFamily.OPENAI_GPT;
            case 'OPENAI_GPT_MINI':
                return llm.ModelFamily.OPENAI_GPT_MINI;
            case 'OPENAI_GPT_NANO':
                return llm.ModelFamily.OPENAI_GPT_NANO;
            case 'OPENAI_O1':
                return llm.ModelFamily.OPENAI_O1;
            case 'OPENAI_O3_MINI':
                return llm.ModelFamily.OPENAI_O3_MINI;
            case 'OPENAI_GPT_OMNI':
                return llm.ModelFamily.OPENAI_GPT_OMNI;
            case 'OPENAI_GPT_OMNI_MINI':
                return llm.ModelFamily.OPENAI_GPT_OMNI_MINI;
            default:
                throw new Error(`Unsupported model: ${modelEnumName}. Please check the script parameter help for valid model values.`);
        }
    }

    /**
     * Create expense processing prompt for different scenarios
     * @param {string} scenario - Processing scenario (standard, review, category_only)
     * @param {Object} data - Data for the scenario
     * @param {Array} categories - Available categories
     * @returns {Object} Specialized prompt with chat history and concatenated formats
     */
    function createSpecializedPrompt(scenario, data, categories) {
        const categoryList = categories.map(cat => `${cat.id}: ${cat.name}`).join('\n');

        let systemMessage, userMessage;

        switch (scenario) {
            case 'category_only':
                systemMessage = `You are a business expense categorization expert. Your task is to analyze expense data and assign the most appropriate category ID from the provided list. You must return ONLY the category ID - no other text, explanations, or formatting.`;
                userMessage = `DATA: ${JSON.stringify(data, null, 2)}

CATEGORIES:
${categoryList}

Return only the category ID (just the ID, no other text).`;
                break;

            case 'review':
                systemMessage = `You are an expense data quality reviewer. Your task is to review and improve expense data by fixing obvious errors while maintaining the same JSON structure. Focus on correcting vendor names, amounts, dates, and category assignments.`;
                userMessage = `CURRENT DATA: ${JSON.stringify(data, null, 2)}

CATEGORIES:
${categoryList}

Fix any obvious errors and return improved JSON with same structure.`;
                break;

            default:
                return buildExpenseProcessingPrompt(data, categories);
        }

        const chatHistory = [
            {
                role: "system",
                content: systemMessage
            },
            {
                role: "user",
                content: userMessage
            }
        ];

        return {
            chatHistory: chatHistory,
            concatenatedPrompt: `${systemMessage}\n\n### USER REQUEST:\n${userMessage}`
        };
    }

    /**
     * Get LLM usage statistics
     * @returns {Object} Usage statistics
     */
    function getLLMUsageStats() {
        try {
            const remainingUsage = llm.getRemainingFreeUsage();
            const remainingEmbedUsage = llm.getRemainingFreeEmbedUsage();

            return {
                remainingTextGeneration: remainingUsage,
                remainingEmbedding: remainingEmbedUsage,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            log.error('getLLMUsageStats', `Error getting usage stats: ${error.message}`);
            return {
                remainingTextGeneration: 'Unknown',
                remainingEmbedding: 'Unknown',
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Simplified wrapper for backward compatibility
     * @param {Object} expenseData - Extracted expense data from OCR
     * @param {Array} expenseCategories - Optional expense categories (legacy parameter, will be fetched internally)
     * @returns {Object} Processing results
     */
    function processWithLLM(expenseData, expenseCategories) {
        // Call the main function with simplified parameters
        const options = expenseCategories ? { expenseCategories: expenseCategories } : {};
        return processExpenseDataWithLLM(expenseData, options);
    }

    // Public interface
    return {
        processExpenseDataWithLLM: processExpenseDataWithLLM,
        processWithLLM: processWithLLM, // Backward compatibility alias
        parseExpenseDataFromLLMResponse: parseExpenseDataFromLLMResponse,
        extractJSONFromThinkingResponse: extractJSONFromThinkingResponse,
        buildExpenseProcessingPrompt: buildExpenseProcessingPrompt,
        buildConfidenceGuidanceSection: buildConfidenceGuidanceSection,
        createSpecializedPrompt: createSpecializedPrompt,
        getLLMUsageStats: getLLMUsageStats,
        validateAndFormatVendor: validateAndFormatVendor,
        validateAndFormatAmount: validateAndFormatAmount,
        validateAndFormatDate: validateAndFormatDate,
        validateAndFormatCategory: validateAndFormatCategory
    };
});