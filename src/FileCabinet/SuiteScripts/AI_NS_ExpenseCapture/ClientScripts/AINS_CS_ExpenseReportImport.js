/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @description AI NS|CS|Expense Report Import - Simple expense import functionality
 */
define(['N/currentRecord', 'N/https', 'N/url'], function(currentRecord, https, url) {

    function pageInit(context) {
        // Only add button in create/edit mode
        if (context.mode === 'create' || context.mode === 'edit') {
            setTimeout(addImportButton, 500); // Small delay to ensure DOM is ready
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

                // Simple confirmation
                let message = `Found ${expenses.length} expense(s) to import:\n\n`;
                expenses.slice(0, 5).forEach(exp => {
                    message += `• ${exp.vendorName || 'Unknown'} - $${exp.amount || '0'}\n`;
                });
                if (expenses.length > 5) {
                    message += `... and ${expenses.length - 5} more\n`;
                }
                message += '\nImport all expenses?';

                if (confirm(message)) {
                    addExpensesToReport(expenses);
                }
            } else {
                alert('Error loading expenses. Please try again.');
            }
        }).catch(function(error) {
            alert('Error: ' + error);
        });
    }

    function addExpensesToReport(expenses) {
        const rec = currentRecord.get();
        let addedCount = 0;

        try {
            expenses.forEach(expense => {
                rec.selectNewLine({ sublistId: 'expense' });

                if (expense.date) {
                    rec.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'expensedate',
                        value: new Date(expense.date)
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

                if (expense.fileId) {
                    rec.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'receipt',
                        value: expense.fileId
                    });
                }

                rec.commitLine({ sublistId: 'expense' });
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