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

            // Create output file path - encode ALL context in filename for scheduled script
            const timestamp = Date.now();
            const outputFileName = `receipt_${userId}_${fileId}_${timestamp}_${trackingId}.json`;
            const outputFilePath = `SuiteScripts/AI_NS_ExpenseCapture/OciOutputFiles/${outputFileName}`;

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
     * Reduce stage - Submit to OCI and let scheduled script handle the rest
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
                commonLib.logOperation('mr_reduce_failed', {
                    fileId: fileId,
                    trackingId: trackingId,
                    error: error
                }, 'error');
                return; // No record creation - just log and exit
            }

            // Simple logging - OCI task submitted, scheduled script will handle the rest
            commonLib.logOperation('mr_reduce_complete', {
                fileId: fileId,
                trackingId: trackingId,
                userId: userId,
                taskId: taskId,
                message: 'OCI task submitted successfully. Scheduled script will process results when ready.'
            });

        } catch (error) {
            commonLib.logOperation('mr_reduce_error', {
                error: error.message,
                fileId: context.key
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