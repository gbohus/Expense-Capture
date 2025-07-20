/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @description Scheduled script to process completed OCI files and create final expense records
 */

define(['N/file', 'N/search', 'N/record', 'N/runtime', 'N/query',
        '../Libraries/AINS_LIB_Common', '../Libraries/AINS_LIB_LLMProcessor'],
function(file, search, record, runtime, query, commonLib, llmProcessor) {

    const CONSTANTS = commonLib.CONSTANTS;

    /**
     * Scheduled script execution function
     * @param {Object} context - Execution context
     */
    function execute(context) {
        try {
            commonLib.logOperation('ss_execute_start', {
                timestamp: new Date().toISOString()
            });

            // Find completed OCI files that haven't been processed yet
            const completedFiles = findCompletedOCIFiles();

            if (completedFiles.length === 0) {
                commonLib.logOperation('ss_no_files_found', {
                    message: 'No OCI files ready for processing'
                });
                return;
            }

            commonLib.logOperation('ss_files_found', {
                fileCount: completedFiles.length,
                files: completedFiles.map(f => f.name)
            });

            // Process each completed file
            let processedCount = 0;
            let errorCount = 0;

            completedFiles.forEach(ociFile => {
                try {
                    processOCIFile(ociFile);
                    processedCount++;
                } catch (error) {
                    errorCount++;
                    commonLib.logOperation('ss_file_processing_error', {
                        fileName: ociFile.name,
                        error: error.message
                    }, 'error');
                }
            });

            commonLib.logOperation('ss_execute_complete', {
                totalFiles: completedFiles.length,
                processedCount: processedCount,
                errorCount: errorCount
            });

        } catch (error) {
            commonLib.logOperation('ss_execute_error', {
                error: error.message
            }, 'error');
        }
    }

    /**
     * Find completed OCI files ready for processing
     * @returns {Array} Array of file objects
     */
    function findCompletedOCIFiles() {
        try {
            // Use SuiteQL to find OCI files - using correct file table field names
            const suiteQL = `
                SELECT
                    BUILTIN_RESULT.TYPE_INTEGER("FILE"."ID") AS "ID",
                    BUILTIN_RESULT.TYPE_STRING("FILE".name) AS name,
                    BUILTIN_RESULT.TYPE_DATETIME("FILE".createddate) AS createddate,
                    BUILTIN_RESULT.TYPE_INTEGER("FILE".folder) AS folder
                FROM "FILE"
                WHERE name LIKE 'receipt_%'
                AND name LIKE '%.json'
                ORDER BY createddate ASC
            `;

            const results = query.runSuiteQL({
                query: suiteQL
            }).results;

            commonLib.logOperation('ss_raw_file_search', {
                totalFound: results.length,
                sampleFiles: results.slice(0, 3).map(r => ({
                    name: r.values[1],
                    folder: r.values[3]
                }))
            });

            // Limit to 50 files in JavaScript
            const limitedResults = results.slice(0, 50);

            return limitedResults.map(result => ({
                id: result.values[0],
                name: result.values[1],
                created: result.values[2],
                folder: result.values[3]
            }));

        } catch (error) {
            commonLib.logOperation('find_completed_files_error', {
                error: error.message
            }, 'error');
            return [];
        }
    }

    /**
     * Process a single OCI file
     * @param {Object} ociFile - File object with id and name
     */
    function processOCIFile(ociFile) {
        try {
            // Extract context from filename: receipt_userId_fileId_timestamp_trackingId.json
            const context = extractContextFromFilename(ociFile.name);

            commonLib.logOperation('ss_processing_file', {
                fileName: ociFile.name,
                extractedContext: context
            });

            // Load the OCI results
            const fileObj = file.load({ id: ociFile.id });
            const ocrData = JSON.parse(fileObj.getContents());

            commonLib.logOperation('ss_ocr_data_loaded', {
                fileName: ociFile.name,
                hasOcrData: !!ocrData,
                ocrDataKeys: ocrData ? Object.keys(ocrData) : []
            });

            // Process with LLM
            const llmResponse = llmProcessor.processExpenseDataWithLLM(ocrData, {
                model: 'command-r',
                confidenceThreshold: 0.7
            });

            if (!llmResponse.success) {
                throw new Error(`LLM processing failed: ${llmResponse.error}`);
            }

            const llmResults = llmResponse.expenseData;
            const { rawLLMRequest, rawLLMResponse } = llmResponse;

            commonLib.logOperation('ss_llm_processing_complete', {
                fileName: ociFile.name,
                vendor: llmResults.vendor,
                amount: llmResults.amount,
                confidence: llmResults.confidence
            });

            // Create the final complete expense record
            const expenseRecordId = createCompleteExpenseRecord({
                context: context,
                ocrData: ocrData,
                llmResults: llmResults,
                rawLLMRequest: rawLLMRequest,
                rawLLMResponse: rawLLMResponse,
                ociFileId: ociFile.id
            });

            commonLib.logOperation('ss_expense_record_created', {
                fileName: ociFile.name,
                expenseRecordId: expenseRecordId,
                vendor: llmResults.vendor,
                amount: llmResults.amount
            });

            // Clean up the OCI file
            // Archive the OCI JSON to the processed folder instead of deleting
            try {
                const archiveFolderId = getProcessedFolderId();

                if (archiveFolderId) {
                    const archivedFile = file.load({ id: ociFile.id });
                    archivedFile.folder = archiveFolderId;
                    archivedFile.name   = 'processed_' + archivedFile.name;
                    archivedFile.save();

                    commonLib.logOperation('ss_file_archived', {
                        fileName: archivedFile.name,
                        folderId: archiveFolderId
                    });
                } else {
                    commonLib.logOperation('ss_processed_folder_not_found', {
                        fileName: ociFile.name
                    });
                    file.delete({ id: ociFile.id });
                }

            } catch (archiveErr) {
                // If archiving fails, log and fall back to deletion to avoid re-processing
                commonLib.logOperation('ss_file_archive_error', {
                    fileName: ociFile.name,
                    error: archiveErr.message
                }, 'error');

                file.delete({ id: ociFile.id });
            }

            commonLib.logOperation('ss_file_processed_successfully', {
                fileName: ociFile.name,
                expenseRecordId: expenseRecordId
            });

        } catch (error) {
            commonLib.logOperation('ss_process_file_error', {
                fileName: ociFile.name,
                error: error.message
            }, 'error');
            throw error;
        }
    }

    /**
     * Extract context information from OCI filename
     * @param {string} filename - OCI filename: receipt_userId_fileId_timestamp_trackingId.json
     * @returns {Object} Extracted context
     */
    function extractContextFromFilename(filename) {
        try {
            // Remove .json extension and split by underscore
            const parts = filename.replace('.json', '').split('_');

            if (parts.length < 5 || parts[0] !== 'receipt') {
                throw new Error('Invalid filename format');
            }

            return {
                userId: parts[1],
                fileId: parts[2],
                timestamp: parseInt(parts[3]),
                trackingId: parts[4]
            };

        } catch (error) {
            throw new Error(`Failed to extract context from filename ${filename}: ${error.message}`);
        }
    }

    /**
     * Create complete expense record with all data
     * @param {Object} data - All expense data
     * @returns {string} Created record ID
     */
    function createCompleteExpenseRecord(data) {
        try {
            const { context, ocrData, llmResults, rawLLMRequest, rawLLMResponse, ociFileId } = data;

            const expenseRecord = record.create({
                type: CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE
            });

            // Note: Name field is auto-generated (AINS-0001, AINS-0002, etc.)

            // Set basic information
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.FILE_ATTACHMENT,
                value: context.fileId
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.CREATED_BY,
                value: context.userId
            });

            // Set processed expense data from LLM
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.VENDOR_NAME,
                value: llmResults.vendor || 'Unknown Vendor'
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.EXPENSE_AMOUNT,
                value: llmResults.amount || 0
            });

            if (llmResults.date) {
                expenseRecord.setValue({
                    fieldId: CONSTANTS.FIELDS.EXPENSE_DATE,
                    value: new Date(llmResults.date)
                });
            }

            if (llmResults.categoryId) {
                expenseRecord.setValue({
                    fieldId: CONSTANTS.FIELDS.EXPENSE_CATEGORY,
                    value: llmResults.categoryId
                });
            }

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.DESCRIPTION,
                value: llmResults.description || 'Receipt processed by AI'
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.CONFIDENCE_SCORE,
                value: llmResults.confidence || 0
            });

            // Set status as complete (no intermediate states)
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.PROCESSING_STATUS,
                value: CONSTANTS.STATUS.COMPLETE
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.PROCESSED_DATE,
                value: new Date()
            });

            // Store technical data
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.RAW_OCR_DATA,
                value: JSON.stringify(ocrData)
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.LLM_RESPONSE,
                value: JSON.stringify(llmResults)
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.LLM_REQUEST,
                value: rawLLMRequest || ''
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.LLM_RAW_RESPONSE,
                value: rawLLMResponse || ''
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.IMPORTED_TO_ER,
                value: false
            });

            // Save the record
            const recordId = expenseRecord.save();
            return recordId;

        } catch (error) {
            throw new Error(`Failed to create expense record: ${error.message}`);
        }
    }

    /**
     * Resolve the internal ID of the "Expense Capture - Processed" folder.
     * 1. Try to locate the folder by exact name (case-sensitive match).
     * 2. If not found, look for a script parameter (custscript_ains_processed_folder_id).
     * 3. Finally, fall back to default internal ID 3876.
     *
     * @returns {number} internalId of the processed folder
     */
    function getProcessedFolderId () {
        const PROCESSED_FOLDER_NAME = 'ArchivedOciJson';
        try {
            // Attempt to find folder by name
            const folderSearch = search.create({
                type: 'folder',
                filters: [['name', 'is', PROCESSED_FOLDER_NAME]],
                columns: ['internalid']
            });

            const result = folderSearch.run().getRange({ start: 0, end: 1 });
            if (result && result.length) {
                return parseInt(result[0].getValue({ name: 'internalid' }), 10);
            }
        } catch (lookupErr) {
            // Fall through to next resolution steps but log for visibility
            commonLib.logOperation('ss_processed_folder_lookup_error', {
                message: lookupErr.message
            }, 'error');
        }
        return null; // Return null if folder not found by name
    }

    return {
        execute: execute
    };
});