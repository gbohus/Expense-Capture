/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @description AI NS|SL|Expense Import Modal - Modal interface for selecting captured expenses to import
 */

define(['N/ui/serverWidget', 'N/query', 'N/record', 'N/runtime', 'N/format', '../Libraries/AINS_LIB_Common'],
function(ui, query, record, runtime, format, commonLib) {

    const SCRIPT_NAME = 'AI NS|SL|Expense Import Modal';

    /**
     * Main request handler
     * @param {Object} context - Request context
     */
    function onRequest(context) {
        try {
            if (context.request.method === 'GET') {
                return renderSelectionModal(context);
            } else if (context.request.method === 'POST') {
                return processSelection(context);
            }
        } catch (error) {
            commonLib.logOperation('onRequest', { error: error.message }, 'error');
            throw error;
        }
    }

    /**
     * Render the expense selection modal
     * @param {Object} context - Request context
     */
    function renderSelectionModal(context) {
        try {
            const params = context.request.parameters;
            const employeeId = params.employee || commonLib.getCurrentUser().id;
            const expenseReportId = params.expenseReport;

            commonLib.logOperation('renderSelectionModal', {
                employeeId: employeeId,
                expenseReportId: expenseReportId
            });

            // Create form
            const form = ui.createForm({
                title: 'Import Captured Expenses'
            });

            // Add client script for modal behavior
            form.clientScriptModulePath = './AINS_CS_ImportModalClient.js';

            // Add hidden fields for parameters
            const employeeField = form.addField({
                id: 'custpage_employee_id',
                type: ui.FieldType.TEXT,
                label: 'Employee ID'
            });
            employeeField.updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });
            employeeField.defaultValue = employeeId;

            const erField = form.addField({
                id: 'custpage_expense_report_id',
                type: ui.FieldType.TEXT,
                label: 'Expense Report ID'
            });
            erField.updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });
            erField.defaultValue = expenseReportId || '';

            // Get available expenses for this employee
            const availableExpenses = getAvailableExpenses(employeeId);

            if (!availableExpenses || availableExpenses.length === 0) {
                // No expenses available
                const messageField = form.addField({
                    id: 'custpage_no_expenses_msg',
                    type: ui.FieldType.INLINEHTML,
                    label: 'Message'
                });
                messageField.defaultValue = `
                    <div style="text-align: center; padding: 20px;">
                        <h3>No Captured Expenses Available</h3>
                        <p>You don't have any processed expense receipts available for import.</p>
                        <p>Please upload and process some receipts first using the Receipt Upload feature.</p>
                        <br/>
                        <button type="button" onclick="window.close();">Close</button>
                    </div>
                `;
                context.response.writePage(form);
                return;
            }

            // Create sublist for expense selection
            const sublist = form.addSublist({
                id: 'custpage_expenses_sublist',
                type: ui.SublistType.LIST,
                label: `Available Expenses (${availableExpenses.length})`
            });

            // Add selection checkbox column
            sublist.addField({
                id: 'custpage_select',
                type: ui.FieldType.CHECKBOX,
                label: 'Select'
            });

            // Add expense data columns
            sublist.addField({
                id: 'custpage_expense_id',
                type: ui.FieldType.TEXT,
                label: 'ID'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'custpage_vendor',
                type: ui.FieldType.TEXT,
                label: 'Vendor'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });

            sublist.addField({
                id: 'custpage_amount',
                type: ui.FieldType.CURRENCY,
                label: 'Amount'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });

            sublist.addField({
                id: 'custpage_date',
                type: ui.FieldType.DATE,
                label: 'Date'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });

            sublist.addField({
                id: 'custpage_category',
                type: ui.FieldType.TEXT,
                label: 'Category'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });

            sublist.addField({
                id: 'custpage_description',
                type: ui.FieldType.TEXT,
                label: 'Description'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });

            sublist.addField({
                id: 'custpage_confidence',
                type: ui.FieldType.PERCENT,
                label: 'Confidence'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });

            sublist.addField({
                id: 'custpage_file_id',
                type: ui.FieldType.TEXT,
                label: 'File ID'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'custpage_category_id',
                type: ui.FieldType.TEXT,
                label: 'Category ID'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            // Populate sublist with expense data
            availableExpenses.forEach((expense, index) => {
                sublist.setSublistValue({
                    id: 'custpage_expense_id',
                    line: index,
                    value: expense.id
                });

                sublist.setSublistValue({
                    id: 'custpage_vendor',
                    line: index,
                    value: expense.vendorName || 'Unknown'
                });

                sublist.setSublistValue({
                    id: 'custpage_amount',
                    line: index,
                    value: expense.amount || 0
                });

                sublist.setSublistValue({
                    id: 'custpage_date',
                    line: index,
                    value: expense.date || new Date()
                });

                sublist.setSublistValue({
                    id: 'custpage_category',
                    line: index,
                    value: expense.categoryName || 'Uncategorized'
                });

                sublist.setSublistValue({
                    id: 'custpage_description',
                    line: index,
                    value: expense.description || expense.vendorName || 'No description'
                });

                sublist.setSublistValue({
                    id: 'custpage_confidence',
                    line: index,
                    value: (expense.confidenceScore || 0) * 100
                });

                sublist.setSublistValue({
                    id: 'custpage_file_id',
                    line: index,
                    value: expense.fileId || ''
                });

                sublist.setSublistValue({
                    id: 'custpage_category_id',
                    line: index,
                    value: expense.categoryId || ''
                });
            });

            // Add action buttons
            form.addSubmitButton({
                label: 'Import Selected'
            });

            form.addButton({
                id: 'custpage_select_all',
                label: 'Select All',
                functionName: 'selectAllExpenses'
            });

            form.addButton({
                id: 'custpage_select_none',
                label: 'Clear All',
                functionName: 'clearAllExpenses'
            });

            form.addButton({
                id: 'custpage_cancel',
                label: 'Cancel',
                functionName: 'closeModal'
            });

            // Add modal styling and JavaScript
            const styleField = form.addField({
                id: 'custpage_modal_style',
                type: ui.FieldType.INLINEHTML,
                label: 'Style'
            });
            styleField.defaultValue = getModalStyling();

            context.response.writePage(form);

        } catch (error) {
            commonLib.logOperation('renderSelectionModal', { error: error.message }, 'error');
            throw error;
        }
    }

    /**
     * Process selected expenses and return data to parent window
     * @param {Object} context - Request context
     */
    function processSelection(context) {
        try {
            const params = context.request.parameters;
            const expenseReportId = params.custpage_expense_report_id;
            const lineCount = parseInt(params.custpage_expenses_sublist_splits) || 0;

            const selectedExpenses = [];

            // Process selected lines
            for (let i = 0; i < lineCount; i++) {
                const isSelected = params[`custpage_expenses_sublist_custpage_select_${i}`] === 'T';

                if (isSelected) {
                    const expense = {
                        id: params[`custpage_expenses_sublist_custpage_expense_id_${i}`],
                        vendorName: params[`custpage_expenses_sublist_custpage_vendor_${i}`],
                        amount: parseFloat(params[`custpage_expenses_sublist_custpage_amount_${i}`] || 0),
                        date: params[`custpage_expenses_sublist_custpage_date_${i}`],
                        categoryId: params[`custpage_expenses_sublist_custpage_category_id_${i}`],
                        description: params[`custpage_expenses_sublist_custpage_description_${i}`],
                        fileId: params[`custpage_expenses_sublist_custpage_file_id_${i}`]
                    };
                    selectedExpenses.push(expense);
                }
            }

            commonLib.logOperation('processSelection', {
                selectedCount: selectedExpenses.length,
                totalCount: lineCount,
                expenseReportId: expenseReportId
            });

            // Update captured expense records to mark as imported
            if (selectedExpenses.length > 0 && expenseReportId && expenseReportId !== 'new') {
                updateImportedStatus(selectedExpenses, expenseReportId);
            }

            // Return success page with JavaScript to communicate with parent
            const form = ui.createForm({
                title: 'Import Processing'
            });

            const resultField = form.addField({
                id: 'custpage_result',
                type: ui.FieldType.INLINEHTML,
                label: 'Result'
            });

            resultField.defaultValue = generateResultPage(selectedExpenses);

            context.response.writePage(form);

        } catch (error) {
            commonLib.logOperation('processSelection', { error: error.message }, 'error');
            throw error;
        }
    }

    /**
     * Get available captured expenses for the employee using N/query
     * @param {string} employeeId - Employee internal ID
     * @returns {Array} Array of available expense objects
     */
    function getAvailableExpenses(employeeId) {
        try {
            const queryString = `
                SELECT
                    ec.id,
                    ec.${commonLib.CONSTANTS.FIELDS.VENDOR_NAME} as vendorName,
                    ec.${commonLib.CONSTANTS.FIELDS.EXPENSE_AMOUNT} as amount,
                    ec.${commonLib.CONSTANTS.FIELDS.EXPENSE_DATE} as date,
                    ec.${commonLib.CONSTANTS.FIELDS.EXPENSE_CATEGORY} as categoryId,
                    cat.name as categoryName,
                    ec.${commonLib.CONSTANTS.FIELDS.DESCRIPTION} as description,
                    ec.${commonLib.CONSTANTS.FIELDS.CONFIDENCE_SCORE} as confidenceScore,
                    ec.${commonLib.CONSTANTS.FIELDS.FILE_ATTACHMENT} as fileId,
                    ec.${commonLib.CONSTANTS.FIELDS.PROCESSING_STATUS} as status
                FROM
                    ${commonLib.CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE} ec
                LEFT JOIN
                    ExpenseCategory cat ON ec.${commonLib.CONSTANTS.FIELDS.EXPENSE_CATEGORY} = cat.id
                WHERE
                    ec.${commonLib.CONSTANTS.FIELDS.CREATED_BY} = ?
                    AND ec.${commonLib.CONSTANTS.FIELDS.PROCESSING_STATUS} = ?
                    AND (ec.${commonLib.CONSTANTS.FIELDS.IMPORTED_TO_ER} IS NULL OR ec.${commonLib.CONSTANTS.FIELDS.IMPORTED_TO_ER} = 'F')
                ORDER BY
                    ec.${commonLib.CONSTANTS.FIELDS.EXPENSE_DATE} DESC
            `;

            const queryResult = query.runSuiteQL({
                query: queryString,
                params: [employeeId, commonLib.CONSTANTS.STATUS.COMPLETE]
            });

            const expenses = [];
            queryResult.results.forEach(result => {
                expenses.push({
                    id: result.values[0],
                    vendorName: result.values[1],
                    amount: parseFloat(result.values[2] || 0),
                    date: result.values[3],
                    categoryId: result.values[4],
                    categoryName: result.values[5],
                    description: result.values[6],
                    confidenceScore: parseFloat(result.values[7] || 0),
                    fileId: result.values[8],
                    status: result.values[9]
                });
            });

            commonLib.logOperation('getAvailableExpenses', {
                employeeId: employeeId,
                expenseCount: expenses.length
            });

            return expenses;

        } catch (error) {
            commonLib.logOperation('getAvailableExpenses', {
                employeeId: employeeId,
                error: error.message
            }, 'error');
            return [];
        }
    }

    /**
     * Update imported status for selected expenses using N/query
     * @param {Array} expenses - Selected expense objects
     * @param {string} expenseReportId - Expense report ID
     */
    function updateImportedStatus(expenses, expenseReportId) {
        try {
            expenses.forEach(expense => {
                try {
                    const expenseRecord = record.load({
                        type: commonLib.CONSTANTS.RECORD_TYPES.EXPENSE_CAPTURE,
                        id: expense.id
                    });

                    expenseRecord.setValue({
                        fieldId: commonLib.CONSTANTS.FIELDS.IMPORTED_TO_ER,
                        value: true
                    });

                    if (expenseReportId && expenseReportId !== 'new') {
                        expenseRecord.setValue({
                            fieldId: commonLib.CONSTANTS.FIELDS.EXPENSE_REPORT_ID,
                            value: expenseReportId
                        });
                    }

                    expenseRecord.save();

                } catch (updateError) {
                    commonLib.logOperation('updateImportedStatus', {
                        expenseId: expense.id,
                        error: updateError.message
                    }, 'error');
                }
            });

            commonLib.logOperation('updateImportedStatus', {
                updatedCount: expenses.length,
                expenseReportId: expenseReportId
            });

        } catch (error) {
            commonLib.logOperation('updateImportedStatus', { error: error.message }, 'error');
        }
    }

    /**
     * Generate modal styling CSS
     * @returns {string} CSS styling for modal
     */
    function getModalStyling() {
        return `
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 10px;
                }
                .uir-page-title {
                    background: #4CAF50;
                    color: white;
                    padding: 10px;
                    margin: -10px -10px 10px -10px;
                }
                .uir-sublist-table {
                    border: 1px solid #ddd;
                    border-collapse: collapse;
                    width: 100%;
                }
                .uir-sublist-table th,
                .uir-sublist-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .uir-sublist-table th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                .uir-sublist-table tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .uir-sublist-table tr:hover {
                    background-color: #f5f5f5;
                }
                .button-container {
                    text-align: center;
                    margin-top: 15px;
                    padding: 10px;
                    border-top: 1px solid #ddd;
                }
                input[type="button"], input[type="submit"] {
                    margin: 0 5px;
                    padding: 8px 16px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                input[type="button"]:hover, input[type="submit"]:hover {
                    background-color: #45a049;
                }
                .cancel-button {
                    background-color: #f44336 !important;
                }
                .cancel-button:hover {
                    background-color: #da190b !important;
                }
            </style>
            <script>
                function selectAllExpenses() {
                    const checkboxes = document.querySelectorAll('input[name*="custpage_select"]');
                    checkboxes.forEach(cb => cb.checked = true);
                }

                function clearAllExpenses() {
                    const checkboxes = document.querySelectorAll('input[name*="custpage_select"]');
                    checkboxes.forEach(cb => cb.checked = false);
                }

                function closeModal() {
                    window.close();
                }
            </script>
        `;
    }

    /**
     * Generate result page with communication back to parent window
     * @param {Array} selectedExpenses - Selected expense objects
     * @returns {string} HTML content for result page
     */
    function generateResultPage(selectedExpenses) {
        const expenseData = JSON.stringify(selectedExpenses).replace(/"/g, '&quot;');

        return `
            <div style="text-align: center; padding: 20px;">
                <h3>Processing Import...</h3>
                <p>${selectedExpenses.length} expense(s) selected for import.</p>
                <script>
                    if (window.opener && window.opener.postMessage) {
                        window.opener.postMessage({
                            action: 'importExpenses',
                            expenses: ${JSON.stringify(selectedExpenses)}
                        }, '*');
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    } else {
                        document.write('<p>Unable to communicate with parent window. Please close this window manually.</p>');
                    }
                </script>
            </div>
        `;
    }

    // Return public interface
    return {
        onRequest: onRequest
    };
});