/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/**
 * AI NS Expense Capture - Receipt Upload Success Client Script
 * Provides client-side functionality for the upload success page
 */

define(['N/url', 'N/runtime'], function(url, runtime) {
    'use strict';

    var processingCheckInterval;

    /**
     * Page initialization function
     * @param {Object} context - Client script context
     */
    function pageInit(context) {
        try {
            console.log('AI NS Receipt Upload Success page initialized');

            // Initialize status checking if needed
            initializeStatusChecking();

        } catch (error) {
            console.error('Error initializing success page:', error);
        }
    }

    /**
     * Initialize status checking functionality
     */
    function initializeStatusChecking() {
        try {
            // Check if we should auto-refresh for processing status
            var urlParams = new URLSearchParams(window.location.search);
            var shouldCheck = urlParams.get('checkstatus');

            if (shouldCheck === 'true') {
                // Set up periodic status checking
                processingCheckInterval = setInterval(function() {
                    checkProcessingStatus();
                }, 30000); // Check every 30 seconds

                // Stop checking after 10 minutes to prevent infinite polling
                setTimeout(function() {
                    if (processingCheckInterval) {
                        clearInterval(processingCheckInterval);
                        console.log('Status checking stopped after timeout');
                    }
                }, 600000); // 10 minutes
            }

        } catch (error) {
            console.error('Error initializing status checking:', error);
        }
    }

    /**
     * Upload another receipt
     */
    function uploadAnother() {
        try {
            var uploadUrl = url.resolveScript({
                scriptId: 'customscript_ains_sl_receiptupload',
                deploymentId: 'customdeploy_ains_sl_receiptupload'
            });

            if (uploadUrl) {
                window.location.href = uploadUrl;
            } else {
                throw new Error('Unable to resolve upload script URL');
            }

        } catch (error) {
            console.error('Error navigating to upload form:', error);
            // Fallback: try to navigate to upload page directly
            try {
                // Remove all query parameters to get clean Suitelet URL
                const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
                const cleanUrl = baseUrl.split('?')[0];
                window.location.href = cleanUrl;
            } catch (fallbackError) {
                console.error('Fallback navigation failed:', fallbackError);
                alert('Unable to navigate to upload form. Please try refreshing the page.');
            }
        }
    }

    /**
     * Return to NetSuite Dashboard
     */
    function returnToDashboard() {
        try {
            // Navigate to NetSuite home screen
            window.location.href = '/app/center/homepage.nl';
        } catch (error) {
            console.error('Error returning to dashboard:', error);
            // Fallback to general center
            try {
                window.location.href = '/app/center/';
            } catch (fallbackError) {
                console.error('Fallback navigation failed:', fallbackError);
                // Last resort - try to go back
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    // Final fallback - reload the page
                    window.location.reload();
                }
            }
        }
    }

    /**
     * View the created expense record
     * @param {string} recordId - ID of the expense capture record
     */
    function viewRecord(recordId) {
        try {
            if (!recordId) {
                alert('Record ID not available. Unable to open record.');
                return;
            }

            // Validate record ID format
            if (!/^\d+$/.test(recordId)) {
                alert('Invalid record ID format.');
                return;
            }

            var recordUrl = url.resolveRecord({
                recordType: 'customrecord_ains_expense_capture',
                recordId: recordId
            });

            if (recordUrl) {
                window.open(recordUrl, '_blank');
            } else {
                throw new Error('Unable to resolve record URL');
            }

        } catch (error) {
            console.error('Error viewing record:', error);
            alert('Unable to open record. Please check your permissions or try again later.');
        }
    }

    /**
     * Check processing status with better NetSuite integration
     */
    function checkProcessingStatus() {
        try {
            // Instead of DOM manipulation, use URL parameters or make a proper AJAX call
            var urlParams = new URLSearchParams(window.location.search);
            var recordId = urlParams.get('recordid');

            if (recordId) {
                // Option 1: Refresh the current page to get updated status
                // This is safer than DOM manipulation in NetSuite
                var currentUrl = window.location.href;
                if (!currentUrl.includes('refreshed=true')) {
                    var separator = currentUrl.includes('?') ? '&' : '?';
                    window.location.href = currentUrl + separator + 'refreshed=true&timestamp=' + Date.now();
                }
            } else {
                console.log('No record ID available for status checking');
            }

        } catch (error) {
            console.error('Error checking processing status:', error);
        }
    }

    /**
     * Refresh the current page
     */
    function refreshPage() {
        try {
            // Add timestamp to prevent caching issues
            var currentUrl = window.location.href.split('?')[0];
            var urlParams = new URLSearchParams(window.location.search);
            urlParams.set('refresh', Date.now().toString());

            window.location.href = currentUrl + '?' + urlParams.toString();

        } catch (error) {
            console.error('Error refreshing page:', error);
            // Fallback to simple reload
            window.location.reload();
        }
    }

    /**
     * Download receipt file (if available)
     * @param {string} fileId - NetSuite file ID
     */
    function downloadReceipt(fileId) {
        try {
            if (!fileId) {
                alert('File ID not available for download.');
                return;
            }

            // Validate file ID format
            if (!/^\d+$/.test(fileId)) {
                alert('Invalid file ID format.');
                return;
            }

            var fileUrl = '/app/common/media/mediaitem.nl?id=' + fileId;
            window.open(fileUrl, '_blank');

        } catch (error) {
            console.error('Error downloading receipt:', error);
            alert('Unable to download receipt. Please try again later.');
        }
    }

    /**
     * Clean up intervals when page is unloaded
     */
    function beforeUnload() {
        try {
            if (processingCheckInterval) {
                clearInterval(processingCheckInterval);
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    /**
     * Field changed event handler (if needed for dynamic forms)
     * @param {Object} context - Client script context
     */
    function fieldChanged(context) {
        try {
            // Handle any field changes on the success page if needed
            console.log('Field changed:', context.fieldId);
        } catch (error) {
            console.error('Error in fieldChanged:', error);
        }
    }

    // Set up cleanup on page unload
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', beforeUnload);
    }

    // Return the entry points for the client script
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        uploadAnother: uploadAnother,
        returnToDashboard: returnToDashboard,
        viewRecord: viewRecord,
        refreshPage: refreshPage,
        downloadReceipt: downloadReceipt
    };
});