/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @description AI NS|CS|Expense Report Import - Simple expense import functionality
 */
define(['N/currentRecord', 'N/https', 'N/url', 'N/file', 'N/format', '../Libraries/AINS_LIB_Common'],
    function(currentRecord, https, url, file, format, commonLib) {

    function pageInit(context) {
        // Only add button in create/edit mode
        if (context.mode === 'create' || context.mode === 'edit') {
            loadStyles();
            setTimeout(addImportButton, 500); // Small delay to ensure DOM is ready
        }
    }

    /**
     * Create a Date object that respects NetSuite timezone preferences
     * @param {string} dateString - Date string in YYYY-MM-DD format
     * @returns {Date} Date object in proper timezone
     */
    function createTimezoneAwareDate(dateString) {
        try {
            // Use NetSuite's format module to parse dates properly
            // This respects user/company timezone preferences
            const formattedDate = format.parse({
                value: dateString,
                type: format.Type.DATE
            });

            return formattedDate;

        } catch (error) {
            console.error('Date parsing error:', error.message, 'for date:', dateString);

            // Fallback to manual parsing if format module fails
            const dateParts = dateString.split('-');
            return new Date(
                parseInt(dateParts[0]), // year
                parseInt(dateParts[1]) - 1, // month (0-based)
                parseInt(dateParts[2]) // day
            );
        }
    }

    function loadStyles() {
        // Inject the master CSS
        if (!document.getElementById('ains-styles')) {
            const style = document.createElement('style');
            style.id = 'ains-styles';
            style.textContent = commonLib.getMasterCSSString();
            document.head.appendChild(style);
        }
    }

    function addImportButton() {
        // Find the expense sublist area
        const expenseTable = document.querySelector('[id*="expense"]') ||
                            document.querySelector('.uir-machine-table-container') ||
                            document.querySelector('#main_form');

        if (!expenseTable) return;

        // Check if button already exists
        if (document.getElementById('import_expenses_btn')) return;

        // Create import button
        const button = document.createElement('input');
        button.type = 'button';
        button.id = 'import_expenses_btn';
        button.value = 'Import Captured Expenses';
        button.className = 'uir-button';
        button.style.margin = '5px';
        button.onclick = importCapturedExpenses;

        // Create container and add button
        const buttonContainer = document.createElement('div');
        buttonContainer.style.padding = '10px 0';
        buttonContainer.appendChild(button);

        // Insert before the expense table
        expenseTable.parentNode.insertBefore(buttonContainer, expenseTable);
    }

    function importCapturedExpenses() {
        // Build Suitelet URL
        const suiteletUrl = url.resolveScript({
            scriptId: 'customscript_ains_sl_expenseimportmodal',
            deploymentId: 'customdeploy_ains_sl_expenseimportmodal',
            returnExternalUrl: false
        });

        // Fetch expenses
        https.get.promise({
            url: suiteletUrl
        }).then(function(response) {
            if (response.code === 200) {
                const expenses = JSON.parse(response.body);

                if (!expenses || expenses.length === 0) {
                    alert('No processed expenses available to import.');
                    return;
                }

                // Show selection modal
                showExpenseSelectionModal(expenses);
            } else {
                alert('Error loading expenses. Please try again.');
            }
        }).catch(function(error) {
            alert('Error: ' + error);
        });
    }

    function showExpenseSelectionModal(expenses) {
        // Create modal overlay using CSS classes
        const overlay = document.createElement('div');
        overlay.className = 'my-app-modal-backdrop';
        overlay.id = 'expense-modal-overlay';

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'my-app-modal-dialog';

        // Modal HTML content with CSS classes
        let modalHTML = `
            <div class="my-app-modal-header">
                <h2 style="margin: 0; font-size: 16px; font-weight: 700;">Select Expenses to Import</h2>
                <button class="close-button" id="modal-close-btn">&times;</button>
            </div>
            <div class="my-app-modal-body">
                <div style="margin-bottom: 16px;">
                    <label style="display: inline-flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="select-all-expenses" style="margin-right: 8px; transform: scale(1.2);">
                        Select All (${expenses.length} expenses)
                    </label>
                </div>
                <div class="my-app-table-container">
                    <table class="my-app-table">
                        <thead>
                            <tr>
                                <th>Select</th>
                                <th>Date</th>
                                <th>Vendor</th>
                                <th>Amount</th>
                                <th>Category</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        expenses.forEach((expense, index) => {
            modalHTML += `
                <tr>
                    <td>
                        <label style="display: inline-flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" class="expense-checkbox" data-index="${index}" checked style="margin-right: 8px; transform: scale(1.2);">
                        </label>
                    </td>
                    <td>${expense.date || 'N/A'}</td>
                    <td>${expense.vendorName || 'Unknown'}</td>
                    <td>$${parseFloat(expense.amount || 0).toFixed(2)}</td>
                    <td>${expense.categoryName || 'N/A'}</td>
                    <td><span style="color: #666;">${(expense.description || 'N/A').substring(0, 50)}${(expense.description || '').length > 50 ? '...' : ''}</span></td>
                </tr>
            `;
        });

        modalHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="my-app-modal-footer">
                <button id="cancel-import" class="my-app-button">Cancel</button>
                <button id="import-selected" class="my-app-button my-app-button-primary">Import Selected</button>
            </div>
        `;

        modal.innerHTML = modalHTML;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

                // Event listeners
        document.getElementById('select-all-expenses').addEventListener('change', function(e) {
            const checkboxes = document.querySelectorAll('.expense-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });

        // Close button event listener
        document.getElementById('modal-close-btn').addEventListener('click', function() {
            document.body.removeChild(overlay);
        });

        document.getElementById('cancel-import').addEventListener('click', function() {
            document.body.removeChild(overlay);
        });

        document.getElementById('import-selected').addEventListener('click', function() {
            const selectedExpenses = [];
            const checkboxes = document.querySelectorAll('.expense-checkbox:checked');

            checkboxes.forEach(cb => {
                const index = parseInt(cb.getAttribute('data-index'));
                selectedExpenses.push(expenses[index]);
            });

            if (selectedExpenses.length === 0) {
                alert('Please select at least one expense to import.');
                return;
            }

            document.body.removeChild(overlay);
            addExpensesToReport(selectedExpenses);
        });

        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }

    function addExpensesToReport(expenses) {
        const rec = currentRecord.get();
        let addedCount = 0;

        try {
            expenses.forEach(expense => {
                rec.selectNewLine({ sublistId: 'expense' });

                                if (expense.date) {
                    // Use NetSuite timezone-aware date creation
                    // This respects user/company timezone preferences
                    const timezoneAwareDate = createTimezoneAwareDate(expense.date);

                    rec.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'expensedate',
                        value: timezoneAwareDate
                    });
                }

                if (expense.categoryId) {
                    rec.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'category',
                        value: expense.categoryId
                    });
                }

                if (expense.amount) {
                    rec.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'amount',
                        value: expense.amount
                    });
                }

                if (expense.description || expense.vendorName) {
                    rec.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'memo',
                        value: expense.description || expense.vendorName
                    });
                }

                                                                                // Set file attachment using file ID from custom record
                if (expense.fileId) {
                    try {
                        const fileIdValue = parseInt(expense.fileId);
                        console.log('Setting expmediaitem with value:', fileIdValue, 'type:', typeof fileIdValue);

                        rec.setCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: 'expmediaitem',
                            value: fileIdValue
                        });

                        // Immediately check if it was set
                        const setValue = rec.getCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: 'expmediaitem'
                        });
                        console.log('Value immediately after setting:', setValue);

                    } catch (error) {
                        console.error('Could not set file attachment:', error.message);
                    }
                }

                rec.commitLine({ sublistId: 'expense' });

                                                // Verify file attachment was committed
                if (expense.fileId) {
                    try {
                        const attachmentValue = rec.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'expmediaitem',
                            line: addedCount
                        });
                        console.log('Post-commit expmediaitem value:', attachmentValue);
                        console.log('Post-commit value type:', typeof attachmentValue);
                        console.log('Expected file ID:', expense.fileId);
                        console.log('Values match:', attachmentValue == expense.fileId);
                    } catch (error) {
                        console.error('Could not verify file attachment:', error.message);
                    }
                }

                addedCount++;
            });

            alert(`Successfully imported ${addedCount} expense(s)!`);

        } catch (error) {
            alert('Error adding expenses: ' + error.message);
        }
    }

    return {
        pageInit: pageInit
    };
});