/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @description Scheduled script to process completed OCI files and create final expense records
 */

define(['N/file', 'N/search', 'N/record', 'N/runtime', 'N/query', 'N/documentUnderstanding', 'N/format', 'N/config',
        '../Libraries/AINS_LIB_Common', '../Libraries/AINS_LIB_LLMProcessor'],
function(file, search, record, runtime, query, documentUnderstanding, format, config, commonLib, llmProcessor) {

    const CONSTANTS = commonLib.CONSTANTS;

    /**
     * Create a Date object that respects NetSuite company timezone preferences
     * @param {string} dateString - Date string in YYYY-MM-DD format
     * @returns {Date} Date object in company timezone
     */
    function createCompanyTimezoneDate(dateString) {
        try {
            // First create the date using NetSuite's format module with company timezone
            // This ensures we respect the company's configured timezone preference
            const formattedDate = format.parse({
                value: dateString,
                type: format.Type.DATE
            });

            return formattedDate;

        } catch (error) {
            commonLib.logOperation('ss_timezone_date_creation_error', {
                dateString: dateString,
                error: error.message
            }, 'error');

            // Fallback to manual parsing if format module fails
            const dateParts = dateString.split('-');
            return new Date(
                parseInt(dateParts[0]), // year
                parseInt(dateParts[1]) - 1, // month (0-based)
                parseInt(dateParts[2]) // day
            );
        }
    }

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

                        // Load the OCI results file
            const fileObj = file.load({ id: ociFile.id });

            // Get raw OCI data before parsing
            const rawOciData = JSON.parse(fileObj.getContents());

            // Use parseAnalysisResult for structured data instead of raw JSON
            const structuredData = documentUnderstanding.parseAnalysisResult({ file: fileObj });

            commonLib.logOperation('ss_structured_data_parsed', {
                fileName: ociFile.name,
                hasPages: !!(structuredData.pages && structuredData.pages.length > 0),
                pageCount: structuredData.pages ? structuredData.pages.length : 0,
                hasFields: !!(structuredData.pages?.[0]?.fields?.length),
                fieldCount: structuredData.pages?.[0]?.fields?.length || 0,
                hasTables: !!(structuredData.pages?.[0]?.tables?.length),
                tableCount: structuredData.pages?.[0]?.tables?.length || 0
            });

            // Convert structured data to enhanced format for LLM
            const enhancedOcrData = convertStructuredDataForLLM(structuredData);

            // Calculate overall OCI confidence for reporting
            const ociConfidenceMetrics = calculateOCIConfidenceMetrics(structuredData);

            // Process with LLM using enhanced structured data
            const llmResponse = llmProcessor.processExpenseDataWithLLM(enhancedOcrData, {
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
                llmConfidence: llmResults.confidence,
                ociConfidence: ociConfidenceMetrics.overallOCIScore,
                highConfidenceOCIFields: ociConfidenceMetrics.highConfidenceFields,
                lowConfidenceOCIFields: ociConfidenceMetrics.lowConfidenceFields,
                usedStructuredData: true
            });

            // Calculate composite confidence score before creating record
            const compositeConfidence = calculateCompositeConfidence(
                ociConfidenceMetrics.overallOCIScore,
                llmResults.confidence
            );

            // Create the final complete expense record
            const expenseRecordId = createCompleteExpenseRecord({
                context: context,
                ocrData: enhancedOcrData, // Use enhanced data
                structuredData: structuredData, // Keep original structured data
                rawOciData: rawOciData, // Raw OCI data before parsing
                ociConfidenceMetrics: ociConfidenceMetrics, // Add OCI confidence
                llmResults: llmResults,
                rawLLMRequest: rawLLMRequest,
                rawLLMResponse: rawLLMResponse,
                ociFileId: ociFile.id,
                compositeConfidence: compositeConfidence // Pass the calculated confidence
            });

            commonLib.logOperation('ss_expense_record_created', {
                fileName: ociFile.name,
                expenseRecordId: expenseRecordId,
                vendor: llmResults.vendor,
                amount: llmResults.amount,
                ociConfidence: ociConfidenceMetrics.overallOCIScore,
                llmConfidence: llmResults.confidence,
                compositeConfidence: compositeConfidence,
                confidenceLevel: getConfidenceLevel(compositeConfidence)
            });

            // Clean up the OCI file
            // Archive the OCI JSON to the processed folder instead of deleting
            try {
                const archiveFolderId = getProcessedFolderId();

                if (archiveFolderId) {
                    try {
                        const archivedFile = file.load({ id: ociFile.id });
                        const originalName = archivedFile.name;
                        archivedFile.folder = archiveFolderId;
                        archivedFile.name = 'processed_' + originalName;
                        archivedFile.save();

                        commonLib.logOperation('ss_file_archived', {
                            originalName: originalName,
                            newName: archivedFile.name,
                            folderId: archiveFolderId
                        });
                    } catch (moveErr) {
                        // If moving fails, try a different approach
                        commonLib.logOperation('ss_file_move_failed_trying_copy', {
                            fileName: ociFile.name,
                            moveError: moveErr.message
                        });

                        // Try creating a copy in the archive folder and then delete original
                        const originalFile = file.load({ id: ociFile.id });
                        const archivedFile = file.create({
                            name: 'processed_' + originalFile.name,
                            fileType: originalFile.fileType,
                            contents: originalFile.getContents(),
                            folder: archiveFolderId
                        });
                        const newFileId = archivedFile.save();

                        // Only delete original after successful copy
                        file.delete({ id: ociFile.id });

                        commonLib.logOperation('ss_file_copied_to_archive', {
                            originalFileId: ociFile.id,
                            newFileId: newFileId,
                            fileName: archivedFile.name,
                            folderId: archiveFolderId
                        });
                    }
                } else {
                    // Folder couldn't be found or created - this is now a critical error
                    commonLib.logOperation('ss_critical_archive_folder_unavailable', {
                        fileName: ociFile.name,
                        message: 'ArchivedOciJson folder not found and could not be created. File will be DELETED to prevent reprocessing.'
                    }, 'error');

                    // Still delete to prevent infinite reprocessing, but log as critical error
                    file.delete({ id: ociFile.id });
                }

            } catch (archiveErr) {
                // If archiving fails completely, log detailed error and fall back to deletion
                commonLib.logOperation('ss_file_archive_error', {
                    fileName: ociFile.name,
                    error: archiveErr.message,
                    stack: archiveErr.stack
                }, 'error');

                // Delete to prevent infinite reprocessing loops
                try {
                    file.delete({ id: ociFile.id });
                } catch (deleteErr) {
                    commonLib.logOperation('ss_file_delete_also_failed', {
                        fileName: ociFile.name,
                        archiveError: archiveErr.message,
                        deleteError: deleteErr.message
                    }, 'error');
                }
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
            const { context, ocrData, structuredData, rawOciData, ociConfidenceMetrics, llmResults, rawLLMRequest, rawLLMResponse, ociFileId, compositeConfidence } = data;

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
                // Use NetSuite company timezone preferences for date creation
                // This ensures dates are stored in the correct timezone based on company configuration
                const companyDate = createCompanyTimezoneDate(llmResults.date);

                expenseRecord.setValue({
                    fieldId: CONSTANTS.FIELDS.EXPENSE_DATE,
                    value: companyDate
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

            // Use the passed composite confidence score
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.CONFIDENCE_SCORE,
                value: compositeConfidence
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

            // Set file metadata - get original file details
            try {
                const originalFile = file.load({ id: context.fileId });

                // Set file size (convert bytes to KB)
                const fileSizeKB = Math.ceil(originalFile.size / 1024);
                expenseRecord.setValue({
                    fieldId: CONSTANTS.FIELDS.FILE_SIZE,
                    value: fileSizeKB
                });

                // Set file type from file extension
                const fileName = originalFile.name || '';
                const extension = fileName.split('.').pop()?.toLowerCase() || 'unknown';
                expenseRecord.setValue({
                    fieldId: CONSTANTS.FIELDS.FILE_TYPE,
                    value: extension.toUpperCase()
                });

                commonLib.logOperation('ss_file_metadata_set', {
                    fileName: fileName,
                    fileSizeBytes: originalFile.size,
                    fileSizeKB: fileSizeKB,
                    fileType: extension.toUpperCase()
                });

            } catch (fileMetadataError) {
                commonLib.logOperation('ss_file_metadata_error', {
                    fileId: context.fileId,
                    error: fileMetadataError.message
                }, 'error');

                // Set default values if file metadata retrieval fails
                expenseRecord.setValue({
                    fieldId: CONSTANTS.FIELDS.FILE_SIZE,
                    value: 0
                });
                expenseRecord.setValue({
                    fieldId: CONSTANTS.FIELDS.FILE_TYPE,
                    value: 'UNKNOWN'
                });
            }

            // Attach OCI JSON file by ID
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.OCI_JSON_FILE,
                value: ociFileId
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

            // Store raw OCI data before parsing
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.RAW_OCI_BEFORE,
                value: JSON.stringify(rawOciData)
            });

            // Store structured OCI data after parsing
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.STRUCTURED_OCI_DATA,
                value: JSON.stringify(structuredData)
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
     * Resolve the internal ID of the "ArchivedOciJson" folder.
     * 1. Try to locate the folder by exact name (case-sensitive match).
     * 2. If not found, try to create the folder.
     * 3. If creation fails, log detailed error for troubleshooting.
     *
     * @returns {number} internalId of the processed folder or null if not found/created
     */
    function getProcessedFolderId () {
        const PROCESSED_FOLDER_NAME = 'ArchivedOciJson';
        try {
            // Attempt to find folder by name
            const folderSearch = search.create({
                type: 'folder',
                filters: [['name', 'is', PROCESSED_FOLDER_NAME]],
                columns: ['internalid', 'name']
            });

            const result = folderSearch.run().getRange({ start: 0, end: 1 });
            if (result && result.length) {
                const folderId = parseInt(result[0].getValue({ name: 'internalid' }), 10);
                commonLib.logOperation('ss_processed_folder_found', {
                    folderId: folderId,
                    folderName: result[0].getValue({ name: 'name' })
                });
                return folderId;
            }

            // Folder not found - try to create it
            commonLib.logOperation('ss_processed_folder_not_found_attempting_create', {
                folderName: PROCESSED_FOLDER_NAME
            });

            const newFolder = record.create({
                type: record.Type.FOLDER
            });
            newFolder.setValue({
                fieldId: 'name',
                value: PROCESSED_FOLDER_NAME
            });
            newFolder.setValue({
                fieldId: 'parent',
                value: -15 // File Cabinet root
            });

            const newFolderId = newFolder.save();

            commonLib.logOperation('ss_processed_folder_created', {
                folderId: newFolderId,
                folderName: PROCESSED_FOLDER_NAME
            });

            return newFolderId;

        } catch (lookupErr) {
            // Log detailed error for troubleshooting
            commonLib.logOperation('ss_processed_folder_error', {
                folderName: PROCESSED_FOLDER_NAME,
                error: lookupErr.message,
                stack: lookupErr.stack
            }, 'error');
        }
        return null;
    }

            /**
     * Pass structured OCR data directly to LLM with minimal processing
     * @param {Object} structuredData - Parsed Document Understanding data
     * @returns {Object} Raw data with basic context for LLM
     */
    function convertStructuredDataForLLM(structuredData) {
        try {
            // Ultra-minimal approach: just add context and pass through
            return {
                documentType: 'receipt',
                ocrData: structuredData,
                processingNote: 'Raw OCR data from NetSuite Document Understanding service'
            };

        } catch (error) {
            commonLib.logOperation('convert_structured_data_error', {
                error: error.message
            }, 'error');

            // Return minimal fallback
            return {
                documentType: 'receipt',
                ocrData: { pages: [], mimeType: 'unknown' },
                processingNote: 'Error loading OCR data'
            };
        }
    }

    /**
     * Calculate OCI confidence metrics for reporting and decision making
     * @param {Object} structuredData - Parsed Document Understanding data
     * @returns {Object} Confidence metrics
     */
    function calculateOCIConfidenceMetrics(structuredData) {
        try {
            const metrics = {
                fieldConfidences: {},
                averageFieldConfidence: 0,
                highConfidenceFields: [],
                lowConfidenceFields: [],
                overallOCIScore: 0
            };

            if (structuredData.pages && structuredData.pages.length > 0) {
                let totalConfidence = 0;
                let elementCount = 0;

                structuredData.pages.forEach(page => {
                    // Process words confidence
                    if (page.words && page.words.length > 0) {
                        page.words.forEach(word => {
                            if (word.confidence !== undefined) {
                                totalConfidence += word.confidence;
                                elementCount++;

                                if (word.confidence >= 0.8) {
                                    metrics.highConfidenceFields.push(`word: ${word.text}`);
                                } else if (word.confidence < 0.5) {
                                    metrics.lowConfidenceFields.push(`word: ${word.text}`);
                                }
                            }
                        });
                    }

                    // Process lines confidence
                    if (page.lines && page.lines.length > 0) {
                        page.lines.forEach(line => {
                            if (line.confidence !== undefined) {
                                totalConfidence += line.confidence;
                                elementCount++;
                            }
                        });
                    }

                    // Process tables confidence
                    if (page.tables && page.tables.length > 0) {
                        page.tables.forEach(table => {
                            if (table.confidence !== undefined) {
                                totalConfidence += table.confidence;
                                elementCount++;

                                if (table.confidence >= 0.8) {
                                    metrics.highConfidenceFields.push(`table: ${table.confidence.toFixed(2)}`);
                                } else if (table.confidence < 0.5) {
                                    metrics.lowConfidenceFields.push(`table: ${table.confidence.toFixed(2)}`);
                                }
                            }
                        });
                    }

                    // Process fields if they exist (for backward compatibility)
                    if (page.fields && page.fields.length > 0) {
                        page.fields.forEach(field => {
                            if (field.label && field.value) {
                                const fieldName = field.label.name || 'unknown';
                                const confidence = field.value.confidence || 0;

                                metrics.fieldConfidences[fieldName.toLowerCase()] = confidence;
                                totalConfidence += confidence;
                                elementCount++;

                                if (confidence >= 0.8) {
                                    metrics.highConfidenceFields.push(fieldName);
                                } else if (confidence < 0.5) {
                                    metrics.lowConfidenceFields.push(fieldName);
                                }
                            }
                        });
                    }
                });

                metrics.averageFieldConfidence = elementCount > 0 ? totalConfidence / elementCount : 0;
                metrics.overallOCIScore = metrics.averageFieldConfidence;

                // Log the calculated metrics for debugging
                commonLib.logOperation('oci_confidence_calculated', {
                    totalElements: elementCount,
                    averageConfidence: metrics.averageFieldConfidence,
                    overallScore: metrics.overallOCIScore,
                    highConfidenceCount: metrics.highConfidenceFields.length,
                    lowConfidenceCount: metrics.lowConfidenceFields.length
                });
            }

            return metrics;

        } catch (error) {
            commonLib.logOperation('calculate_oci_confidence_error', {
                error: error.message
            }, 'error');

            return {
                fieldConfidences: {},
                averageFieldConfidence: 0,
                highConfidenceFields: [],
                lowConfidenceFields: [],
                overallOCIScore: 0
            };
        }
    }

    /**
     * Calculate composite confidence score combining OCI and LLM confidence
     * @param {number} ociConfidence - OCI overall confidence (0-1)
     * @param {number} llmConfidence - LLM confidence (0-1)
     * @returns {number} Composite confidence score (0-1)
     */
    function calculateCompositeConfidence(ociConfidence, llmConfidence) {
        try {
            // Ensure valid inputs
            const oci = Math.max(0, Math.min(1, ociConfidence || 0));
            const llm = Math.max(0, Math.min(1, llmConfidence || 0));

            // If either is very low, overall confidence should be low
            if (oci < 0.3 || llm < 0.3) {
                return Math.min(oci, llm); // Return the lower of the two
            }

            // Weighted combination:
            // - OCI confidence weighted 60% (data extraction quality is fundamental)
            // - LLM confidence weighted 40% (interpretation quality)
            const weightedScore = (oci * 0.6) + (llm * 0.4);

            // Apply a penalty if either component is not high confidence
            // This ensures both components need to be good for high overall score
            const harmonic_mean = 2 * (oci * llm) / (oci + llm);
            const final_score = (weightedScore + harmonic_mean) / 2;

            return Math.round(final_score * 100) / 100; // Round to 2 decimal places

        } catch (error) {
            commonLib.logOperation('calculate_composite_confidence_error', {
                ociConfidence: ociConfidence,
                llmConfidence: llmConfidence,
                error: error.message
            }, 'error');

            // Return conservative confidence on error
            return 0.3;
        }
    }

    /**
     * Convert numeric confidence to human-readable level
     * @param {number} confidence - Composite confidence score (0-1)
     * @returns {string} Confidence level description
     */
    function getConfidenceLevel(confidence) {
        if (confidence >= 0.8) return 'High';
        if (confidence >= 0.6) return 'Medium';
        if (confidence >= 0.4) return 'Low';
        return 'Very Low';
    }

    return {
        execute: execute
    };
});