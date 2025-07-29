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
                // Check for specific actions
                const action = context.request.parameters.action;

                if (action === 'capture_upload_response') {
                    return handleUploadResponse(context);
                }

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
     * Handle upload response from NetSuite expense media system
     * @param {Object} context - Request context
     */
    function handleUploadResponse(context) {
        // This handles returns from the expense upload iframe
        const mediaId = context.request.parameters.optionid;
        const fileName = context.request.parameters.optionname;

        if (mediaId) {
            commonLib.logOperation('expense_media_upload_captured', {
                mediaId: mediaId,
                fileName: fileName
            });

            // Send JavaScript to notify parent window
            const responseHtml = `
                <script>
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage({
                            type: 'expense_upload_complete',
                            mediaId: '${mediaId}',
                            fileName: '${fileName || 'receipt.pdf'}'
                        }, '*');
                    }
                    window.close();
                </script>
            `;

            context.response.write(responseHtml);
        } else {
            // Upload cancelled or failed
            const responseHtml = `
                <script>
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage({
                            type: 'expense_upload_cancelled'
                        }, '*');
                    }
                    window.close();
                </script>
            `;

            context.response.write(responseHtml);
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
        // Add iframe for expense media upload
        const iframeUploadField = form.addField({
            id: 'expense_upload_iframe',
            type: ui.FieldType.INLINEHTML,
            label: 'Receipt Upload'
        });

                // Get proper base URL - use runtime.accountId for reliable URL construction
        const accountId = runtime.accountId;
        const baseUrl = `https://${accountId}.app.netsuite.com`;

        // Simple expense upload URL without custom return URL (avoid page not found)
        const expenseUploadUrl = `${baseUrl}/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=AI+Receipt+Processing&reportOwner=${currentUser.id}&entity=${currentUser.id}`;

        // Log for debugging
        commonLib.logOperation('debug_url_construction', {
            accountId: accountId,
            currentUserId: currentUser.id,
            baseUrl: baseUrl,
            expenseUploadUrl: expenseUploadUrl
        });

        iframeUploadField.defaultValue = `
            <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 20px; margin: 15px 0;">
                <h3 style="color: #1f4e79; margin-top: 0;">📎 Upload Your Receipt</h3>
                <p style="margin-bottom: 15px;">Click "Choose File" below to upload your receipt using NetSuite's secure expense system.</p>

                <div style="margin: 15px 0;">
                    <button type="button" id="btn_choose_file" onclick="openExpenseUpload()"
                            style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 5px; font-size: 16px; cursor: pointer;">
                        📁 Choose File
                    </button>
                </div>

                <div id="upload_status" style="margin: 15px 0; display: none;">
                    <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 10px; border-radius: 3px;">
                        <strong>✅ File Uploaded Successfully!</strong><br>
                        <span id="file_name_display"></span><br>
                        <em>Click "Process Receipt" below to extract expense data.</em>
                    </div>
                </div>

                <div style="background: #e9ecef; border-radius: 3px; padding: 10px; margin: 10px 0;">
                    <strong>📋 Supported Formats:</strong> ${CONSTANTS.SUPPORTED_FILE_TYPES.join(', ').toUpperCase()}<br>
                    <strong>📏 Maximum Size:</strong> ${commonLib.getScriptParameter(CONSTANTS.SCRIPT_PARAMS.MAX_FILE_SIZE, CONSTANTS.DEFAULT_VALUES.MAX_FILE_SIZE_MB)}MB<br>
                    <strong>🤖 AI Processing:</strong> Automatically extracts vendor, amount, date, and category
                </div>
                <p style="font-size: 12px; color: #6c757d; margin-bottom: 0;">
                    💡 <strong>Tip:</strong> Clear, well-lit images work best for accurate data extraction
                </p>

                <div style="background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 10px; border-radius: 3px; margin: 10px 0; font-size: 12px;">
                    <strong>🔍 Debug Info:</strong><br>
                    Account ID: ${accountId}<br>
                    User ID: ${currentUser.id}<br>
                    Generated URL: <span style="word-break: break-all; font-family: monospace;">${expenseUploadUrl}</span>
                </div>
            </div>

            <!-- Hidden iframe for expense upload -->
            <iframe id="expense_upload_iframe" src="" style="display: none; width: 100%; height: 600px; border: 1px solid #ccc; border-radius: 5px;"></iframe>

            <!-- Modal overlay -->
            <div id="upload_modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 0; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); width: 90%; max-width: 800px; height: 80%; max-height: 600px;">
                    <div style="background: #1f4e79; color: white; padding: 15px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;">📸 Upload Receipt - NetSuite Expense System</h3>
                        <button onclick="closeUploadModal()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
                    </div>
                    <iframe id="modal_iframe" src="${expenseUploadUrl}" style="width: 100%; height: calc(100% - 60px); border: none;"></iframe>
                </div>
            </div>

            <script>
                let uploadedMediaId = null;
                let uploadedFileName = null;

                function openExpenseUpload() {
                    document.getElementById('upload_modal').style.display = 'block';
                    document.body.style.overflow = 'hidden';
                }

                function closeUploadModal() {
                    document.getElementById('upload_modal').style.display = 'none';
                    document.body.style.overflow = 'auto';
                }

                // Listen for messages from the iframe
                window.addEventListener('message', function(event) {
                    console.log('Received message:', event);

                    // Check if the message is from NetSuite upload completion
                    if (event.data && event.data.type === 'expense_upload_complete') {
                        uploadedMediaId = event.data.mediaId;
                        uploadedFileName = event.data.fileName;

                        // Show success status
                        document.getElementById('file_name_display').textContent = uploadedFileName;
                        document.getElementById('upload_status').style.display = 'block';
                        document.getElementById('btn_choose_file').textContent = '✅ File Uploaded - Choose Different File';

                        // Close modal
                        closeUploadModal();

                        // Enable process button
                        enableProcessButton();
                    }
                });

                                // Monitor iframe URL changes (enhanced monitoring)
                function monitorIframe() {
                    const iframe = document.getElementById('modal_iframe');
                    if (iframe) {
                        try {
                            const iframeUrl = iframe.contentWindow.location.href;
                            console.log('Iframe URL:', iframeUrl);

                            // Check if URL contains optionid (successful upload)
                            if (iframeUrl.includes('optionid=')) {
                                const urlParams = new URLSearchParams(iframeUrl.split('?')[1]);
                                const optionId = urlParams.get('optionid');
                                const optionName = urlParams.get('optionname');

                                if (optionId) {
                                    uploadedMediaId = optionId;
                                    uploadedFileName = decodeURIComponent(optionName || 'receipt.pdf');

                                    console.log('Successfully captured expense media:', {
                                        mediaId: uploadedMediaId,
                                        fileName: uploadedFileName
                                    });

                                    // Show success status
                                    document.getElementById('file_name_display').textContent = uploadedFileName;
                                    document.getElementById('upload_status').style.display = 'block';
                                    document.getElementById('btn_choose_file').textContent = '✅ File Uploaded - Choose Different File';

                                    // Close modal
                                    closeUploadModal();

                                    // Enable process button
                                    enableProcessButton();
                                }
                            }

                            // Also check for upload completion pages
                            if (iframeUrl.includes('addpage.nl') && iframeUrl.includes('whence=')) {
                                console.log('Upload completed, checking for parameters...');
                                // Sometimes the success page has different parameter names
                            }

                        } catch (e) {
                            // Cross-origin restrictions - this is expected for most pages
                            console.log('Cannot access iframe URL due to cross-origin policy (this is normal)');
                        }
                    }
                }

                // More frequent polling during active upload
                let monitoringInterval = setInterval(monitorIframe, 1000);

                // Stop monitoring after 30 minutes to prevent memory leaks
                setTimeout(function() {
                    if (monitoringInterval) {
                        clearInterval(monitoringInterval);
                        console.log('Stopped iframe monitoring after 30 minutes');
                    }
                }, 30 * 60 * 1000);

                function enableProcessButton() {
                    // Add process button if it doesn't exist
                    if (!document.getElementById('btn_process_receipt')) {
                        const processButton = document.createElement('button');
                        processButton.id = 'btn_process_receipt';
                        processButton.type = 'button';
                        processButton.onclick = processUploadedReceipt;
                        processButton.style.cssText = 'background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 5px; font-size: 16px; cursor: pointer; margin-left: 10px;';
                        processButton.textContent = '🤖 Process Receipt';

                        document.getElementById('btn_choose_file').parentNode.appendChild(processButton);
                    }
                }

                function processUploadedReceipt() {
                    if (!uploadedMediaId) {
                        alert('No file uploaded. Please choose a file first.');
                        return;
                    }

                    // Submit form with uploaded media ID
                    const form = document.forms[0];

                    // Add hidden inputs for the uploaded media
                    const mediaIdInput = document.createElement('input');
                    mediaIdInput.type = 'hidden';
                    mediaIdInput.name = 'uploaded_media_id';
                    mediaIdInput.value = uploadedMediaId;
                    form.appendChild(mediaIdInput);

                    const fileNameInput = document.createElement('input');
                    fileNameInput.type = 'hidden';
                    fileNameInput.name = 'uploaded_file_name';
                    fileNameInput.value = uploadedFileName;
                    form.appendChild(fileNameInput);

                    const actionInput = document.createElement('input');
                    actionInput.type = 'hidden';
                    actionInput.name = 'action';
                    actionInput.value = 'process_expense_media';
                    form.appendChild(actionInput);

                    // Show processing message
                    showProcessingMessage('Starting AI processing of your receipt...');

                    // Submit form
                    form.submit();
                }

                function showProcessingMessage(message) {
                    const overlay = document.createElement('div');
                    overlay.id = 'processing-overlay';
                    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10001; display: flex; align-items: center; justify-content: center;';

                    const messageBox = document.createElement('div');
                    messageBox.style.cssText = 'background: white; padding: 30px; border-radius: 5px; text-align: center; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
                    messageBox.innerHTML = '<div style="font-size: 18px; color: #1f4e79; margin-bottom: 15px;">🔄 Processing...</div><div style="margin-bottom: 15px;">' + message + '</div><div style="font-size: 12px; color: #666;">Please wait while we process your receipt.</div>';

                    overlay.appendChild(messageBox);
                    document.body.appendChild(overlay);
                }
            </script>
        `;

        // Remove the old file field and submit button
        // We'll handle submission through JavaScript now
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
            const action = parameters.action;

            // Handle expense media processing
            if (action === 'process_expense_media') {
                const mediaId = parameters.uploaded_media_id;
                const fileName = parameters.uploaded_file_name;
                const userId = parameters.user_id;

                return triggerExpenseMediaProcessing(context, mediaId, fileName, userId, trackingId);
            }

            // Legacy file upload handling (keep for backward compatibility)
            const files = context.request.files;
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
     * Handle initial file upload (Step 1) - Legacy support
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
     * Trigger processing of expense media item
     * @param {Object} context - Request context
     * @param {string} mediaId - ID of expense media item
     * @param {string} fileName - Name of uploaded file
     * @param {string} userId - User ID
     * @param {string} trackingId - Tracking ID for this operation
     */
    function triggerExpenseMediaProcessing(context, mediaId, fileName, userId, trackingId) {
        commonLib.logOperation('trigger_expense_media_processing_start', {
            trackingId: trackingId,
            mediaId: mediaId,
            fileName: fileName,
            userId: userId
        });

        // Start Map/Reduce script with expense media information
        const mrTaskId = startExpenseMediaProcessing(mediaId, fileName, userId, trackingId);

        commonLib.logOperation('expense_media_processing_triggered', {
            trackingId: trackingId,
            mediaId: mediaId,
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
     * Start Map/Reduce script to process the expense media
     * @param {string} mediaId - ID of expense media item to process
     * @param {string} fileName - Name of file
     * @param {string} userId - User ID
     * @param {string} trackingId - Tracking ID
     * @returns {string} Map/Reduce task ID
     */
    function startExpenseMediaProcessing(mediaId, fileName, userId, trackingId) {
        try {
            const mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: CONSTANTS.SCRIPT_IDS.PROCESS_MR,
                deploymentId: CONSTANTS.DEPLOYMENT_IDS.PROCESS_MR,
                params: {
                    'custscript_ains_file_id': mediaId,
                    'custscript_ains_file_name': fileName,
                    'custscript_ains_user_id': userId,
                    'custscript_ains_tracking_id': trackingId,
                    'custscript_ains_is_expense_media': true  // Flag to indicate expense media
                }
            });

            const taskId = mrTask.submit();

            commonLib.logOperation('mr_task_submitted_expense_media', {
                taskId: taskId,
                mediaId: mediaId,
                fileName: fileName,
                userId: userId,
                trackingId: trackingId
            });

            return taskId;

        } catch (error) {
            commonLib.logOperation('mr_task_submission_error_expense_media', {
                error: error.message,
                mediaId: mediaId,
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
            <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                <h2 style="margin-top: 0; color: #155724;">✅ Upload Successful!</h2>
                <p style="font-size: 16px; margin: 15px 0;"><strong>File:</strong> ${details.fileName}</p>
                <hr style="border: none; border-top: 1px solid #c3e6cb; margin: 20px 0;">
                <h3 style="color: #155724;">🤖 AI Processing Started</h3>
                <p style="font-size: 15px; margin: 15px 0;">Your receipt is being processed automatically.</p>
                <p style="font-size: 14px; color: #666; margin: 10px 0;">
                    <em>Processing typically takes 2-5 minutes.<br/>
                    Check your dashboard for the completed expense record.</em>
                </p>
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