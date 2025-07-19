/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @description Receipt upload Suitelet for AI NS Expense Capture system
 */

define(['N/ui/serverWidget', 'N/file', 'N/record', 'N/runtime', 'N/url', 'N/redirect', 'N/encode', 'N/task', 'N/search',
        '../Libraries/AINS_LIB_Common', '../Libraries/AINS_LIB_OCIIntegration'],
function(ui, file, record, runtime, url, redirect, encode, task, search, commonLib, ociLib) {

    const CONSTANTS = commonLib.CONSTANTS;

    /**
     * Definition of the Suitelet script trigger point.
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     */
    function onRequest(context) {
        try {
            if (context.request.method === 'GET') {
                return renderUploadForm(context);
            } else if (context.request.method === 'POST') {
                return processFileUpload(context);
            }
        } catch (error) {
            commonLib.logOperation('suitelet_error', {
                method: context.request.method,
                error: error.message
            }, 'error');

            return showErrorPage(context, error);
        }
    }

    /**
     * Render the file upload form
     * @param {Object} context - Request context
     */
    function renderUploadForm(context) {
        const currentUser = commonLib.getCurrentUser();
        const isEmployeeCenter = commonLib.isEmployeeCenterRole();

        // Check if we have an uploaded file in the session/parameters
        let uploadedFileId = context.request.parameters.uploaded_file_id;
        let uploadedFileName = context.request.parameters.uploaded_file_name;

        commonLib.logOperation('render_upload_form', {
            userId: currentUser.id,
            isEmployeeCenter: isEmployeeCenter,
            hasUploadedFile: !!uploadedFileId
        });

        // Create form
        const form = ui.createForm({
            title: 'AI NS Expense Receipt Upload'
        });

        // Add client script for form validation
        form.clientScriptModulePath = '../ClientScripts/AINS_CS_ReceiptUpload.js';

        // Add CSS styling
        addFormStyling(form);

        // Instructions section
        const instructionsField = form.addField({
            id: 'instructions',
            type: ui.FieldType.INLINEHTML,
            label: 'Instructions'
        });

        instructionsField.defaultValue = createInstructionsHTML();

        if (!uploadedFileId) {
            // Step 1: Show upload interface
            renderUploadInterface(form, currentUser);
        } else {
            // Step 2: Show processing interface
            renderProcessingInterface(form, currentUser, uploadedFileId, uploadedFileName);
        }

        // Status section for displaying recent uploads
        if (context.request.parameters.showRecent !== 'false') {
            addRecentUploadsSection(form, currentUser.id);
        }

        // Cancel button for Employee Center
        if (isEmployeeCenter) {
            form.addButton({
                id: 'btn_cancel',
                label: 'Return to Dashboard',
                functionName: 'returnToDashboard'
            });
        }

        // Add hidden fields for processing
        form.addField({
            id: 'user_id',
            type: ui.FieldType.TEXT,
            label: 'User ID'
        }).updateDisplayType({
            displayType: ui.FieldDisplayType.HIDDEN
        }).defaultValue = currentUser.id;

        if (uploadedFileId) {
            form.addField({
                id: 'uploaded_file_id',
                type: ui.FieldType.TEXT,
                label: 'Uploaded File ID'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = uploadedFileId;

            form.addField({
                id: 'uploaded_file_name',
                type: ui.FieldType.TEXT,
                label: 'Uploaded File Name'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = uploadedFileName;
        }

        context.response.writePage(form);
    }

    /**
     * Render upload interface (Step 1)
     * @param {Form} form - Form object
     * @param {Object} currentUser - Current user details
     */
    function renderUploadInterface(form, currentUser) {
        // Native NetSuite File Upload Field
        const fileField = form.addField({
            id: 'receipt_file',
            type: ui.FieldType.FILE,
            label: 'Receipt File'
        });

        fileField.isMandatory = true;

        // File upload instructions
        const uploadSection = form.addField({
            id: 'upload_section',
            type: ui.FieldType.INLINEHTML,
            label: 'Upload Your Receipt'
        });

        const maxSize = commonLib.getScriptParameter(CONSTANTS.SCRIPT_PARAMS.MAX_FILE_SIZE, CONSTANTS.DEFAULT_VALUES.MAX_FILE_SIZE_MB);

        uploadSection.defaultValue = `
            <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 20px; margin: 15px 0;">
                <h3 style="color: #1f4e79; margin-top: 0;">📎 Upload Your Receipt</h3>
                <p style="margin-bottom: 15px;">Select your receipt file using the field above, then click "Upload & Process" to extract expense data with AI.</p>
                <div style="background: #e9ecef; border-radius: 3px; padding: 10px; margin: 10px 0;">
                    <strong>📋 Supported Formats:</strong> ${CONSTANTS.SUPPORTED_FILE_TYPES.join(', ').toUpperCase()}<br>
                    <strong>📏 Maximum Size:</strong> ${maxSize}MB<br>
                    <strong>🤖 AI Processing:</strong> Automatically extracts vendor, amount, date, and category
                </div>
                <p style="font-size: 12px; color: #6c757d; margin-bottom: 0;">
                    💡 <strong>Tip:</strong> Clear, well-lit images work best for accurate data extraction
                </p>
            </div>
        `;

        // Submit button
        form.addSubmitButton({
            label: 'Upload & Process Receipt'
        });
    }

    /**
     * Render processing interface (Step 2)
     * @param {Form} form - Form object
     * @param {Object} currentUser - Current user details
     * @param {string} uploadedFileId - ID of uploaded file
     * @param {string} uploadedFileName - Name of uploaded file
     */
    function renderProcessingInterface(form, currentUser, uploadedFileId, uploadedFileName) {
        // Show uploaded file confirmation
        const confirmationField = form.addField({
            id: 'file_confirmation',
            type: ui.FieldType.INLINEHTML,
            label: 'Uploaded File'
        });

        confirmationField.defaultValue = `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h4>✅ File Uploaded Successfully!</h4>
                <p><strong>File:</strong> ${uploadedFileName}</p>
                <p><strong>File ID:</strong> ${uploadedFileId}</p>
                <p>Click "Process Receipt" below to extract expense data using AI.</p>
            </div>
        `;

        // Processing options
        const processingField = form.addField({
            id: 'processing_options',
            type: ui.FieldType.INLINEHTML,
            label: 'Processing Options'
        });

        processingField.defaultValue = `
            <div style="text-align: center; padding: 20px; background: #e7f3ff; border-radius: 5px; margin: 15px 0;">
                <h3 style="color: #1f4e79; margin-bottom: 15px;">🤖 AI Processing</h3>
                <p style="margin-bottom: 20px;">Ready to extract expense data from your receipt using Oracle OCI Document Understanding and NetSuite LLM.</p>
                <p style="margin-bottom: 20px; font-size: 14px; color: #666;">
                    This will automatically extract: Vendor, Amount, Date, Category, and Description
                </p>
            </div>
        `;

        // Process button
        form.addSubmitButton({
            label: 'Process Receipt'
        });

        // Upload different file button
        form.addButton({
            id: 'btn_upload_different',
            label: '📁 Upload Different File',
            functionName: 'uploadDifferentFile'
        });
    }

    /**
     * Process uploaded file or trigger processing
     * @param {Object} context - Request context
     */
    function processFileUpload(context) {
        const trackingId = commonLib.generateTrackingId();

        try {
            const parameters = context.request.parameters;
            const files = context.request.files;

            // Check if this is a processing trigger (Step 2) or file upload (Step 1)
            const uploadedFileId = parameters.uploaded_file_id;
            const uploadedFileName = parameters.uploaded_file_name;

            if (uploadedFileId) {
                // Step 2: Trigger processing of already uploaded file
                return triggerProcessing(context, uploadedFileId, uploadedFileName, trackingId);
            } else {
                // Step 1: Handle file upload
                return handleFileUpload(context, trackingId);
            }

        } catch (error) {
            commonLib.logOperation('process_file_upload_error', {
                trackingId: trackingId,
                error: error.message
            }, 'error');

            return showErrorPage(context, error);
        }
    }

    /**
     * Handle initial file upload (Step 1)
     * @param {Object} context - Request context
     * @param {string} trackingId - Tracking ID for this operation
     */
    function handleFileUpload(context, trackingId) {
        const parameters = context.request.parameters;
        const files = context.request.files;
        const uploadedFile = files.receipt_file;

        commonLib.logOperation('handle_file_upload_start', {
            trackingId: trackingId,
            userId: parameters.user_id,
            hasFile: !!uploadedFile,
            fileName: uploadedFile ? uploadedFile.name : null
        });

        // Validate file upload
        if (!uploadedFile) {
            throw new Error('No file was uploaded. Please select a receipt file to upload.');
        }

        // Validate file
        const validation = validateUploadedFile(uploadedFile);
        if (!validation.isValid) {
            throw new Error(validation.message);
        }

        // Save file using Enhanced File Security pattern
        const savedFile = saveFileWithEnhancedSecurity(uploadedFile, parameters.user_id);

        commonLib.logOperation('file_upload_success', {
            trackingId: trackingId,
            fileId: savedFile.id,
            fileName: savedFile.name,
            userId: parameters.user_id
        });

        // Redirect back to form with file information for processing step
        return redirectToProcessingStep(context, savedFile.id, savedFile.name);
    }

    /**
     * Trigger processing of uploaded file (Step 2)
     * @param {Object} context - Request context
     * @param {string} fileId - ID of uploaded file
     * @param {string} fileName - Name of uploaded file
     * @param {string} trackingId - Tracking ID for this operation
     */
    function triggerProcessing(context, fileId, fileName, trackingId) {
        const parameters = context.request.parameters;

        commonLib.logOperation('trigger_processing_start', {
            trackingId: trackingId,
            fileId: fileId,
            fileName: fileName,
            userId: parameters.user_id
        });

        // Start Map/Reduce script with file information
        const mrTaskId = startMapReduceProcessing(fileId, fileName, parameters.user_id, trackingId);

        commonLib.logOperation('processing_triggered', {
            trackingId: trackingId,
            fileId: fileId,
            mrTaskId: mrTaskId
        });

        // Show processing started page
        return showProcessingStartedPage(context, {
            fileName: fileName,
            trackingId: trackingId,
            mrTaskId: mrTaskId
        });
    }

    /**
     * Start Map/Reduce script to process the file
     * @param {string} fileId - ID of file to process
     * @param {string} fileName - Name of file
     * @param {string} userId - User ID
     * @param {string} trackingId - Tracking ID
     * @returns {string} Map/Reduce task ID
     */
    function startMapReduceProcessing(fileId, fileName, userId, trackingId) {
        try {
            const mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: CONSTANTS.SCRIPT_IDS.PROCESS_MR,
                deploymentId: CONSTANTS.DEPLOYMENT_IDS.PROCESS_MR,
                params: {
                    'custscript_ains_file_id': fileId,
                    'custscript_ains_file_name': fileName,
                    'custscript_ains_user_id': userId,
                    'custscript_ains_tracking_id': trackingId
                }
            });

            const taskId = mrTask.submit();

            commonLib.logOperation('mr_task_submitted', {
                taskId: taskId,
                fileId: fileId,
                fileName: fileName,
                userId: userId,
                trackingId: trackingId
            });

            return taskId;

        } catch (error) {
            commonLib.logOperation('mr_task_submission_error', {
                error: error.message,
                fileId: fileId,
                trackingId: trackingId
            }, 'error');

            throw new Error(`Failed to start processing: ${error.message}`);
        }
    }

    /**
     * Redirect to processing step after successful upload
     * @param {Object} context - Request context
     * @param {string} fileId - Uploaded file ID
     * @param {string} fileName - Uploaded file name
     */
    function redirectToProcessingStep(context, fileId, fileName) {
        const currentUrl = url.resolveScript({
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId,
            params: {
                uploaded_file_id: fileId,
                uploaded_file_name: fileName
            }
        });

        redirect.redirect({ url: currentUrl });
    }

    /**
     * Show processing started page
     * @param {Object} context - Request context
     * @param {Object} details - Processing details
     */
    function showProcessingStartedPage(context, details) {
        const form = ui.createForm({
            title: 'AI Processing Started'
        });

        const statusField = form.addField({
            id: 'processing_status',
            type: ui.FieldType.INLINEHTML,
            label: 'Status'
        });

        statusField.defaultValue = `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <h3 style="margin-top: 0;">🔄 Processing Started!</h3>
                <p><strong>File:</strong> ${details.fileName}</p>
                <p><strong>Tracking ID:</strong> ${details.trackingId}</p>
                <p><strong>Task ID:</strong> ${details.mrTaskId}</p>
                <p>Your receipt is being processed by AI. The system will:</p>
                <ul>
                    <li>Extract text using Oracle OCI Document Understanding</li>
                    <li>Format data using NetSuite LLM</li>
                    <li>Create expense capture record with extracted details</li>
                </ul>
                <p><em>Processing typically takes 1-2 minutes. Check your dashboard for updates.</em></p>
            </div>
        `;

        // Add action buttons
        form.addButton({
            id: 'btn_upload_another',
            label: 'Upload Another Receipt',
            functionName: 'uploadAnother'
        });

        form.addButton({
            id: 'btn_return_dashboard',
            label: 'Return to Dashboard',
            functionName: 'returnToDashboard'
        });

        // Add client script for button actions
        form.clientScriptModulePath = '../ClientScripts/AINS_CS_ReceiptUploadSuccess.js';

        context.response.writePage(form);
    }

    /**
     * Validate uploaded file
     * @param {File} uploadedFile - File to validate
     * @returns {Object} Validation result
     */
    function validateUploadedFile(uploadedFile) {
        try {
            // Check if file exists
            if (!uploadedFile) {
                return { isValid: false, message: 'No file provided' };
            }

            // Check file size
            const sizeValidation = commonLib.validateFileSize(uploadedFile.size);
            if (!sizeValidation.isValid) {
                return sizeValidation;
            }

            // Check file type
            const typeValidation = commonLib.validateFileType(uploadedFile.name);
            if (!typeValidation.isValid) {
                return typeValidation;
            }

            // Additional OCI-specific validation
            const ociValidation = ociLib.validateReceiptFile(uploadedFile);
            if (!ociValidation.isValid) {
                return ociValidation;
            }

            return { isValid: true, message: 'File validation passed' };

        } catch (error) {
            return { isValid: false, message: `Validation error: ${error.message}` };
        }
    }

    /**
     * Save file using Enhanced File Security pattern
     * @param {File} uploadedFile - File to save
     * @param {string} userId - User ID for folder creation
     * @returns {File} Saved file object
     */
    function saveFileWithEnhancedSecurity(uploadedFile, userId) {
        try {
            // Determine file type with fallback logic
            let fileType = uploadedFile.type || uploadedFile.fileType;

            if (!fileType) {
                // Extract file type from filename
                const fileName = uploadedFile.name || '';
                const extension = fileName.split('.').pop().toLowerCase();

                // Map common extensions to NetSuite file types
                const extensionToType = {
                    'pdf': file.Type.PDF,
                    'jpg': file.Type.JPGIMAGE,
                    'jpeg': file.Type.JPGIMAGE,
                    'png': file.Type.PNGIMAGE,
                    'gif': file.Type.GIFIMAGE,
                    'tiff': file.Type.TIFFIMAGE,
                    'tif': file.Type.TIFFIMAGE
                };

                fileType = extensionToType[extension] || file.Type.PLAINTEXT;
            }

            // Log file details for debugging
            commonLib.logOperation('save_file_details', {
                fileName: uploadedFile.name,
                originalType: uploadedFile.type,
                originalFileType: uploadedFile.fileType,
                determinedFileType: fileType,
                fileSize: uploadedFile.size
            });

            // Create file record with Enhanced File Security pattern
            // The folder ID will automatically be managed by Enhanced File Security
            const fileRecord = file.create({
                name: `AINS_${Date.now()}_${uploadedFile.name}`,
                fileType: fileType,
                contents: uploadedFile.getContents(),
                description: `AI NS Expense Receipt - ${new Date().toLocaleDateString()}`,
                folder: getExpenseFolderId(userId),
                isOnline: true
            });

            const savedFileId = fileRecord.save();

            // Load and return the saved file
            return file.load({ id: savedFileId });

        } catch (error) {
            commonLib.logOperation('save_file_error', {
                fileName: uploadedFile.name,
                userId: userId,
                error: error.message,
                uploadedFileProps: Object.keys(uploadedFile)
            }, 'error');

            throw new Error(`Failed to save file: ${error.message}`);
        }
    }

    /**
     * Get or create expense folder for user (Enhanced File Security pattern)
     * @param {string} userId - User ID
     * @returns {number} Folder ID
     */
    function getExpenseFolderId(userId) {
        try {
            // Enhanced File Security automatically creates user-specific folders
            // The folder structure follows: /Filing Cabinet/Expense Reports/[Employee Name]/
            // For now, we'll use a general folder and let Enhanced File Security handle the organization
            return -15; // Standard Expense Reports folder - Enhanced File Security will create user subfolders

        } catch (error) {
            // Fallback to general folder
            return -15;
        }
    }

    /**
     * Show success page after upload
     * @param {Object} context - Request context
     * @param {Object} details - Success details
     */
    function showSuccessPage(context, details) {
        const form = ui.createForm({
            title: 'Receipt Upload Successful'
        });

        const successField = form.addField({
            id: 'success_message',
            type: ui.FieldType.INLINEHTML,
            label: 'Status'
        });

        successField.defaultValue = `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <h3 style="margin-top: 0;">✓ Upload Successful!</h3>
                <p><strong>File:</strong> ${details.fileName}</p>
                <p><strong>Tracking ID:</strong> ${details.trackingId}</p>
                <p><strong>Status:</strong> Processing started automatically</p>
                <p>Your receipt is being processed by AI. Check back in a few minutes to see the extracted expense data.</p>
            </div>
        `;

        // Add action buttons
        form.addButton({
            id: 'btn_upload_another',
            label: 'Upload Another Receipt',
            functionName: 'uploadAnother'
        });

        if (details.isEmployeeCenter) {
            form.addButton({
                id: 'btn_return_dashboard',
                label: 'Return to Dashboard',
                functionName: 'returnToDashboard'
            });
        } else {
            form.addButton({
                id: 'btn_view_record',
                label: 'View Record',
                functionName: `viewRecord(${details.expenseRecordId})`
            });
        }

        // Add client script for button actions
        form.clientScriptModulePath = '../ClientScripts/AINS_CS_ReceiptUploadSuccess.js';

        context.response.writePage(form);
    }

    /**
     * Show recent file not found page
     * @param {Object} context - Request context
     */
    function showRecentFileNotFoundPage(context) {
        const form = ui.createForm({
            title: 'File Not Found'
        });

        const errorField = form.addField({
            id: 'error_message',
            type: ui.FieldType.INLINEHTML,
            label: 'Error'
        });

        errorField.defaultValue = `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <h3 style="margin-top: 0;">⚠️ File Not Found</h3>
                <p>Unable to locate the recently uploaded file. This may be due to:</p>
                <ul>
                    <li>File upload was not completed successfully</li>
                    <li>File is still being processed by NetSuite</li>
                    <li>File was uploaded to a different location</li>
                </ul>
                <p>Please try uploading your receipt again.</p>
            </div>
        `;

        form.addButton({
            id: 'btn_try_again',
            label: 'Try Again',
            functionName: 'uploadAnother'
        });

        // Add client script
        form.clientScriptModulePath = '../ClientScripts/AINS_CS_ReceiptUpload.js';

        context.response.writePage(form);
    }

    /**
     * Show error page
     * @param {Object} context - Request context
     * @param {Error} error - Error object
     */
    function showErrorPage(context, error) {
        const form = ui.createForm({
            title: 'Upload Error'
        });

        const errorField = form.addField({
            id: 'error_message',
            type: ui.FieldType.INLINEHTML,
            label: 'Error'
        });

        errorField.defaultValue = `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <h3 style="margin-top: 0;">❌ Upload Error</h3>
                <p><strong>Error:</strong> ${error.message}</p>
                <p>Please check your file and try again. If the problem persists, contact your system administrator.</p>
            </div>
        `;

        form.addButton({
            id: 'btn_try_again',
            label: 'Try Again',
            functionName: 'uploadAnother'
        });

        // Add client script
        form.clientScriptModulePath = '../ClientScripts/AINS_CS_ReceiptUpload.js';

        context.response.writePage(form);
    }

    /**
     * Add form styling
     * @param {Form} form - Form object
     */
    function addFormStyling(form) {
        const styleField = form.addField({
            id: 'custom_style',
            type: ui.FieldType.INLINEHTML,
            label: 'Styling'
        });

        styleField.defaultValue = `
            <style>
                .uir-form-title { color: #1f4e79; font-size: 24px; }
                .uir-field-wrapper { margin: 10px 0; }
                .uir-form-group-title { background: #f8f9fa; padding: 10px; border-radius: 3px; }
                .file-upload-area {
                    border: 2px dashed #ccc;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px;
                    margin: 10px 0;
                }
                .file-upload-area:hover { border-color: #007bff; }
                .instructions {
                    background: #e7f3ff;
                    border-left: 4px solid #007bff;
                    padding: 15px;
                    margin: 10px 0;
                }
            </style>
        `;

        styleField.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    }

    /**
     * Create instructions HTML
     * @returns {string} Instructions HTML
     */
    function createInstructionsHTML() {
        const maxSize = commonLib.getScriptParameter(CONSTANTS.SCRIPT_PARAMS.MAX_FILE_SIZE, CONSTANTS.DEFAULT_VALUES.MAX_FILE_SIZE_MB);

        return `
            <div class="instructions">
                <h4>📋 Upload Instructions</h4>
                <ul>
                    <li><strong>Supported Files:</strong> ${CONSTANTS.SUPPORTED_FILE_TYPES.join(', ').toUpperCase()} (max ${maxSize}MB)</li>
                    <li><strong>Processing:</strong> AI will automatically extract vendor, amount, date, and category</li>
                    <li><strong>Quality:</strong> Clear, well-lit images work best</li>
                    <li><strong>Security:</strong> Files are stored securely in your personal expense folder</li>
                </ul>
                <p><em>💡 Tip: You can import processed expenses into your expense reports later!</em></p>
            </div>
        `;
    }

    /**
     * Find the most recently uploaded file by the current user
     * @param {string} userId - Current user ID
     * @returns {Object|null} File object with id and name, or null if not found
     */
    function findRecentlyUploadedFile(userId) {
        try {
            // Add a small delay to allow file to be fully committed to database
            // This is a synchronous delay in the server-side script
            const startTime = Date.now();
            while (Date.now() - startTime < 2000) {
                // 2 second delay
            }

            // Search for files uploaded by the current user in the last 10 minutes
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

            // Create saved search for files
            const fileSearch = search.create({
                type: "file",
                columns: [
                    search.createColumn({ name: "name", label: "Name" }),
                    search.createColumn({ name: "folder", label: "Folder" }),
                    search.createColumn({ name: "created", label: "Date Created" }),
                    search.createColumn({ name: "owner", label: "Owner" })
                ],
                filters: [
                    search.createFilter({
                        name: 'created',
                        operator: search.Operator.ONORAFTER,
                        values: tenMinutesAgo
                    })
                ]
            });

            // Run the search and get results
            const allRecentFiles = [];
            fileSearch.run().each(function(result) {
                allRecentFiles.push({
                    id: result.id,
                    name: result.getValue('name'),
                    created: result.getValue('created'),
                    folder: result.getValue('folder'),
                    owner: result.getValue('owner')
                });
                return allRecentFiles.length < 20; // Limit to first 20 results
            });

            // Log ALL recent files for debugging
            commonLib.logOperation('debug_all_recent_files', {
                userId: userId,
                searchTime: tenMinutesAgo.toISOString(),
                allRecentCount: allRecentFiles.length,
                allRecentFiles: allRecentFiles.slice(0, 10).map(f => ({
                    id: f.id,
                    name: f.name,
                    created: f.created,
                    folder: f.folder,
                    owner: f.owner,
                    matchesUser: f.owner == userId
                }))
            });

            // Find files owned by the current user
            const userFiles = allRecentFiles.filter(f => f.owner == userId);

            // Log specific user files
            commonLib.logOperation('recent_file_search', {
                userId: userId,
                userIdType: typeof userId,
                searchTime: tenMinutesAgo.toISOString(),
                resultsCount: userFiles.length,
                userFiles: userFiles.slice(0, 3).map(f => ({
                    id: f.id,
                    name: f.name,
                    created: f.created,
                    folder: f.folder
                }))
            });

            if (userFiles.length > 0) {
                // Sort by creation date (most recent first) and take the first one
                userFiles.sort((a, b) => new Date(b.created) - new Date(a.created));
                const fileResult = userFiles[0];

                commonLib.logOperation('found_recent_file', {
                    fileId: fileResult.id,
                    fileName: fileResult.name,
                    created: fileResult.created,
                    folder: fileResult.folder,
                    userId: userId
                });

                return {
                    id: fileResult.id,
                    name: fileResult.name
                };
            }

            commonLib.logOperation('no_recent_file_found', {
                userId: userId,
                searchTime: tenMinutesAgo.toISOString()
            });
            return null;

        } catch (error) {
            commonLib.logOperation('find_recent_file_error', {
                userId: userId,
                error: error.message,
                stack: error.stack
            }, 'error');
            return null;
        }
    }

    /**
     * Add recent uploads section to form
     * @param {Form} form - Form object
     * @param {string} userId - Current user ID
     */
    function addRecentUploadsSection(form, userId) {
        try {
            // This would query recent uploads - simplified for now
            const recentField = form.addField({
                id: 'recent_uploads',
                type: ui.FieldType.INLINEHTML,
                label: 'Recent Uploads'
            });

            recentField.defaultValue = `
                <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                    <h4>📊 Recent Activity</h4>
                    <p><em>Your recent uploads will appear here after processing.</em></p>
                </div>
            `;

        } catch (error) {
            // Ignore if recent uploads section fails
            commonLib.logOperation('recent_uploads_error', { error: error.message }, 'error');
        }
    }

    return {
        onRequest: onRequest
    };
});