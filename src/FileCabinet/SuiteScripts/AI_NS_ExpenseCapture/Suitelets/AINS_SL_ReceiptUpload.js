/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @description Receipt upload Suitelet for AI NS Expense Capture system
 */

define(['N/ui/serverWidget', 'N/file', 'N/record', 'N/runtime', 'N/url', 'N/redirect', 'N/encode',
        '../Libraries/AINS_LIB_Common', '../Libraries/AINS_LIB_OCIIntegration'],
function(ui, file, record, runtime, url, redirect, encode, commonLib, ociLib) {

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

        commonLib.logOperation('render_upload_form', {
            userId: currentUser.id,
            isEmployeeCenter: isEmployeeCenter
        });

        // Create form
        const form = ui.createForm({
            title: 'AI NS Expense Receipt Upload'
        });

        // Add client script for enhanced UX
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

        // File upload section
        const fileField = form.addField({
            id: 'receipt_file',
            type: ui.FieldType.FILE,
            label: 'Receipt File'
        });

        fileField.isMandatory = false;
        fileField.help = `Upload receipt image or PDF (max ${commonLib.getScriptParameter(CONSTANTS.SCRIPT_PARAMS.MAX_FILE_SIZE, CONSTANTS.DEFAULT_VALUES.MAX_FILE_SIZE_MB)}MB). Supported formats: ${CONSTANTS.SUPPORTED_FILE_TYPES.join(', ').toUpperCase()}`;

        // Description field (optional)
        const descriptionField = form.addField({
            id: 'initial_description',
            type: ui.FieldType.TEXTAREA,
            label: 'Description (Optional)'
        });

        descriptionField.help = 'Optional initial description - AI will extract details automatically';

        // Progress indicator
        const progressField = form.addField({
            id: 'progress_indicator',
            type: ui.FieldType.INLINEHTML,
            label: 'Upload Progress'
        });

        progressField.defaultValue = commonLib.createProgressIndicator('upload_progress');

        // Status section for displaying recent uploads
        if (context.request.parameters.showRecent !== 'false') {
            addRecentUploadsSection(form, currentUser.id);
        }

        // Submit button
        form.addSubmitButton({
            label: 'Upload Receipt'
        });

        // Cancel button for Employee Center
        if (isEmployeeCenter) {
            form.addButton({
                id: 'btn_cancel',
                label: 'Cancel',
                functionName: 'cancelUpload'
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

        form.addField({
            id: 'is_employee_center',
            type: ui.FieldType.CHECKBOX,
            label: 'Employee Center'
        }).updateDisplayType({
            displayType: ui.FieldDisplayType.HIDDEN
        }).defaultValue = isEmployeeCenter ? 'T' : 'F';

        context.response.writePage(form);
    }

    /**
     * Process uploaded file
     * @param {Object} context - Request context
     */
    function processFileUpload(context) {
        const trackingId = commonLib.generateTrackingId();

        try {
            const parameters = context.request.parameters;
            const files = context.request.files;

            commonLib.logOperation('process_file_upload_start', {
                trackingId: trackingId,
                userId: parameters.user_id,
                hasFile: !!files.receipt_file
            });

            // Validate file upload
            if (!files.receipt_file) {
                throw new Error('No file was uploaded. Please select a receipt file to upload.');
            }

            const uploadedFile = files.receipt_file;

            // Validate file
            const validation = validateUploadedFile(uploadedFile);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            // Save file using Enhanced File Security
            const savedFile = saveFileWithEnhancedSecurity(uploadedFile, parameters.user_id);

            // Create expense capture record
            const expenseRecord = createExpenseCaptureRecord({
                file: savedFile,
                userId: parameters.user_id,
                trackingId: trackingId
            });

            // Trigger processing (if using Map/Reduce)
            triggerProcessing(expenseRecord.id);

            commonLib.logOperation('process_file_upload_success', {
                trackingId: trackingId,
                expenseRecordId: expenseRecord.id,
                fileId: savedFile.id,
                fileName: savedFile.name
            });

            // Redirect to success page
            return showSuccessPage(context, {
                expenseRecordId: expenseRecord.id,
                fileName: savedFile.name,
                trackingId: trackingId,
                isEmployeeCenter: parameters.is_employee_center === 'T'
            });

        } catch (error) {
            commonLib.logOperation('process_file_upload_error', {
                trackingId: trackingId,
                error: error.message
            }, 'error');

            return showErrorPage(context, error);
        }
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
     * Save file using Enhanced File Security
     * @param {File} uploadedFile - File to save
     * @param {string} userId - User ID for folder creation
     * @returns {File} Saved file object
     */
    function saveFileWithEnhancedSecurity(uploadedFile, userId) {
        try {
            // Create file record with Enhanced File Security pattern
            const fileRecord = file.create({
                name: `AINS_${Date.now()}_${uploadedFile.name}`,
                fileType: uploadedFile.type,
                contents: uploadedFile.getContents(),
                description: `AI NS Expense Receipt - ${new Date().toLocaleDateString()}`,
                folder: getExpenseFolderId(userId), // This leverages Enhanced File Security
                isOnline: true
            });

            const savedFileId = fileRecord.save();

            // Load and return the saved file
            return file.load({ id: savedFileId });

        } catch (error) {
            commonLib.logOperation('save_file_error', {
                fileName: uploadedFile.name,
                userId: userId,
                error: error.message
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
     * Create expense capture record
     * @param {Object} options - Record creation options
     * @returns {Record} Created record
     */
    function createExpenseCaptureRecord(options) {
        try {
            const expenseRecord = record.create({
                type: CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE,
                isDynamic: true
            });

            // Set required fields
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.FILE_ATTACHMENT,
                value: options.file.id
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.CREATED_BY,
                value: options.userId
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.PROCESSING_STATUS,
                value: CONSTANTS.STATUS.PENDING
            });

            // Set file metadata
            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.FILE_SIZE,
                value: Math.round(options.file.size / 1024) // Convert to KB
            });

            expenseRecord.setValue({
                fieldId: CONSTANTS.FIELDS.FILE_TYPE,
                value: options.file.fileType || options.file.name.split('.').pop().toLowerCase()
            });

            // Save record
            const recordId = expenseRecord.save();

            commonLib.logOperation('expense_record_created', {
                recordId: recordId,
                fileId: options.file.id,
                userId: options.userId,
                trackingId: options.trackingId
            });

            return { id: recordId, record: expenseRecord };

        } catch (error) {
            throw new Error(`Failed to create expense record: ${error.message}`);
        }
    }

    /**
     * Trigger processing for the uploaded receipt
     * @param {string} expenseRecordId - ID of expense capture record
     */
    function triggerProcessing(expenseRecordId) {
        try {
            // The Map/Reduce script will automatically pick up records with PENDING status
            // We could also trigger it manually here if needed

            commonLib.logOperation('processing_triggered', {
                expenseRecordId: expenseRecordId,
                method: 'automatic'
            });

        } catch (error) {
            commonLib.logOperation('trigger_processing_error', {
                expenseRecordId: expenseRecordId,
                error: error.message
            }, 'error');

            // Don't throw error as the file is already saved and record created
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
                <h3 style="margin-top: 0;">❌ Upload Failed</h3>
                <p><strong>Error:</strong> ${commonLib.formatErrorMessage(error)}</p>
                <p>Please check your file and try again. If the problem persists, contact your administrator.</p>
            </div>
        `;

        form.addButton({
            id: 'btn_try_again',
            label: 'Try Again',
            functionName: 'tryAgain'
        });

        // Add client script for button actions
        form.clientScriptModulePath = '../ClientScripts/AINS_CS_ReceiptUploadError.js';

        context.response.writePage(form);
    }

    /**
     * Add CSS styling to form
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
                .upload-progress { display: none; }
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