/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @description Map/Reduce script to process individual receipt files with OCI Document Understanding and NetSuite LLM
 */

define(['N/file', 'N/record', 'N/runtime', 'N/search',
        '../Libraries/AINS_LIB_Common', '../Libraries/AINS_LIB_OCIIntegration', '../Libraries/AINS_LIB_LLMProcessor'],
function(file, record, runtime, search, commonLib, ociLib, llmLib) {

    const CONSTANTS = commonLib.CONSTANTS;

    /**
     * Get input data - in this case, just the file information passed as parameters
     * @returns {Object} File processing data
     */
    function getInputData() {
        try {
            const script = runtime.getCurrentScript();

            // Get parameters passed from Suitelet
            const fileId = script.getParameter({ name: 'custscript_ains_file_id' });
            const fileName = script.getParameter({ name: 'custscript_ains_file_name' });
            const userId = script.getParameter({ name: 'custscript_ains_user_id' });
            const trackingId = script.getParameter({ name: 'custscript_ains_tracking_id' });

            if (!fileId || !fileName || !userId) {
                throw new Error('Missing required parameters: fileId, fileName, or userId');
            }

            commonLib.logOperation('mr_getInputData', {
                fileId: fileId,
                fileName: fileName,
                userId: userId,
                trackingId: trackingId
            });

            // Return single file for processing
            return [{
                fileId: fileId,
                fileName: fileName,
                userId: userId,
                trackingId: trackingId
            }];

        } catch (error) {
            commonLib.logOperation('mr_getInputData_error', {
                error: error.message
            }, 'error');

            throw error;
        }
    }

    /**
     * Map stage - Process the file with OCI Document Understanding
     * @param {Object} context - Map context
     */
    function map(context) {
        try {
            const fileData = JSON.parse(context.value);
            const { fileId, fileName, userId, trackingId } = fileData;

            commonLib.logOperation('mr_map_start', {
                fileId: fileId,
                fileName: fileName,
                userId: userId,
                trackingId: trackingId
            });

            // Load the file
            const fileObj = file.load({ id: fileId });

            // Process with OCI Document Understanding
            const ocrResults = ociLib.processDocument(fileObj.getContents(), fileName);

            commonLib.logOperation('mr_map_ocr_complete', {
                fileId: fileId,
                trackingId: trackingId,
                ocrResultsFound: !!ocrResults,
                confidence: ocrResults ? ocrResults.confidence : null
            });

            // Pass data to reduce stage
            context.write(fileId, {
                fileId: fileId,
                fileName: fileName,
                userId: userId,
                trackingId: trackingId,
                fileSize: fileObj.size,
                fileType: fileObj.fileType,
                ocrResults: ocrResults
            });

        } catch (error) {
            commonLib.logOperation('mr_map_error', {
                error: error.message,
                context: context.value
            }, 'error');

            // Write error data to reduce for error handling
            const fileData = JSON.parse(context.value);
            context.write(fileData.fileId, {
                ...fileData,
                error: error.message,
                processingFailed: true
            });
        }
    }

    /**
     * Reduce stage - Process OCR data with LLM and create custom record
     * @param {Object} context - Reduce context
     */
    function reduce(context) {
        try {
            const data = JSON.parse(context.values[0]);
            const { fileId, fileName, userId, trackingId, fileSize, fileType, ocrResults, error, processingFailed } = data;

            commonLib.logOperation('mr_reduce_start', {
                fileId: fileId,
                trackingId: trackingId,
                hasOcrResults: !!ocrResults,
                processingFailed: !!processingFailed
            });

            if (processingFailed) {
                // Create error record
                createErrorRecord(fileId, fileName, userId, trackingId, fileSize, fileType, error);
                return;
            }

            // Get available expense categories for LLM processing
            const expenseCategories = llmLib.getExpenseCategories();

            // Process with NetSuite LLM
            const llmResults = llmLib.processWithLLM(ocrResults, expenseCategories);

            commonLib.logOperation('mr_reduce_llm_complete', {
                fileId: fileId,
                trackingId: trackingId,
                llmResultsFound: !!llmResults,
                assignedCategory: llmResults ? llmResults.category_id : null
            });

            // Create expense capture record with processed data
            const recordId = createExpenseCaptureRecord({
                fileId: fileId,
                fileName: fileName,
                userId: userId,
                trackingId: trackingId,
                fileSize: fileSize,
                fileType: fileType,
                ocrResults: ocrResults,
                llmResults: llmResults
            });

            commonLib.logOperation('mr_reduce_complete', {
                fileId: fileId,
                trackingId: trackingId,
                recordId: recordId
            });

        } catch (error) {
            commonLib.logOperation('mr_reduce_error', {
                error: error.message,
                fileId: context.key
            }, 'error');

            // Create error record
            const data = JSON.parse(context.values[0]);
            createErrorRecord(data.fileId, data.fileName, data.userId, data.trackingId,
                            data.fileSize, data.fileType, error.message);
        }
    }

    /**
     * Create expense capture record with processed data
     * @param {Object} options - Record creation options
     * @returns {string} Created record ID
     */
    function createExpenseCaptureRecord(options) {
        try {
            const { fileId, fileName, userId, trackingId, fileSize, fileType, ocrResults, llmResults } = options;

            const expenseRecord = record.create({
                type: CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE,
                isDynamic: true
            });

            // Set file attachment
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.FILE_ATTACHMENT,
                value: fileId
            });

            // Set user information
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.CREATED_BY,
                value: userId
            });

            // Set processing status
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.PROCESSING_STATUS,
                value: CONSTANTS.STATUS.COMPLETE
            });

            // Set extracted data from LLM
            if (llmResults) {
                if (llmResults.vendor) {
                    expenseRecord.setValue({
                        fieldId: CONSTANTS.FIELDS.VENDOR_NAME,
                        value: llmResults.vendor
                    });
                }

                if (llmResults.amount) {
                    expenseRecord.setValue({
                        fieldId: CONSTANTS.FIELDS.EXPENSE_AMOUNT,
                        value: parseFloat(llmResults.amount)
                    });
                }

                if (llmResults.date) {
                    expenseRecord.setValue({
                        fieldId: CONSTANTS.FIELDS.EXPENSE_DATE,
                        value: new Date(llmResults.date)
                    });
                }

                if (llmResults.category_id) {
                    expenseRecord.setValue({
                        fieldId: CONSTANTS.FIELDS.EXPENSE_CATEGORY,
                        value: llmResults.category_id
                    });
                }

                if (llmResults.description) {
                    expenseRecord.setValue({
                        fieldId: CONSTANTS.FIELDS.DESCRIPTION,
                        value: llmResults.description
                    });
                }

                if (llmResults.confidence) {
                    expenseRecord.setValue({
                        fieldId: CONSTANTS.FIELDS.CONFIDENCE_SCORE,
                        value: parseFloat(llmResults.confidence)
                    });
                }
            }

            // Set file metadata
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.FILE_SIZE,
                value: Math.round(fileSize / 1024) // Convert to KB
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.FILE_TYPE,
                value: fileType || fileName.split('.').pop().toLowerCase()
            });

            // Set processing timestamp
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.PROCESSED_DATE,
                value: new Date()
            });

            // Set technical data
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.RAW_OCR_DATA,
                value: JSON.stringify(ocrResults)
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.LLM_RESPONSE,
                value: JSON.stringify(llmResults)
            });

            // Save record
            const recordId = expenseRecord.save();

            commonLib.logOperation('expense_record_created', {
                recordId: recordId,
                fileId: fileId,
                userId: userId,
                trackingId: trackingId,
                vendor: llmResults ? llmResults.vendor : null,
                amount: llmResults ? llmResults.amount : null
            });

            return recordId;

        } catch (error) {
            commonLib.logOperation('create_expense_record_error', {
                error: error.message,
                fileId: options.fileId,
                trackingId: options.trackingId
            }, 'error');

            throw error;
        }
    }

    /**
     * Create error record when processing fails
     * @param {string} fileId - File ID
     * @param {string} fileName - File name
     * @param {string} userId - User ID
     * @param {string} trackingId - Tracking ID
     * @param {number} fileSize - File size
     * @param {string} fileType - File type
     * @param {string} errorMessage - Error message
     */
    function createErrorRecord(fileId, fileName, userId, trackingId, fileSize, fileType, errorMessage) {
        try {
            const expenseRecord = record.create({
                type: CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE,
                isDynamic: true
            });

            // Set file attachment
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.FILE_ATTACHMENT,
                value: fileId
            });

            // Set user information
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.CREATED_BY,
                value: userId
            });

            // Set error status
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.PROCESSING_STATUS,
                value: CONSTANTS.STATUS.ERROR
            });

            // Set error message
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.ERROR_MESSAGE,
                value: errorMessage
            });

            // Set file metadata
            if (fileSize) {
                expenseRecord.setValue({
                    fieldId: CONSTANTS.FIELDS.FILE_SIZE,
                    value: Math.round(fileSize / 1024)
                });
            }

            if (fileType) {
                expenseRecord.setValue({
                    fieldId: CONSTANTS.FIELDS.FILE_TYPE,
                    value: fileType
                });
            }

            // Set processing timestamp
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.PROCESSED_DATE,
                value: new Date()
            });

            // Save error record
            const recordId = expenseRecord.save();

            commonLib.logOperation('error_record_created', {
                recordId: recordId,
                fileId: fileId,
                userId: userId,
                trackingId: trackingId,
                error: errorMessage
            });

        } catch (error) {
            commonLib.logOperation('create_error_record_failed', {
                originalError: errorMessage,
                createError: error.message,
                fileId: fileId,
                trackingId: trackingId
            }, 'error');
        }
    }

    /**
     * Summarize stage - Log overall processing results
     * @param {Object} context - Summary context
     */
    function summarize(context) {
        try {
            const script = runtime.getCurrentScript();
            const trackingId = script.getParameter({ name: 'custscript_ains_tracking_id' });

            commonLib.logOperation('mr_summarize', {
                trackingId: trackingId,
                inputStage: context.inputSummary,
                mapStage: context.mapSummary,
                reduceStage: context.reduceSummary,
                errors: context.errors
            });

            // Log any errors that occurred
            if (context.errors && context.errors.length > 0) {
                context.errors.forEach(function(error) {
                    commonLib.logOperation('mr_error_detail', {
                        trackingId: trackingId,
                        error: error
                    }, 'error');
                });
            }

        } catch (error) {
            commonLib.logOperation('mr_summarize_error', {
                error: error.message
            }, 'error');
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});