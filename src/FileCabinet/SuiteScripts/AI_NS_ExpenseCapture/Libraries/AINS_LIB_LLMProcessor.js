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

            // Build prompt with OCR data and categories
            const prompt = buildExpenseProcessingPrompt(ocrData, expenseCategories);

            // Configure LLM parameters
            const llmOptions = {
                prompt: prompt,
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

            // Add documents if available for RAG
            const documents = createDocumentsFromOCRData(ocrData);
            if (documents.length > 0) {
                llmOptions.documents = documents;
            }

            // Call NetSuite LLM
            const response = llm.generateText(llmOptions);

            // Parse and validate LLM response
            const parsedData = parseExpenseDataFromLLMResponse(response.text, expenseCategories);

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
                modelUsed: response.model
            });

            return {
                success: true,
                trackingId: trackingId,
                expenseData: finalData,
                rawLLMResponse: response.text,
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
     * @param {Object} ocrData - OCR extracted data
     * @param {Array} expenseCategories - Available expense categories
     * @returns {string} Formatted prompt for LLM
     */
    function buildExpenseProcessingPrompt(ocrData, expenseCategories) {
        const categoryList = expenseCategories.map(cat =>
            `${cat.id}: ${cat.name}${cat.description ? ` (${cat.description})` : ''}`
        ).join('\n');

        const prompt = `You are a NetSuite expense processing assistant with deep knowledge of business expense categorization. Analyze this receipt data intelligently.

EXTRACTED OCR DATA:
${JSON.stringify(ocrData, null, 2)}

AVAILABLE EXPENSE CATEGORIES:
${categoryList}

INTELLIGENT ANALYSIS TASK:
Process this receipt using business expense expertise to make the smartest possible categorization and data extraction.

EXTRACTION REQUIREMENTS:
1. **Vendor Analysis**: Extract the business/merchant name (not payment processor names like "SQ *" or "PYMT")
2. **Amount Intelligence**: Find the final total amount including tax/tips, ignore subtotals or line items
3. **Date Precision**: Extract transaction date (not processing/posting dates)
4. **Smart Categorization**: Match to the most specific and appropriate expense category based on:
   - Business type/industry of vendor
   - Common expense patterns (meals, travel, office supplies, etc.)
   - Specific category descriptions provided
5. **Descriptive Summary**: Create a clear 3-6 word expense description

CATEGORY MATCHING INTELLIGENCE:
- Restaurant/dining → Meals & Entertainment categories
- Gas stations → Travel/Transportation
- Hotels → Travel/Lodging
- Office supply stores → Office Supplies
- Airlines → Travel/Transportation
- Uber/Lyft/taxi → Transportation/Local Travel
- Software/subscriptions → Technology/Software
- Phone bills → Communications/Phone
- Internet → Communications/Internet
- When uncertain, choose the most general applicable category

RESPONSE FORMAT:
Return ONLY this exact JSON structure:
{
    "vendor": "string - clean business name (no payment processors)",
    "amount": number - final total as decimal number,
    "date": "string - transaction date in YYYY-MM-DD format",
    "categoryId": "string - exact category ID from list above",
    "description": "string - clear expense description (3-6 words)",
    "confidence": number - confidence score 0.0-1.0 based on data clarity,
    "reasoning": "string - brief explanation of category choice"
}

QUALITY STANDARDS:
- High confidence (0.8+): Clear vendor, amount, date, obvious category match
- Medium confidence (0.5-0.8): Most fields clear, category requires interpretation
- Low confidence (0.3-0.5): Some fields unclear but reasonable assumptions possible
- Never return confidence below 0.3 - always make best judgment
- NO null or blank values - use best available data

SMART DEFAULTS:
- If no clear vendor: Use closest business identifier from OCR
- If multiple amounts: Choose the largest/final total
- If unclear category: Use most general applicable option
- If no clear date: Use best available date information

Analyze thoroughly and respond with only the JSON object.`;

        return prompt;
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
        if (!categoryId || !expenseCategories || expenseCategories.length === 0) {
            return getDefaultCategoryId(expenseCategories);
        }

        // Check if provided category ID exists
        const category = expenseCategories.find(cat => cat.id === String(categoryId));

        if (category) {
            return String(categoryId);
        }

        // Try to find by name (case insensitive)
        const categoryByName = expenseCategories.find(cat =>
            cat.name.toLowerCase() === String(categoryId).toLowerCase()
        );

        if (categoryByName) {
            return categoryByName.id;
        }

        // Default to first available category
        return getDefaultCategoryId(expenseCategories);
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
                return buildExpenseProcessingPrompt(data, categories);
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
        validateAndFormatCategory: validateAndFormatCategory
    };
});