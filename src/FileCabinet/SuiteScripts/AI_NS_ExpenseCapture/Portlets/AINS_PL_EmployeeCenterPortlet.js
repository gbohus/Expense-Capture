/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 * @NModuleScope SameAccount
 * @description Employee Center portlet for AI NS Expense Capture system
 */

define(['N/ui/serverWidget', 'N/runtime', 'N/query', 'N/url', 'N/format',
        '../Libraries/AINS_LIB_Common'],
function(ui, runtime, query, url, format, commonLib) {

    const CONSTANTS = commonLib.CONSTANTS;

    /**
     * Definition of the Portlet script trigger point.
     * @param {Object} params
     * @param {Portlet} params.portlet - The portlet object used for rendering
     * @param {number} params.column - Specifies whether portlet is in left (1), center (2) or right (3) column of the dashboard
     * @param {string} params.entity - (For custom portlets only) references the customer ID for the selected customer
     */
    function render(params) {
        const portlet = params.portlet;
        portlet.title = 'AI Expense Receipt Capture';

        try {
            const currentUser = commonLib.getCurrentUser();

            commonLib.logOperation('portlet_render_start', {
                userId: currentUser.id,
                column: params.column
            });

            // Get user's recent uploads
            const recentUploads = getUserRecentUploads(currentUser.id);
            const stats = calculateUserStats(recentUploads);

            // Create and set main content
            portlet.html = createPortletContent(currentUser, recentUploads, stats);

            commonLib.logOperation('portlet_render_success', {
                userId: currentUser.id,
                recentCount: recentUploads.length,
                stats: stats
            });

        } catch (error) {
            commonLib.logOperation('portlet_render_error', {
                error: error.message
            }, 'error');

            // Show error in portlet
            portlet.html = createErrorContent(error);
        }
    }

    /**
     * Get user's recent expense capture uploads using SuiteQL
     * @param {string} userId - User ID
     * @returns {Array} Array of recent uploads
     */
    function getUserRecentUploads(userId) {
        try {
            const suiteQL = `
                SELECT
                    internalid,
                    custrecord_ains_vendor_name,
                    custrecord_ains_expense_amount,
                    custrecord_ains_expense_date,
                    custrecord_ains_processing_status,
                    custrecord_ains_confidence_score,
                    custrecord_ains_imported_to_er,
                    created,
                    custrecord_ains_file_type
                FROM customrecord_ains_expense_capture
                WHERE createdby = ?
                AND isinactive = 'F'
                ORDER BY created DESC
                LIMIT 10
            `;

            const results = query.runSuiteQL({
                query: suiteQL,
                params: [userId]
            }).results;

            return results.map(result => ({
                id: result.values[0],
                vendor: result.values[1] || 'Processing...',
                amount: result.values[2] || 0,
                date: result.values[3],
                status: result.values[4],
                confidence: result.values[5] || 0,
                imported: result.values[6] === 'T',
                created: result.values[7],
                fileType: result.values[8] || 'unknown'
            }));

        } catch (error) {
            commonLib.logOperation('get_recent_uploads_error', {
                userId: userId,
                error: error.message
            }, 'error');

            return [];
        }
    }

    /**
     * Calculate user statistics
     * @param {Array} uploads - User uploads
     * @returns {Object} Statistics object
     */
    function calculateUserStats(uploads) {
        const stats = {
            total: uploads.length,
            pending: 0,
            processing: 0,
            complete: 0,
            error: 0,
            imported: 0,
            totalAmount: 0,
            avgConfidence: 0,
            recentActivity: uploads.length > 0 ? uploads[0].created : null
        };

        if (uploads.length === 0) {
            return stats;
        }

        let confidenceSum = 0;
        let confidenceCount = 0;

        uploads.forEach(upload => {
            // Count by status
            switch (upload.status) {
                case CONSTANTS.STATUS.PENDING:
                    stats.pending++;
                    break;
                case CONSTANTS.STATUS.PROCESSING:
                    stats.processing++;
                    break;
                case CONSTANTS.STATUS.COMPLETE:
                    stats.complete++;
                    break;
                case CONSTANTS.STATUS.ERROR:
                    stats.error++;
                    break;
            }

            // Count imported
            if (upload.imported) {
                stats.imported++;
            }

            // Sum amounts and confidence
            if (upload.amount) {
                stats.totalAmount += parseFloat(upload.amount);
            }

            if (upload.confidence && upload.confidence > 0) {
                confidenceSum += parseFloat(upload.confidence);
                confidenceCount++;
            }
        });

        // Calculate average confidence
        if (confidenceCount > 0) {
            stats.avgConfidence = confidenceSum / confidenceCount;
        }

        return stats;
    }

    /**
     * Create main portlet content
     * @param {Object} user - Current user
     * @param {Array} uploads - Recent uploads
     * @param {Object} stats - User statistics
     * @returns {string} HTML content
     */
    function createPortletContent(user, uploads, stats) {
        const uploadUrl = getUploadSuiteletUrl();

        return `
            <div class="ains-portlet-container">
                ${createHeaderSection(user, uploadUrl)}
                ${createStatsSection(stats)}
                ${createRecentUploadsSection(uploads)}
                ${createActionSection(uploadUrl)}
            </div>

            <style>
                .ains-portlet-container {
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .ains-header {
                    background: #325C72;
                    color: white;
                    padding: 16px;
                    border-radius: 4px 4px 0 0;
                    text-align: center;
                }

                .ains-stats {
                    display: flex;
                    justify-content: space-around;
                    background: #f8f9fa;
                    padding: 16px;
                    border-left: 1px solid #325C72;
                    border-right: 1px solid #325C72;
                    border-bottom: 1px solid #e9ecef;
                }

                .ains-stat {
                    text-align: center;
                    flex: 1;
                    padding: 4px;
                }

                .ains-stat-number {
                    font-size: 20px;
                    font-weight: bold;
                    color: #325C72;
                    margin-bottom: 4px;
                }

                .ains-stat-label {
                    font-size: 11px;
                    color: #666;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .ains-recent {
                    max-height: 220px;
                    overflow-y: auto;
                    border: 1px solid #325C72;
                    background: white;
                }

                .ains-upload-item {
                    padding: 12px 16px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 14px;
                }

                .ains-upload-item:hover {
                    background: #f0f6f8;
                }

                .ains-upload-info {
                    flex: 1;
                }

                .ains-upload-vendor {
                    font-weight: bold;
                    color: #325C72;
                    font-size: 15px;
                }

                .ains-upload-amount {
                    color: #2d5266;
                    font-weight: bold;
                    font-size: 14px;
                }

                .ains-upload-meta {
                    font-size: 12px;
                    color: #666;
                    margin-top: 4px;
                }

                .ains-status {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                }

                .status-pending { background: #fff3cd; color: #856404; }
                .status-processing { background: #dbeafe; color: #325C72; }
                .status-complete { background: #d4edda; color: #155724; }
                .status-error { background: #f8d7da; color: #721c24; }

                .ains-actions {
                    background: #f8f9fa;
                    padding: 16px;
                    border-radius: 0 0 4px 4px;
                    border: 1px solid #325C72;
                    border-top: none;
                    text-align: center;
                }

                .ains-btn {
                    display: inline-block;
                    padding: 10px 20px;
                    margin: 0 4px;
                    color: white !important;
                    text-decoration: none;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 500;
                    transition: background-color 0.2s ease;
                }

                .ains-btn:hover {
                    color: white !important;
                    text-decoration: none;
                }

                .ains-btn-primary {
                    background: #325C72;
                    color: white !important;
                }

                .ains-btn-primary:hover {
                    background: #2d5266;
                    color: white !important;
                }

                .ains-btn-secondary {
                    background: #6c757d;
                    color: white !important;
                }

                .ains-btn-secondary:hover {
                    background: #5a6268;
                    color: white !important;
                }

                .ains-empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #666;
                    font-size: 14px;
                    background: #fafbfc;
                }

                .ains-empty-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #325C72;
                    margin-bottom: 8px;
                }

                .ains-empty-subtitle {
                    font-size: 14px;
                    color: #666;
                }
            </style>
        `;
    }

    /**
     * Create header section
     * @param {Object} user - Current user
     * @param {string} uploadUrl - Upload URL
     * @returns {string} HTML content
     */
    function createHeaderSection(user, uploadUrl) {
        return `
            <div class="ains-header">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 6px;">
                    Expense Capture
                </div>

            </div>
        `;
    }

    /**
     * Create statistics section
     * @param {Object} stats - User statistics
     * @returns {string} HTML content
     */
    function createStatsSection(stats) {
        return `
            <div class="ains-stats">
                <div class="ains-stat">
                    <div class="ains-stat-number">${stats.total}</div>
                    <div class="ains-stat-label">Total</div>
                </div>
                <div class="ains-stat">
                    <div class="ains-stat-number">${stats.complete}</div>
                    <div class="ains-stat-label">Processed</div>
                </div>
                <div class="ains-stat">
                    <div class="ains-stat-number">${stats.imported}</div>
                    <div class="ains-stat-label">Imported</div>
                </div>
                <div class="ains-stat">
                    <div class="ains-stat-number">${commonLib.formatCurrency(stats.totalAmount)}</div>
                    <div class="ains-stat-label">Total Amount</div>
                </div>
            </div>
        `;
    }

    /**
     * Create recent uploads section
     * @param {Array} uploads - Recent uploads
     * @returns {string} HTML content
     */
    function createRecentUploadsSection(uploads) {
        if (uploads.length === 0) {
            return `
                <div class="ains-recent">
                    <div class="ains-empty-state">
                        <div class="ains-empty-title">No receipts uploaded</div>
                        <div class="ains-empty-subtitle">Upload receipt documents to begin processing</div>
                    </div>
                </div>
            `;
        }

        const uploadItems = uploads.map(upload => {
            const statusClass = `status-${upload.status}`;
            const dateStr = upload.date ? commonLib.formatDate(upload.date) : 'No date';
            const amountStr = upload.amount ? commonLib.formatCurrency(upload.amount) : '$0.00';
            const confidenceStr = upload.confidence ? `${Math.round(upload.confidence * 100)}%` : 'N/A';

            return `
                <div class="ains-upload-item">
                    <div class="ains-upload-info">
                        <div class="ains-upload-vendor">${upload.vendor}</div>
                        <div class="ains-upload-amount">${amountStr}</div>
                        <div class="ains-upload-meta">${dateStr} • Confidence: ${confidenceStr}</div>
                    </div>
                    <div>
                        <div class="ains-status ${statusClass}">${upload.status}</div>
                        ${upload.imported ? '<div style="font-size: 10px; color: #28a745; margin-top: 2px;">✓ Imported</div>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="ains-recent">
                ${uploadItems}
            </div>
        `;
    }

    /**
     * Create action section
     * @param {string} uploadUrl - Upload URL
     * @returns {string} HTML content
     */
    function createActionSection(uploadUrl) {
        return `
            <div class="ains-actions">
                <a href="${uploadUrl}" class="ains-btn ains-btn-primary" target="_blank">
                    Upload Receipt
                </a>
                <a href="#" onclick="window.location.reload(); return false;" class="ains-btn ains-btn-secondary">
                    Refresh
                </a>
            </div>
        `;
    }

    /**
     * Create error content
     * @param {Error} error - Error object
     * @returns {string} HTML content
     */
    function createErrorContent(error) {
        return `
            <div style="padding: 20px; text-align: center; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
                <div style="font-size: 16px; margin-bottom: 8px;">⚠️ Error</div>
                <div style="font-size: 12px;">Unable to load receipt data</div>
                <div style="font-size: 11px; margin-top: 8px; color: #856404;">
                    ${commonLib.formatErrorMessage(error)}
                </div>
                <div style="margin-top: 12px;">
                    <a href="#" onclick="window.location.reload(); return false;" style="color: #004085; text-decoration: underline;">
                        Try Again
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Get upload Suitelet URL
     * @returns {string} Upload URL
     */
    function getUploadSuiteletUrl() {
        try {
            return url.resolveScript({
                scriptId: CONSTANTS.SCRIPT_IDS.UPLOAD_SUITELET,
                deploymentId: CONSTANTS.DEPLOYMENT_IDS.UPLOAD_SUITELET,
                params: {
                    source: 'portlet'
                }
            });
        } catch (error) {
            commonLib.logOperation('get_upload_url_error', {
                error: error.message
            }, 'error');

            // Fallback URL
            return '/app/site/hosting/scriptlet.nl?script=_nsai_sl_receipt_upload&deploy=1';
        }
    }

    /**
     * Format status for display
     * @param {string} status - Status value
     * @returns {string} Formatted status
     */
    function formatStatus(status) {
        const statusMap = {
            [CONSTANTS.STATUS.PENDING]: 'Pending',
            [CONSTANTS.STATUS.PROCESSING]: 'Processing',
            [CONSTANTS.STATUS.COMPLETE]: 'Complete',
            [CONSTANTS.STATUS.ERROR]: 'Error'
        };

        return statusMap[status] || status;
    }

    /**
     * Get status icon
     * @param {string} status - Status value
     * @returns {string} Status icon
     */
    function getStatusIcon(status) {
        const iconMap = {
            [CONSTANTS.STATUS.PENDING]: '⏳',
            [CONSTANTS.STATUS.PROCESSING]: '⚙️',
            [CONSTANTS.STATUS.COMPLETE]: '✅',
            [CONSTANTS.STATUS.ERROR]: '❌'
        };

        return iconMap[status] || '📄';
    }

    /**
     * Check if user has permission to view portlet
     * @param {Object} user - Current user
     * @returns {boolean} Permission status
     */
    function hasPortletPermission(user) {
        try {
            // Employee Center users and full access users can view
            return commonLib.isEmployeeCenterRole() || user.roleId !== '14';
        } catch (error) {
            return true; // Default to allow access
        }
    }

    return {
        render: render
    };
});