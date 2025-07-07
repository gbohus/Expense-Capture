/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @description OCI Document Understanding integration for AI NS Expense Capture system
 */

define(['N/documentUnderstanding', 'N/log', './AINS_LIB_Common'],
function(documentUnderstanding, log, commonLib) {

    const CONSTANTS = commonLib.CONSTANTS;

    /**
     * Process receipt file using OCI Document Understanding
     * @param {File} file - NetSuite file object containing the receipt
     * @param {Object} options - Processing options
     * @param {string} [options.documentType] - Document type (defaults to RECEIPT)
     * @param {Array} [options.features] - Features to extract
     * @param {string} [options.language] - Document language (defaults to english)
     * @param {number} [options.timeout] - Timeout in milliseconds
     * @returns {Object} Structured expense data extracted from receipt
     */
    function processReceiptDocument(file, options = {}) {
        const trackingId = commonLib.generateTrackingId();

        try {
            commonLib.logOperation('processReceiptDocument_start', {
                trackingId: trackingId,
                fileId: file.id,
                fileName: file.name,
                fileSize: file.size
            });

            // Validate file before processing
            const validation = validateReceiptFile(file);
            if (!validation.isValid) {
                throw new Error(`File validation failed: ${validation.message}`);
            }

            // Configure OCI Document Understanding options
            const analyzeOptions = {
                file: file,
                documentType: options.documentType || 'RECEIPT',
                features: options.features || ['TEXT_EXTRACTION', 'FIELD_EXTRACTION', 'TABLE_EXTRACTION'],
                language: options.language || 'english',
                timeout: options.timeout || 30000
            };

            // Add OCI config if provided in script parameters
            const ociConfig = getOCIConfig();
            if (ociConfig && Object.keys(ociConfig).length > 0) {
                analyzeOptions.ociConfig = ociConfig;
            }

            // Call OCI Document Understanding
            const documentResult = documentUnderstanding.analyzeDocument(analyzeOptions);

            // Extract expense data from the document result
            const expenseData = extractExpenseDataFromDocument(documentResult);

            commonLib.logOperation('processReceiptDocument_success', {
                trackingId: trackingId,
                extractedData: expenseData,
                documentPages: documentResult.pages ? documentResult.pages.length : 0
            });

            return {
                success: true,
                trackingId: trackingId,
                rawData: documentResult,
                expenseData: expenseData,
                processingDetails: {
                    documentType: analyzeOptions.documentType,
                    features: analyzeOptions.features,
                    language: analyzeOptions.language,
                    pageCount: documentResult.pages ? documentResult.pages.length : 0
                }
            };

        } catch (error) {
            commonLib.logOperation('processReceiptDocument_error', {
                trackingId: trackingId,
                error: error.message,
                fileId: file.id
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
     * Validate receipt file for OCI processing
     * @param {File} file - File to validate
     * @returns {Object} Validation result {isValid: boolean, message: string}
     */
    function validateReceiptFile(file) {
        try {
            if (!file) {
                return { isValid: false, message: 'File is required' };
            }

            // Check file size
            const sizeValidation = commonLib.validateFileSize(file.size);
            if (!sizeValidation.isValid) {
                return sizeValidation;
            }

            // Check file type
            const typeValidation = commonLib.validateFileType(file.name);
            if (!typeValidation.isValid) {
                return typeValidation;
            }

            // Check if file is empty
            if (file.size === 0) {
                return { isValid: false, message: 'File cannot be empty' };
            }

            return { isValid: true, message: 'File validation passed' };

        } catch (error) {
            return { isValid: false, message: `Validation error: ${error.message}` };
        }
    }

    /**
     * Extract expense-related data from OCI Document Understanding result
     * @param {Document} document - Document object from OCI
     * @returns {Object} Structured expense data
     */
    function extractExpenseDataFromDocument(document) {
        try {
            const expenseData = {
                vendor: null,
                amount: null,
                date: null,
                description: null,
                lineItems: [],
                confidence: {
                    overall: 0,
                    vendor: 0,
                    amount: 0,
                    date: 0
                }
            };

            if (!document.pages || document.pages.length === 0) {
                return expenseData;
            }

            // Process each page
            document.pages.forEach((page, pageIndex) => {
                // Extract from fields (key-value pairs)
                if (page.fields && page.fields.length > 0) {
                    const fieldData = extractFromFields(page.fields);
                    mergeExpenseData(expenseData, fieldData);
                }

                // Extract from tables
                if (page.tables && page.tables.length > 0) {
                    const tableData = extractFromTables(page.tables);
                    if (tableData.lineItems && tableData.lineItems.length > 0) {
                        expenseData.lineItems = expenseData.lineItems.concat(tableData.lineItems);
                    }
                    if (tableData.total && !expenseData.amount) {
                        expenseData.amount = tableData.total;
                    }
                }

                // Extract from lines as fallback
                if (page.lines && page.lines.length > 0) {
                    const lineData = extractFromLines(page.lines);
                    mergeExpenseData(expenseData, lineData);
                }
            });

            // Calculate overall confidence
            expenseData.confidence.overall = calculateOverallConfidence(expenseData.confidence);

            return expenseData;

        } catch (error) {
            log.error('extractExpenseDataFromDocument', `Error extracting expense data: ${error.message}`);
            return {
                vendor: null,
                amount: null,
                date: null,
                description: null,
                lineItems: [],
                confidence: { overall: 0, vendor: 0, amount: 0, date: 0 }
            };
        }
    }

    /**
     * Extract expense data from document fields (key-value pairs)
     * @param {Array} fields - Array of field objects
     * @returns {Object} Extracted expense data
     */
    function extractFromFields(fields) {
        const data = {
            vendor: null,
            amount: null,
            date: null,
            description: null,
            confidence: { vendor: 0, amount: 0, date: 0 }
        };

        fields.forEach(field => {
            if (!field.label || !field.value) return;

            const labelName = field.label.name ? field.label.name.toLowerCase() : '';
            const valueText = field.value.text || '';
            const confidence = field.value.confidence || 0;

            // Vendor detection patterns
            if (labelName.includes('vendor') || labelName.includes('merchant') ||
                labelName.includes('supplier') || labelName.includes('company') ||
                labelName.includes('business')) {
                if (!data.vendor || confidence > data.confidence.vendor) {
                    data.vendor = valueText;
                    data.confidence.vendor = confidence;
                }
            }

            // Amount detection patterns
            else if (labelName.includes('total') || labelName.includes('amount') ||
                     labelName.includes('sum') || labelName.includes('due') ||
                     labelName.includes('balance')) {
                const amount = parseAmount(valueText);
                if (amount && (!data.amount || confidence > data.confidence.amount)) {
                    data.amount = amount;
                    data.confidence.amount = confidence;
                }
            }

            // Date detection patterns
            else if (labelName.includes('date') || labelName.includes('time') ||
                     labelName.includes('transaction')) {
                const date = parseDate(valueText);
                if (date && (!data.date || confidence > data.confidence.date)) {
                    data.date = date;
                    data.confidence.date = confidence;
                }
            }

            // Description patterns
            else if (labelName.includes('description') || labelName.includes('memo') ||
                     labelName.includes('purpose') || labelName.includes('item')) {
                if (!data.description && valueText.length > 0) {
                    data.description = valueText;
                }
            }
        });

        return data;
    }

    /**
     * Extract expense data from document tables
     * @param {Array} tables - Array of table objects
     * @returns {Object} Extracted data including line items
     */
    function extractFromTables(tables) {
        const data = {
            lineItems: [],
            total: null
        };

        tables.forEach(table => {
            if (!table.bodyRows) return;

            table.bodyRows.forEach(row => {
                if (!row.cells) return;

                const lineItem = {
                    description: '',
                    amount: null,
                    quantity: null
                };

                let hasValidData = false;

                row.cells.forEach(cell => {
                    const cellText = cell.text || '';

                    // Try to parse as amount
                    const amount = parseAmount(cellText);
                    if (amount && !lineItem.amount) {
                        lineItem.amount = amount;
                        hasValidData = true;
                    }

                    // Try to parse as quantity
                    const quantity = parseQuantity(cellText);
                    if (quantity && !lineItem.quantity) {
                        lineItem.quantity = quantity;
                    }

                    // Use as description if not amount/quantity
                    if (!amount && !quantity && cellText.length > 2) {
                        if (lineItem.description.length === 0) {
                            lineItem.description = cellText;
                        } else {
                            lineItem.description += ' ' + cellText;
                        }
                        hasValidData = true;
                    }
                });

                if (hasValidData) {
                    data.lineItems.push(lineItem);

                    // Update total if this looks like a total row
                    if (lineItem.description.toLowerCase().includes('total') && lineItem.amount) {
                        data.total = lineItem.amount;
                    }
                }
            });
        });

        return data;
    }

    /**
     * Extract expense data from document lines as fallback
     * @param {Array} lines - Array of line objects
     * @returns {Object} Extracted expense data
     */
    function extractFromLines(lines) {
        const data = {
            vendor: null,
            amount: null,
            date: null,
            description: null,
            confidence: { vendor: 0, amount: 0, date: 0 }
        };

        lines.forEach(line => {
            const text = line.text || '';
            const confidence = line.confidence || 0;

            // Look for amounts in lines
            const amount = parseAmount(text);
            if (amount && (!data.amount || confidence > data.confidence.amount)) {
                data.amount = amount;
                data.confidence.amount = confidence;
            }

            // Look for dates in lines
            const date = parseDate(text);
            if (date && (!data.date || confidence > data.confidence.date)) {
                data.date = date;
                data.confidence.date = confidence;
            }

            // Use first line with high confidence as potential vendor
            if (!data.vendor && confidence > 0.8 && text.length > 3 && text.length < 100) {
                data.vendor = text;
                data.confidence.vendor = confidence;
            }
        });

        return data;
    }

    /**
     * Parse amount from text string
     * @param {string} text - Text to parse
     * @returns {number|null} Parsed amount or null
     */
    function parseAmount(text) {
        if (!text || typeof text !== 'string') return null;

        // Remove common currency symbols and clean text
        let cleanText = text.replace(/[$€£¥₹]/g, '').replace(/[,\s]/g, '').trim();

        // Look for decimal numbers
        const amountMatch = cleanText.match(/(\d+\.?\d*)/);
        if (amountMatch) {
            const amount = parseFloat(amountMatch[1]);
            if (!isNaN(amount) && amount > 0) {
                return amount;
            }
        }

        return null;
    }

    /**
     * Parse date from text string
     * @param {string} text - Text to parse
     * @returns {string|null} Parsed date in YYYY-MM-DD format or null
     */
    function parseDate(text) {
        if (!text || typeof text !== 'string') return null;

        try {
            // Try various date patterns
            const datePatterns = [
                /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // MM/DD/YYYY or MM-DD-YYYY
                /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY/MM/DD or YYYY-MM-DD
                /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/   // MM/DD/YY or MM-DD-YY
            ];

            for (let pattern of datePatterns) {
                const match = text.match(pattern);
                if (match) {
                    let year, month, day;

                    if (match[3].length === 4) { // First pattern
                        month = match[1];
                        day = match[2];
                        year = match[3];
                    } else if (match[1].length === 4) { // Second pattern
                        year = match[1];
                        month = match[2];
                        day = match[3];
                    } else { // Third pattern (2-digit year)
                        month = match[1];
                        day = match[2];
                        year = '20' + match[3]; // Assume 2000s
                    }

                    // Validate and format
                    const date = new Date(year, month - 1, day);
                    if (date.getFullYear() == year && date.getMonth() == month - 1 && date.getDate() == day) {
                        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
                    }
                }
            }
        } catch (error) {
            // Ignore parsing errors
        }

        return null;
    }

    /**
     * Parse quantity from text string
     * @param {string} text - Text to parse
     * @returns {number|null} Parsed quantity or null
     */
    function parseQuantity(text) {
        if (!text || typeof text !== 'string') return null;

        const quantityMatch = text.match(/^(\d+)$/);
        if (quantityMatch) {
            const quantity = parseInt(quantityMatch[1]);
            if (!isNaN(quantity) && quantity > 0 && quantity < 1000) {
                return quantity;
            }
        }

        return null;
    }

    /**
     * Merge expense data objects, prioritizing higher confidence values
     * @param {Object} target - Target data object to merge into
     * @param {Object} source - Source data object to merge from
     */
    function mergeExpenseData(target, source) {
        if (!source) return;

        ['vendor', 'amount', 'date'].forEach(field => {
            if (source[field] && (!target[field] ||
                (source.confidence && target.confidence &&
                 source.confidence[field] > target.confidence[field]))) {
                target[field] = source[field];
                if (source.confidence && target.confidence) {
                    target.confidence[field] = source.confidence[field];
                }
            }
        });

        // Always use description if target doesn't have one
        if (source.description && !target.description) {
            target.description = source.description;
        }
    }

    /**
     * Calculate overall confidence score
     * @param {Object} confidence - Individual confidence scores
     * @returns {number} Overall confidence score
     */
    function calculateOverallConfidence(confidence) {
        const scores = [confidence.vendor, confidence.amount, confidence.date].filter(score => score > 0);
        if (scores.length === 0) return 0;
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    /**
     * Get OCI configuration from script parameters
     * @returns {Object|null} OCI configuration or null
     */
    function getOCIConfig() {
        try {
            // This would be configured in script parameters if needed
            // For now, return null to use default NetSuite configuration
            return null;
        } catch (error) {
            log.error('getOCIConfig', `Error getting OCI config: ${error.message}`);
            return null;
        }
    }

    /**
     * Format extracted data for logging (remove sensitive information)
     * @param {Object} data - Expense data to format
     * @returns {Object} Formatted data for logging
     */
    function formatDataForLogging(data) {
        return {
            hasVendor: !!data.vendor,
            hasAmount: !!data.amount,
            hasDate: !!data.date,
            hasDescription: !!data.description,
            lineItemCount: data.lineItems ? data.lineItems.length : 0,
            overallConfidence: data.confidence ? data.confidence.overall : 0
        };
    }

    // Public interface
    return {
        processReceiptDocument: processReceiptDocument,
        validateReceiptFile: validateReceiptFile,
        extractExpenseDataFromDocument: extractExpenseDataFromDocument,
        parseAmount: parseAmount,
        parseDate: parseDate,
        formatDataForLogging: formatDataForLogging
    };
});