/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @description Client script for Receipt Upload functionality
 */

define(['N/currentRecord', 'N/ui/dialog', 'N/url', 'N/https'],
function(currentRecord, dialog, url, https) {

    /**
     * Page initialization function
     * @param {Object} scriptContext - Client script context
     */
    function pageInit(scriptContext) {
        try {
            console.log('AI NS Receipt Upload form initialized - native upload method');

            // Add global functions for the interface
            window.openNativeUpload = openNativeUpload;
            window.returnToDashboard = returnToDashboard;
            window.uploadDifferentFile = uploadDifferentFile;
            window.uploadAnother = uploadAnother;

        } catch (error) {
            console.error('Error initializing receipt upload form:', error);
        }
    }

    /**
     * Open NetSuite's native expense media upload window
     * @param {string} uploadUrl - The native NetSuite upload URL
     */
    function openNativeUpload(uploadUrl) {
        try {
            console.log('Opening native NetSuite upload window:', uploadUrl);

            // Open NetSuite's native upload window in a popup
            const popup = window.open(
                uploadUrl,
                'ExpenseMediaUpload',
                'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
            );

            // Monitor the popup for completion
            const checkClosed = setInterval(function() {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    handleUploadComplete();
                }
            }, 1000);

        } catch (error) {
            console.error('Error opening native upload window:', error);
            dialog.alert({
                title: 'Upload Error',
                message: 'Unable to open upload window. Please try again.'
            });
        }
    }

    /**
     * Handle upload completion from native window
     */
    function handleUploadComplete() {
        try {
            console.log('Native upload window closed - checking for completion');

            // Show success message and redirect to processing step
            dialog.alert({
                title: 'Upload Complete',
                message: 'File uploaded successfully! Click OK to proceed to processing.'
            }).then(function() {
                // Preserve the script and deployment IDs in the redirect URL
                const currentUrl = window.location.href;
                const urlParts = currentUrl.split('?');
                const baseUrl = urlParts[0];
                const existingParams = urlParts[1] || '';

                // Parse existing parameters
                const params = new URLSearchParams(existingParams);

                // Add the find_recent_upload parameter
                params.set('find_recent_upload', 'true');

                // Remove any existing file parameters to start fresh
                params.delete('uploaded_file_id');
                params.delete('uploaded_file_name');

                // Construct the new URL with all parameters
                const processingUrl = baseUrl + '?' + params.toString();
                window.location.href = processingUrl;
            });

        } catch (error) {
            console.error('Error handling upload completion:', error);
        }
    }

    /**
     * Save record validation function
     * @param {Object} context - Script context
     * @returns {boolean} - True if validation passes
     */
    function saveRecord(context) {
        try {
            const record = context.currentRecord;

            // Check if this is Step 1 (upload) or Step 2 (processing)
            const uploadedFileId = record.getValue('uploaded_file_id');

            if (!uploadedFileId) {
                // Step 1: Validate file upload
                return validateFileUpload(record);
            } else {
                // Step 2: Validate processing trigger
                return validateProcessingTrigger(record);
            }

        } catch (error) {
            console.error('Form validation error:', error);
            dialog.alert({
                title: 'Validation Error',
                message: 'An error occurred during validation: ' + error.message
            });
            return false;
        }
    }

    /**
     * Validate file upload (Step 1) - Not used with native upload
     * @param {Record} record - Current record
     * @returns {boolean} - True if validation passes
     */
    function validateFileUpload(record) {
        // Native upload handles its own validation
        return true;
    }

    /**
     * Validate processing trigger (Step 2)
     * @param {Record} record - Current record
     * @returns {boolean} - True if validation passes
     */
    function validateProcessingTrigger(record) {
        // Confirm processing with user
        const fileName = record.getValue('uploaded_file_name');

        return dialog.confirm({
            title: 'Start AI Processing',
            message: `Ready to process "${fileName}" with AI?\n\nThis will extract expense data using Oracle OCI and NetSuite LLM.`
        });
    }

    /**
     * Upload a different file (return to upload step)
     */
    function uploadDifferentFile() {
        // Redirect back to upload form without file parameters but preserve script/deployment IDs
        const currentUrl = window.location.href;
        const urlParts = currentUrl.split('?');
        const baseUrl = urlParts[0];
        const existingParams = urlParts[1] || '';

        // Parse existing parameters
        const params = new URLSearchParams(existingParams);

        // Remove file-related parameters
        params.delete('uploaded_file_id');
        params.delete('uploaded_file_name');
        params.delete('find_recent_upload');

        // Construct the clean URL
        const cleanUrl = baseUrl + (params.toString() ? '?' + params.toString() : '');
        window.location.href = cleanUrl;
    }

    /**
     * Upload another receipt (start fresh)
     */
    function uploadAnother() {
        // Redirect to fresh upload form preserving script/deployment IDs
        const currentUrl = window.location.href;
        const urlParts = currentUrl.split('?');
        const baseUrl = urlParts[0];
        const existingParams = urlParts[1] || '';

        // Parse existing parameters
        const params = new URLSearchParams(existingParams);

        // Remove file-related parameters
        params.delete('uploaded_file_id');
        params.delete('uploaded_file_name');
        params.delete('find_recent_upload');

        // Construct the clean URL
        const cleanUrl = baseUrl + (params.toString() ? '?' + params.toString() : '');
        window.location.href = cleanUrl;
    }

    /**
     * Return to dashboard
     */
    function returnToDashboard() {
        // This would redirect to the Employee Center dashboard
        // For now, just go back to the main page
        window.location.href = '/app/center/card.nl?sc=-29';
    }

    /**
     * View a specific expense record
     * @param {string} recordId - Record ID to view
     */
    function viewRecord(recordId) {
        if (recordId) {
            const recordUrl = url.resolveRecord({
                recordType: 'customrecord_ains_expense_capture',
                recordId: recordId
            });
            window.location.href = recordUrl;
        }
    }

    // Return public functions
    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        uploadDifferentFile: uploadDifferentFile,
        uploadAnother: uploadAnother,
        returnToDashboard: returnToDashboard,
        viewRecord: viewRecord
    };
});