/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @description Common utilities and constants for AI NS Expense Capture system
 */

define(['N/runtime', 'N/log', 'N/url', 'N/query'],
function(runtime, log, url, query) {

    // System constants
    const CONSTANTS = {
        RECORD_TYPES: {
            EXPENSE_CAPTURE: 'customrecord_ains_expense_capture'
        },

        FIELDS: {
            FILE_ATTACHMENT: 'custrecord_ains_file_attachment',
            VENDOR_NAME: 'custrecord_ains_vendor_name',
            EXPENSE_AMOUNT: 'custrecord_ains_expense_amount',
            EXPENSE_DATE: 'custrecord_ains_expense_date',
            EXPENSE_CATEGORY: 'custrecord_ains_expense_category',
            DESCRIPTION: 'custrecord_ains_description',
            PROCESSING_STATUS: 'custrecord_ains_processing_status',
            CREATED_BY: 'custrecord_ains_created_by',
            IMPORTED_TO_ER: 'custrecord_ains_imported_to_er',
            EXPENSE_REPORT_ID: 'custrecord_ains_expense_report_id',
            ERROR_MESSAGE: 'custrecord_ains_error_message',
            RAW_OCR_DATA: 'custrecord_ains_raw_ocr_data',
            LLM_RESPONSE: 'custrecord_ains_llm_response',
            LLM_REQUEST: 'custrecord_ains_llm_request',
            LLM_RAW_RESPONSE: 'custrecord_ains_llm_raw_response',
            CONFIDENCE_SCORE: 'custrecord_ains_confidence_score',
            PROCESSED_DATE: 'custrecord_ains_processed_date',
            FILE_SIZE: 'custrecord_ains_file_size',
            FILE_TYPE: 'custrecord_ains_file_type'
        },

        STATUS: {
            PENDING: 1,
            PROCESSING: 2,
            COMPLETE: 3,
            ERROR: 4
        },

        SCRIPT_IDS: {
            UPLOAD_SUITELET: 'customscript_ains_sl_receiptupload',
            PROCESS_MR: 'customscript_ains_mr_processreceipts',
            IMPORT_MODAL: 'customscript_ains_sl_expenseimportmodal',
            EMPLOYEE_PORTLET: 'customscript_ains_pl_empcentportlet',
            ER_CLIENT_SCRIPT: 'customscript_ains_cs_expensereportimport'
        },

        DEPLOYMENT_IDS: {
            UPLOAD_SUITELET: 'customdeploy_ains_sl_receiptupload',
            PROCESS_MR: 'customdeploy_ains_mr_processreceipts',
            IMPORT_MODAL: 'customdeploy_ains_sl_expenseimportmodal',
            EMPLOYEE_PORTLET: 'customdeploy_ains_pl_empcentportlet',
            ER_CLIENT_SCRIPT: 'customdeploy_ains_cs_expensereportimport'
        },

        SCRIPT_PARAMS: {
            MAX_FILE_SIZE: 'custscript_ains_max_file_size',
            RESULTS_FOLDER_ID: 'custscript_ains_results_folder',
            LLM_MODEL: 'custscript_ains_llm_model',
            CONFIDENCE_THRESHOLD: 'custscript_ains_confidence_threshold',
            AUTO_ASSIGN_CATEGORIES: 'custscript_ains_auto_assign'
        },

        DEFAULT_VALUES: {
            MAX_FILE_SIZE_MB: 10,
            LLM_MODEL: 'command-r',
            CONFIDENCE_THRESHOLD: 0.8,
            AUTO_ASSIGN_CATEGORIES: true
        },

        SUPPORTED_FILE_TYPES: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif']
    };

    /**
     * Get script parameter value with default fallback
     * @param {string} paramName - Parameter name
     * @param {*} defaultValue - Default value if parameter not set
     * @returns {*} Parameter value or default
     */
    function getScriptParameter(paramName, defaultValue) {
        try {
            const script = runtime.getCurrentScript();
            const value = script.getParameter({ name: paramName });
            return value !== null && value !== undefined && value !== '' ? value : defaultValue;
        } catch (error) {
            log.error('getScriptParameter', `Error getting parameter ${paramName}: ${error.message}`);
            return defaultValue;
        }
    }

    /**
     * Generate Enhanced File Security URL for user
     * @param {string|number} employeeId - Employee internal ID
     * @returns {string} Complete URL for Enhanced File Security
     */
    function getEnhancedFileSecurityUrl(employeeId) {
        try {
            const baseUrl = url.resolveDomain({
                hostType: url.HostType.APPLICATION
            });

            return `${baseUrl}/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=Attach+File&reportOwner=${employeeId}&entity=${employeeId}`;
        } catch (error) {
            log.error('getEnhancedFileSecurityUrl', `Error generating URL for employee ${employeeId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate file size against configured limit
     * @param {number} fileSizeBytes - File size in bytes
     * @returns {Object} Validation result {isValid: boolean, message: string}
     */
    function validateFileSize(fileSizeBytes) {
        const maxSizeMB = getScriptParameter(CONSTANTS.SCRIPT_PARAMS.MAX_FILE_SIZE, CONSTANTS.DEFAULT_VALUES.MAX_FILE_SIZE_MB);
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        if (fileSizeBytes <= maxSizeBytes) {
            return { isValid: true, message: 'File size is valid' };
        } else {
            return {
                isValid: false,
                message: `File size (${Math.round(fileSizeBytes / 1024 / 1024)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`
            };
        }
    }

    /**
     * Validate file type against supported types
     * @param {string} fileName - File name with extension
     * @returns {Object} Validation result {isValid: boolean, message: string}
     */
    function validateFileType(fileName) {
        if (!fileName) {
            return { isValid: false, message: 'No file name provided' };
        }

        const extension = fileName.split('.').pop().toLowerCase();

        if (CONSTANTS.SUPPORTED_FILE_TYPES.includes(extension)) {
            return { isValid: true, message: 'File type is supported' };
        } else {
            return {
                isValid: false,
                message: `File type '${extension}' is not supported. Supported types: ${CONSTANTS.SUPPORTED_FILE_TYPES.join(', ').toUpperCase()}`
            };
        }
    }

    /**
     * Get current user information
     * @returns {Object} User details
     */
    function getCurrentUser() {
        try {
            const user = runtime.getCurrentUser();
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                roleId: user.roleId
            };
        } catch (error) {
            log.error('getCurrentUser', `Error getting current user: ${error.message}`);
            throw error;
        }
    }

    /**
     * Format error message for user display
     * @param {Error|string} error - Error object or message
     * @returns {string} Formatted error message
     */
    function formatErrorMessage(error) {
        if (typeof error === 'string') {
            return error;
        }

        if (error && error.message) {
            return error.message;
        }

        return 'An unexpected error occurred. Please try again.';
    }

    /**
     * Log operation with consistent formatting
     * @param {string} operation - Operation name
     * @param {Object} details - Additional details to log
     * @param {string} level - Log level (debug, audit, error)
     */
    function logOperation(operation, details, level = 'audit') {
        const logData = {
            operation: operation,
            timestamp: new Date().toISOString(),
            user: getCurrentUser().id,
            details: details
        };

        log[level]('AI_NS_ExpenseCapture', JSON.stringify(logData));
    }

    /**
     * Check if current user has Employee Center role
     * @returns {boolean} True if Employee Center role
     */
    function isEmployeeCenterRole() {
        try {
            const user = runtime.getCurrentUser();
            const roleId = user.roleId;

            // Employee Center roles typically have specific IDs
            // This may need adjustment based on specific NetSuite configuration
            const employeeCenterRoles = [14, 15, 16, 17]; // Common Employee Center role IDs
            return employeeCenterRoles.includes(parseInt(roleId));
        } catch (error) {
            log.error('isEmployeeCenterRole', `Error checking role: ${error.message}`);
            return false;
        }
    }

    /**
     * Generate unique tracking ID for operations
     * @returns {string} Unique tracking ID
     */
    function generateTrackingId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `AINS_${timestamp}_${random}`;
    }

    /**
     * Validate required fields in data object
     * @param {Object} data - Data object to validate
     * @param {Array} requiredFields - Array of required field names
     * @returns {Object} Validation result {isValid: boolean, missingFields: []}
     */
    function validateRequiredFields(data, requiredFields) {
        const missingFields = [];

        requiredFields.forEach(field => {
            if (!data.hasOwnProperty(field) || data[field] === null || data[field] === undefined || data[field] === '') {
                missingFields.push(field);
            }
        });

        return {
            isValid: missingFields.length === 0,
            missingFields: missingFields
        };
    }

    /**
     * Get available expense categories using SuiteQL for multi-account compatibility
     * @returns {Array} Array of expense category objects {id, name}
     */
    function getExpenseCategories() {
        try {
            const queryString = `
                SELECT id, name, description
                FROM ExpenseCategory
                WHERE isinactive = 'F'
                ORDER BY name
            `;

            const results = query.runSuiteQL({
                query: queryString
            }).asMappedResults();

            const categories = results.map(result => ({
                id: result.id,
                name: result.name,
                description: result.description || ''
            }));

            // Debug logging to see what categories are loaded
            log.debug('getExpenseCategories', `Loaded ${categories.length} categories: ${JSON.stringify(categories)}`);

            return categories;

        } catch (error) {
            log.error('getExpenseCategories', `Error loading expense categories: ${error.message}`);
            return [];
        }
    }

    /**
     * Create progress indicator HTML
     * @param {string} id - Element ID for the progress indicator
     * @returns {string} HTML for progress indicator
     */
    function createProgressIndicator(id) {
        return `
            <div id="${id}" style="display: none;">
                <div style="background: #f0f0f0; border-radius: 10px; padding: 3px; margin: 10px 0;">
                    <div style="background: #007bff; height: 20px; border-radius: 7px; width: 0%; transition: width 0.3s ease;" id="${id}_bar"></div>
                </div>
                <div style="text-align: center; font-size: 12px; color: #666;" id="${id}_text">Processing...</div>
            </div>
        `;
    }

    /**
     * Format currency amount for display
     * @param {number} amount - Amount to format
     * @param {string} currencyCode - Currency code (optional)
     * @returns {string} Formatted currency string
     */
    function formatCurrency(amount, currencyCode = 'USD') {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode
            }).format(amount);
        } catch (error) {
            return `$${amount.toFixed(2)}`;
        }
    }

    /**
     * Format date for display
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date string
     */
    function formatDate(date) {
        try {
            if (typeof date === 'string') {
                date = new Date(date);
            }
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return date.toString();
        }
    }

    /**
     * Get the CSS file content as a string for inline injection
     * @returns {string} CSS content
     */
    function getMasterCSSString() {
        return `
:root { --nsn-uif-redwood-spacing-2-x: 7px; --nsn-uif-redwood-spacing-4-x: 14px; --nsn-uif-redwood-spacing-9-x: 31.5px; --nsn-uif-redwood-size-2-xs: 8px; --nsn-uif-redwood-size-3-xs: 4px; --nsn-uif-redwood-size-s: 16px; --nsn-uif-redwood-color-light-neutral-0: rgb(255, 255, 255); --nsn-uif-redwood-color-light-neutral-10: rgb(251, 249, 248); --nsn-uif-redwood-color-light-brand-100: rgb(34, 126, 158); --nsn-uif-redwood-color-light-brand-120: rgb(54, 103, 125); --nsn-uif-redwood-color-light-brand-130: rgb(50, 92, 114); --nsn-uif-redwood-color-light-text-primary: rgb(22, 21, 19); --nsn-uif-redwood-color-light-text-inverse: rgb(255, 255, 255); --nsn-uif-redwood-color-light-border-enabled: rgba(22, 21, 19, 0.5); --nsn-uif-redwood-color-light-border-divider: rgba(22, 21, 19, 0.12); --nsn-uif-redwood-color-light-border-keyboard-focus: rgb(22, 21, 19); --nsn-uif-redwood-color-light-overlay-hover: rgba(22, 21, 19, 0.08); --nsn-uif-redwood-color-light-overlay-active: rgba(22, 21, 19, 0.16); --nsn-uif-redwood-color-light-overlay-scrim: rgba(22, 21, 19, 0.4); --nsn-uif-redwood-font-size-body-sm: 14px; --nsn-uif-redwood-font-size-body-md: 16px; --nsn-uif-redwood-font-weight-semi-bold: 600; --nsn-uif-redwood-font-weight-bold: 700; --nsn-uif-redwood-border-rounded-corners-mid: 4px; --nsn-uif-redwood-border-rounded-corners: 6px; --nsn-uif-redwood-shadow-medium: 0 6px 12px 0px rgba(0, 0, 0, 0.2); --nsn-uif-redwood-z-index-top-most: 1500; }
.my-app-modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: var(--nsn-uif-redwood-color-light-overlay-scrim); display: flex; justify-content: center; align-items: center; z-index: var(--nsn-uif-redwood-z-index-top-most); }
.my-app-modal-dialog { background-color: var(--nsn-uif-redwood-color-light-neutral-0); border: 1px solid var(--nsn-uif-redwood-color-light-border-divider); border-radius: var(--nsn-uif-redwood-border-rounded-corners); box-shadow: var(--nsn-uif-redwood-shadow-medium); overflow: hidden; min-width: 350px; max-width: 90%; max-height: 90%; display: flex; flex-direction: column; }
.my-app-modal-header { background-color: var(--nsn-uif-redwood-color-light-brand-130); padding: var(--nsn-uif-redwood-size-2-xs) var(--nsn-uif-redwood-size-s); font-size: var(--nsn-uif-redwood-font-size-body-md); font-weight: var(--nsn-uif-redwood-font-weight-bold); color: var(--nsn-uif-redwood-color-light-text-inverse); display: flex; justify-content: space-between; align-items: center; }
.my-app-modal-header .close-button { background: none; border: none; color: var(--nsn-uif-redwood-color-light-text-inverse); font-size: 18px; cursor: pointer; padding: var(--nsn-uif-redwood-size-3-xs); border-radius: var(--nsn-uif-redwood-border-rounded-corners-mid); line-height: 1; }
.my-app-modal-header .close-button:hover { background-color: rgba(255, 255, 255, 0.1); }
.my-app-modal-body { padding: var(--nsn-uif-redwood-size-s); flex-grow: 1; overflow-y: auto; color: var(--nsn-uif-redwood-color-light-text-primary); }
.my-app-modal-footer { display: flex; justify-content: flex-end; padding: var(--nsn-uif-redwood-size-s); border-top: 1px solid var(--nsn-uif-redwood-color-light-border-divider); gap: var(--nsn-uif-redwood-size-s); }
.my-app-button { display: inline-flex; align-items: center; height: var(--nsn-uif-redwood-spacing-9-x); padding: 0 var(--nsn-uif-redwood-spacing-4-x); font-size: var(--nsn-uif-redwood-font-size-body-sm); font-weight: var(--nsn-uif-redwood-font-weight-semi-bold); border-radius: var(--nsn-uif-redwood-border-rounded-corners-mid); cursor: pointer; border: 1px solid var(--nsn-uif-redwood-color-light-border-enabled); background-color: transparent; white-space: nowrap; text-decoration: none; color: var(--nsn-uif-redwood-color-light-text-primary); }
.my-app-button:hover { background-color: var(--nsn-uif-redwood-color-light-overlay-hover); }
.my-app-button-primary { background-color: var(--nsn-uif-redwood-color-light-brand-120); border-color: var(--nsn-uif-redwood-color-light-brand-120); color: var(--nsn-uif-redwood-color-light-text-inverse); }
.my-app-button-primary:hover { background-color: var(--nsn-uif-redwood-color-light-brand-100); border-color: var(--nsn-uif-redwood-color-light-brand-100); }
.my-app-table { border-collapse: collapse; width: 100%; background-color: var(--nsn-uif-redwood-color-light-neutral-0); }
.my-app-table th { font-weight: var(--nsn-uif-redwood-font-weight-semi-bold); text-align: left; border-bottom: 1px solid var(--nsn-uif-redwood-color-light-border-divider); padding: var(--nsn-uif-redwood-size-3-xs) var(--nsn-uif-redwood-size-s); min-height: 28px; color: var(--nsn-uif-redwood-color-light-text-primary); background-color: var(--nsn-uif-redwood-color-light-neutral-10); position: sticky; top: 0; z-index: 1; }
.my-app-table td { border-bottom: 1px solid var(--nsn-uif-redwood-color-light-border-divider); padding: var(--nsn-uif-redwood-size-3-xs) var(--nsn-uif-redwood-size-s); min-height: 28px; color: var(--nsn-uif-redwood-color-light-text-primary); }
.my-app-table tbody tr:hover { background-color: var(--nsn-uif-redwood-color-light-overlay-hover); }
.my-app-table-container { max-height: 400px; overflow-y: auto; border: 1px solid var(--nsn-uif-redwood-color-light-border-divider); border-radius: var(--nsn-uif-redwood-border-rounded-corners); }
        `;
    }

    // Public interface
    return {
        CONSTANTS: CONSTANTS,
        getScriptParameter: getScriptParameter,
        getEnhancedFileSecurityUrl: getEnhancedFileSecurityUrl,
        validateFileSize: validateFileSize,
        validateFileType: validateFileType,
        getCurrentUser: getCurrentUser,
        formatErrorMessage: formatErrorMessage,
        logOperation: logOperation,
        isEmployeeCenterRole: isEmployeeCenterRole,
        generateTrackingId: generateTrackingId,
        validateRequiredFields: validateRequiredFields,
        getExpenseCategories: getExpenseCategories,
        createProgressIndicator: createProgressIndicator,
        formatCurrency: formatCurrency,
        formatDate: formatDate,
        getMasterCSSString: getMasterCSSString
    };
});