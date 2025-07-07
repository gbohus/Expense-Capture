# AI NS Expense Capture System - Deployment Guide

## Overview
The AI NS Expense Capture system is a comprehensive NetSuite solution that enables users to upload receipts, automatically extract expense data using Oracle OCI Document Understanding and NetSuite LLM, and seamlessly import processed expenses into Expense Reports.

## Prerequisites

### NetSuite Account Requirements
- **NetSuite LLM Module**: Must be enabled and configured
- **Enhanced File Security**: Must be enabled
- **Oracle OCI Document Understanding**: API access configured
- **SuiteApp Features**: Employee Center enabled if using portlet functionality
- **Permissions**: Administrative access for deployment

### Technical Requirements
- NetSuite 2023.1 or later (for full N/query support)
- SuiteScript 2.1 support
- API access for external integrations

## Installation Steps

### Step 1: Deploy Custom Record
1. Navigate to `Customization > Lists, Records, & Fields > Record Types`
2. Import the custom record definition: `Objects/customrecord_ains_expense_capture.xml`
3. Verify all fields are created correctly

### Step 2: Upload Script Files
1. Upload all script files to File Cabinet following the directory structure:
   ```
   SuiteScripts/AI_NS_ExpenseCapture/
   ├── Libraries/
   │   ├── AINS_LIB_Common.js
   │   ├── AINS_LIB_OCIIntegration.js
   │   └── AINS_LIB_LLMProcessor.js
   ├── Suitelets/
   │   ├── AINS_SL_ReceiptUpload.js
   │   └── AINS_SL_ExpenseImportModal.js
   ├── MapReduce/
   │   └── AINS_MR_ProcessReceipts.js
   ├── Portlets/
   │   └── AINS_PL_EmployeeCenterPortlet.js
   └── ClientScripts/
       └── AINS_CS_ExpenseReportImport.js
   ```

### Step 3: Create Script Records
Use the provided `deploy.xml` file or manually create each script record with the following details:

#### Receipt Upload Suitelet (`_nsai_sl_receipt_upload`)
- **File**: `AINS_SL_ReceiptUpload.js`
- **Type**: Suitelet
- **Parameters**:
  - `custscript_ains_max_file_size`: 10 (MB)
  - `custscript_ains_results_folder`: [Folder ID for results storage]

#### Map/Reduce Processing (`_nsai_mr_process_receipts`)
- **File**: `AINS_MR_ProcessReceipts.js`
- **Type**: Map/Reduce
- **Parameters**:
  - `custscript_ains_llm_model`: "command-r"
  - `custscript_ains_confidence_threshold`: 0.8
  - `custscript_ains_auto_assign`: true

#### Employee Center Portlet (`_nsai_pl_employee_center_portlet`)
- **File**: `AINS_PL_EmployeeCenterPortlet.js`
- **Type**: Portlet

#### Expense Import Modal (`_nsai_sl_expense_import_modal`)
- **File**: `AINS_SL_ExpenseImportModal.js`
- **Type**: Suitelet

#### Expense Report Client Script (`_nsai_cs_expense_report_import`)
- **File**: `AINS_CS_ExpenseReportImport.js`
- **Type**: Client Script
- **Record Type**: Expense Report
- **Events**: Create, Edit, View

### Step 4: Configure Deployments
Deploy each script with appropriate role permissions:

| Script | Roles | Audience |
|--------|-------|----------|
| Receipt Upload | Administrator, Full Access, Employee Center | All Employees |
| Map/Reduce Processing | Administrator | System Only |
| Employee Center Portlet | Administrator, Full Access, Employee Center | All Employees |
| Import Modal | Administrator, Full Access, Employee Center | All Employees |
| Expense Report Client | Administrator, Full Access, Employee Center | All Employees |

### Step 5: Configure File Cabinet Folder
1. Create a dedicated folder for processing results
2. Note the Internal ID of this folder
3. Update the `custscript_ains_results_folder` parameter in the Map/Reduce script

## Configuration

### Script Parameters

#### Receipt Upload Suitelet Parameters
- **Maximum File Size (MB)** (`custscript_ains_max_file_size`)
  - Default: 10
  - Description: Maximum allowed file size for uploads
  - Range: 1-50 MB recommended

- **Results Folder ID** (`custscript_ains_results_folder`)
  - Description: Internal ID of File Cabinet folder for storing processing results
  - Required: Yes

#### Map/Reduce Processing Parameters
- **LLM Model** (`custscript_ains_llm_model`)
  - Default: "command-r"
  - Description: NetSuite LLM model for processing
  - Options: "command-r", "llama-2" (based on account configuration)

- **Confidence Threshold** (`custscript_ains_confidence_threshold`)
  - Default: 0.8
  - Description: Minimum confidence score for auto-assignment (0.0 - 1.0)
  - Range: 0.6-0.95 recommended

- **Auto-Assign Categories** (`custscript_ains_auto_assign`)
  - Default: true
  - Description: Enable automatic expense category assignment
  - Note: When false, categories will be left blank for manual assignment

### Enhanced File Security Setup
The system automatically uses Enhanced File Security with the following URL pattern:
```
https://{account}.app.netsuite.com/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=Attach+File&reportOwner={employeeId}&entity={employeeId}
```

This creates user-specific folders: `/Filing Cabinet/Expense Reports/[Employee Name]/`

### Oracle OCI Integration
Configure Oracle OCI Document Understanding API access according to the included documentation in `Document Understanding.md`.

### NetSuite LLM Configuration
Ensure NetSuite LLM module is enabled and configured for the Command R model as described in `nLLM Module.md`.

## User Setup

### Employee Center Dashboard
1. Navigate to Employee Center dashboard setup
2. Add the "Expense Receipt Capture" portlet
3. Configure portlet position and visibility

### Role Permissions
Ensure the following permissions are granted:

#### Custom Record Permissions
- **Employee Center Role**: Create, View, Edit (own records only)
- **Full Access Role**: Full CRUD access
- **Administrator**: Full CRUD access

#### Script Permissions
- **All Roles**: Access to Receipt Upload, Import Modal, Portlet
- **Administrator Only**: Map/Reduce script access

## Testing

### Test Scenarios
1. **File Upload**: Test with various file types and sizes
2. **OCR Processing**: Verify receipt data extraction accuracy
3. **LLM Processing**: Confirm expense category auto-assignment
4. **Expense Import**: Test import functionality in Expense Reports
5. **Error Handling**: Test with invalid files and network issues
6. **Role Permissions**: Verify access controls work correctly

### Test Data
- Use sample receipts with clear vendor names, amounts, and dates
- Test edge cases: handwritten receipts, poor quality images
- Verify multi-currency support if applicable

## Monitoring & Maintenance

### Logging
The system provides comprehensive logging at DEBUG level. Monitor the following:
- Upload success/failure rates
- OCR processing accuracy
- LLM response quality
- Import completion rates

### Performance Monitoring
- Map/Reduce script execution times
- File processing queue depths
- User adoption metrics

### Maintenance Tasks
- **Monthly**: Review confidence threshold effectiveness
- **Quarterly**: Analyze category assignment accuracy
- **As Needed**: Update file size limits based on usage

## Troubleshooting

### Common Issues

#### Upload Failures
- **Cause**: File size exceeds limit
- **Solution**: Increase `custscript_ains_max_file_size` parameter or compress files

#### Processing Errors
- **Cause**: OCR or LLM service unavailable
- **Solution**: Check external service status and retry processing

#### Import Button Missing
- **Cause**: Client script not deployed or permissions issue
- **Solution**: Verify client script deployment and role permissions

#### Category Assignment Issues
- **Cause**: Low confidence scores or missing expense categories
- **Solution**: Adjust confidence threshold or review expense category setup

### Log Locations
- Script execution logs: Setup > Integration > Script Execution Log
- Custom record processing: Monitor custom record creation and updates
- Error tracking: Review error messages in custom record error fields

## Support

### Documentation References
- `Document Understanding.md`: Oracle OCI integration details
- `nLLM Module.md`: NetSuite LLM configuration
- Script comments: Detailed inline documentation

### Key Contact Points
- **Technical Issues**: Review script execution logs
- **Functional Issues**: Check custom record data and processing status
- **Performance Issues**: Monitor Map/Reduce script metrics

## Version History

### Version 1.0
- Initial release with core functionality
- Receipt upload with Enhanced File Security
- OCR processing with Oracle OCI Document Understanding
- LLM processing with NetSuite Command R model
- Expense Report integration
- Employee Center portlet

### Future Enhancements
- Multi-language receipt support
- Advanced approval workflows
- Bulk processing capabilities
- Mobile app integration
- Analytics and reporting dashboard

---

**Important**: Test thoroughly in a sandbox environment before deploying to production. Ensure all external integrations (OCI, LLM) are properly configured and tested.