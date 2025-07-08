/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/**
 * AI NS Expense Capture - Receipt Upload Client Script
 * Provides client-side functionality for the receipt upload form
 */

define(['N/currentRecord'], function(currentRecord) {
    'use strict';

    /**
     * Page initialization function
     * @param {Object} scriptContext - Client script context
     */
    function pageInit(scriptContext) {
        try {
            console.log('AI NS Receipt Upload form initialized');

            // Add initialization logic specific to NetSuite forms
            initializeUploadForm(scriptContext.currentRecord);

        } catch (error) {
            console.error('Error initializing receipt upload form:', error);
        }
    }

    /**
     * Initialize upload form with NetSuite-specific enhancements
     * @param {Record} currentRec - Current record object
     */
    function initializeUploadForm(currentRec) {
        try {
            // Add any NetSuite-specific initialization here
            // Avoid direct DOM manipulation
            console.log('Upload form initialized');
        } catch (error) {
            console.error('Error initializing upload form:', error);
        }
    }

    /**
     * Field changed event handler
     * @param {Object} scriptContext - Client script context
     */
    function fieldChanged(scriptContext) {
        try {
            const currentRec = scriptContext.currentRecord;
            const fieldId = scriptContext.fieldId;

            // Handle file field changes
            if (fieldId === 'custpage_receipt_file') { // Use proper NetSuite field ID
                handleFileSelection(currentRec);
            }

        } catch (error) {
            console.error('Error in fieldChanged:', error);
        }
    }

    /**
     * Handle file selection for receipt upload
     * @param {Record} currentRec - Current record object
     */
    function handleFileSelection(currentRec) {
        try {
            // Check if file is selected using NetSuite methods
            const fileObj = currentRec.getValue({ fieldId: 'custpage_receipt_file' });

            if (fileObj) {
                console.log('Receipt file selected');
                // Perform any additional validation or processing
                validateFileSelection(fileObj);
            }
        } catch (error) {
            console.error('Error handling file selection:', error);
        }
    }

    /**
     * Validate file selection (server-side validation is still needed)
     * @param {Object} fileObj - File object from NetSuite
     */
    function validateFileSelection(fileObj) {
        try {
            // Note: Client-side file validation in NetSuite is limited
            // Most validation should be done server-side

            if (fileObj && fileObj.name) {
                const fileName = fileObj.name.toLowerCase();
                const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];

                const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

                if (!hasValidExtension) {
                    alert('Please select a valid file type: JPEG, PNG, GIF, or PDF');
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Error validating file:', error);
            return true; // Allow submission if validation fails
        }
    }

    /**
     * Validate form before submission
     * @param {Object} scriptContext - Client script context
     * @returns {boolean} True if validation passes
     */
    function saveRecord(scriptContext) {
        try {
            const currentRec = scriptContext.currentRecord;

            // Check if file is selected
            const fileField = currentRec.getValue({ fieldId: 'custpage_receipt_file' });

            if (!fileField) {
                alert('Please select a receipt file to upload.');
                return false;
            }

            // Additional validation can be added here
            if (!validateFormData(currentRec)) {
                return false;
            }

            // Show loading message
            showProcessingMessage();

            return true;

        } catch (error) {
            console.error('Error in saveRecord validation:', error);
            alert('An error occurred during validation. Please try again.');
            return false;
        }
    }

    /**
     * Validate additional form data
     * @param {Record} currentRec - Current record object
     * @returns {boolean} True if validation passes
     */
    function validateFormData(currentRec) {
        try {
            // Add any additional form validation here
            // Example: Check required fields, validate data formats, etc.

            return true;
        } catch (error) {
            console.error('Error validating form data:', error);
            return false;
        }
    }

    /**
     * Show processing message (NetSuite-compatible approach)
     */
    function showProcessingMessage() {
        try {
            // Use NetSuite's built-in loading message if available
            // Or show a simple alert
            console.log('Processing upload...');

            // Note: For better UX, consider using a Suitelet with AJAX
            // to show proper progress indicators

        } catch (error) {
            console.error('Error showing processing message:', error);
        }
    }

    /**
     * Cancel upload functionality
     * @param {Object} scriptContext - Client script context (optional)
     */
    function cancelUpload(scriptContext) {
        try {
            // Confirm cancellation
            if (confirm('Are you sure you want to cancel the upload?')) {
                // Clear the form or navigate away
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    // Navigate to a safe location
                    window.location = '/app/center/card.nl?sc=-29'; // Employee Center
                }
            }
        } catch (error) {
            console.error('Error during cancel:', error);
            // Fallback navigation
            window.location = '/app/center/card.nl?sc=-29';
        }
    }

    /**
     * Post sourcing event handler (if needed)
     * @param {Object} scriptContext - Client script context
     */
    function postSourcing(scriptContext) {
        try {
            // Handle post-sourcing logic if needed
            console.log('Post sourcing triggered for field:', scriptContext.fieldId);
        } catch (error) {
            console.error('Error in postSourcing:', error);
        }
    }

    // Return the entry points for the client script
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord,
        postSourcing: postSourcing,
        cancelUpload: cancelUpload
    };
});