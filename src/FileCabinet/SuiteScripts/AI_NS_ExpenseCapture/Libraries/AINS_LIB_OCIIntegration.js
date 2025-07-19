/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @description OCI Document Understanding utilities for AI NS Expense Capture system
 * Task-based approach - raw JSON output to File Cabinet
 */

define(['N/file', 'N/search', 'N/log', './AINS_LIB_Common'],
function(file, search, log, commonLib) {

    const CONSTANTS = commonLib.CONSTANTS;

    /**
     * Create a temporary file from base64 data for OCI processing
     * @param {string} base64Data - Base64 encoded file data
     * @param {string} fileName - Original file name
     * @param {string} fileType - MIME type of the file
     * @returns {Object} NetSuite file object
     */
    function createTempFile(base64Data, fileName, fileType) {
        try {
            log.debug('Creating Temp File', {
                fileName: fileName,
                fileType: fileType,
                dataSize: base64Data ? base64Data.length : 0
            });

            // Create file from base64 data
            const fileObj = file.create({
                name: fileName,
                fileType: getNetSuiteFileType(fileType),
                contents: base64Data,
                encoding: file.Encoding.BASE64
            });

            log.debug('Temp File Created', {
                fileName: fileObj.name,
                fileType: fileObj.fileType,
                size: fileObj.size
            });

            return fileObj;

        } catch (error) {
            log.error('CreateTempFile Error', error);
            throw new Error('Failed to create temporary file: ' + error.message);
        }
    }

    /**
     * Convert MIME type to NetSuite file type
     * @param {string} mimeType - MIME type string
     * @returns {string} NetSuite file type constant
     */
    function getNetSuiteFileType(mimeType) {
        const typeMap = {
            'image/png': file.Type.PNGIMAGE,
            'image/jpeg': file.Type.JPGIMAGE,
            'image/jpg': file.Type.JPGIMAGE,
            'image/tiff': file.Type.TIFFIMAGE,
            'image/tif': file.Type.TIFFIMAGE,
            'application/pdf': file.Type.PDF
        };

        const netSuiteType = typeMap[mimeType.toLowerCase()];
        if (!netSuiteType) {
            log.debug('Unknown MIME Type', 'Defaulting to PDF for MIME type: ' + mimeType);
            return file.Type.PDF;
        }

        return netSuiteType;
    }

    /**
     * Validate receipt file for OCI processing
     * @param {File} file - File to validate
     * @returns {Object} Validation result {isValid: boolean, message: string}
     */
    function validateReceiptFile(file) {
        try {
            if (!file) {
                return { isValid: false, message: 'File is required' };
            }

            // Check file size
            const sizeValidation = commonLib.validateFileSize(file.size);
            if (!sizeValidation.isValid) {
                return sizeValidation;
            }

            // Check file type
            const typeValidation = commonLib.validateFileType(file.name);
            if (!typeValidation.isValid) {
                return typeValidation;
            }

            // Check if file is empty
            if (file.size === 0) {
                return { isValid: false, message: 'File cannot be empty' };
            }

            return { isValid: true, message: 'File validation passed' };

        } catch (error) {
            return { isValid: false, message: `Validation error: ${error.message}` };
        }
    }

    /**
     * Validate file for OCI processing (additional validation options)
     * @param {string} fileName - File name
     * @param {string} fileType - MIME type
     * @param {number} fileSize - File size in bytes
     * @param {Object} options - Validation options
     * @returns {Object} Validation result {valid: boolean, error: string}
     */
    function validateFileForOCI(fileName, fileType, fileSize, options) {
        try {
            options = options || {};
            const maxSize = options.maxSize || (10 * 1024 * 1024); // 10MB default
            const supportedTypes = options.supportedTypes || [
                'image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/tif', 'application/pdf'
            ];

            // Check file size
            if (fileSize > maxSize) {
                return {
                    valid: false,
                    error: 'File size (' + Math.round(fileSize / 1024 / 1024) + 'MB) exceeds maximum allowed size (' + Math.round(maxSize / 1024 / 1024) + 'MB)'
                };
            }

            // Check file type
            if (supportedTypes.indexOf(fileType.toLowerCase()) === -1) {
                return {
                    valid: false,
                    error: 'Unsupported file type: ' + fileType + '. Supported types: ' + supportedTypes.join(', ')
                };
            }

            // Check file name
            if (!fileName || fileName.trim() === '') {
                return {
                    valid: false,
                    error: 'File name is required'
                };
            }

            return {
                valid: true,
                error: null
            };

        } catch (error) {
            log.error('ValidateFileForOCI Error', error);
            return {
                valid: false,
                error: 'Validation error: ' + error.message
            };
        }
    }

    /**
     * Generate output file path for Document Understanding Task
     * @param {string} trackingId - Unique tracking identifier
     * @returns {string} File path for task output
     */
    function generateOutputFilePath(trackingId) {
        const outputFileName = `receipt_analysis_${trackingId}.json`;
        return `SuiteScripts/AI_NS_ExpenseCapture/OutputFiles/${outputFileName}`;
    }

    /**
     * Load OCI output file from File Cabinet
     * @param {string} outputFilePath - Path to the output file
     * @returns {Object|null} File object or null if not found
     */
    function loadOCIOutputFile(outputFilePath) {
        try {
            const fileName = outputFilePath.split('/').pop();

            const fileSearch = search.create({
                type: 'file',
                filters: [
                    ['name', 'is', fileName]
                ]
            });

            const searchResults = fileSearch.run().getRange(0, 10);

            // Filter results by folder path since we can't use folder filter reliably
            for (let i = 0; i < searchResults.length; i++) {
                const result = searchResults[i];
                const fileObj = file.load({ id: result.id });

                // Check if the file is in the correct folder path
                if (fileObj.folder && fileObj.folder.toString().indexOf('AI_NS_ExpenseCapture') > -1) {
                    return fileObj;
                }
            }

            return null;

        } catch (error) {
            log.error('LoadOCIOutputFile Error', error);
            return null;
        }
    }

    /**
     * Parse raw OCI JSON output file
     * @param {File} outputFile - OCI output file
     * @returns {Object} Parsed JSON data
     */
    function parseOCIOutputFile(outputFile) {
        try {
            const fileContent = outputFile.getContents();
            return JSON.parse(fileContent);
        } catch (error) {
            log.error('ParseOCIOutputFile Error', error);
            throw new Error('Failed to parse OCI output file: ' + error.message);
        }
    }

    // Public interface - simple utilities for task-based approach
    return {
        createTempFile: createTempFile,
        getNetSuiteFileType: getNetSuiteFileType,
        validateReceiptFile: validateReceiptFile,
        validateFileForOCI: validateFileForOCI,
        generateOutputFilePath: generateOutputFilePath,
        loadOCIOutputFile: loadOCIOutputFile,
        parseOCIOutputFile: parseOCIOutputFile
    };
});