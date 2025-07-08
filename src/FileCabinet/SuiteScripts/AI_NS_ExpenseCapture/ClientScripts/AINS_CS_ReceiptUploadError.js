/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/**
 * AI NS Expense Capture - Receipt Upload Error Client Script
 * Provides client-side functionality for the upload error page
 */

define(['N/url', 'N/currentRecord'], function(url, currentRecord) {
    'use strict';

    /**
     * Page initialization function
     * @param {Object} context - Client script context
     */
    function pageInit(context) {
        try {
            console.log('AI NS Receipt Upload Error page initialized');

            // Focus on the try again button for better UX
            setTimeout(function() {
                const tryAgainButton = document.querySelector('input[onclick*="tryAgain"]');
                if (tryAgainButton) {
                    tryAgainButton.focus();
                }
            }, 100);

            // Expose functions to global scope for onclick handlers
            if (typeof window !== 'undefined') {
                window.tryAgain = tryAgain;
                window.goBack = goBack;
                window.copyErrorDetails = copyErrorDetails;
                window.reportError = reportError;
            }

        } catch (error) {
            console.error('Error initializing error page:', error);
        }
    }

    /**
     * Try uploading again - return to upload form
     */
    function tryAgain() {
        try {
            // Navigate back to the upload form
            const uploadUrl = url.resolveScript({
                scriptId: 'customscript_ains_sl_receiptupload',
                deploymentId: 'customdeploy_ains_sl_receiptupload'
            });

            window.location = uploadUrl;

        } catch (error) {
            console.error('Error navigating to upload form:', error);

            // Fallback - try to go back in history
            if (window.history.length > 1) {
                window.history.back();
            } else {
                // Last resort - reload current page (which should redirect to form)
                window.location.reload();
            }
        }
    }

    /**
     * Go back to previous page
     */
    function goBack() {
        try {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                // Navigate to Employee Center as fallback
                window.location = '/app/center/card.nl?sc=-29';
            }
        } catch (error) {
            console.error('Error going back:', error);
        }
    }

    /**
     * Copy error details to clipboard (if supported)
     */
    function copyErrorDetails() {
        try {
            const errorElements = document.querySelectorAll('.error-message, [id*="error"]');
            let errorText = '';

            errorElements.forEach(function(element) {
                if (element.textContent) {
                    errorText += element.textContent + '\n';
                }
            });

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(errorText).then(function() {
                    alert('Error details copied to clipboard');
                }).catch(function(err) {
                    console.error('Could not copy error details:', err);
                });
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = errorText;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    alert('Error details copied to clipboard');
                } catch (err) {
                    console.error('Could not copy error details:', err);
                    alert('Could not copy error details. Please copy manually.');
                }
                document.body.removeChild(textArea);
            }

        } catch (error) {
            console.error('Error copying error details:', error);
        }
    }

    /**
     * Report error to administrator (placeholder)
     */
    function reportError() {
        try {
            // This could open an email compose window or submit to a support system
            alert('Please contact your system administrator with the error details shown above.');

            // Could potentially implement automatic error reporting here

        } catch (error) {
            console.error('Error reporting error:', error);
        }
    }

    // Return entry point functions for SuiteScript
    return {
        pageInit: pageInit
    };
});