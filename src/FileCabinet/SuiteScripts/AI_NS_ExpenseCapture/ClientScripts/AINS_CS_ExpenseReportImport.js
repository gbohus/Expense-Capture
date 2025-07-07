/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @description AI NS|CS|Expense Report Import - Adds import functionality to Expense Reports
 */

define(['N/currentRecord', 'N/ui/dialog', 'N/url', 'N/query', '../Libraries/AINS_LIB_Common'],
function(currentRecord, dialog, url, query, commonLib) {

    const SCRIPT_NAME = 'AI NS|CS|Expense Report Import';

    /**
     * Executed when the page is loaded
     * @param {Object} context - Script context
     */
    function pageInit(context) {
        try {
            commonLib.logOperation('pageInit', {
                mode: context.mode,
                recordType: context.currentRecord.type
            });

            // Only add button in edit/create mode for expense reports
            if (context.mode !== 'create' && context.mode !== 'edit') {
                return;
            }

            // Add the import button
            addImportButton();

        } catch (error) {
            console.error('Error in pageInit:', error);
            commonLib.logOperation('pageInit', { error: error.message }, 'error');
        }
    }

    /**
     * Add the Import Captured Expenses button to the form
     */
    function addImportButton() {
        try {
            // Check if button already exists
            if (document.getElementById('custpage_import_expenses_btn')) {
                return;
            }

            // Find the expense line tab or a suitable location to add the button
            const expenseLineTab = findExpenseLineTab();
            if (!expenseLineTab) {
                commonLib.logOperation('addImportButton', { warning: 'Could not find expense line tab' });
                return;
            }

            // Create the import button
            const importButton = document.createElement('input');
            importButton.type = 'button';
            importButton.id = 'custpage_import_expenses_btn';
            importButton.value = 'Import Captured Expenses';
            importButton.className = 'rndrctrl_button';
            importButton.style.marginLeft = '10px';
            importButton.onclick = openImportModal;

            // Insert button near expense lines
            const buttonContainer = document.createElement('div');
            buttonContainer.style.margin = '10px 0';
            buttonContainer.appendChild(importButton);

            expenseLineTab.insertBefore(buttonContainer, expenseLineTab.firstChild);

            commonLib.logOperation('addImportButton', { success: 'Import button added successfully' });

        } catch (error) {
            console.error('Error adding import button:', error);
            commonLib.logOperation('addImportButton', { error: error.message }, 'error');
        }
    }

    /**
     * Find the expense line tab or suitable container
     * @returns {Element} Element to attach button to
     */
    function findExpenseLineTab() {
        // Try different selectors to find expense lines section
        const selectors = [
            '[id*="expense"]',
            '[id*="line"]',
            '.uir-page-title-secondline',
            '#main_form'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }

        return document.body; // Fallback
    }

    /**
     * Open the import modal window
     */
    function openImportModal() {
        try {
            const currentRec = currentRecord.get();
            const employeeId = currentRec.getValue('entity') || commonLib.getCurrentUser().id;

            // Build modal URL with parameters
            const modalUrl = url.resolveScript({
                scriptId: commonLib.CONSTANTS.SCRIPT_IDS.IMPORT_MODAL,
                deploymentId: commonLib.CONSTANTS.SCRIPT_IDS.IMPORT_MODAL,
                params: {
                    employee: employeeId,
                    expenseReport: currentRec.id || 'new'
                }
            });

            // Open modal window
            const modalWindow = window.open(
                modalUrl,
                'importExpensesModal',
                'width=900,height=700,scrollbars=yes,resizable=yes,centerscreen=yes'
            );

            if (!modalWindow) {
                dialog.alert({
                    title: 'Popup Blocked',
                    message: 'Please allow popups for this site to use the import feature.'
                });
                return;
            }

            // Set up message listener for modal communication
            window.addEventListener('message', handleModalMessage, false);

            commonLib.logOperation('openImportModal', {
                employeeId: employeeId,
                expenseReportId: currentRec.id
            });

        } catch (error) {
            console.error('Error opening import modal:', error);
            dialog.alert({
                title: 'Error',
                message: 'Failed to open import modal: ' + commonLib.formatErrorMessage(error)
            });
            commonLib.logOperation('openImportModal', { error: error.message }, 'error');
        }
    }

    /**
     * Handle messages from the import modal
     * @param {MessageEvent} event - Message event from modal
     */
    function handleModalMessage(event) {
        try {
            if (event.data && event.data.action === 'importExpenses') {
                const selectedExpenses = event.data.expenses;

                if (selectedExpenses && selectedExpenses.length > 0) {
                    importSelectedExpenses(selectedExpenses);
                }

                // Close modal
                event.source.close();
            }
        } catch (error) {
            console.error('Error handling modal message:', error);
            commonLib.logOperation('handleModalMessage', { error: error.message }, 'error');
        }
    }

    /**
     * Import selected expenses into the current expense report
     * @param {Array} expenses - Array of expense data objects
     */
    function importSelectedExpenses(expenses) {
        try {
            const currentRec = currentRecord.get();
            let importedCount = 0;
            let errorCount = 0;

            commonLib.logOperation('importSelectedExpenses', {
                expenseCount: expenses.length,
                expenseReportId: currentRec.id
            });

            // Process each selected expense
            expenses.forEach((expense, index) => {
                try {
                    // Add new expense line
                    const lineNum = currentRec.getLineCount('expense');
                    currentRec.insertLine({
                        sublistId: 'expense',
                        line: lineNum
                    });

                    // Set line values from captured expense data
                    currentRec.setSublistValue({
                        sublistId: 'expense',
                        fieldId: 'category',
                        line: lineNum,
                        value: expense.categoryId
                    });

                    currentRec.setSublistValue({
                        sublistId: 'expense',
                        fieldId: 'amount',
                        line: lineNum,
                        value: expense.amount
                    });

                    currentRec.setSublistValue({
                        sublistId: 'expense',
                        fieldId: 'expensedate',
                        line: lineNum,
                        value: expense.date
                    });

                    currentRec.setSublistValue({
                        sublistId: 'expense',
                        fieldId: 'memo',
                        line: lineNum,
                        value: expense.description || expense.vendorName
                    });

                    // Set receipt attachment if available
                    if (expense.fileId) {
                        currentRec.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'receipt',
                            line: lineNum,
                            value: expense.fileId
                        });
                    }

                    // Commit the line
                    currentRec.commitLine({ sublistId: 'expense' });
                    importedCount++;

                } catch (lineError) {
                    console.error(`Error importing expense ${index}:`, lineError);
                    errorCount++;
                }
            });

            // Show success/error message
            const message = `Import completed: ${importedCount} expenses imported`;
            const fullMessage = errorCount > 0 ?
                `${message}, ${errorCount} errors encountered` : message;

            dialog.alert({
                title: 'Import Results',
                message: fullMessage
            });

            commonLib.logOperation('importSelectedExpenses', {
                importedCount: importedCount,
                errorCount: errorCount
            });

            // Update captured expense records to mark as imported
            updateCapturedExpenseRecords(expenses);

        } catch (error) {
            console.error('Error importing expenses:', error);
            dialog.alert({
                title: 'Import Error',
                message: 'Failed to import expenses: ' + commonLib.formatErrorMessage(error)
            });
            commonLib.logOperation('importSelectedExpenses', { error: error.message }, 'error');
        }
    }

    /**
     * Update captured expense records to mark them as imported
     * @param {Array} expenses - Array of imported expense objects
     */
    function updateCapturedExpenseRecords(expenses) {
        try {
            // This would typically be done via a server-side call
            // For now, we'll log the action and rely on the modal to handle updates
            const expenseIds = expenses.map(exp => exp.id);

            commonLib.logOperation('updateCapturedExpenseRecords', {
                action: 'mark_as_imported',
                expenseIds: expenseIds
            });

            // Note: In a production environment, you might want to make a server-side call
            // to update the captured expense records with imported status and ER reference

        } catch (error) {
            console.error('Error updating captured expense records:', error);
            commonLib.logOperation('updateCapturedExpenseRecords', { error: error.message }, 'error');
        }
    }

    /**
     * Validate before save
     * @param {Object} context - Script context
     * @returns {boolean} True to allow save, false to prevent
     */
    function saveRecord(context) {
        try {
            // Perform any necessary validation before saving
            commonLib.logOperation('saveRecord', {
                mode: context.currentRecord.getValue('tranid') || 'new'
            });

            return true;
        } catch (error) {
            console.error('Error in saveRecord:', error);
            commonLib.logOperation('saveRecord', { error: error.message }, 'error');
            return true; // Don't block save due to script errors
        }
    }

    // Return public functions
    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };
});