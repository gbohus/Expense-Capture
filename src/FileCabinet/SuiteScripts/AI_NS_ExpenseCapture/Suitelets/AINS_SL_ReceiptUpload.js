/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @description Receipt upload Suitelet for AI NS Expense Capture system
 */

define(['N/ui/serverWidget', 'N/file', 'N/record', 'N/runtime', 'N/url', 'N/redirect', 'N/encode', 'N/task', 'N/search', 'N/config',
        '../Libraries/AINS_LIB_Common', '../Libraries/AINS_LIB_OCIIntegration'],
function(ui, file, record, runtime, url, redirect, encode, task, search, config, commonLib, ociLib) {

    const CONSTANTS = commonLib.CONSTANTS;

    /**
     * Check if the Expense Management feature is enabled
     * @returns {boolean} True if fcexpense feature is enabled
     */
    function isExpenseFeatureEnabled() {
        try {
            const featureConfig = config.load({
                type: config.Type.FEATURES
            });

            return featureConfig.getValue({
                fieldId: 'fcexpense'
            });
        } catch (error) {
            commonLib.logOperation('expense_feature_check_error', {
                error: error.message
            }, 'error');

            // Default to false if we can't check the feature
            return false;
        }
    }

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
        const isExpenseEnabled = isExpenseFeatureEnabled();

        commonLib.logOperation('render_upload_form', {
            userId: currentUser.id,
            isEmployeeCenter: isEmployeeCenter,
            isExpenseEnabled: isExpenseEnabled
        });

        // Create NetSuite form (keeps toolbar) with clean content
        const form = ui.createForm({
            title: 'Expense Capture'
        });

        // Add client script
        form.clientScriptModulePath = '../ClientScripts/AINS_CS_ReceiptUpload.js';

        // Add the clean upload interface based on feature availability
        if (isExpenseEnabled) {
            renderExpenseUploadInterface(form, currentUser);
        } else {
            renderRegularFileUploadInterface(form, currentUser);
        }

        // Hidden user ID for processing
        form.addField({
            id: 'user_id',
            type: ui.FieldType.TEXT,
            label: 'User ID'
        }).updateDisplayType({
            displayType: ui.FieldDisplayType.HIDDEN
        }).defaultValue = currentUser.id;

        // Hidden field to indicate feature status
        form.addField({
            id: 'expense_feature_enabled',
            type: ui.FieldType.TEXT,
            label: 'Expense Feature'
        }).updateDisplayType({
            displayType: ui.FieldDisplayType.HIDDEN
        }).defaultValue = isExpenseEnabled;

        context.response.writePage(form);
    }

    /**
     * Render expense upload interface when expense feature is enabled
     * @param {Form} form - NetSuite form object
     * @param {Object} currentUser - Current user details
     */
    function renderExpenseUploadInterface(form, currentUser) {
        const accountId = runtime.accountId;
        const baseUrl = `https://${accountId}.app.netsuite.com`;
        const expenseUploadUrl = `${baseUrl}/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=AI+Receipt+Processing&reportOwner=${currentUser.id}&entity=${currentUser.id}`;

        // Log for debugging
        commonLib.logOperation('debug_expense_url_construction', {
            accountId: accountId,
            currentUserId: currentUser.id,
            baseUrl: baseUrl,
            expenseUploadUrl: expenseUploadUrl
        });

        // Create single field with all content
        const uploadField = form.addField({
            id: 'upload_interface',
            type: ui.FieldType.INLINEHTML,
            label: 'Receipt Upload'
        });

        uploadField.defaultValue = `
            <link rel="stylesheet" type="text/css" href="../Libraries/AINS_LIB_Styles.css">

            <style>
                :root {
                    --nsn-uif-redwood-color-light-neutral-0: rgb(255, 255, 255);
                    --nsn-uif-redwood-color-light-neutral-10: rgb(251, 249, 248);
                    --nsn-uif-redwood-color-light-neutral-20: rgb(245, 244, 242);
                    --nsn-uif-redwood-color-light-brand-100: rgb(34, 126, 158);
                    --nsn-uif-redwood-color-light-brand-120: rgb(54, 103, 125);
                    --nsn-uif-redwood-color-light-text-primary: rgb(22, 21, 19);
                    --nsn-uif-redwood-color-light-text-secondary: rgba(22, 21, 19, 0.7);
                    --nsn-uif-redwood-color-light-border-divider: rgba(22, 21, 19, 0.12);
                    --nsn-uif-redwood-size-s: 16px;
                    --nsn-uif-redwood-size-m: 24px;
                    --nsn-uif-redwood-border-rounded-corners: 6px;
                    --nsn-uif-redwood-shadow-small: 0 4px 8px 0 rgba(0, 0, 0, 0.16);
                }

                /* Main container to center content */
                .upload-page-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                }

                .page-header {
                    background-color: var(--nsn-uif-redwood-color-light-brand-120);
                    color: white;
                    padding: var(--nsn-uif-redwood-size-m);
                    margin: -20px -20px 20px -20px;
                    text-align: center;
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners) var(--nsn-uif-redwood-border-rounded-corners) 0 0;
                }

                .page-header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                }

                /* Process Flow Styles */
                .process-flow-container {
                    background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                    border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    padding: var(--nsn-uif-redwood-size-m);
                    margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                    text-align: center;
                    opacity: 0.95;
                }

                .process-flow-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--nsn-uif-redwood-color-light-text-secondary);
                    margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                }

                .process-flow-steps {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: var(--nsn-uif-redwood-size-s);
                    max-width: 600px;
                    margin: 0 auto;
                }

                .step-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background-color: var(--nsn-uif-redwood-color-light-brand-100);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 12px;
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    font-family: 'Oracle Sans', sans-serif;
                }

                .step-icon.upload::before {
                    content: "↑";
                    font-size: 20px;
                    font-weight: 900;
                }

                .step-icon.process::before {
                    content: "⟳";
                    font-size: 18px;
                    font-weight: 700;
                }

                .step-icon.review::before {
                    content: "✓";
                    font-size: 20px;
                    font-weight: 900;
                }

                .step-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--nsn-uif-redwood-color-light-text-primary);
                    margin: 0 0 6px 0;
                    line-height: 1.2;
                }

                .step-description {
                    font-size: 12px;
                    color: var(--nsn-uif-redwood-color-light-text-secondary);
                    margin: 0;
                    line-height: 1.4;
                }

                .process-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    flex: 1;
                    min-width: 120px;
                    max-width: 160px;
                    transition: transform 0.2s ease;
                }

                .process-step:hover {
                    transform: translateY(-2px);
                }

                .process-step:hover .step-icon {
                    transform: scale(1.05);
                    box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
                }

                .process-arrow {
                    color: var(--nsn-uif-redwood-color-light-brand-100);
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0 4px;
                    flex-shrink: 0;
                }

                @media (max-width: 600px) {
                    .upload-page-container {
                        margin: 0;
                        border-radius: 0;
                        padding: 15px;
                    }

                    .process-flow-steps {
                        flex-direction: column;
                        gap: var(--nsn-uif-redwood-size-s);
                    }

                    .process-arrow {
                        transform: rotate(90deg);
                        margin: 4px 0;
                    }
                }

                .upload-container {
                    background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                    border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    padding: var(--nsn-uif-redwood-size-l);
                    margin: var(--nsn-uif-redwood-size-s) 0;
                    text-align: center;
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                    transition: box-shadow 0.2s ease;
                    position: relative;
                }

                .upload-container:hover {
                    box-shadow: 0 6px 12px 0px rgba(0, 0, 0, 0.12);
                }

                .upload-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--nsn-uif-redwood-color-light-text-primary);
                    margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                }

                .upload-subtitle {
                    font-size: 16px;
                    color: var(--nsn-uif-redwood-color-light-text-secondary);
                    margin: 0 0 var(--nsn-uif-redwood-size-l) 0;
                }

                .choose-file-btn {
                    background-color: var(--nsn-uif-redwood-color-light-brand-120);
                    color: white;
                    border: none;
                    padding: 16px 32px;
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                    transition: all 0.2s ease;
                    min-width: 160px;
                    position: relative;
                    font-family: 'Oracle Sans', sans-serif;
                }

                .choose-file-btn:hover {
                    background-color: var(--nsn-uif-redwood-color-light-brand-100);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
                }

                .choose-file-btn:active {
                    transform: translateY(0);
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                }

                .upload-success {
                    background-color: var(--nsn-uif-redwood-color-light-surface-info-low);
                    border: 1px solid var(--nsn-uif-redwood-color-light-brand-100);
                    border-left: 4px solid var(--nsn-uif-redwood-color-light-brand-100);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    padding: var(--nsn-uif-redwood-size-s);
                    margin: var(--nsn-uif-redwood-size-s) 0;
                    text-align: left;
                    display: none;
                    transition: all 0.3s ease;
                }

                .success-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--nsn-uif-redwood-color-light-text-primary);
                    margin: 0 0 8px 0;
                }

                .success-title::before {
                    content: "✓";
                    color: var(--nsn-uif-redwood-color-light-brand-100);
                    font-weight: 900;
                    margin-right: 8px;
                    font-size: 16px;
                }

                .file-detail {
                    font-size: 14px;
                    color: var(--nsn-uif-redwood-color-light-text-secondary);
                    margin: 4px 0;
                }

                .media-id {
                    font-family: 'Courier New', monospace;
                    background-color: var(--nsn-uif-redwood-color-light-neutral-20);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 12px;
                }

                .process-container {
                    margin: var(--nsn-uif-redwood-size-m) 0;
                    padding: var(--nsn-uif-redwood-size-s);
                    background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    border: 1px dashed var(--nsn-uif-redwood-color-light-brand-100);
                    text-align: center;
                }

                .process-btn {
                    background-color: var(--nsn-uif-redwood-color-light-brand-100);
                    color: white;
                    border: none;
                    padding: 16px 32px;
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                    transition: all 0.2s ease;
                    min-width: 160px;
                    font-family: 'Oracle Sans', sans-serif;
                }

                .process-btn:hover {
                    background-color: var(--nsn-uif-redwood-color-light-brand-120);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
                }

                .process-btn:active {
                    transform: translateY(0);
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                }

                .my-app-modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(22, 21, 19, 0.4);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1500;
                }

                .my-app-modal-dialog {
                    background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                    border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    box-shadow: 0 6px 12px 0px rgba(0, 0, 0, 0.2);
                    overflow: hidden;
                    min-width: 350px;
                    max-width: 90%;
                    max-height: 90%;
                    display: flex;
                    flex-direction: column;
                }

                .my-app-modal-header {
                    background-color: var(--nsn-uif-redwood-color-light-brand-120);
                    padding: 8px var(--nsn-uif-redwood-size-s);
                    font-size: 16px;
                    font-weight: 700;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .close-button {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    line-height: 1;
                }

                .close-button:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
            </style>

            <div class="upload-page-container">
                <div class="page-header">
                    <h1>Expense Capture</h1>
                </div>

                <div class="process-flow-container">
                    <div class="process-flow-title">Expense Capture Processing Flow</div>
                    <div class="process-flow-steps">
                        <div class="process-step">
                            <div class="step-icon upload"></div>
                            <div class="step-title">Upload</div>
                            <div class="step-description">Choose your receipt file</div>
                        </div>
                        <span class="process-arrow">→</span>
                        <div class="process-step">
                            <div class="step-icon process"></div>
                            <div class="step-title">Process</div>
                            <div class="step-description">Extract data using AI</div>
                        </div>
                        <span class="process-arrow">→</span>
                        <div class="process-step">
                            <div class="step-icon review"></div>
                            <div class="step-title">Review</div>
                            <div class="step-description">Navigate to expense report and add expense items</div>
                        </div>
                    </div>
                </div>

                <div class="upload-container">
                    <div class="upload-title">Receipt Processing</div>
                    <div class="upload-subtitle">Upload your receipt for automatic expense data extraction</div>

                    <button type="button" id="btn_choose_file" onclick="openExpenseUpload()" class="choose-file-btn">
                    📁 Choose File
                    </button>

                    <div id="upload_status" class="upload-success">
                        <div class="success-title">File Uploaded Successfully</div>
                        <div class="file-detail"><strong>File:</strong> <span id="file_name_display"></span></div>
                        <div class="file-detail"><strong>ID:</strong> <span id="media_id_display" class="media-id"></span></div>
                    </div>
                </div>
            </div>

            <!-- Modal overlay -->
            <div id="upload_modal" class="my-app-modal-backdrop" style="display: none;">
                <div class="my-app-modal-dialog" style="width: 90%; max-width: 800px; height: 80%; max-height: 600px;">
                    <div class="my-app-modal-header">
                        <span>Upload Receipt</span>
                        <button onclick="closeUploadModal()" class="close-button">×</button>
                    </div>
                    <iframe id="modal_iframe" src="${expenseUploadUrl}" style="width: 100%; height: calc(100% - 60px); border: none; background: white;"></iframe>
                </div>
            </div>

            <script>
                let uploadedMediaId = null;
                let uploadedFileName = null;

                function openExpenseUpload() {
                    document.getElementById('upload_modal').style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }

                function closeUploadModal() {
                    document.getElementById('upload_modal').style.display = 'none';
                    document.body.style.overflow = 'auto';
                }

                // Listen for messages from the iframe
                window.addEventListener('message', function(event) {
                    console.log('Received message:', event);

                    if (event.data && event.data.type === 'expense_upload_complete') {
                        uploadedMediaId = event.data.mediaId;
                        uploadedFileName = event.data.fileName;

                        document.getElementById('file_name_display').textContent = uploadedFileName;
                        document.getElementById('media_id_display').textContent = uploadedMediaId;
                        document.getElementById('upload_status').style.display = 'block';

                        closeUploadModal();
                        enableProcessButton();

                        console.log('Upload completed successfully:', {
                            mediaId: uploadedMediaId,
                            fileName: uploadedFileName
                        });
                    }
                });

                // Monitor iframe URL changes (enhanced monitoring)
                function monitorIframe() {
                    const iframe = document.getElementById('modal_iframe');
                    if (iframe) {
                        try {
                            const iframeUrl = iframe.contentWindow.location.href;
                            console.log('Iframe URL:', iframeUrl);

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

                                    document.getElementById('file_name_display').textContent = uploadedFileName;
                                    document.getElementById('media_id_display').textContent = uploadedMediaId;
                                    document.getElementById('upload_status').style.display = 'block';

                                    closeUploadModal();
                                    enableProcessButton();
                                }
                            }
                        } catch (e) {
                            console.log('Cannot access iframe URL due to cross-origin policy (this is normal)');
                        }
                    }
                }

                let monitoringInterval = setInterval(monitorIframe, 1000);

                setTimeout(function() {
                    if (monitoringInterval) {
                        clearInterval(monitoringInterval);
                        console.log('Stopped iframe monitoring after 30 minutes');
                    }
                }, 30 * 60 * 1000);

                function enableProcessButton() {
                    if (!document.getElementById('btn_process_receipt')) {
                        // Hide the choose file button
                        document.getElementById('btn_choose_file').style.display = 'none';

                        // Add process button to the main container (white area)
                        const processButton = document.createElement('button');
                        processButton.id = 'btn_process_receipt';
                        processButton.type = 'button';
                        processButton.className = 'process-btn';
                        processButton.onclick = processUploadedReceipt;
                        processButton.textContent = 'Process Receipt';

                        // Add some margin for spacing and center it
                        processButton.style.marginTop = '20px';
                        processButton.style.display = 'block';
                        processButton.style.margin = '20px auto 0 auto';

                        const uploadContainer = document.querySelector('.upload-container');
                        uploadContainer.appendChild(processButton);
                    }
                }

                function processUploadedReceipt() {
                    if (!uploadedMediaId) {
                        alert('No file uploaded. Please choose a file first.');
                        return;
                    }

                    // Create form and submit for processing
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = window.location.href;

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

                    const userIdInput = document.createElement('input');
                    userIdInput.type = 'hidden';
                    userIdInput.name = 'user_id';
                    userIdInput.value = '${currentUser.id}';
                    form.appendChild(userIdInput);

                    document.body.appendChild(form);

                    showProcessingMessage('Starting AI processing of your receipt...');

                    form.submit();
                }

                function showProcessingMessage(message) {
                    const overlay = document.createElement('div');
                    overlay.id = 'processing-overlay';
                    overlay.className = 'my-app-processing-overlay';

                    const messageBox = document.createElement('div');
                    messageBox.className = 'my-app-processing-message-box';
                    messageBox.innerHTML =
                        '<div class="my-app-processing-title">🔄 Processing...</div>' +
                        '<div class="my-app-processing-message">' + message + '</div>' +
                        '<div class="my-app-processing-details">Please wait while we process your receipt.</div>';

                    overlay.appendChild(messageBox);
                    document.body.appendChild(overlay);
                }
            </script>
        `;
    }

    /**
     * Render regular file upload interface when expense feature is disabled
     * @param {Form} form - NetSuite form object
     * @param {Object} currentUser - Current user details
     */
    function renderRegularFileUploadInterface(form, currentUser) {
        const accountId = runtime.accountId;
        const baseUrl = `https://${accountId}.app.netsuite.com`;
        const regularUploadUrl = `${baseUrl}/app/common/media/mediaitem.nl?restricttype=&l=T&upload`;

        // Log for debugging
        commonLib.logOperation('debug_regular_url_construction', {
            accountId: accountId,
            currentUserId: currentUser.id,
            baseUrl: baseUrl,
            regularUploadUrl: regularUploadUrl
        });

        // Create single field with all content
        const uploadField = form.addField({
            id: 'upload_interface',
            type: ui.FieldType.INLINEHTML,
            label: 'Receipt Upload'
        });

        uploadField.defaultValue = `
            <link rel="stylesheet" type="text/css" href="../Libraries/AINS_LIB_Styles.css">

            <style>
                :root {
                    --nsn-uif-redwood-color-light-neutral-0: rgb(255, 255, 255);
                    --nsn-uif-redwood-color-light-neutral-10: rgb(251, 249, 248);
                    --nsn-uif-redwood-color-light-neutral-20: rgb(245, 244, 242);
                    --nsn-uif-redwood-color-light-brand-100: rgb(34, 126, 158);
                    --nsn-uif-redwood-color-light-brand-120: rgb(54, 103, 125);
                    --nsn-uif-redwood-color-light-text-primary: rgb(22, 21, 19);
                    --nsn-uif-redwood-color-light-text-secondary: rgba(22, 21, 19, 0.7);
                    --nsn-uif-redwood-color-light-border-divider: rgba(22, 21, 19, 0.12);
                    --nsn-uif-redwood-size-s: 16px;
                    --nsn-uif-redwood-size-m: 24px;
                    --nsn-uif-redwood-border-rounded-corners: 6px;
                    --nsn-uif-redwood-shadow-small: 0 4px 8px 0 rgba(0, 0, 0, 0.16);
                }

                /* Main container to center content */
                .upload-page-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                }

                .page-header {
                    background-color: var(--nsn-uif-redwood-color-light-brand-120);
                    color: white;
                    padding: var(--nsn-uif-redwood-size-m);
                    margin: -20px -20px 20px -20px;
                    text-align: center;
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners) var(--nsn-uif-redwood-border-rounded-corners) 0 0;
                }

                .page-header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                }

                /* Process Flow Styles */
                .process-flow-container {
                    background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                    border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    padding: var(--nsn-uif-redwood-size-m);
                    margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                    text-align: center;
                    opacity: 0.95;
                }

                .process-flow-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--nsn-uif-redwood-color-light-text-primary);
                    margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                }

                .process-flow-steps {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: var(--nsn-uif-redwood-size-s);
                    max-width: 600px;
                    margin: 0 auto;
                }

                .process-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    flex: 1;
                    min-width: 120px;
                    max-width: 160px;
                }

                .step-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background-color: var(--nsn-uif-redwood-color-light-brand-100);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    margin-bottom: 8px;
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                }

                .step-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--nsn-uif-redwood-color-light-text-primary);
                    margin: 0 0 4px 0;
                    line-height: 1.2;
                }

                .step-description {
                    font-size: 10px;
                    color: var(--nsn-uif-redwood-color-light-text-secondary);
                    margin: 0;
                    line-height: 1.3;
                }

                .process-arrow {
                    color: var(--nsn-uif-redwood-color-light-brand-100);
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0 4px;
                    flex-shrink: 0;
                }

                @media (max-width: 600px) {
                    .upload-page-container {
                        margin: 0;
                        border-radius: 0;
                        padding: 15px;
                    }

                    .process-flow-steps {
                        flex-direction: column;
                        gap: var(--nsn-uif-redwood-size-s);
                    }

                    .process-arrow {
                        transform: rotate(90deg);
                        margin: 4px 0;
                    }
                }

                .upload-container {
                    background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                    border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    padding: var(--nsn-uif-redwood-size-l);
                    margin: var(--nsn-uif-redwood-size-s) 0;
                    text-align: center;
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                    transition: box-shadow 0.2s ease;
                    position: relative;
                }

                .upload-container:hover {
                    box-shadow: 0 6px 12px 0px rgba(0, 0, 0, 0.12);
                }

                .upload-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--nsn-uif-redwood-color-light-text-primary);
                    margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                }

                .upload-subtitle {
                    font-size: 16px;
                    color: var(--nsn-uif-redwood-color-light-text-secondary);
                    margin: 0 0 var(--nsn-uif-redwood-size-l) 0;
                }

                .choose-file-btn {
                    background-color: var(--nsn-uif-redwood-color-light-brand-120);
                    color: white;
                    border: none;
                    padding: 16px 32px;
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                    transition: all 0.2s ease;
                    min-width: 160px;
                    position: relative;
                    font-family: 'Oracle Sans', sans-serif;
                }

                .choose-file-btn:hover {
                    background-color: var(--nsn-uif-redwood-color-light-brand-100);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
                }

                .choose-file-btn:active {
                    transform: translateY(0);
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                }

                .upload-success {
                    background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                    border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    padding: var(--nsn-uif-redwood-size-s);
                    margin: var(--nsn-uif-redwood-size-s) 0;
                    text-align: left;
                    display: none;
                }

                .success-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--nsn-uif-redwood-color-light-text-primary);
                    margin: 0 0 8px 0;
                }

                .file-detail {
                    font-size: 14px;
                    color: var(--nsn-uif-redwood-color-light-text-secondary);
                    margin: 4px 0;
                }

                .media-id {
                    font-family: 'Courier New', monospace;
                    background-color: var(--nsn-uif-redwood-color-light-neutral-20);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 12px;
                }

                .process-container {
                    margin: var(--nsn-uif-redwood-size-m) 0;
                    padding: var(--nsn-uif-redwood-size-s);
                    background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    border: 1px dashed var(--nsn-uif-redwood-color-light-brand-100);
                    text-align: center;
                }

                .process-btn {
                    background-color: var(--nsn-uif-redwood-color-light-brand-100);
                    color: white;
                    border: none;
                    padding: 16px 32px;
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                    transition: all 0.2s ease;
                    min-width: 160px;
                    font-family: 'Oracle Sans', sans-serif;
                }

                .process-btn:hover {
                    background-color: var(--nsn-uif-redwood-color-light-brand-120);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
                }

                .process-btn:active {
                    transform: translateY(0);
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                }

                .my-app-modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(22, 21, 19, 0.4);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1500;
                }

                .my-app-modal-dialog {
                    background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                    border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    box-shadow: 0 6px 12px 0px rgba(0, 0, 0, 0.2);
                    overflow: hidden;
                    min-width: 350px;
                    max-width: 90%;
                    max-height: 90%;
                    display: flex;
                    flex-direction: column;
                }

                .my-app-modal-header {
                    background-color: var(--nsn-uif-redwood-color-light-brand-120);
                    padding: 8px var(--nsn-uif-redwood-size-s);
                    font-size: 16px;
                    font-weight: 700;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .close-button {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    line-height: 1;
                }

                .close-button:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
            </style>

            <div class="upload-page-container">
                <div class="page-header">
                    <h1>🤖 Expense Capture</h1>
                </div>

                <div class="process-flow-container">
                    <div class="process-flow-title">Expense Capture Processing Flow</div>
                    <div class="process-flow-steps">
                        <div class="process-step">
                            <div class="step-icon">⬆</div>
                            <div class="step-title">Upload</div>
                            <div class="step-description">Choose your receipt file</div>
                        </div>
                        <span class="process-arrow">→</span>
                        <div class="process-step">
                            <div class="step-icon">⚙</div>
                            <div class="step-title">Process</div>
                            <div class="step-description">Extract data using AI</div>
                        </div>
                        <span class="process-arrow">→</span>
                        <div class="process-step">
                            <div class="step-icon">✓</div>
                            <div class="step-title">Review</div>
                            <div class="step-description">Add to expense report</div>
                        </div>
                    </div>
                </div>

                <div class="upload-container">
                    <div class="upload-title">Receipt Processing</div>
                    <div class="upload-subtitle">Upload your receipt for automatic expense data extraction</div>

                    <button type="button" id="btn_choose_file" onclick="openRegularUpload()" class="choose-file-btn">
                    📁 Choose File
                    </button>

                    <div id="upload_status" class="upload-success">
                        <div class="success-title">✅ File Uploaded Successfully</div>
                        <div class="file-detail"><strong>File:</strong> <span id="file_name_display"></span></div>
                        <div class="file-detail"><strong>ID:</strong> <span id="media_id_display" class="media-id"></span></div>
                    </div>
                </div>
            </div>

            <!-- Modal overlay -->
            <div id="upload_modal" class="my-app-modal-backdrop" style="display: none;">
                <div class="my-app-modal-dialog" style="width: 90%; max-width: 800px; height: 80%; max-height: 600px;">
                    <div class="my-app-modal-header">
                        <span>📸 Upload Receipt</span>
                        <button onclick="closeUploadModal()" class="close-button">×</button>
                    </div>
                    <iframe id="modal_iframe" src="${regularUploadUrl}" style="width: 100%; height: calc(100% - 60px); border: none; background: white;"></iframe>
                </div>
            </div>

            <script>
                let uploadedFileId = null;
                let uploadedFileName = null;

                function openRegularUpload() {
                    document.getElementById('upload_modal').style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }

                function closeUploadModal() {
                    document.getElementById('upload_modal').style.display = 'none';
                    document.body.style.overflow = 'auto';
                }

                // Monitor iframe for file upload completion
                function monitorRegularUpload() {
                    const iframe = document.getElementById('modal_iframe');
                    if (iframe) {
                        try {
                            const iframeUrl = iframe.contentWindow.location.href;
                            console.log('Iframe URL:', iframeUrl);

                            // Check for successful upload indicators in the URL
                            if (iframeUrl.includes('mediaid=') || iframeUrl.includes('id=')) {
                                const urlParams = new URLSearchParams(iframeUrl.split('?')[1]);
                                const fileId = urlParams.get('mediaid') || urlParams.get('id');
                                const fileName = urlParams.get('filename') || urlParams.get('name') || 'uploaded_receipt';

                                if (fileId) {
                                    uploadedFileId = fileId;
                                    uploadedFileName = decodeURIComponent(fileName);

                                    console.log('Successfully captured regular file upload:', {
                                        fileId: uploadedFileId,
                                        fileName: uploadedFileName
                                    });

                                    document.getElementById('file_name_display').textContent = uploadedFileName;
                                    document.getElementById('media_id_display').textContent = uploadedFileId;
                                    document.getElementById('upload_status').style.display = 'block';

                                    closeUploadModal();
                                    enableProcessButton();
                                }
                            }
                        } catch (e) {
                            console.log('Cannot access iframe URL due to cross-origin policy (this is normal)');
                        }
                    }
                }

                let monitoringInterval = setInterval(monitorRegularUpload, 1000);

                setTimeout(function() {
                    if (monitoringInterval) {
                        clearInterval(monitoringInterval);
                        console.log('Stopped iframe monitoring after 30 minutes');
                    }
                }, 30 * 60 * 1000);

                function enableProcessButton() {
                    if (!document.getElementById('btn_process_receipt')) {
                        // Hide the choose file button
                        document.getElementById('btn_choose_file').style.display = 'none';

                        // Add process button to the main container (white area)
                        const processButton = document.createElement('button');
                        processButton.id = 'btn_process_receipt';
                        processButton.type = 'button';
                        processButton.className = 'process-btn';
                        processButton.onclick = processUploadedFile;
                        processButton.textContent = 'Process Receipt';

                        // Add some margin for spacing and center it
                        processButton.style.marginTop = '20px';
                        processButton.style.display = 'block';
                        processButton.style.margin = '20px auto 0 auto';

                        const uploadContainer = document.querySelector('.upload-container');
                        uploadContainer.appendChild(processButton);
                    }
                }

                function processUploadedFile() {
                    if (!uploadedFileId) {
                        alert('No file uploaded. Please choose a file first.');
                        return;
                    }

                    // Create form and submit for processing
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = window.location.href;

                    const fileIdInput = document.createElement('input');
                    fileIdInput.type = 'hidden';
                    fileIdInput.name = 'uploaded_file_id';
                    fileIdInput.value = uploadedFileId;
                    form.appendChild(fileIdInput);

                    const fileNameInput = document.createElement('input');
                    fileNameInput.type = 'hidden';
                    fileNameInput.name = 'uploaded_file_name';
                    fileNameInput.value = uploadedFileName;
                    form.appendChild(fileNameInput);

                    const actionInput = document.createElement('input');
                    actionInput.type = 'hidden';
                    actionInput.name = 'action';
                    actionInput.value = 'process_regular_file';
                    form.appendChild(actionInput);

                    const userIdInput = document.createElement('input');
                    userIdInput.type = 'hidden';
                    userIdInput.name = 'user_id';
                    userIdInput.value = '${currentUser.id}';
                    form.appendChild(userIdInput);

                    document.body.appendChild(form);

                    showProcessingMessage('Starting AI processing of your receipt...');

                    form.submit();
                }

                function showProcessingMessage(message) {
                    const overlay = document.createElement('div');
                    overlay.id = 'processing-overlay';
                    overlay.className = 'my-app-processing-overlay';

                    const messageBox = document.createElement('div');
                    messageBox.className = 'my-app-processing-message-box';
                    messageBox.innerHTML =
                        '<div class="my-app-processing-title">🔄 Processing...</div>' +
                        '<div class="my-app-processing-message">' + message + '</div>' +
                        '<div class="my-app-processing-details">Please wait while we process your receipt.</div>';

                    overlay.appendChild(messageBox);
                    document.body.appendChild(overlay);
                }
            </script>
        `;
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

            // Handle regular file processing
            if (action === 'process_regular_file') {
                const fileId = parameters.uploaded_file_id;
                const fileName = parameters.uploaded_file_name;
                const userId = parameters.user_id;

                return triggerRegularFileProcessing(context, fileId, fileName, userId, trackingId);
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
     * Trigger processing of regular file item
     * @param {Object} context - Request context
     * @param {string} fileId - ID of regular file item
     * @param {string} fileName - Name of uploaded file
     * @param {string} userId - User ID
     * @param {string} trackingId - Tracking ID for this operation
     */
    function triggerRegularFileProcessing(context, fileId, fileName, userId, trackingId) {
        commonLib.logOperation('trigger_regular_file_processing_start', {
            trackingId: trackingId,
            fileId: fileId,
            fileName: fileName,
            userId: userId
        });

        // Start Map/Reduce script with regular file information
        const mrTaskId = startRegularFileProcessing(fileId, fileName, userId, trackingId);

        commonLib.logOperation('regular_file_processing_triggered', {
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
     * Start Map/Reduce script to process the regular file
     * @param {string} fileId - ID of regular file item to process
     * @param {string} fileName - Name of file
     * @param {string} userId - User ID
     * @param {string} trackingId - Tracking ID
     * @returns {string} Map/Reduce task ID
     */
    function startRegularFileProcessing(fileId, fileName, userId, trackingId) {
        try {
            const mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: CONSTANTS.SCRIPT_IDS.PROCESS_MR,
                deploymentId: CONSTANTS.DEPLOYMENT_IDS.PROCESS_MR,
                params: {
                    'custscript_ains_file_id': fileId,
                    'custscript_ains_file_name': fileName,
                    'custscript_ains_user_id': userId,
                    'custscript_ains_tracking_id': trackingId,
                    'custscript_ains_is_regular_file': true  // Flag to indicate regular file
                }
            });

            const taskId = mrTask.submit();

            commonLib.logOperation('mr_task_submitted_regular_file', {
                taskId: taskId,
                fileId: fileId,
                fileName: fileName,
                userId: userId,
                trackingId: trackingId
            });

            return taskId;

        } catch (error) {
            commonLib.logOperation('mr_task_submission_error_regular_file', {
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
        // Generate the proper suitelet URL for upload another functionality
        const uploadUrl = url.resolveScript({
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId
        });

        // Use simple HTML response instead of NetSuite form to avoid form submission issues
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>AI Processing Started - NetSuite</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" type="text/css" href="../Libraries/AINS_LIB_Styles.css">
                <style>
                    :root {
                        --nsn-uif-redwood-color-light-neutral-0: rgb(255, 255, 255);
                        --nsn-uif-redwood-color-light-neutral-10: rgb(251, 249, 248);
                        --nsn-uif-redwood-color-light-neutral-20: rgb(245, 244, 242);
                        --nsn-uif-redwood-color-light-brand-100: rgb(34, 126, 158);
                        --nsn-uif-redwood-color-light-brand-120: rgb(54, 103, 125);
                        --nsn-uif-redwood-color-light-text-primary: rgb(22, 21, 19);
                        --nsn-uif-redwood-color-light-text-secondary: rgba(22, 21, 19, 0.7);
                        --nsn-uif-redwood-color-light-border-divider: rgba(22, 21, 19, 0.12);
                        --nsn-uif-redwood-size-s: 16px;
                        --nsn-uif-redwood-size-m: 24px;
                        --nsn-uif-redwood-border-rounded-corners: 6px;
                        --nsn-uif-redwood-shadow-small: 0 4px 8px 0 rgba(0, 0, 0, 0.16);
                    }

                    body {
                        font-family: 'Oracle Sans', 'Helvetica Neue', sans-serif;
                        background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                        margin: 0;
                        padding: 20px;
                        line-height: 1.5;
                    }

                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                        border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                        box-shadow: var(--nsn-uif-redwood-shadow-small);
                        overflow: hidden;
                    }

                    .header {
                        background-color: var(--nsn-uif-redwood-color-light-brand-120);
                        color: white;
                        padding: var(--nsn-uif-redwood-size-m);
                        text-align: center;
                    }

                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }

                    .content {
                        padding: var(--nsn-uif-redwood-size-m);
                    }

                .processing-container {
                    background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                    border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    padding: var(--nsn-uif-redwood-size-m);
                    margin: var(--nsn-uif-redwood-size-s) 0;
                    text-align: center;
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                }

                .success-header {
                        font-size: 20px;
                        font-weight: 600;
                    color: var(--nsn-uif-redwood-color-light-brand-100);
                    margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                }

                .file-info {
                    background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                    border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    padding: var(--nsn-uif-redwood-size-s);
                    margin: var(--nsn-uif-redwood-size-s) 0;
                    text-align: left;
                }

                .file-name {
                        font-size: 16px;
                        font-weight: 600;
                    color: var(--nsn-uif-redwood-color-light-text-primary);
                        margin: 0 0 8px 0;
                }

                .file-detail {
                        font-size: 14px;
                    color: var(--nsn-uif-redwood-color-light-text-secondary);
                    margin: 0;
                }

                .processing-status {
                    margin: var(--nsn-uif-redwood-size-m) 0;
                    padding: var(--nsn-uif-redwood-size-s);
                    background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                    border: 1px dashed var(--nsn-uif-redwood-color-light-brand-100);
                }

                .processing-title {
                        font-size: 18px;
                        font-weight: 600;
                    color: var(--nsn-uif-redwood-color-light-brand-100);
                    margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                }

                .processing-message {
                        font-size: 16px;
                    color: var(--nsn-uif-redwood-color-light-text-primary);
                    margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                }

                .processing-details {
                        font-size: 14px;
                    color: var(--nsn-uif-redwood-color-light-text-secondary);
                    margin: 0;
                    line-height: 1.5;
                }

                .action-buttons {
                    margin: var(--nsn-uif-redwood-size-m) 0 0 0;
                    display: flex;
                    gap: var(--nsn-uif-redwood-size-s);
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .action-btn {
                    background-color: var(--nsn-uif-redwood-color-light-brand-120);
                        color: white;
                    border: none;
                        padding: 12px 24px;
                    border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                        font-size: 14px;
                        font-weight: 600;
                    cursor: pointer;
                    box-shadow: var(--nsn-uif-redwood-shadow-small);
                        transition: all 0.2s ease;
                    text-decoration: none;
                    display: inline-block;
                        min-width: 160px;
                }

                .action-btn:hover {
                    background-color: var(--nsn-uif-redwood-color-light-brand-100);
                        transform: translateY(-1px);
                        box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
                }

                .action-btn.secondary {
                    background-color: var(--nsn-uif-redwood-color-light-neutral-20);
                    color: var(--nsn-uif-redwood-color-light-text-primary);
                    border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                }

                .action-btn.secondary:hover {
                    background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                        transform: translateY(-1px);
                }
            </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🤖 AI Processing Started</h1>
                    </div>

                    <div class="content">
            <div class="processing-container">
                <div class="success-header">Upload Successful!</div>

                <div class="file-info">
                    <div class="file-name">📄 ${details.fileName}</div>
                    <div class="file-detail">File uploaded and processing initiated</div>
                </div>

                <div class="processing-status">
                    <div class="processing-title">Processing Started</div>
                    <div class="processing-message">Your receipt is being processed automatically</div>
                    <div class="processing-details">
                        Processing typically takes 2-5 minutes<br>
                        Check your dashboard for the completed expense record
                    </div>
                </div>

                <div class="action-buttons">
                                <button type="button" onclick="uploadAnother()" class="action-btn">
                        📁 Upload Another Receipt
                    </button>
                                <button type="button" onclick="returnToDashboard()" class="action-btn secondary">
                        🏠 Return to Dashboard
                    </button>
                            </div>
                        </div>
                </div>
            </div>

            <script>
                function uploadAnother() {
                        // Navigate back to upload page (GET request)
                        try {
                            // Use server-resolved URL for proper navigation
                            const uploadUrl = '${uploadUrl}';
                            console.log('Navigating to upload page:', uploadUrl);
                            window.location.href = uploadUrl;
                        } catch (error) {
                            console.error('Error navigating to upload form:', error);
                            // Fallback: force reload
                            window.location.reload();
                        }
                }

                function returnToDashboard() {
                        // Navigate to NetSuite home screen
                        try {
                            console.log('Navigating to NetSuite dashboard');
                            window.location.href = '/app/center/card.nl';
                        } catch (error) {
                            console.error('Error returning to dashboard:', error);
                            // Fallback to general center
                            window.location.href = '/app/center/';
                        }
                    }

                    // Log page load for debugging
                    console.log('Processing success page loaded');
            </script>
            </body>
            </html>
        `;

        // Write the HTML response directly
        context.response.write(htmlContent);
    }

    /**
     * Handle traditional file upload through form (legacy support)
     * @param {Object} context - Request context
     * @param {string} trackingId - Tracking ID for this operation
     */
    function handleFileUpload(context, trackingId) {
        try {
            const currentUser = commonLib.getCurrentUser();
            const files = context.request.files;

            // Check if any files were uploaded
            if (!files || Object.keys(files).length === 0) {
                throw new Error('No files were uploaded. Please select a file to upload.');
            }

            // Get the first uploaded file
            const fileKey = Object.keys(files)[0];
            const uploadedFile = files[fileKey];

            commonLib.logOperation('legacy_file_upload_start', {
                trackingId: trackingId,
                fileName: uploadedFile.name,
                fileSize: uploadedFile.size,
                userId: currentUser.id
            });

            // Validate the uploaded file
            const validation = validateUploadedFile(uploadedFile);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            // Save the file with enhanced security
            const savedFile = saveFileWithEnhancedSecurity(uploadedFile, currentUser.id);

            commonLib.logOperation('legacy_file_saved', {
                trackingId: trackingId,
                fileId: savedFile.id,
                fileName: savedFile.name,
                userId: currentUser.id
            });

            // Start processing the saved file
            return triggerProcessing(context, savedFile.id, savedFile.name, trackingId);

        } catch (error) {
            commonLib.logOperation('legacy_file_upload_error', {
                trackingId: trackingId,
                error: error.message
            }, 'error');

            throw error;
        }
    }

    /**
     * Trigger processing of uploaded file (legacy support)
     * @param {Object} context - Request context
     * @param {string} fileId - ID of uploaded file
     * @param {string} fileName - Name of uploaded file
     * @param {string} trackingId - Tracking ID for this operation
     */
    function triggerProcessing(context, fileId, fileName, trackingId) {
        try {
            const currentUser = commonLib.getCurrentUser();

            commonLib.logOperation('trigger_legacy_processing_start', {
                trackingId: trackingId,
                fileId: fileId,
                fileName: fileName,
                userId: currentUser.id
            });

            // Start Map/Reduce script for regular file processing
            const mrTaskId = startRegularFileProcessing(fileId, fileName, currentUser.id, trackingId);

            commonLib.logOperation('legacy_processing_triggered', {
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

        } catch (error) {
            commonLib.logOperation('trigger_legacy_processing_error', {
                trackingId: trackingId,
                fileId: fileId,
                error: error.message
            }, 'error');

            throw error;
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
        // Generate the proper suitelet URL for upload another functionality
        const uploadUrl = url.resolveScript({
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId
        });

        // Use simple HTML response for consistent design
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Upload Successful - NetSuite</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    :root {
                        --nsn-uif-redwood-color-light-neutral-0: rgb(255, 255, 255);
                        --nsn-uif-redwood-color-light-neutral-10: rgb(251, 249, 248);
                        --nsn-uif-redwood-color-light-neutral-20: rgb(245, 244, 242);
                        --nsn-uif-redwood-color-light-brand-100: rgb(34, 126, 158);
                        --nsn-uif-redwood-color-light-brand-120: rgb(54, 103, 125);
                        --nsn-uif-redwood-color-light-text-primary: rgb(22, 21, 19);
                        --nsn-uif-redwood-color-light-text-secondary: rgba(22, 21, 19, 0.7);
                        --nsn-uif-redwood-color-light-border-divider: rgba(22, 21, 19, 0.12);
                        --nsn-uif-redwood-color-light-success-100: rgb(40, 167, 69);
                        --nsn-uif-redwood-color-light-success-10: rgb(243, 248, 244);
                        --nsn-uif-redwood-size-s: 16px;
                        --nsn-uif-redwood-size-m: 24px;
                        --nsn-uif-redwood-border-rounded-corners: 6px;
                        --nsn-uif-redwood-shadow-small: 0 4px 8px 0 rgba(0, 0, 0, 0.16);
                    }

                    body {
                        font-family: 'Oracle Sans', 'Helvetica Neue', sans-serif;
                        background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                        margin: 0;
                        padding: 20px;
                        line-height: 1.5;
                    }

                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                        border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                        box-shadow: var(--nsn-uif-redwood-shadow-small);
                        overflow: hidden;
                    }

                    .header {
                        background-color: var(--nsn-uif-redwood-color-light-success-100);
                        color: white;
                        padding: var(--nsn-uif-redwood-size-m);
                        text-align: center;
                    }

                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }

                    .content {
                        padding: var(--nsn-uif-redwood-size-m);
                    }

                    .success-container {
                        background-color: var(--nsn-uif-redwood-color-light-success-10);
                        border: 1px solid var(--nsn-uif-redwood-color-light-success-100);
                        border-left: 4px solid var(--nsn-uif-redwood-color-light-success-100);
                        border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                        padding: var(--nsn-uif-redwood-size-m);
                        margin: var(--nsn-uif-redwood-size-s) 0;
                    }

                    .success-header {
                        font-size: 20px;
                        font-weight: 600;
                        color: var(--nsn-uif-redwood-color-light-success-100);
                        margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                    }

                    .success-header::before {
                        content: "✓";
                        margin-right: 8px;
                    }

                    .detail-item {
                        margin: 8px 0;
                        font-size: 14px;
                    }

                    .detail-label {
                        font-weight: 600;
                        color: var(--nsn-uif-redwood-color-light-text-primary);
                    }

                    .detail-value {
                        color: var(--nsn-uif-redwood-color-light-text-secondary);
                        font-family: 'Courier New', monospace;
                        background-color: var(--nsn-uif-redwood-color-light-neutral-20);
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 12px;
                    }

                    .success-details {
                        font-size: 14px;
                        color: var(--nsn-uif-redwood-color-light-text-secondary);
                        margin: var(--nsn-uif-redwood-size-s) 0 0 0;
                        line-height: 1.5;
                    }

                    .action-buttons {
                        margin: var(--nsn-uif-redwood-size-m) 0 0 0;
                        display: flex;
                        gap: var(--nsn-uif-redwood-size-s);
                        justify-content: center;
                        flex-wrap: wrap;
                    }

                    .action-btn {
                        background-color: var(--nsn-uif-redwood-color-light-brand-120);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: var(--nsn-uif-redwood-shadow-small);
                        transition: all 0.2s ease;
                        text-decoration: none;
                        display: inline-block;
                        min-width: 160px;
                    }

                    .action-btn:hover {
                        background-color: var(--nsn-uif-redwood-color-light-brand-100);
                        transform: translateY(-1px);
                        box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
                    }

                    .action-btn.secondary {
                        background-color: var(--nsn-uif-redwood-color-light-neutral-20);
                        color: var(--nsn-uif-redwood-color-light-text-primary);
                        border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                    }

                    .action-btn.secondary:hover {
                        background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                        transform: translateY(-1px);
                    }

                    @media (max-width: 600px) {
                        .container {
                            margin: 0;
                            border-radius: 0;
                        }

                        body {
                            padding: 15px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Upload Successful</h1>
                    </div>

                    <div class="content">
                        <div class="success-container">
                            <div class="success-header">Upload Successful!</div>

                            <div class="detail-item">
                                <span class="detail-label">File:</span> ${details.fileName}
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Tracking ID:</span> <span class="detail-value">${details.trackingId}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Status:</span> Processing started automatically
                            </div>

                            <div class="success-details">
                                Your receipt is being processed by AI. Check back in a few minutes to see the extracted expense data.
                            </div>
                        </div>

                        <div class="action-buttons">
                            <button type="button" onclick="uploadAnother()" class="action-btn">
                                📁 Upload Another Receipt
                            </button>
                            ${details.isEmployeeCenter ?
                                `<button type="button" onclick="returnToDashboard()" class="action-btn secondary">
                                    🏠 Return to Dashboard
                                </button>` :
                                `<button type="button" onclick="viewRecord()" class="action-btn secondary">
                                    👁️ View Record
                                </button>`
                            }
                        </div>
                    </div>
                </div>

                <script>
                    function uploadAnother() {
                        // Navigate back to upload page (GET request)
                        try {
                            // Use server-resolved URL for proper navigation
                            const uploadUrl = '${uploadUrl}';
                            console.log('Navigating to upload page:', uploadUrl);
                            window.location.href = uploadUrl;
                        } catch (error) {
                            console.error('Error navigating to upload form:', error);
                            // Fallback: force reload
                            window.location.reload();
                        }
                    }

                    function returnToDashboard() {
                        // Navigate to NetSuite home screen
                        try {
                            console.log('Navigating to NetSuite dashboard');
                            window.location.href = '/app/center/homepage.nl';
                        } catch (error) {
                            console.error('Error returning to dashboard:', error);
                            // Fallback to general center
                            window.location.href = '/app/center/';
                        }
                    }

                    function viewRecord() {
                        // Navigate to expense record if available
                        try {
                            const recordId = '${details.expenseRecordId || ''}';
                            if (recordId) {
                                window.location.href = '/app/common/custom/custrecordentry.nl?rectype=customrecord_ains_expense_capture&id=' + recordId;
                            } else {
                                console.log('No record ID available');
                                returnToDashboard();
                            }
                        } catch (error) {
                            console.error('Error navigating to record:', error);
                            returnToDashboard();
                        }
                    }

                    // Log page load for debugging
                    console.log('Success page loaded with details:', {
                        fileName: '${details.fileName}',
                        trackingId: '${details.trackingId}',
                        isEmployeeCenter: ${details.isEmployeeCenter || false}
                    });
                </script>
            </body>
            </html>
        `;

        // Write the HTML response directly
        context.response.write(htmlContent);
    }

    /**
     * Show recent file not found page
     * @param {Object} context - Request context
     */
    function showRecentFileNotFoundPage(context) {
        // Use simple HTML response for consistent design
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>File Not Found - NetSuite</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    :root {
                        --nsn-uif-redwood-color-light-neutral-0: rgb(255, 255, 255);
                        --nsn-uif-redwood-color-light-neutral-10: rgb(251, 249, 248);
                        --nsn-uif-redwood-color-light-neutral-20: rgb(245, 244, 242);
                        --nsn-uif-redwood-color-light-brand-100: rgb(34, 126, 158);
                        --nsn-uif-redwood-color-light-brand-120: rgb(54, 103, 125);
                        --nsn-uif-redwood-color-light-text-primary: rgb(22, 21, 19);
                        --nsn-uif-redwood-color-light-text-secondary: rgba(22, 21, 19, 0.7);
                        --nsn-uif-redwood-color-light-border-divider: rgba(22, 21, 19, 0.12);
                        --nsn-uif-redwood-color-light-warning-100: rgb(255, 193, 7);
                        --nsn-uif-redwood-color-light-warning-10: rgb(255, 252, 235);
                        --nsn-uif-redwood-size-s: 16px;
                        --nsn-uif-redwood-size-m: 24px;
                        --nsn-uif-redwood-border-rounded-corners: 6px;
                        --nsn-uif-redwood-shadow-small: 0 4px 8px 0 rgba(0, 0, 0, 0.16);
                    }

                    body {
                        font-family: 'Oracle Sans', 'Helvetica Neue', sans-serif;
                        background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                        margin: 0;
                        padding: 20px;
                        line-height: 1.5;
                    }

                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                        border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                        box-shadow: var(--nsn-uif-redwood-shadow-small);
                        overflow: hidden;
                    }

                    .header {
                        background-color: var(--nsn-uif-redwood-color-light-warning-100);
                        color: var(--nsn-uif-redwood-color-light-text-primary);
                        padding: var(--nsn-uif-redwood-size-m);
                        text-align: center;
                    }

                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }

                    .content {
                        padding: var(--nsn-uif-redwood-size-m);
                    }

                    .warning-container {
                        background-color: var(--nsn-uif-redwood-color-light-warning-10);
                        border: 1px solid var(--nsn-uif-redwood-color-light-warning-100);
                        border-left: 4px solid var(--nsn-uif-redwood-color-light-warning-100);
                        border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                        padding: var(--nsn-uif-redwood-size-m);
                        margin: var(--nsn-uif-redwood-size-s) 0;
                    }

                    .warning-header {
                        font-size: 20px;
                        font-weight: 600;
                        color: var(--nsn-uif-redwood-color-light-text-primary);
                        margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                    }

                    .warning-header::before {
                        content: "⚠️";
                        margin-right: 8px;
                    }

                    .warning-message {
                        font-size: 16px;
                        color: var(--nsn-uif-redwood-color-light-text-primary);
                        margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                    }

                    .warning-list {
                        background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                        padding: 12px;
                        border-radius: 4px;
                        border: 1px dashed var(--nsn-uif-redwood-color-light-warning-100);
                        margin: var(--nsn-uif-redwood-size-s) 0;
                    }

                    .warning-list ul {
                        margin: 0;
                        padding-left: 20px;
                    }

                    .warning-list li {
                        margin: 4px 0;
                        color: var(--nsn-uif-redwood-color-light-text-secondary);
                    }

                    .warning-details {
                        font-size: 14px;
                        color: var(--nsn-uif-redwood-color-light-text-secondary);
                        margin: 0;
                        line-height: 1.5;
                    }

                    .action-buttons {
                        margin: var(--nsn-uif-redwood-size-m) 0 0 0;
                        display: flex;
                        gap: var(--nsn-uif-redwood-size-s);
                        justify-content: center;
                        flex-wrap: wrap;
                    }

                    .action-btn {
                        background-color: var(--nsn-uif-redwood-color-light-brand-120);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: var(--nsn-uif-redwood-shadow-small);
                        transition: all 0.2s ease;
                        text-decoration: none;
                        display: inline-block;
                        min-width: 160px;
                    }

                    .action-btn:hover {
                        background-color: var(--nsn-uif-redwood-color-light-brand-100);
                        transform: translateY(-1px);
                        box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
                    }

                    .action-btn.secondary {
                        background-color: var(--nsn-uif-redwood-color-light-neutral-20);
                        color: var(--nsn-uif-redwood-color-light-text-primary);
                        border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                    }

                    .action-btn.secondary:hover {
                        background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                        transform: translateY(-1px);
                    }

                    @media (max-width: 600px) {
                        .container {
                            margin: 0;
                            border-radius: 0;
                        }

                        body {
                            padding: 15px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📄 File Not Found</h1>
                    </div>

                    <div class="content">
                        <div class="warning-container">
                            <div class="warning-header">File Not Found</div>
                            <div class="warning-message">
                                Unable to locate the recently uploaded file. This may be due to:
                            </div>
                            <div class="warning-list">
                                <ul>
                                    <li>File upload was not completed successfully</li>
                                    <li>File is still being processed by NetSuite</li>
                                    <li>File was uploaded to a different location</li>
                                </ul>
                            </div>
                            <div class="warning-details">
                                Please try uploading your receipt again.
                            </div>
                        </div>

                        <div class="action-buttons">
                            <button type="button" onclick="tryAgain()" class="action-btn">
                                🔄 Try Again
                            </button>
                            <button type="button" onclick="returnToDashboard()" class="action-btn secondary">
                                🏠 Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>

                <script>
                    function tryAgain() {
                        // Navigate back to upload page (GET request)
                        try {
                            const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
                            console.log('Navigating to upload page:', baseUrl);
                            window.location.href = baseUrl;
                        } catch (error) {
                            console.error('Error navigating to upload form:', error);
                            // Fallback: force reload
                            window.location.reload();
                        }
                    }

                    function returnToDashboard() {
                        // Navigate to NetSuite home screen
                        try {
                            console.log('Navigating to NetSuite dashboard');
                            window.location.href = '/app/center/homepage.nl';
                        } catch (error) {
                            console.error('Error returning to dashboard:', error);
                            // Fallback to general center
                            window.location.href = '/app/center/';
                        }
                    }

                    // Log page load for debugging
                    console.log('File not found page loaded');
                </script>
            </body>
            </html>
        `;

        // Write the HTML response directly
        context.response.write(htmlContent);
    }

    /**
     * Show error page
     * @param {Object} context - Request context
     * @param {Error} error - Error object
     */
    function showErrorPage(context, error) {
        // Use simple HTML response for consistent design
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Upload Error - NetSuite</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    :root {
                        --nsn-uif-redwood-color-light-neutral-0: rgb(255, 255, 255);
                        --nsn-uif-redwood-color-light-neutral-10: rgb(251, 249, 248);
                        --nsn-uif-redwood-color-light-neutral-20: rgb(245, 244, 242);
                        --nsn-uif-redwood-color-light-brand-100: rgb(34, 126, 158);
                        --nsn-uif-redwood-color-light-brand-120: rgb(54, 103, 125);
                        --nsn-uif-redwood-color-light-text-primary: rgb(22, 21, 19);
                        --nsn-uif-redwood-color-light-text-secondary: rgba(22, 21, 19, 0.7);
                        --nsn-uif-redwood-color-light-border-divider: rgba(22, 21, 19, 0.12);
                        --nsn-uif-redwood-color-light-danger-100: rgb(184, 40, 40);
                        --nsn-uif-redwood-color-light-danger-10: rgb(255, 243, 243);
                        --nsn-uif-redwood-size-s: 16px;
                        --nsn-uif-redwood-size-m: 24px;
                        --nsn-uif-redwood-border-rounded-corners: 6px;
                        --nsn-uif-redwood-shadow-small: 0 4px 8px 0 rgba(0, 0, 0, 0.16);
                    }

                    body {
                        font-family: 'Oracle Sans', 'Helvetica Neue', sans-serif;
                        background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                        margin: 0;
                        padding: 20px;
                        line-height: 1.5;
                    }

                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                        border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                        box-shadow: var(--nsn-uif-redwood-shadow-small);
                        overflow: hidden;
                    }

                    .header {
                        background-color: var(--nsn-uif-redwood-color-light-danger-100);
                        color: white;
                        padding: var(--nsn-uif-redwood-size-m);
                        text-align: center;
                    }

                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }

                    .content {
                        padding: var(--nsn-uif-redwood-size-m);
                    }

                    .error-container {
                        background-color: var(--nsn-uif-redwood-color-light-danger-10);
                        border: 1px solid var(--nsn-uif-redwood-color-light-danger-100);
                        border-left: 4px solid var(--nsn-uif-redwood-color-light-danger-100);
                        border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                        padding: var(--nsn-uif-redwood-size-m);
                        margin: var(--nsn-uif-redwood-size-s) 0;
                    }

                    .error-header {
                        font-size: 20px;
                        font-weight: 600;
                        color: var(--nsn-uif-redwood-color-light-danger-100);
                        margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                    }

                    .error-header::before {
                        content: "❌";
                        margin-right: 8px;
                    }

                    .error-message {
                        font-size: 16px;
                        color: var(--nsn-uif-redwood-color-light-text-primary);
                        margin: 0 0 var(--nsn-uif-redwood-size-s) 0;
                        background-color: var(--nsn-uif-redwood-color-light-neutral-0);
                        padding: 12px;
                        border-radius: 4px;
                        border: 1px dashed var(--nsn-uif-redwood-color-light-danger-100);
                    }

                    .error-details {
                        font-size: 14px;
                        color: var(--nsn-uif-redwood-color-light-text-secondary);
                        margin: 0;
                        line-height: 1.5;
                    }

                    .action-buttons {
                        margin: var(--nsn-uif-redwood-size-m) 0 0 0;
                        display: flex;
                        gap: var(--nsn-uif-redwood-size-s);
                        justify-content: center;
                        flex-wrap: wrap;
                    }

                    .action-btn {
                        background-color: var(--nsn-uif-redwood-color-light-brand-120);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: var(--nsn-uif-redwood-border-rounded-corners);
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: var(--nsn-uif-redwood-shadow-small);
                        transition: all 0.2s ease;
                        text-decoration: none;
                        display: inline-block;
                        min-width: 160px;
                    }

                    .action-btn:hover {
                        background-color: var(--nsn-uif-redwood-color-light-brand-100);
                        transform: translateY(-1px);
                        box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
                    }

                    .action-btn.secondary {
                        background-color: var(--nsn-uif-redwood-color-light-neutral-20);
                        color: var(--nsn-uif-redwood-color-light-text-primary);
                        border: 1px solid var(--nsn-uif-redwood-color-light-border-divider);
                    }

                    .action-btn.secondary:hover {
                        background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                        transform: translateY(-1px);
                    }

                    @media (max-width: 600px) {
                        .container {
                            margin: 0;
                            border-radius: 0;
                        }

                        body {
                            padding: 15px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚠️ Upload Error</h1>
                    </div>

                    <div class="content">
                        <div class="error-container">
                            <div class="error-header">Upload Error</div>
                            <div class="error-message">
                                <strong>Error:</strong> ${error.message}
                            </div>
                            <div class="error-details">
                                Please check your file and try again. If the problem persists, contact your system administrator.
                            </div>
                        </div>

                        <div class="action-buttons">
                            <button type="button" onclick="tryAgain()" class="action-btn">
                                🔄 Try Again
                            </button>
                            <button type="button" onclick="returnToDashboard()" class="action-btn secondary">
                                🏠 Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>

                <script>
                    function tryAgain() {
                        // Navigate back to upload page (GET request)
                        try {
                            const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
                            console.log('Navigating to upload page:', baseUrl);
                            window.location.href = baseUrl;
                        } catch (error) {
                            console.error('Error navigating to upload form:', error);
                            // Fallback: force reload
                            window.location.reload();
                        }
                    }

                    function returnToDashboard() {
                        // Navigate to NetSuite home screen
                        try {
                            console.log('Navigating to NetSuite dashboard');
                            window.location.href = '/app/center/homepage.nl';
                        } catch (error) {
                            console.error('Error returning to dashboard:', error);
                            // Fallback to general center
                            window.location.href = '/app/center/';
                        }
                    }

                    // Log page load for debugging
                    console.log('Error page loaded with message:', '${error.message}');
                </script>
            </body>
            </html>
        `;

        // Write the HTML response directly
        context.response.write(htmlContent);
    }

    /**
     * Add minimal form styling aligned with Redwood design system
     * @param {Form} form - Form object
     */
    function addFormStyling(form) {
        const styleField = form.addField({
            id: 'custom_style',
            type: ui.FieldType.INLINEHTML,
            label: 'Styling'
        });

        styleField.defaultValue = `
            <link rel="stylesheet" type="text/css" href="../Libraries/AINS_LIB_Styles.css">

            <style>
                .uir-form-title {
                    color: var(--nsn-uif-redwood-color-light-text-primary);
                    font-size: var(--nsn-uif-redwood-font-size-heading-sm);
                    font-weight: var(--nsn-uif-redwood-font-weight-semi-bold);
                    margin-bottom: var(--nsn-uif-redwood-size-s);
                }
                .uir-field-wrapper {
                    margin: var(--nsn-uif-redwood-size-2-xs) 0;
                }
                body {
                    font-family: 'Oracle Sans', 'Helvetica Neue', sans-serif;
                    background-color: var(--nsn-uif-redwood-color-light-neutral-10);
                }
                /* Hide default NetSuite form elements */
                .uir-form-buttons,
                .uir-form-buttonbar,
                input[type="submit"],
                input[value="Save"],
                input[value="Cancel"] {
                    display: none !important;
                }
                /* Hide any unwanted form sections */
                .uir-form-section:not(:has(.upload-container)) {
                    display: none !important;
                }
            </style>
        `;

        styleField.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    }

    // Removed createInstructionsHTML and addRecentUploadsSection for cleaner interface

    return {
        onRequest: onRequest
    };
});