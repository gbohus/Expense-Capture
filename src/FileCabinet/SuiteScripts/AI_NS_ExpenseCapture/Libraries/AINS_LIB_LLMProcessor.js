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
     * @param {string} [options.model] - LLM model to use (defaults to Command R)
     * @param {Array} [options.expenseCategories] - Available expense categories
     * @param {number} [options.confidenceThreshold] - Minimum confidence threshold
     * @returns {Object} Structured expense data formatted by LLM
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

            // Create chat history with OCR data and confidence guidance as first user message
            const confidenceGuidance = buildConfidenceGuidanceSection(ocrData);
            const chatHistory = [
                llm.createChatMessage({
                    role: llm.ChatRole.USER,
                    text: `Please analyze this receipt/expense data:\n\n${JSON.stringify(ocrData, null, 2)}${confidenceGuidance}`
                })
            ];

            // Build instructions-only prompt (no OCR data embedded)
            const prompt = buildExpenseProcessingPrompt(expenseCategories);

            // Configure LLM parameters
            const llmOptions = {
                prompt: prompt,
                chatHistory: chatHistory,
                modelFamily: getLLMModelFamily(options.model),
                modelParameters: {
                    maxTokens: 500,
                    temperature: 0.1,
                    topK: 3,
                    topP: 0.7,
                    frequencyPenalty: 0.2,
                    presencePenalty: 0
                }
            };

            // Create complete LLM request object for logging
            const completeRequest = {
                prompt: prompt,
                chatHistory: chatHistory.map(msg => ({
                    role: msg.role,
                    text: msg.text
                })),
                modelFamily: llmOptions.modelFamily,
                modelParameters: llmOptions.modelParameters,
                timestamp: new Date().toISOString(),
                trackingId: trackingId
            };

            // Call NetSuite LLM
            const response = llm.generateText(llmOptions);

            // Debug logging for LLM response
            log.debug('processExpenseDataWithLLM', `Raw LLM response: ${response.text}`);

            // Parse and validate LLM response
            const parsedData = parseExpenseDataFromLLMResponse(response.text, expenseCategories);

            // Debug logging for parsed data
            log.debug('processExpenseDataWithLLM', `Parsed LLM data: ${JSON.stringify(parsedData)}`);

            // Apply confidence threshold
            const confidenceThreshold = options.confidenceThreshold ||
                commonLib.getScriptParameter(CONSTANTS.SCRIPT_PARAMS.CONFIDENCE_THRESHOLD,
                    CONSTANTS.DEFAULT_VALUES.CONFIDENCE_THRESHOLD);

            const finalData = applyConfidenceThreshold(parsedData, confidenceThreshold);

            commonLib.logOperation('processExpenseDataWithLLM_success', {
                trackingId: trackingId,
                hasVendor: !!finalData.vendor,
                hasAmount: !!finalData.amount,
                hasDate: !!finalData.date,
                hasCategory: !!finalData.categoryId,
                confidence: finalData.confidence,
                modelUsed: response.model,
                requestParameters: {
                    temperature: llmOptions.modelParameters.temperature,
                    maxTokens: llmOptions.modelParameters.maxTokens,
                    topK: llmOptions.modelParameters.topK,
                    topP: llmOptions.modelParameters.topP
                }
            });

            // Create JSON string first, then format it for display
            const jsonString = JSON.stringify(completeRequest, null, 2);
            const formattedJsonString = formatTextForNetSuiteDisplay(jsonString);

            return {
                success: true,
                trackingId: trackingId,
                expenseData: finalData,
                rawLLMResponse: response.text,
                rawLLMRequest: formattedJsonString,
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
     * Build comprehensive prompt for expense processing
     * @param {Array} expenseCategories - Available expense categories
     * @returns {string} Formatted prompt for LLM
     */
    function buildExpenseProcessingPrompt(expenseCategories) {
        const categoryList = expenseCategories.map(cat =>
            `${cat.id}: ${cat.name}${cat.description ? ` (${cat.description})` : ''}`
        ).join('\n');

        const prompt = `You are a NetSuite expense processing assistant. Analyze the receipt data from the previous message and extract business expense information.

AVAILABLE EXPENSE CATEGORIES:
${categoryList}

EXTRACTION RULES:
• **Vendor**: Business name only (not payment processors like "SQ *")
• **Amount**: Final total including tax/tips (not subtotals)
• **Date**: Transaction date in YYYY-MM-DD format
• **Category**: Match vendor type to most appropriate category ID
• **Description**: Clear 3-6 word summary
• **Confidence**: Score 0.0-1.0 based on data clarity (1.0 = highest confidence)

CATEGORY EXAMPLES:
• Restaurants → Meals & Entertainment
• Gas stations/Airlines/Uber → Travel & Transportation
• Hotels → Travel/Lodging
• Software/subscriptions → Technology
• When uncertain, choose the most general applicable category

RESPONSE FORMAT (JSON only):
{
    "vendor": "clean business name",
    "amount": 0.00,
    "date": "YYYY-MM-DD",
    "categoryId": "exact category ID",
    "description": "brief expense summary",
    "confidence": 0.95,
    "reasoning": "brief category explanation"
}

QUALITY STANDARDS:
• High confidence (0.8+): All fields clear and obvious
• Medium confidence (0.5-0.8): Most fields clear, some interpretation needed
• Low confidence (0.3-0.5): Several fields unclear but reasonable assumptions possible
• Always provide best estimates - no null values

Return only the JSON object.`;

        return prompt;
    }

    /**
     * Build confidence guidance section for chat history
     * @param {Object} ocrData - Enhanced OCR data with confidence guidance
     * @returns {string} Confidence guidance section for chat message
     */
    function buildConfidenceGuidanceSection(ocrData) {
        if (!ocrData.confidenceGuidance) {
            return '';
        }

        const { highConfidenceFields, lowConfidenceFields, fieldReliability } = ocrData.confidenceGuidance;

        let guidance = '\n\nDATA CONFIDENCE GUIDANCE:\n';

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
     * Parse expense data from LLM response
     * @param {string} responseText - LLM response text
     * @param {Array} expenseCategories - Available expense categories for validation
     * @returns {Object} Parsed expense data
     */
    function parseExpenseDataFromLLMResponse(responseText, expenseCategories) {
        try {
            // Clean response text (remove any markdown formatting)
            let cleanResponse = responseText.trim();

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
                confidence: 0.1 // Low confidence for fallback data
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
     * @param {number|string} confidence - Raw confidence value (0.0-1.0 from LLM)
     * @returns {number} Formatted confidence between 0 and 1
     */
    function validateAndFormatConfidence(confidence) {
        const numConfidence = parseFloat(confidence);

        if (isNaN(numConfidence)) {
            return 0.5; // Default medium confidence
        }

        // Ensure between 0 and 1 (LLM now correctly returns 0.0-1.0 range)
        return Math.max(0, Math.min(1, numConfidence));
    }

    /**
     * Apply confidence threshold to expense data
     * @param {Object} expenseData - Processed expense data
     * @param {number} threshold - Confidence threshold
     * @returns {Object} Expense data with confidence applied
     */
    function applyConfidenceThreshold(expenseData, threshold) {
        const result = { ...expenseData };

        // If overall confidence is below threshold, flag for manual review
        if (result.confidence < threshold) {
            result.requiresReview = true;
            result.reviewReason = `Confidence (${result.confidence.toFixed(2)}) below threshold (${threshold})`;
        } else {
            result.requiresReview = false;
        }

        return result;
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
     * Get LLM model family from string
     * @param {string} model - Model name
     * @returns {string} LLM model family constant
     */
    function getLLMModelFamily(model) {
        const modelName = (model || 'command-r').toLowerCase();

        switch (modelName) {
            case 'command-r':
            case 'cohere-command-r':
                return llm.ModelFamily.COHERE_COMMAND_R;
            case 'llama':
            case 'meta-llama':
                return llm.ModelFamily.META_LLAMA_3_1_70B_INSTRUCT;
            default:
                return llm.ModelFamily.COHERE_COMMAND_R; // Default to Command R
        }
    }

    /**
     * Create expense processing prompt for different scenarios
     * @param {string} scenario - Processing scenario (standard, review, category_only)
     * @param {Object} data - Data for the scenario
     * @param {Array} categories - Available categories
     * @returns {string} Specialized prompt
     */
    function createSpecializedPrompt(scenario, data, categories) {
        const categoryList = categories.map(cat => `${cat.id}: ${cat.name}`).join('\n');

        switch (scenario) {
            case 'category_only':
                return `Analyze this expense data and assign the most appropriate category:

DATA: ${JSON.stringify(data, null, 2)}

CATEGORIES:
${categoryList}

Return only the category ID (just the ID, no other text).`;

            case 'review':
                return `Review and improve this expense data:

CURRENT DATA: ${JSON.stringify(data, null, 2)}

CATEGORIES:
${categoryList}

Fix any obvious errors and return improved JSON with same structure.`;

            default:
                return buildExpenseProcessingPrompt(categories);
        }
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
     * Format text for NetSuite display by converting escape sequences to actual characters
     * @param {string} text - Text with escape sequences
     * @returns {string} Formatted text with actual line breaks and characters
     */
    function formatTextForNetSuiteDisplay(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        return text
            .replace(/\\n/g, '\n')        // Convert \n to actual line breaks
            .replace(/\\t/g, '\t')        // Convert \t to actual tabs
            .replace(/\\r/g, '\r')        // Convert \r to carriage returns
            .replace(/\\"/g, '"')         // Convert \" to actual quotes
            .replace(/\\'/g, "'")         // Convert \' to actual single quotes
            .replace(/\\\\/g, '\\');      // Convert \\ to actual backslashes
    }

    /**
     * Format entire object for NetSuite display, recursively converting text fields
     * @param {Object} obj - Object to format
     * @param {Array} textFields - Array of field names to format (optional)
     * @returns {Object} Object with formatted text fields
     */
    function formatObjectForNetSuiteDisplay(obj, textFields = ['prompt', 'text', 'description', 'message']) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        const formatted = {};

        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];

                if (textFields.includes(key) && typeof value === 'string') {
                    // Format text fields
                    formatted[key] = formatTextForNetSuiteDisplay(value);
                } else if (Array.isArray(value)) {
                    // Recursively format arrays
                    formatted[key] = value.map(item =>
                        typeof item === 'object' ? formatObjectForNetSuiteDisplay(item, textFields) :
                        typeof item === 'string' && textFields.includes('text') ? formatTextForNetSuiteDisplay(item) : item
                    );
                } else if (typeof value === 'object' && value !== null) {
                    // Recursively format objects
                    formatted[key] = formatObjectForNetSuiteDisplay(value, textFields);
                } else {
                    // Keep other values as-is
                    formatted[key] = value;
                }
            }
        }

        return formatted;
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
        buildExpenseProcessingPrompt: buildExpenseProcessingPrompt,
        createSpecializedPrompt: createSpecializedPrompt,
        getLLMUsageStats: getLLMUsageStats,
        validateAndFormatVendor: validateAndFormatVendor,
        validateAndFormatAmount: validateAndFormatAmount,
        validateAndFormatDate: validateAndFormatDate,
        validateAndFormatCategory: validateAndFormatCategory,
        formatTextForNetSuiteDisplay: formatTextForNetSuiteDisplay,
        formatObjectForNetSuiteDisplay: formatObjectForNetSuiteDisplay
    };
});