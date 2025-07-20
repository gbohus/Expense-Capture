/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @description AI NS|SL|Expense Import Data Provider - Provides available captured expenses as JSON data.
 */

define(['N/query', 'N/runtime', '../Libraries/AINS_LIB_Common'],
function(query, runtime, commonLib) {

    const SCRIPT_NAME = 'AI NS|SL|Expense Import Data Provider';

    /**
     * Main request handler
     * @param {Object} context - Request context
     */
    function onRequest(context) {
        try {
            if (context.request.method === 'GET') {
                const params = context.request.parameters;
                const employeeId = params.employee || commonLib.getCurrentUser().id;

                commonLib.logOperation('onRequest:GET', { employeeId: employeeId });

                const availableExpenses = getAvailableExpenses(employeeId);

                context.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json'
                });
                context.response.write(JSON.stringify(availableExpenses || []));

            } else {
                context.response.write(JSON.stringify({ error: `Unsupported method: ${context.request.method}` }));
            }
        } catch (error) {
            commonLib.logOperation('onRequest', { error: error.message }, 'error');
            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            context.response.write(JSON.stringify({ error: error.message }));
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