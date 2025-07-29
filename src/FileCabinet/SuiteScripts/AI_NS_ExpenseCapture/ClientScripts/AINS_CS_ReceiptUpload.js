/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @description Client script for Receipt Upload functionality
 */

define(['N/currentRecord', 'N/ui/dialog', 'N/url'],
function(currentRecord, dialog, url) {

    /**
     * Page initialization function
     * @param {Object} scriptContext - Client script context
     */
    function pageInit(scriptContext) {
        try {
            console.log('AI NS Receipt Upload form initialized');

            // Add global functions for the interface
            window.uploadDifferentFile = uploadDifferentFile;
            window.uploadAnother = uploadAnother;
            window.returnToDashboard = returnToDashboard;

            // Legacy file validation for backward compatibility
            const fileField = document.getElementById('receipt_file_fs');
            if (fileField) {
                fileField.addEventListener('change', function(e) {
                    validateFileSelection(e.target);
                });
            }

            // Initialize expense upload listeners if present
            initializeExpenseUploadListeners();

        } catch (error) {
            console.error('AI NS Receipt Upload initialization error:', error);
        }
    }

    /**
     * Initialize listeners for expense upload iframe
     */
    function initializeExpenseUploadListeners() {
        // Listen for messages from expense upload iframe
        window.addEventListener('message', function(event) {
            console.log('Client script received message:', event);

            if (event.data && event.data.type === 'expense_upload_complete') {
                console.log('Expense upload completed:', event.data);
                // The embedded JavaScript in the suitelet handles this
            } else if (event.data && event.data.type === 'expense_upload_cancelled') {
                console.log('Expense upload cancelled');
                // Could show a message here if needed
            }
        });
    }

    /**
     * Form submission validation
     * @param {Object} scriptContext - Client script context
     * @returns {boolean} True if validation passes
     */
    function saveRecord(scriptContext) {
        try {
            const record = scriptContext.currentRecord;

            // Check if we have an uploaded file or media (for step 1) or are processing (for step 2)
            const uploadedFileId = record.getValue('uploaded_file_id');
            const uploadedMediaId = record.getValue('uploaded_media_id');
            const receiptFile = record.getValue('receipt_file');

            // Step 1: File/Media upload validation
            if (!uploadedFileId && !uploadedMediaId && !receiptFile) {
                dialog.alert({
                    title: 'File Required',
                    message: 'Please select a receipt file to upload.'
                });
                return false;
            }

            // If we have a traditional file, validate it
            if (receiptFile) {
                const fileValidation = validateUploadedFile(receiptFile);
                if (!fileValidation.isValid) {
                    dialog.alert({
                        title: 'Invalid File',
                        message: fileValidation.message
                    });
                    return false;
                }
            }

            // Show processing message
            if (receiptFile) {
                showProcessingMessage('Uploading and processing your receipt...');
            } else if (uploadedFileId || uploadedMediaId) {
                showProcessingMessage('Starting AI processing of your receipt...');
            }

            return true;

        } catch (error) {
            console.error('AI NS Receipt Upload save validation error:', error);
            dialog.alert({
                title: 'Validation Error',
                message: 'There was an error validating your upload. Please try again.'
            });
            return false;
        }
    }

    /**
     * Validate file selection in real-time
     * @param {HTMLInputElement} fileInput - File input element
     */
    function validateFileSelection(fileInput) {
        try {
            if (!fileInput.files || fileInput.files.length === 0) {
                return;
            }

            const file = fileInput.files[0];
            const validation = validateFileFromInput(file);

            if (!validation.isValid) {
                // Clear the file input
                fileInput.value = '';

                dialog.alert({
                    title: 'Invalid File',
                    message: validation.message
                });
                return;
            }

            // Show file info
            showFileInfo(file);

        } catch (error) {
            console.error('File selection validation error:', error);
        }
    }

    /**
     * Validate uploaded file (NetSuite file object)
     * @param {Object} fileObj - NetSuite file object
     * @returns {Object} Validation result
     */
    function validateUploadedFile(fileObj) {
        if (!fileObj) {
            return { isValid: false, message: 'No file provided' };
        }

        // For NetSuite file objects, basic validation
        return { isValid: true, message: 'File validation passed' };
    }

    /**
     * Validate file from HTML input (for real-time feedback)
     * @param {File} file - HTML File object
     * @returns {Object} Validation result
     */
    function validateFileFromInput(file) {
        try {
            // Check file size (10MB limit)
            const maxSizeBytes = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSizeBytes) {
                return {
                    isValid: false,
                    message: `File size (${(file.size / (1024*1024)).toFixed(1)}MB) exceeds the 10MB limit.`
                };
            }

            // Check file type
            const fileName = file.name.toLowerCase();
            const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif'];
            const fileExtension = fileName.split('.').pop();

            if (!allowedExtensions.includes(fileExtension)) {
                return {
                    isValid: false,
                    message: `File type '${fileExtension.toUpperCase()}' is not supported. Please use: ${allowedExtensions.join(', ').toUpperCase()}`
                };
            }

            return { isValid: true, message: 'File validation passed' };

        } catch (error) {
            return { isValid: false, message: 'Error validating file: ' + error.message };
        }
    }

    /**
     * Show file information after selection
     * @param {File} file - Selected file
     */
    function showFileInfo(file) {
        try {
            const infoHtml = `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 10px; border-radius: 3px; margin: 10px 0;">
                    <strong>✅ File Selected:</strong> ${file.name}<br>
                    <strong>Size:</strong> ${(file.size / (1024*1024)).toFixed(2)}MB<br>
                    <strong>Type:</strong> ${file.type || 'Unknown'}<br>
                    <em>Click "Upload & Process Receipt" to continue</em>
                </div>
            `;

            // Try to find a place to inject this info
            const uploadSection = document.querySelector('#upload_section_fs');
            if (uploadSection) {
                let infoDiv = document.getElementById('file-info-display');
                if (!infoDiv) {
                    infoDiv = document.createElement('div');
                    infoDiv.id = 'file-info-display';
                    uploadSection.appendChild(infoDiv);
                }
                infoDiv.innerHTML = infoHtml;
            }

        } catch (error) {
            console.error('Error showing file info:', error);
        }
    }

    /**
     * Show processing message
     * @param {string} message - Message to display
     */
    function showProcessingMessage(message) {
        try {
            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'processing-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            const messageBox = document.createElement('div');
            messageBox.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 5px;
                text-align: center;
                max-width: 400px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            `;

            messageBox.innerHTML = `
                <div style="font-size: 18px; color: #1f4e79; margin-bottom: 15px;">
                    🔄 Processing...
                </div>
                <div style="margin-bottom: 15px;">${message}</div>
                <div style="font-size: 12px; color: #666;">
                    Please wait while we process your receipt.
                </div>
            `;

            overlay.appendChild(messageBox);
            document.body.appendChild(overlay);

        } catch (error) {
            console.error('Error showing processing message:', error);
        }
    }

    /**
     * Upload a different file (clear current state)
     */
    function uploadDifferentFile() {
        try {
            // Get current URL without file parameters
            const currentUrl = window.location.href;
            const baseUrl = currentUrl.split('?')[0];

            // Navigate back to upload form
            window.location.href = baseUrl;

        } catch (error) {
            console.error('Error in uploadDifferentFile:', error);
            dialog.alert({
                title: 'Navigation Error',
                message: 'Unable to return to upload form. Please refresh the page.'
            });
        }
    }

    /**
     * Upload another receipt (same as uploadDifferentFile)
     */
    function uploadAnother() {
        uploadDifferentFile();
    }

    /**
     * Return to Employee Center Dashboard
     */
    function returnToDashboard() {
        try {
            // Try to detect Employee Center and navigate appropriately
            if (window.parent && window.parent !== window) {
                // We're in a popup/iframe, close it
                window.parent.focus();
                if (window.close) {
                    window.close();
                }
            } else {
                // Navigate to Employee Center home
                window.location.href = '/app/center/userprefs.nl';
            }

        } catch (error) {
            console.error('Error returning to dashboard:', error);
            dialog.alert({
                title: 'Navigation Error',
                message: 'Unable to return to dashboard. Please use your browser navigation.'
            });
        }
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };
});