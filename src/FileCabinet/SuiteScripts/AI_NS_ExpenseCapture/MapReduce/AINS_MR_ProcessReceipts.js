/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @description Map/Reduce script to process receipt files with OCI Document Understanding and save results as JSON files
 */

define(['N/file', 'N/record', 'N/runtime', 'N/search', 'N/task',
        '../Libraries/AINS_LIB_Common', '../Libraries/AINS_LIB_LLMProcessor'],
function(file, record, runtime, search, task, commonLib, llmProcessor) {

    const CONSTANTS = commonLib.CONSTANTS;

    /**
     * Get input data - file information passed as parameters
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
     * Map stage - Submit file to OCI Document Understanding task
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

            // Load the file to validate it exists
            const fileObj = file.load({ id: fileId });

            // Validate file
            const validation = validateReceiptFile(fileObj);
            if (!validation.isValid) {
                throw new Error(`File validation failed: ${validation.message}`);
            }

            // Create output file path - use trackingId to make it unique
            const outputFileName = `receipt_analysis_${trackingId}.json`;
            const outputFilePath = `SuiteScripts/AI_NS_ExpenseCapture/OutputFiles/${outputFileName}`;

            // Create the Document Understanding Task
            const docTask = task.create(task.TaskType.DOCUMENT_UNDERSTANDING);
            docTask.documentType = "RECEIPT";
            docTask.inputFile = fileObj;
            docTask.outputFilePath = outputFilePath;

            // Submit the task
            const taskId = docTask.submit();

            commonLib.logOperation('mr_map_task_submitted', {
                fileId: fileId,
                trackingId: trackingId,
                taskId: taskId,
                outputFilePath: outputFilePath
            });

            // Pass data to reduce stage
            context.write(fileId, {
                fileId: fileId,
                fileName: fileName,
                userId: userId,
                trackingId: trackingId,
                taskId: taskId,
                outputFilePath: outputFilePath,
                fileSize: fileObj.size,
                fileType: fileObj.fileType
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
     * Validate receipt file for processing
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
     * Reduce stage - Wait for task completion, process results, and create expense record
     * @param {Object} context - Reduce context
     */
    function reduce(context) {
        try {
            const data = JSON.parse(context.values[0]);
            const { fileId, fileName, userId, trackingId, taskId, outputFilePath, fileSize, fileType, error, processingFailed } = data;

            commonLib.logOperation('mr_reduce_start', {
                fileId: fileId,
                trackingId: trackingId,
                taskId: taskId,
                outputFilePath: outputFilePath,
                processingFailed: !!processingFailed
            });

            // Check if processing failed in map stage
            if (processingFailed) {
                createErrorRecord(fileId, fileName, userId, trackingId, error);
                return;
            }

            // Check if the output file exists (task completion)
            let outputFile = null;
            try {
                outputFile = findOCIOutputFile(outputFilePath, trackingId);
            } catch (loadError) {
                // File doesn't exist yet - task may still be processing
                commonLib.logOperation('mr_reduce_output_not_ready', {
                    fileId: fileId,
                    trackingId: trackingId,
                    outputFilePath: outputFilePath,
                    error: loadError.message
                });

                // Create pending record to track processing
                createPendingRecord(fileId, fileName, userId, trackingId, fileSize, fileType);
                return;
            }

            if (outputFile) {
                // Task completed successfully - process the results
                processOCIResults(outputFile, fileId, fileName, userId, trackingId, fileSize, fileType);
            } else {
                // Task still processing - create pending record
                createPendingRecord(fileId, fileName, userId, trackingId, fileSize, fileType);
            }

        } catch (error) {
            commonLib.logOperation('mr_reduce_error', {
                error: error.message,
                fileId: context.key
            }, 'error');

            // Create error record
            const data = JSON.parse(context.values[0]);
            createErrorRecord(data.fileId, data.fileName, data.userId, data.trackingId, error.message);
        }
    }

    /**
     * Find the OCI output file
     * @param {string} outputFilePath - Expected output file path
     * @param {string} trackingId - Tracking ID for the operation
     * @returns {File|null} Output file if found
     */
    function findOCIOutputFile(outputFilePath, trackingId) {
        try {
            const fileName = outputFilePath.split('/').pop();

            const fileSearch = search.create({
                type: 'file',
                filters: [
                    ['name', 'is', fileName]
                ]
            });

            const searchResults = fileSearch.run().getRange(0, 10);

            // Find the correct file by checking folder path and content
            for (let i = 0; i < searchResults.length; i++) {
                const result = searchResults[i];
                try {
                    const fileObj = file.load({ id: result.id });

                    // Verify this is our output file by checking if it's in the correct folder
                    // and contains our tracking ID
                    if (fileObj.name.includes(trackingId)) {
                        return fileObj;
                    }
                } catch (loadError) {
                    continue; // Try next file
                }
            }

            return null;
        } catch (error) {
            commonLib.logOperation('find_oci_output_file_error', {
                outputFilePath: outputFilePath,
                trackingId: trackingId,
                error: error.message
            }, 'error');
            return null;
        }
    }

    /**
     * Process OCI results, send to LLM, and create expense record
     * @param {File} outputFile - OCI output file
     * @param {string} fileId - Original file ID
     * @param {string} fileName - Original file name
     * @param {string} userId - User ID
     * @param {string} trackingId - Tracking ID
     * @param {number} fileSize - File size
     * @param {string} fileType - File type
     */
    function processOCIResults(outputFile, fileId, fileName, userId, trackingId, fileSize, fileType) {
        try {
            commonLib.logOperation('process_oci_results_start', {
                outputFileId: outputFile.id,
                trackingId: trackingId,
                fileId: fileId
            });

            // Load and parse OCI results
            const ocrData = JSON.parse(outputFile.getContents());

            commonLib.logOperation('oci_results_parsed', {
                trackingId: trackingId,
                hasResults: !!ocrData,
                resultKeys: ocrData ? Object.keys(ocrData) : []
            });

            // Process with LLM to format expense data
            const llmResults = llmProcessor.processExpenseDataWithLLM(ocrData, {
                model: 'command-r',
                confidenceThreshold: 0.7
            });

            commonLib.logOperation('llm_processing_complete', {
                trackingId: trackingId,
                vendor: llmResults.vendor,
                amount: llmResults.amount,
                confidence: llmResults.confidence,
                categoryId: llmResults.categoryId,
                reasoning: llmResults.reasoning || 'No reasoning provided'
            });

            // Create the expense capture record with all data
            const expenseRecordId = createExpenseRecord({
                fileId: fileId,
                fileName: fileName,
                userId: userId,
                trackingId: trackingId,
                fileSize: fileSize,
                fileType: fileType,
                ocrData: ocrData,
                llmResults: llmResults,
                outputFileId: outputFile.id
            });

            commonLib.logOperation('expense_record_created', {
                trackingId: trackingId,
                expenseRecordId: expenseRecordId,
                vendor: llmResults.vendor,
                amount: llmResults.amount,
                status: 'complete'
            });

        } catch (error) {
            commonLib.logOperation('process_oci_results_error', {
                trackingId: trackingId,
                error: error.message
            }, 'error');

            // Create error record
            createErrorRecord(fileId, fileName, userId, trackingId, `OCI/LLM processing failed: ${error.message}`);
        }
    }

    /**
     * Create expense capture record with processed data
     * @param {Object} data - All expense data
     * @returns {string} Created record ID
     */
    function createExpenseRecord(data) {
        try {
            const expenseRecord = record.create({
                type: commonLib.CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE
            });

            // Note: Name field is auto-generated due to enablenumbering=T (AINS-0001, AINS-0002, etc.)

            // Set basic file information
            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.FILE_ATTACHMENT,
                value: data.fileId
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.CREATED_BY,
                value: data.userId
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.FILE_SIZE,
                value: Math.round(data.fileSize / 1024) // Convert to KB
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.FILE_TYPE,
                value: data.fileType
            });

            // Set processed expense data from LLM
            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.VENDOR_NAME,
                value: data.llmResults.vendor || 'Unknown Vendor'
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.EXPENSE_AMOUNT,
                value: data.llmResults.amount || 0
            });

            if (data.llmResults.date) {
                expenseRecord.setValue({
                    fieldId: commonLib.CONSTANTS.FIELDS.EXPENSE_DATE,
                    value: new Date(data.llmResults.date)
                });
            }

            if (data.llmResults.categoryId) {
                expenseRecord.setValue({
                    fieldId: commonLib.CONSTANTS.FIELDS.EXPENSE_CATEGORY,
                    value: data.llmResults.categoryId
                });
            }

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.DESCRIPTION,
                value: data.llmResults.description || 'Receipt processed by AI'
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.CONFIDENCE_SCORE,
                value: data.llmResults.confidence || 0
            });

            // Set processing status and technical data
            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.PROCESSING_STATUS,
                value: commonLib.CONSTANTS.STATUS.COMPLETE
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.PROCESSED_DATE,
                value: new Date()
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.RAW_OCR_DATA,
                value: JSON.stringify(data.ocrData)
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.LLM_RESPONSE,
                value: JSON.stringify(data.llmResults)
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.IMPORTED_TO_ER,
                value: false
            });

            // Save the record
            const recordId = expenseRecord.save();

            return recordId;

        } catch (error) {
            commonLib.logOperation('create_expense_record_error', {
                trackingId: data.trackingId,
                error: error.message
            }, 'error');
            throw error;
        }
    }

    /**
     * Create pending record while OCI task is processing
     * @param {string} fileId - File ID
     * @param {string} fileName - File name
     * @param {string} userId - User ID
     * @param {string} trackingId - Tracking ID
     * @param {number} fileSize - File size
     * @param {string} fileType - File type
     */
    function createPendingRecord(fileId, fileName, userId, trackingId, fileSize, fileType) {
        try {
            // Check if record already exists for this file
            const existingSearch = search.create({
                type: commonLib.CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE,
                filters: [
                    ['custrecord_ains_file_attachment', 'anyof', fileId]
                ]
            });

            const existingResults = existingSearch.run().getRange(0, 1);
            if (existingResults.length > 0) {
                // Record already exists, just update status
                const existingRecord = record.load({
                    type: commonLib.CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE,
                    id: existingResults[0].id
                });

                existingRecord.setValue({
                    fieldId: commonLib.CONSTANTS.FIELDS.PROCESSING_STATUS,
                    value: commonLib.CONSTANTS.STATUS.PROCESSING
                });

                existingRecord.save();
                return;
            }

            // Create new pending record
            const expenseRecord = record.create({
                type: commonLib.CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE
            });

            // Note: Name field is auto-generated due to enablenumbering=T (AINS-0001, AINS-0002, etc.)

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.FILE_ATTACHMENT,
                value: fileId
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.CREATED_BY,
                value: userId
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.FILE_SIZE,
                value: Math.round(fileSize / 1024)
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.FILE_TYPE,
                value: fileType
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.PROCESSING_STATUS,
                value: commonLib.CONSTANTS.STATUS.PROCESSING
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.VENDOR_NAME,
                value: 'Processing...'
            });

            // Set required fields with default values
            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.EXPENSE_AMOUNT,
                value: 0
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.EXPENSE_DATE,
                value: new Date()
            });

            // Set default expense category (you may need to adjust this ID)
            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.EXPENSE_CATEGORY,
                value: 1 // Default category - adjust as needed
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.DESCRIPTION,
                value: 'Receipt processing in progress'
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.IMPORTED_TO_ER,
                value: false
            });

            const recordId = expenseRecord.save();

            commonLib.logOperation('pending_record_created', {
                trackingId: trackingId,
                recordId: recordId,
                status: 'processing'
            });

        } catch (error) {
            commonLib.logOperation('create_pending_record_error', {
                trackingId: trackingId,
                error: error.message
            }, 'error');
        }
    }

    /**
     * Create error record when processing fails
     * @param {string} fileId - File ID
     * @param {string} fileName - File name
     * @param {string} userId - User ID
     * @param {string} trackingId - Tracking ID
     * @param {string} errorMessage - Error message
     */
    function createErrorRecord(fileId, fileName, userId, trackingId, errorMessage) {
        try {
            const expenseRecord = record.create({
                type: commonLib.CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE
            });

            // Note: Name field is auto-generated due to enablenumbering=T (AINS-0001, AINS-0002, etc.)

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.FILE_ATTACHMENT,
                value: fileId
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.CREATED_BY,
                value: userId
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.PROCESSING_STATUS,
                value: commonLib.CONSTANTS.STATUS.ERROR
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.ERROR_MESSAGE,
                value: errorMessage
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.VENDOR_NAME,
                value: 'Processing Failed'
            });

            // Set required fields with default values for error record
            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.EXPENSE_AMOUNT,
                value: 0
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.EXPENSE_DATE,
                value: new Date()
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.EXPENSE_CATEGORY,
                value: 1 // Default category - adjust as needed
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.DESCRIPTION,
                value: 'Error during receipt processing'
            });

            expenseRecord.setValue({
                fieldId: commonLib.CONSTANTS.FIELDS.IMPORTED_TO_ER,
                value: false
            });

            const recordId = expenseRecord.save();

            commonLib.logOperation('error_record_created', {
                trackingId: trackingId,
                recordId: recordId,
                error: errorMessage
            });

        } catch (error) {
            commonLib.logOperation('create_error_record_error', {
                trackingId: trackingId,
                error: error.message
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