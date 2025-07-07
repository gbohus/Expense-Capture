/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @description Map/Reduce script for processing receipts with OCI and LLM
 */

define(['N/query', 'N/record', 'N/file', 'N/runtime', 'N/email', 'N/task',
        '../Libraries/AINS_LIB_Common', '../Libraries/AINS_LIB_OCIIntegration', '../Libraries/AINS_LIB_LLMProcessor'],
function(query, record, file, runtime, email, task, commonLib, ociLib, llmLib) {

    const CONSTANTS = commonLib.CONSTANTS;

    /**
     * Defines the function definition that is executed at the beginning of the map/reduce process
     * @returns {Array|Object|Search|RecordRef} inputSummary
     */
    function getInputData() {
        try {
            commonLib.logOperation('mapreduce_getInputData_start', {
                timestamp: new Date().toISOString()
            });

            // Query for expense capture records with PENDING status using SuiteQL
            const expenseQuery = `
                SELECT
                    internalid,
                    custrecord_ains_file_attachment,
                    custrecord_ains_created_by,
                    custrecord_ains_processing_status,
                    created
                FROM customrecord_ains_expense_capture
                WHERE custrecord_ains_processing_status = '${CONSTANTS.STATUS.PENDING}'
                AND isinactive = 'F'
                ORDER BY created ASC
            `;

            const queryResult = query.runSuiteQL({
                query: expenseQuery
            });

            const resultCount = queryResult.results.length;

            commonLib.logOperation('mapreduce_getInputData_complete', {
                recordCount: resultCount
            });

            return queryResult.results;

        } catch (error) {
            commonLib.logOperation('mapreduce_getInputData_error', {
                error: error.message
            }, 'error');

            throw error;
        }
    }

    /**
     * Defines the function definition that is executed in the map stage of the map/reduce process
     * @param {Object} context
     * @param {string} context.key - Key to be processed during the map stage
     * @param {string} context.value - Value to be processed during the map stage
     */
    function map(context) {
        const trackingId = commonLib.generateTrackingId();

        try {
            const queryResult = JSON.parse(context.value);
            const expenseRecordId = queryResult.values[0]; // internalid
            const fileId = queryResult.values[1]; // custrecord_ains_file_attachment
            const userId = queryResult.values[2]; // custrecord_ains_created_by

            commonLib.logOperation('mapreduce_map_start', {
                trackingId: trackingId,
                expenseRecordId: expenseRecordId,
                fileId: fileId
            });

            // Update record status to PROCESSING
            updateRecordStatus(expenseRecordId, CONSTANTS.STATUS.PROCESSING);

            // Load and validate file
            if (!fileId) {
                throw new Error('No file attachment found');
            }

            const receiptFile = file.load({ id: fileId });

            // Process with OCI Document Understanding
            const ocrResult = ociLib.processReceiptDocument(receiptFile, {
                documentType: 'RECEIPT',
                features: ['TEXT_EXTRACTION', 'FIELD_EXTRACTION', 'TABLE_EXTRACTION'],
                timeout: 30000
            });

            if (!ocrResult.success) {
                throw new Error(`OCR processing failed: ${ocrResult.error}`);
            }

            // Prepare data for reduce stage
            const mapOutput = {
                expenseRecordId: expenseRecordId,
                fileId: fileId,
                ocrResult: ocrResult,
                trackingId: trackingId,
                userId: userId
            };

            commonLib.logOperation('mapreduce_map_success', {
                trackingId: trackingId,
                expenseRecordId: expenseRecordId,
                ocrSuccess: ocrResult.success,
                confidence: ocrResult.expenseData ? ocrResult.expenseData.confidence : null
            });

            // Output to reduce stage
            context.write(expenseRecordId, mapOutput);

        } catch (error) {
            commonLib.logOperation('mapreduce_map_error', {
                trackingId: trackingId,
                expenseRecordId: context.key,
                error: error.message
            }, 'error');

            // Update record with error status
            try {
                updateRecordWithError(context.key, error.message);
            } catch (updateError) {
                commonLib.logOperation('mapreduce_map_update_error', {
                    expenseRecordId: context.key,
                    updateError: updateError.message
                }, 'error');
            }
        }
    }

    /**
     * Defines the function definition that is executed in the reduce stage of the map/reduce process
     * @param {Object} context
     * @param {string} context.key - Key to be processed during the reduce stage
     * @param {Array} context.values - All values associated with a unique key that was passed to the reduce stage
     */
    function reduce(context) {
        const expenseRecordId = context.key;

        try {
            // Parse the map output
            const mapOutput = JSON.parse(context.values[0]);
            const { ocrResult, trackingId, userId } = mapOutput;

            commonLib.logOperation('mapreduce_reduce_start', {
                trackingId: trackingId,
                expenseRecordId: expenseRecordId
            });

            // Get available expense categories
            const expenseCategories = commonLib.getExpenseCategories();

            // Process with NetSuite LLM
            const llmResult = llmLib.processExpenseDataWithLLM(ocrResult.expenseData, {
                model: getScriptParameter('LLM_MODEL', 'command-r'),
                expenseCategories: expenseCategories,
                confidenceThreshold: getScriptParameter('CONFIDENCE_THRESHOLD', 0.8)
            });

            if (!llmResult.success) {
                throw new Error(`LLM processing failed: ${llmResult.error}`);
            }

            // Update expense capture record with processed data
            const updateResult = updateExpenseRecord(expenseRecordId, {
                ocrData: ocrResult,
                llmData: llmResult,
                trackingId: trackingId
            });

            commonLib.logOperation('mapreduce_reduce_success', {
                trackingId: trackingId,
                expenseRecordId: expenseRecordId,
                vendor: llmResult.expenseData.vendor,
                amount: llmResult.expenseData.amount,
                confidence: llmResult.expenseData.confidence,
                requiresReview: llmResult.expenseData.requiresReview
            });

            // Send notification if configured and high confidence
            if (shouldSendNotification(llmResult.expenseData)) {
                sendProcessingNotification(userId, expenseRecordId, llmResult.expenseData);
            }

        } catch (error) {
            commonLib.logOperation('mapreduce_reduce_error', {
                expenseRecordId: expenseRecordId,
                error: error.message
            }, 'error');

            // Update record with error status
            updateRecordWithError(expenseRecordId, error.message);
        }
    }

    /**
     * Defines the function definition that is executed at the completion of the map/reduce process
     * @param {Object} context
     * @param {number} context.concurrency - Maximum concurrency number when executing the reduce stage
     * @param {Date} context.dateCreated - Date and time when the map/reduce job was created
     * @param {boolean} context.isRestarted - Indicates whether the current invocation represents a restart of a previously failed execution
     * @param {Iterator} context.output - Serialized keys and values that were saved as output during the reduce stage
     * @param {number} context.seconds - Total seconds elapsed when running the map/reduce job
     * @param {number} context.usage - Total number of usage units consumed when running the map/reduce job
     * @param {number} context.yields - Total number of yields when running the map/reduce job
     * @param {Object} context.inputSummary - Summary of the input stage
     * @param {Object} context.mapSummary - Summary of the map stage
     * @param {Object} context.reduceSummary - Summary of the reduce stage
     */
    function summarize(context) {
        try {
            const summary = {
                totalRecords: context.inputSummary.count,
                mapErrors: context.mapSummary.errors ? context.mapSummary.errors.length : 0,
                reduceErrors: context.reduceSummary.errors ? context.reduceSummary.errors.length : 0,
                totalUsage: context.usage,
                totalTime: context.seconds,
                yields: context.yields
            };

            commonLib.logOperation('mapreduce_summarize', summary);

            // Log any errors that occurred
            if (context.mapSummary.errors && context.mapSummary.errors.length > 0) {
                context.mapSummary.errors.forEach(error => {
                    commonLib.logOperation('mapreduce_map_stage_error', {
                        stage: 'map',
                        key: error.key,
                        error: error.message
                    }, 'error');
                });
            }

            if (context.reduceSummary.errors && context.reduceSummary.errors.length > 0) {
                context.reduceSummary.errors.forEach(error => {
                    commonLib.logOperation('mapreduce_reduce_stage_error', {
                        stage: 'reduce',
                        key: error.key,
                        error: error.message
                    }, 'error');
                });
            }

            // Schedule next run if there are still pending records
            scheduleNextRun();

        } catch (error) {
            commonLib.logOperation('mapreduce_summarize_error', {
                error: error.message
            }, 'error');
        }
    }

    /**
     * Update record status
     * @param {string} recordId - Record ID
     * @param {string} status - New status
     */
    function updateRecordStatus(recordId, status) {
        try {
            record.submitFields({
                type: CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE,
                id: recordId,
                values: {
                    [CONSTANTS.FIELDS.PROCESSING_STATUS]: status
                }
            });
        } catch (error) {
            commonLib.logOperation('update_record_status_error', {
                recordId: recordId,
                status: status,
                error: error.message
            }, 'error');
        }
    }

    /**
     * Update expense record with processed data
     * @param {string} recordId - Record ID
     * @param {Object} data - Processed data
     * @returns {boolean} Success status
     */
    function updateExpenseRecord(recordId, data) {
        try {
            const { ocrData, llmData, trackingId } = data;
            const expenseData = llmData.expenseData;

            const updateValues = {
                [CONSTANTS.FIELDS.PROCESSING_STATUS]: CONSTANTS.STATUS.COMPLETE,
                [CONSTANTS.FIELDS.VENDOR_NAME]: expenseData.vendor,
                [CONSTANTS.FIELDS.EXPENSE_AMOUNT]: expenseData.amount,
                [CONSTANTS.FIELDS.EXPENSE_DATE]: expenseData.date,
                [CONSTANTS.FIELDS.EXPENSE_CATEGORY]: expenseData.categoryId,
                [CONSTANTS.FIELDS.DESCRIPTION]: expenseData.description,
                [CONSTANTS.FIELDS.CONFIDENCE_SCORE]: expenseData.confidence,
                [CONSTANTS.FIELDS.PROCESSED_DATE]: new Date(),
                [CONSTANTS.FIELDS.RAW_OCR_DATA]: JSON.stringify(ocrData.rawData),
                [CONSTANTS.FIELDS.LLM_RESPONSE]: JSON.stringify({
                    response: llmData.rawLLMResponse,
                    model: llmData.model,
                    trackingId: trackingId
                })
            };

            // Clear any previous error messages
            updateValues[CONSTANTS.FIELDS.ERROR_MESSAGE] = '';

            record.submitFields({
                type: CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE,
                id: recordId,
                values: updateValues
            });

            return true;

        } catch (error) {
            commonLib.logOperation('update_expense_record_error', {
                recordId: recordId,
                error: error.message
            }, 'error');

            throw error;
        }
    }

    /**
     * Update record with error information
     * @param {string} recordId - Record ID
     * @param {string} errorMessage - Error message
     */
    function updateRecordWithError(recordId, errorMessage) {
        try {
            record.submitFields({
                type: CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE,
                id: recordId,
                values: {
                    [CONSTANTS.FIELDS.PROCESSING_STATUS]: CONSTANTS.STATUS.ERROR,
                    [CONSTANTS.FIELDS.ERROR_MESSAGE]: errorMessage,
                    [CONSTANTS.FIELDS.PROCESSED_DATE]: new Date()
                }
            });
        } catch (error) {
            commonLib.logOperation('update_record_with_error_failed', {
                recordId: recordId,
                originalError: errorMessage,
                updateError: error.message
            }, 'error');
        }
    }

    /**
     * Get script parameter with fallback
     * @param {string} paramName - Parameter name
     * @param {*} defaultValue - Default value
     * @returns {*} Parameter value
     */
    function getScriptParameter(paramName, defaultValue) {
        return commonLib.getScriptParameter(
            CONSTANTS.SCRIPT_PARAMS[paramName],
            defaultValue
        );
    }

    /**
     * Determine if notification should be sent
     * @param {Object} expenseData - Processed expense data
     * @returns {boolean} Whether to send notification
     */
    function shouldSendNotification(expenseData) {
        try {
            // Send notification for high-confidence processing
            return expenseData.confidence >= 0.9 && !expenseData.requiresReview;
        } catch (error) {
            return false;
        }
    }

    /**
     * Send processing notification to user
     * @param {string} userId - User ID
     * @param {string} recordId - Expense record ID
     * @param {Object} expenseData - Processed expense data
     */
    function sendProcessingNotification(userId, recordId, expenseData) {
        try {
            // This would send an email notification
            // Simplified for now - could be expanded based on requirements

            commonLib.logOperation('notification_sent', {
                userId: userId,
                recordId: recordId,
                vendor: expenseData.vendor,
                amount: expenseData.amount
            });

        } catch (error) {
            commonLib.logOperation('notification_error', {
                userId: userId,
                recordId: recordId,
                error: error.message
            }, 'error');
        }
    }

    /**
     * Schedule next Map/Reduce run if needed
     */
    function scheduleNextRun() {
        try {
            // Check if there are still pending records using SuiteQL
            const pendingQuery = `
                SELECT COUNT(*) as pending_count
                FROM customrecord_ains_expense_capture
                WHERE custrecord_ains_processing_status = '${CONSTANTS.STATUS.PENDING}'
                AND isinactive = 'F'
            `;

            const pendingResult = query.runSuiteQL({
                query: pendingQuery
            });

            const pendingCount = parseInt(pendingResult.results[0].values[0]);

            if (pendingCount > 0) {
                // Schedule another run in 5 minutes
                const mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: runtime.getCurrentScript().id,
                    deploymentId: runtime.getCurrentScript().deploymentId
                });

                // Note: In a real implementation, you might want to use a scheduled script
                // to periodically check for pending records instead of chaining Map/Reduce jobs

                commonLib.logOperation('next_run_scheduled', {
                    pendingCount: pendingCount,
                    taskId: mrTask.id
                });
            }

        } catch (error) {
            commonLib.logOperation('schedule_next_run_error', {
                error: error.message
            }, 'error');
        }
    }

    /**
     * Validate Map/Reduce execution environment
     * @returns {boolean} Whether environment is valid
     */
    function validateEnvironment() {
        try {
            // Check if required libraries are available
            if (!ociLib || !llmLib) {
                throw new Error('Required libraries not available');
            }

            // Check if expense categories are available
            const categories = commonLib.getExpenseCategories();
            if (!categories || categories.length === 0) {
                throw new Error('No expense categories available');
            }

            // Check LLM usage limits
            const usageStats = llmLib.getLLMUsageStats();
            if (usageStats.remainingTextGeneration === 0) {
                throw new Error('LLM usage limit exceeded');
            }

            return true;

        } catch (error) {
            commonLib.logOperation('environment_validation_error', {
                error: error.message
            }, 'error');

            return false;
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});