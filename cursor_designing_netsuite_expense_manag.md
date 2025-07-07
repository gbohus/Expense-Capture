# Designing netsuite expense management solution
_Exported on 7/7/2025 at 08:47:18 EDT from Cursor (1.2.202507070623-nightly)_

---

**User**

ok so i am starting a new project in netsuite where i will create a solution which allows a user to upload a receipt and oracle oci document understanding will scan it and then it will create this new custom record with the details and fields needed to create an expense line. it will also save the file to this record. 

next when the user goes to the ER there will be a new button which says Import Captured Expenses, and this will bring up a modal where the user can select 1 or many expenses to be added to the ER lines and then the information will be transferred over. 1 key thing when we are creating the new record with the file we need to use this url as this automatically creates a new folder in the File cabinet for the user

sample url, you can see there are parameters for user
@https://td3011969.app.netsuite.com/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=Attach+File&reportOwner=-5&entity=-5
 
this is for the feature in netsuite enhanced File Security, search web if u dont knwo what this does. 

ok next we need to make this compatible with the employee center so we need to create a portlet whcih i will add to their dashboard which will allow them to interact with the SL to add receipts, right now just 1 at a time. 

so this needs to work in both the full access role and employee center role. i said SL bc that can be added to a dashboard but i dont know if its best to have a user interact in there or shoud they interact with the SL and can employee center roles use SL?  i wat to keep in mind all permissions. 

ok that is a good start please design the system archetecture and let me know of questions you have for me

---

**Cursor**

I'll help you design a comprehensive system architecture for this receipt capture and expense processing solution. Let me first research some key NetSuite features and then examine your current project structure.

Based on your requirements and my research into NetSuite's Enhanced File Security and Employee Center capabilities, I'll design a comprehensive system architecture for your receipt capture and expense processing solution.

## System Architecture Design

### **High-Level Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Receipt Capture & Processing System           │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Components:                                           │
│  • Employee Center Portlet (Dashboard)                         │
│  • Expense Report "Import Captured Expenses" Button           │
│  • Receipt Upload Suitelet                                     │
│                                                                │
│  Backend Components:                                           │
│  • Custom Record: Captured Expenses                           │
│  • Oracle OCI Document Understanding Integration              │
│  • Enhanced File Security Integration                         │
│  • User Event Scripts                                         │
│  • Map/Reduce Processing Script                               │
└─────────────────────────────────────────────────────────────────┘
```

### **1. Custom Record Structure**

**Custom Record: "AI NS Captured Expenses"**
- **Record ID**: `customrecord_ains_captured_expense`
- **Script ID**: `_ains_captured_expense`

**Key Fields:**
- `custrecord_ains_receipt_image` (File) - The uploaded receipt
- `custrecord_ains_vendor_name` (Free Text) - Extracted vendor
- `custrecord_ains_expense_amount` (Currency) - Extracted amount
- `custrecord_ains_expense_date` (Date) - Transaction date
- `custrecord_ains_expense_category` (List/Record) - Expense category
- `custrecord_ains_description` (Free Text) - Expense description
- `custrecord_ains_employee` (List/Record) - Employee who uploaded
- `custrecord_ains_processing_status` (List) - Processing status
- `custrecord_ains_imported_to_er` (Checkbox) - Imported flag
- `custrecord_ains_er_reference` (List/Record) - Reference to ER
- `custrecord_ains_raw_ocr_data` (Long Text) - Raw OCR response

### **2. Core Scripts Architecture**

#### **A. Receipt Upload Suitelet**
**Script: `AI NS|SL|Receipt Processor`**
- **File**: `AINS_SL_ReceiptProcessor.js`
- **Deployment**: Available to both Employee Center and Full Access roles
- **Functions**:
  - Handle file upload using Enhanced File Security URL
  - Create initial Captured Expense record
  - Trigger OCR processing
  - Provide upload interface

#### **B. OCR Processing Script**
**Script: `AI NS|MR|OCR Processor`**
- **File**: `AINS_MR_OCRProcessor.js`
- **Type**: Map/Reduce
- **Functions**:
  - Process uploaded receipts with Oracle OCI
  - Extract key data (vendor, amount, date, description)
  - Update Captured Expense records
  - Handle processing errors

#### **C. Employee Center Portlet**
**Script: `AI NS|PL|Receipt Dashboard`**
- **File**: `AINS_PL_ReceiptDashboard.js`
- **Type**: Portlet
- **Deployment**: Dashboard SuiteApp enabled, Employee Center role
- **Functions**:
  - Display recent uploads
  - Show processing status
  - Provide quick upload interface
  - Link to main Suitelet

#### **D. Expense Report Enhancement**
**Script: `AI NS|UE|Expense Report Import`**
- **File**: `AINS_UE_ExpenseReportImport.js`
- **Type**: User Event (beforeLoad)
- **Functions**:
  - Add "Import Captured Expenses" button
  - Handle button click to open modal
  - Process selected expenses import

#### **E. Import Modal Suitelet**
**Script: `AI NS|SL|Import Modal`**
- **File**: `AINS_SL_ImportModal.js`
- **Functions**:
  - Display available captured expenses
  - Allow multi-selection
  - Transfer data to expense report lines
  - Update imported flags

### **3. Enhanced File Security Integration**

**Implementation Strategy:**
```javascript
// Enhanced File Security URL Construction
const enhancedFileSecurityURL = `https://td3011969.app.netsuite.com/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=Attach+File&reportOwner=${employeeId}&entity=${employeeId}`;

// This automatically creates user-specific folders in File Cabinet
// Format: /Filing Cabinet/Expense Reports/[Employee Name]/
```

### **4. Permission Architecture**

#### **Employee Center Role Permissions:**
- **Custom Record**: View, Create, Edit (own records only)
- **Suitelet Access**: Receipt Processor, Import Modal
- **File Cabinet**: Limited to own expense folders (via Enhanced File Security)

#### **Full Access Role Permissions:**
- **Custom Record**: Full access
- **All Scripts**: Full access
- **File Cabinet**: Full access with proper folder restrictions

### **5. Oracle OCI Integration**

**Integration Points:**
- **Authentication**: Oracle Cloud credentials stored in NetSuite
- **API Calls**: RESTlet or external integration
- **Data Mapping**: OCR results to NetSuite field structure
- **Error Handling**: Fallback for OCR failures

### **6. User Experience Flow**

#### **Employee Center Flow:**
1. Employee sees portlet on dashboard
2. Clicks "Upload Receipt" 
3. Redirected to Receipt Processor Suitelet
4. Uploads file (automatically stored in user folder)
5. OCR processing begins automatically
6. Employee can view processing status in portlet

#### **Expense Report Flow:**
1. User creates/edits Expense Report
2. Clicks "Import Captured Expenses" button
3. Modal opens showing available processed receipts
4. User selects receipts to import
5. System creates expense lines with extracted data
6. Files are attached to expense report

### **7. Technical Implementation Details**

#### **SuiteQL Usage (as per memory):**
```javascript
// Use SuiteQL for expense category lookups
const categoryQuery = `
    SELECT id, name 
    FROM customrecord_expense_category 
    WHERE isinactive = 'F'
    ORDER BY name
`;
const categories = query.runSuiteQL({ query: categoryQuery });
```

#### **Enhanced File Security Implementation:**
```javascript
// Create file with automatic folder creation
const fileUrl = `${baseUrl}/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=Attach+File&reportOwner=${employeeId}&entity=${employeeId}`;

// This creates folder structure: /Filing Cabinet/Expense Reports/[Employee Name]/
```

### **8. Security Considerations**

- **Role-based file access** through Enhanced File Security
- **Employee isolation** - users only see their own receipts
- **Data validation** on OCR results
- **Audit trail** for all imports and processing

### **Questions for You:**

1. **Oracle OCI Integration**: Do you have existing Oracle OCI credentials, or do you need guidance on setting up the Document Understanding API?

2. **Expense Categories**: Do you have existing expense categories in NetSuite, or do we need to create a custom list?

3. **File Size Limits**: What's the maximum file size you want to support for receipt uploads?

4. **OCR Accuracy**: How do you want to handle cases where OCR extraction is uncertain or fails?

5. **Approval Workflow**: Do you want any approval process for captured expenses before they can be imported?

6. **Multi-Currency**: Do you need support for multiple currencies in expense processing?

This architecture provides a scalable, secure solution that works across both Employee Center and full NetSuite access while leveraging NetSuite's Enhanced File Security for automatic folder management. The modular design allows for easy maintenance and future enhancements.

```plaintext
┌─────────────────────────────────────────────────────────────────┐
│                    Receipt Capture & Processing System           │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Components:                                           │
│  • Employee Center Portlet (Dashboard)                         │
│  • Expense Report "Import Captured Expenses" Button           │
│  • Receipt Upload Suitelet                                     │
│                                                                │
│  Backend Components:                                           │
│  • Custom Record: Captured Expenses                           │
│  • Oracle OCI Document Understanding Integration              │
│  • Enhanced File Security Integration                         │
│  • User Event Scripts                                         │
│  • Map/Reduce Processing Script                               │
└─────────────────────────────────────────────────────────────────┘
```

```javascript
// Enhanced File Security URL Construction
const enhancedFileSecurityURL = `https://td3011969.app.netsuite.com/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=Attach+File&reportOwner=${employeeId}&entity=${employeeId}`;

// This automatically creates user-specific folders in File Cabinet
// Format: /Filing Cabinet/Expense Reports/[Employee Name]/
```

```javascript
// Use SuiteQL for expense category lookups
const categoryQuery = `
    SELECT id, name 
    FROM customrecord_expense_category 
    WHERE isinactive = 'F'
    ORDER BY name
`;
const categories = query.runSuiteQL({ query: categoryQuery });
```

```javascript
// Create file with automatic folder creation
const fileUrl = `${baseUrl}/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=Attach+File&reportOwner=${employeeId}&entity=${employeeId}`;

// This creates folder structure: /Filing Cabinet/Expense Reports/[Employee Name]/
```

---

**User**

1. we dont need any but documentation on how to use the api can be found here @Document Understanding.md 
2. u will need to load the list of categories as this solution will be deploymed into many accounts so u need to find the relevant ones for each account
3. 10mb for now but make it easy for me to change in the script
4. what i didnt mention is that we will use oci document understanding service and then after we extract the data send it to netsuite llm module and with a prompt which tells the system our use case and then to provide the data back in X format so u can take it and use it to set the fields. the llm module details can be found here@nLLM Module.md 
5. no

6. the custom record should be AI NS Expense Capture

so i think we are agreeing that we need to have a portlet so that it can be put onto the dashboard of the ER screen but then would that display the suitlet interface or can we open up a new page so the user has full screen use? let me know any further questions on the above

---

**Cursor**

Perfect! Thank you for the additional details. This clarifies several important aspects. Let me address your questions and update the architecture accordingly.

## Updated System Architecture

### **OCR + LLM Processing Flow**

The enhanced processing flow will be:
1. **File Upload** → Enhanced File Security folder
2. **OCI Document Understanding** → Extract raw data (vendor, amount, date, etc.)
3. **NetSuite LLM Module** → Format extracted data into structured NetSuite fields
4. **Field Population** → Update custom record with formatted data

### **Custom Record: "AI NS Expense Capture"**
- **Record ID**: `customrecord_ains_expense_capture`
- **Script ID**: `_ains_expense_capture`

### **File Size Configuration**
I'll make the file size limit easily configurable at the top of scripts:
```javascript
// Configuration Constants
const MAX_FILE_SIZE_MB = 10; // Easy to modify
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
```

### **Dynamic Expense Category Loading**
Since this will be deployed to multiple accounts, I'll create a function to discover expense categories:
```javascript
// Dynamic category discovery using SuiteQL
const categoryQuery = `
    SELECT id, name, description 
    FROM ExpenseCategory 
    WHERE isinactive = 'F'
    ORDER BY name
`;
```

### **Portlet vs Suitelet UX Design**

For the optimal user experience, I recommend:

**Employee Center Dashboard Portlet:**
- Shows summary of recent uploads (last 5-10)
- Displays processing status
- Shows quick stats (pending, processed, imported)
- Has a prominent "Upload New Receipt" button

**Full Suitelet Experience:**
- Portlet button opens Suitelet in **new tab/window** for full-screen use
- Provides complete upload interface with drag-drop
- Shows detailed processing progress
- Allows bulk operations
- Better for detailed review and management

This approach gives users:
- **Dashboard visibility** (via portlet)
- **Full functionality** (via dedicated Suitelet page)
- **Non-disruptive workflow** (new tab doesn't interfere with current work)

### **Updated Script Architecture**

#### **A. OCR + LLM Processing Script**
**Script: `AI NS|MR|Receipt OCR Processor`**
```javascript
// Map/Reduce Script Flow:
// Map: Process each uploaded receipt
// Reduce: Handle OCR results and LLM formatting

function map(context) {
    // 1. Load receipt file
    // 2. Call OCI Document Understanding
    // 3. Extract raw data (vendor, amount, date, etc.)
}

function reduce(context) {
    // 1. Take OCR results
    // 2. Send to NetSuite LLM with formatting prompt
    // 3. Parse LLM response
    // 4. Update custom record fields
}
```

#### **B. LLM Formatting Prompt**
```javascript
const EXPENSE_FORMATTING_PROMPT = `
You are a NetSuite expense processing assistant. 
Analyze the following receipt data extracted by OCR and format it into a structured JSON response.

OCR Data: {ocrData}

Return ONLY a JSON object with these exact fields:
{
    "vendor": "string - vendor/merchant name",
    "amount": "number - total amount as decimal", 
    "date": "string - date in YYYY-MM-DD format",
    "description": "string - brief expense description",
    "category": "string - best matching expense category",
    "confidence": "number - confidence score 0-1"
}

Rules:
- Extract the most accurate information possible
- Use common expense categories like 'Meals', 'Travel', 'Office Supplies', etc.
- If uncertain about any field, use your best judgment
- Amount should be the total including tax
`;
```

#### **C. Enhanced File Security Integration**
```javascript
function createReceiptFile(employeeId, fileContent, fileName) {
    // Use Enhanced File Security URL pattern you provided
    const fileSecurityUrl = `https://td3011969.app.netsuite.com/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=Attach+File&reportOwner=${employeeId}&entity=${employeeId}`;
    
    // This automatically creates: /Filing Cabinet/Expense Reports/[Employee Name]/
    // File will be stored with proper permissions
}
```

### **Questions for You:**

1. **OCI Configuration**: Do you want the OCI Document Understanding credentials configured:
   - **Globally** (in AI Preferences for the whole account), or
   - **Per script** (using the ociConfig parameter in the documentUnderstanding call)?

2. **LLM Model Preference**: Which NetSuite LLM model do you prefer?
   - **Cohere Command R** (default, good for structured data)
   - **Meta Llama** (alternative option)

3. **Category Matching**: For expense category assignment, should the system:
   - **Auto-assign** based on LLM's best guess, or
   - **Leave blank** for user to select manually?

4. **Error Handling**: If OCR or LLM processing fails, should the system:
   - **Save the file anyway** with a "Processing Failed" status, or
   - **Retry automatically** after a delay?

5. **Portlet Refresh**: How often should the dashboard portlet refresh its data?
   - **Real-time** (every page load)
   - **Cached** (refresh every 5-10 minutes)

6. **Processing Feedback**: Should users get:
   - **Email notifications** when processing completes, or
   - **Just dashboard status updates**?

This architecture provides a robust, scalable solution that leverages both OCI Document Understanding and NetSuite's LLM capabilities while maintaining the flexibility needed for multi-account deployment. The portlet + Suitelet combination gives users the best of both worlds for their workflow.

```javascript
// Configuration Constants
const MAX_FILE_SIZE_MB = 10; // Easy to modify
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
```

```javascript
// Dynamic category discovery using SuiteQL
const categoryQuery = `
    SELECT id, name, description 
    FROM ExpenseCategory 
    WHERE isinactive = 'F'
    ORDER BY name
`;
```

```javascript
// Map/Reduce Script Flow:
// Map: Process each uploaded receipt
// Reduce: Handle OCR results and LLM formatting

function map(context) {
    // 1. Load receipt file
    // 2. Call OCI Document Understanding
    // 3. Extract raw data (vendor, amount, date, etc.)
}

function reduce(context) {
    // 1. Take OCR results
    // 2. Send to NetSuite LLM with formatting prompt
    // 3. Parse LLM response
    // 4. Update custom record fields
}
```

```javascript
const EXPENSE_FORMATTING_PROMPT = `
You are a NetSuite expense processing assistant. 
Analyze the following receipt data extracted by OCR and format it into a structured JSON response.

OCR Data: {ocrData}

Return ONLY a JSON object with these exact fields:
{
    "vendor": "string - vendor/merchant name",
    "amount": "number - total amount as decimal", 
    "date": "string - date in YYYY-MM-DD format",
    "description": "string - brief expense description",
    "category": "string - best matching expense category",
    "confidence": "number - confidence score 0-1"
}

Rules:
- Extract the most accurate information possible
- Use common expense categories like 'Meals', 'Travel', 'Office Supplies', etc.
- If uncertain about any field, use your best judgment
- Amount should be the total including tax
`;
```

```javascript
function createReceiptFile(employeeId, fileContent, fileName) {
    // Use Enhanced File Security URL pattern you provided
    const fileSecurityUrl = `https://td3011969.app.netsuite.com/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=Attach+File&reportOwner=${employeeId}&entity=${employeeId}`;
    
    // This automatically creates: /Filing Cabinet/Expense Reports/[Employee Name]/
    // File will be stored with proper permissions
}
```

---

**User**

1. i dont need them 
2. you can go with command r for now
3. auto assign but should not be a guess, the ai should be confident and assign a value no blank values allowed
4. display error and do not save file if that is an option
5. real time
6. no feedback at this time. 

remember we will be having the user upload the document, the system saved it to their specfic folder, then a mr script kicks off to process, stores results in a folder i can define, put a paramter in the script parameter so i can adjust in the UI

if u are good can you create a very detailed implemenation task plan so we can use it to build the solution. create a detailed PRD, Implemenation plan, task list so you can keep track of your progress and work section by section

---

**Cursor**

Perfect! I'll create a comprehensive implementation plan for your Receipt Capture & Expense Processing solution. Let me structure this as a detailed PRD, implementation plan, and task list that we can work through systematically.

```markdown
# Receipt Capture & Expense Processing System
## Product Requirements Document (PRD)

### **Project Overview**
A comprehensive NetSuite solution that enables users to upload receipts, automatically extract expense data using Oracle OCI Document Understanding and NetSuite LLM, and seamlessly import processed expenses into Expense Reports.

---

## **1. FUNCTIONAL REQUIREMENTS**

### **1.1 Receipt Upload & Processing**
- **Upload Interface**: Suitelet accessible from Employee Center portlet and full NetSuite interface
- **File Security**: Utilize NetSuite Enhanced File Security for automatic folder creation per user
- **File Size Limit**: 10MB (configurable via script parameter)
- **Processing Flow**:
  1. User uploads receipt → Enhanced File Security folder
  2. Map/Reduce script triggers automatically
  3. OCI Document Understanding extracts raw data
  4. NetSuite LLM (Command R) formats data with confidence-based assignment
  5. Results stored in custom record with no blank values allowed

### **1.2 Custom Record: "AI NS Expense Capture"**
- **Record Type**: `customrecord_ains_expense_capture`
- **Script ID**: `_ains_expense_capture`
- **Required Fields**:
  ```
  custrecord_ains_file_attachment (File)
  custrecord_ains_vendor_name (Text)
  custrecord_ains_expense_amount (Currency)
  custrecord_ains_expense_date (Date)
  custrecord_ains_expense_category (List/Record - Auto-assigned)
  custrecord_ains_description (Text)
  custrecord_ains_processing_status (List: Pending, Processing, Complete, Error)
  custrecord_ains_created_by (Entity - Employee)
  custrecord_ains_error_message (Long Text)
  custrecord_ains_raw_ocr_data (Long Text)
  custrecord_ains_llm_response (Long Text)
  custrecord_ains_confidence_score (Decimal)
  ```

### **1.3 Expense Report Integration**
- **Import Button**: "Import Captured Expenses" on Expense Report
- **Modal Interface**: Multi-select grid showing available captured expenses
- **Data Transfer**: Automatic population of expense line fields from captured data
- **File Association**: Attach original receipt file to expense line

### **1.4 Employee Center Integration**
- **Dashboard Portlet**: Quick access to receipt upload functionality
- **Permission Compatibility**: Works with both Full Access and Employee Center roles

---

## **2. TECHNICAL REQUIREMENTS**

### **2.1 NetSuite Components**

#### **Scripts & Files**
```
AINS_SL_ReceiptUpload.js          - Receipt upload Suitelet
AINS_MR_ProcessReceipts.js        - Map/Reduce processing script
AINS_CS_ExpenseReportImport.js    - Client script for ER import button
AINS_SL_ExpenseImportModal.js     - Modal Suitelet for expense selection
AINS_PL_EmployeeCenterPortlet.js  - Employee Center portlet
AINS_LIB_OCIIntegration.js        - OCI Document Understanding library
AINS_LIB_LLMProcessor.js          - NetSuite LLM integration library
```

#### **Enhanced File Security Integration**
- **Target URL Pattern**: 
  ```
  https://{account}.app.netsuite.com/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=Attach+File&reportOwner={employeeId}&entity={employeeId}
  ```
- **Automatic Folder Creation**: Per-user folders for expense receipts
- **File Association**: Link uploaded files to custom records

### **2.2 External Integrations**

#### **Oracle OCI Document Understanding**
- **Endpoint**: As documented in attached `Document Understanding.md`
- **Processing**: Extract vendor, amount, date, description from receipts
- **Error Handling**: Display errors without saving file if OCR fails

#### **NetSuite LLM Module (Command R)**
- **Model**: Command R
- **Processing Type**: Real-time
- **Prompt Strategy**: 
  ```
  "You are processing expense receipt data. Based on the OCR extracted data: {ocr_data}, 
   and available expense categories: {categories}, assign the most appropriate category 
   with high confidence. Format response as JSON with fields: vendor, amount, date, 
   category_id, description. No blank values allowed - use 'Unknown' if uncertain."
  ```

### **2.3 Data Processing Rules**
- **Category Assignment**: Auto-assign with confidence, no blank values
- **Validation**: Real-time validation during processing
- **Error Handling**: Display errors, prevent file save on failure
- **Results Storage**: Configurable folder via script parameter

---

## **3. USER EXPERIENCE REQUIREMENTS**

### **3.1 Employee Center Experience**
- **Dashboard Portlet**: 
  - Title: "Expense Receipt Capture"
  - Quick upload button
  - Recent uploads status
  - Link to full interface

### **3.2 Full NetSuite Experience**
- **Upload Interface**: Full-featured Suitelet with progress indicators
- **Processing Status**: Real-time updates on processing progress
- **Error Display**: Clear error messages with retry options

### **3.3 Expense Report Integration**
- **Import Button**: Prominent "Import Captured Expenses" button
- **Modal Selection**: 
  - Grid view of available expenses
  - Multi-select capability
  - Preview of expense details
  - Bulk import functionality

---

## **4. IMPLEMENTATION PLAN**

### **Phase 1: Foundation (Tasks 1-2)**
1. **Project Setup & Custom Record**
   - Create project structure
   - Define custom record with all required fields
   - Set up Enhanced File Security integration

### **Phase 2: Core Processing (Tasks 3-4)**
2. **Receipt Upload & Processing**
   - Build upload Suitelet with file size validation
   - Create Map/Reduce script for OCR + LLM processing
   - Implement error handling and validation

### **Phase 3: User Interfaces (Tasks 5-7)**
3. **Employee Center & Expense Report Integration**
   - Create Employee Center portlet
   - Add import button to Expense Reports
   - Build modal interface for expense selection

### **Phase 4: Finalization (Tasks 8-10)**
4. **Permissions, Testing & Deployment**
   - Configure role-based permissions
   - Comprehensive testing across roles
   - Deployment preparation

---

## **5. CONFIGURATION PARAMETERS**

### **Script Parameters**
```javascript
// AINS_MR_ProcessReceipts.js parameters
{
  "maxFileSize": "10", // MB - easily configurable
  "resultsFolderId": "123", // Configurable results storage folder
  "llmModel": "command-r",
  "confidenceThreshold": "0.8",
  "autoAssignCategories": "true"
}
```

### **Deployment Considerations**
- **Multi-Account Compatibility**: Dynamic expense category loading
- **Permission Sets**: Full Access + Employee Center role compatibility
- **Error Recovery**: Robust error handling with user feedback

---

## **6. SUCCESS CRITERIA**

### **Functional Success**
- ✅ Users can upload receipts from both interfaces
- ✅ Automatic processing with 95%+ accuracy
- ✅ Seamless expense import to Expense Reports
- ✅ No blank values in processed records

### **Technical Success**
- ✅ Enhanced File Security integration working
- ✅ Real-time processing with error handling
- ✅ Role-based access control functioning
- ✅ Scalable across multiple NetSuite accounts

### **User Experience Success**
- ✅ Intuitive interfaces for both user types
- ✅ Clear error messaging and recovery
- ✅ Efficient workflow from upload to expense entry

---

## **NEXT STEPS**
1. Begin with Phase 1: Project setup and custom record creation
2. Implement core processing capabilities
3. Build user interfaces
4. Configure permissions and test thoroughly

This solution provides a comprehensive, scalable approach to receipt capture and expense processing that leverages NetSuite's native capabilities while integrating powerful AI-driven document understanding.
```

```markdown
# Receipt Capture System - Detailed Implementation Plan

## **TECHNICAL ARCHITECTURE OVERVIEW**

### **File Structure Organization**
```
src/
├── FileCabinet/
│   └── SuiteScripts/
│       └── AI_NS_ExpenseCapture/
│           ├── Suitelets/
│           │   ├── AINS_SL_ReceiptUpload.js
│           │   ├── AINS_SL_ExpenseImportModal.js
│           │   └── AINS_PL_EmployeeCenterPortlet.js
│           ├── MapReduce/
│           │   └── AINS_MR_ProcessReceipts.js
│           ├── ClientScripts/
│           │   └── AINS_CS_ExpenseReportImport.js
│           ├── Libraries/
│           │   ├── AINS_LIB_OCIIntegration.js
│           │   ├── AINS_LIB_LLMProcessor.js
│           │   └── AINS_LIB_Common.js
│           └── UserEvents/
│               └── AINS_UE_ExpenseCaptureValidation.js
└── Objects/
    └── customrecord_ains_expense_capture.xml
```

---

## **PHASE 1: FOUNDATION SETUP**

### **Task 1: Project Structure & Custom Record** 
**Status**: Pending  
**Dependencies**: None  
**Estimated Time**: 2-3 hours

#### **1.1 Custom Record Definition**
**File**: `Objects/customrecord_ains_expense_capture.xml`

```xml
<customrecord scriptid="customrecord_ains_expense_capture">
    <label>AI NS Expense Capture</label>
    <recordname>AI NS Expense Capture</recordname>
    <customrecordcustomfields>
        <!-- File attachment field -->
        <customrecordcustomfield scriptid="custrecord_ains_file_attachment">
            <label>Receipt File</label>
            <type>FILE</type>
            <mandatory>T</mandatory>
        </customrecordcustomfield>
        
        <!-- Vendor information -->
        <customrecordcustomfield scriptid="custrecord_ains_vendor_name">
            <label>Vendor Name</label>
            <type>FREEFORMTEXT</type>
            <mandatory>T</mandatory>
        </customrecordcustomfield>
        
        <!-- Financial data -->
        <customrecordcustomfield scriptid="custrecord_ains_expense_amount">
            <label>Expense Amount</label>
            <type>CURRENCY</type>
            <mandatory>T</mandatory>
        </customrecordcustomfield>
        
        <customrecordcustomfield scriptid="custrecord_ains_expense_date">
            <label>Expense Date</label>
            <type>DATE</type>
            <mandatory>T</mandatory>
        </customrecordcustomfield>
        
        <!-- Category assignment -->
        <customrecordcustomfield scriptid="custrecord_ains_expense_category">
            <label>Expense Category</label>
            <type>SELECT</type>
            <selectrecordtype>EXPENSE_CATEGORY</selectrecordtype>
            <mandatory>T</mandatory>
        </customrecordcustomfield>
        
        <!-- Processing fields -->
        <customrecordcustomfield scriptid="custrecord_ains_processing_status">
            <label>Processing Status</label>
            <type>SELECT</type>
            <mandatory>T</mandatory>
            <!-- Values: Pending, Processing, Complete, Error -->
        </customrecordcustomfield>
        
        <!-- User and audit fields -->
        <customrecordcustomfield scriptid="custrecord_ains_created_by">
            <label>Created By</label>
            <type>SELECT</type>
            <selectrecordtype>EMPLOYEE</selectrecordtype>
            <mandatory>T</mandatory>
        </customrecordcustomfield>
        
        <!-- Technical fields -->
        <customrecordcustomfield scriptid="custrecord_ains_error_message">
            <label>Error Message</label>
            <type>LONGTEXT</type>
        </customrecordcustomfield>
        
        <customrecordcustomfield scriptid="custrecord_ains_raw_ocr_data">
            <label>Raw OCR Data</label>
            <type>LONGTEXT</type>
        </customrecordcustomfield>
        
        <customrecordcustomfield scriptid="custrecord_ains_llm_response">
            <label>LLM Response</label>
            <type>LONGTEXT</type>
        </customrecordcustomfield>
        
        <customrecordcustomfield scriptid="custrecord_ains_confidence_score">
            <label>Confidence Score</label>
            <type>FLOAT</type>
        </customrecordcustomfield>
    </customrecordcustomfields>
</customrecord>
```

#### **1.2 Directory Structure Creation**
- Create main project directories
- Set up script file templates
- Configure deploy.xml for all components

---

## **PHASE 2: CORE PROCESSING DEVELOPMENT**

### **Task 2: Receipt Upload Suitelet**
**Status**: Pending  
**Dependencies**: Task 1  
**Estimated Time**: 4-5 hours

#### **2.1 AINS_SL_ReceiptUpload.js Structure**
```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/file', 'N/record', 'N/runtime', 'N/url', './AINS_LIB_Common'],
function(ui, file, record, runtime, url, commonLib) {
    
    const SCRIPT_ID = '_nsai_sl_receipt_upload';
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB configurable
    
    function onRequest(context) {
        if (context.request.method === 'GET') {
            return renderUploadForm(context);
        } else {
            return processUpload(context);
        }
    }
    
    function renderUploadForm(context) {
        // Create form with Enhanced File Security integration
        // Include progress indicators
        // Add file size validation
    }
    
    function processUpload(context) {
        // Validate file size and type
        // Create expense capture record
        // Save to Enhanced File Security folder
        // Trigger Map/Reduce processing
    }
    
    function getEnhancedFileSecurityUrl(employeeId) {
        const baseUrl = url.resolveDomain({
            hostType: url.HostType.APPLICATION
        });
        return `${baseUrl}/app/common/media/expensereportmediaitem.nl?target=expense:expmediaitem&label=Attach+File&reportOwner=${employeeId}&entity=${employeeId}`;
    }
    
    return { onRequest };
});
```

#### **2.2 Enhanced File Security Integration**
- Dynamic URL generation per user
- Automatic folder creation handling
- File permission management

### **Task 3: Map/Reduce Processing Script**
**Status**: Pending  
**Dependencies**: Task 1  
**Estimated Time**: 6-8 hours

#### **3.1 AINS_MR_ProcessReceipts.js Structure**
```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/record', 'N/file', 'N/runtime', './AINS_LIB_OCIIntegration', './AINS_LIB_LLMProcessor'],
function(search, record, file, runtime, ociLib, llmLib) {
    
    function getInputData() {
        // Search for expense capture records with status 'Pending'
        return search.create({
            type: 'customrecord_ains_expense_capture',
            filters: [
                ['custrecord_ains_processing_status', 'anyof', 'pending']
            ],
            columns: ['internalid', 'custrecord_ains_file_attachment']
        });
    }
    
    function map(context) {
        // Get record and file
        // Process with OCI Document Understanding
        // Store raw OCR data
        context.write(context.key, context.value);
    }
    
    function reduce(context) {
        // Process OCR data with NetSuite LLM
        // Auto-assign expense categories
        // Update record with processed data
        // Handle errors and confidence scoring
    }
    
    function summarize(context) {
        // Log processing results
        // Handle any failures
        // Update processing status
    }
    
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
```

#### **3.2 Script Parameters Configuration**
```javascript
// Script parameters for easy configuration
const SCRIPT_PARAMS = {
    MAX_FILE_SIZE: 'custscript_ains_max_file_size', // Default: 10MB
    RESULTS_FOLDER_ID: 'custscript_ains_results_folder',
    LLM_MODEL: 'custscript_ains_llm_model', // Default: command-r
    CONFIDENCE_THRESHOLD: 'custscript_ains_confidence_threshold', // Default: 0.8
    AUTO_ASSIGN_CATEGORIES: 'custscript_ains_auto_assign' // Default: true
};
```

---

## **PHASE 3: INTEGRATION LIBRARIES**

### **Task 4: OCI Integration Library**
**Status**: Pending  
**Dependencies**: Task 1  
**Estimated Time**: 4-5 hours

#### **4.1 AINS_LIB_OCIIntegration.js**
```javascript
/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

define(['N/https', 'N/encode', 'N/runtime'],
function(https, encode, runtime) {
    
    function processDocument(fileContent, fileName) {
        try {
            // Implement OCI Document Understanding API call
            // Follow patterns from Document Understanding.md
            const response = callOCIAPI(fileContent, fileName);
            return parseOCIResponse(response);
        } catch (error) {
            throw new Error(`OCR Processing failed: ${error.message}`);
        }
    }
    
    function callOCIAPI(fileContent, fileName) {
        // Configure OCI API call with authentication
        // Handle file encoding and transmission
        // Return raw response
    }
    
    function parseOCIResponse(response) {
        // Extract key fields: vendor, amount, date, description
        // Return structured data object
        return {
            vendor: extractedVendor,
            amount: extractedAmount,
            date: extractedDate,
            description: extractedDescription,
            confidence: overallConfidence,
            rawData: response
        };
    }
    
    return {
        processDocument: processDocument
    };
});
```

### **Task 5: LLM Processing Library**
**Status**: Pending  
**Dependencies**: Task 4  
**Estimated Time**: 3-4 hours

#### **5.1 AINS_LIB_LLMProcessor.js**
```javascript
/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

define(['N/https', 'N/search', 'N/runtime'],
function(https, search, runtime) {
    
    function processWithLLM(ocrData, availableCategories) {
        const prompt = buildPrompt(ocrData, availableCategories);
        const llmResponse = callNetSuiteLLM(prompt);
        return parseStructuredResponse(llmResponse);
    }
    
    function buildPrompt(ocrData, categories) {
        return `You are processing expense receipt data. Based on the OCR extracted data: ${JSON.stringify(ocrData)}, 
                and available expense categories: ${JSON.stringify(categories)}, assign the most appropriate category 
                with high confidence. Format response as JSON with fields: vendor, amount, date, category_id, description. 
                No blank values allowed - use 'Unknown' if uncertain.`;
    }
    
    function callNetSuiteLLM(prompt) {
        // Use patterns from nLLM Module.md
        // Call NetSuite LLM with Command R model
        // Handle real-time processing
    }
    
    function getExpenseCategories() {
        // Dynamic category loading for multi-account compatibility
        return search.create({
            type: 'expensecategory',
            filters: [['isinactive', 'is', 'F']],
            columns: ['internalid', 'name']
        }).run().getRange(0, 1000);
    }
    
    return {
        processWithLLM: processWithLLM,
        getExpenseCategories: getExpenseCategories
    };
});
```

---

## **PHASE 4: USER INTERFACES**

### **Task 6: Employee Center Portlet**
**Status**: Pending  
**Dependencies**: Task 2  
**Estimated Time**: 3-4 hours

#### **6.1 AINS_PL_EmployeeCenterPortlet.js**
```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/runtime', 'N/search', 'N/url'],
function(ui, runtime, search, url) {
    
    function render(params) {
        const portlet = ui.createPortlet({
            title: 'Expense Receipt Capture'
        });
        
        // Add quick upload button
        // Show recent uploads status
        // Link to full Suitelet interface
        
        const uploadUrl = url.resolveScript({
            scriptId: '_nsai_sl_receipt_upload',
            deploymentId: '_nsai_sl_receipt_upload_deploy'
        });
        
        portlet.addColumn({
            id: 'upload_section',
            type: ui.FieldType.INLINEHTML,
            label: 'Quick Upload',
            html: generateUploadSection(uploadUrl)
        });
        
        return portlet;
    }
    
    function generateUploadSection(uploadUrl) {
        // Create compact upload interface
        // Include status indicators
        // Provide navigation to full interface
    }
    
    return { render };
});
```

### **Task 7: Expense Report Import Integration**
**Status**: Pending  
**Dependencies**: Task 1  
**Estimated Time**: 5-6 hours

#### **7.1 AINS_CS_ExpenseReportImport.js**
```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/currentRecord', 'N/ui/dialog', 'N/url'],
function(currentRecord, dialog, url) {
    
    function pageInit(context) {
        // Add 'Import Captured Expenses' button to Expense Report
        addImportButton();
    }
    
    function addImportButton() {
        // Create and position import button
        // Style consistent with NetSuite UI
    }
    
    function openImportModal() {
        const modalUrl = url.resolveScript({
            scriptId: '_nsai_sl_expense_import_modal',
            deploymentId: '_nsai_sl_expense_import_modal_deploy'
        });
        
        window.open(modalUrl, 'importModal', 'width=800,height=600');
    }
    
    function importSelectedExpenses(expenseData) {
        // Process selected expenses
        // Create expense lines
        // Attach receipt files
        // Update expense capture records
    }
    
    return {
        pageInit: pageInit,
        openImportModal: openImportModal,
        importSelectedExpenses: importSelectedExpenses
    };
});
```

#### **7.2 AINS_SL_ExpenseImportModal.js**
```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/search', 'N/runtime'],
function(ui, search, runtime) {
    
    function onRequest(context) {
        if (context.request.method === 'GET') {
            return renderSelectionModal(context);
        } else {
            return processSelection(context);
        }
    }
    
    function renderSelectionModal(context) {
        // Create modal form
        // Display available expense capture records
        // Multi-select grid interface
        // Preview functionality
    }
    
    function processSelection(context) {
        // Process selected expenses
        // Return data to parent window
        // Close modal
    }
    
    return { onRequest };
});
```

---

## **PHASE 5: PERMISSIONS & DEPLOYMENT**

### **Task 8: Permission Configuration**
**Status**: Pending  
**Dependencies**: All previous tasks  
**Estimated Time**: 2-3 hours

#### **8.1 Role-Based Access Setup**
```javascript
// Permission requirements:
// Full Access Role:
// - All script access
// - Custom record CRUD
// - File cabinet access

// Employee Center Role:
// - Limited script access (portlet + upload Suitelet)
// - Create/Read on custom records (own records only)
// - Limited file cabinet access (own folder only)
```

### **Task 9: Testing Framework**
**Status**: Pending  
**Dependencies**: Task 8  
**Estimated Time**: 4-5 hours

#### **9.1 Test Scenarios**
- File upload validation (size, type)
- OCR processing accuracy
- LLM response formatting
- Category auto-assignment
- Error handling and recovery
- Permission restrictions
- Multi-account compatibility

### **Task 10: Deployment Preparation**
**Status**: Pending  
**Dependencies**: Task 9  
**Estimated Time**: 2-3 hours

#### **10.1 Deployment Package**
- Complete deploy.xml configuration
- Script parameter documentation
- Installation instructions
- User training materials

---

## **IMPLEMENTATION SEQUENCE**

### **Week 1: Foundation (Tasks 1-2)**
- Set up project structure
- Create custom record
- Build upload Suitelet with Enhanced File Security

### **Week 2: Processing Engine (Tasks 3-5)**
- Implement Map/Reduce script
- Build OCI integration library
- Create LLM processing library

### **Week 3: User Interfaces (Tasks 6-7)**
- Employee Center portlet
- Expense Report import button and modal

### **Week 4: Finalization (Tasks 8-10)**
- Configure permissions
- Comprehensive testing
- Deployment preparation

---

## **CONFIGURATION CHECKLIST**

### **Script Parameters to Configure**
- ✅ Maximum file size (default: 10MB)
- ✅ Results folder ID
- ✅ LLM model selection (default: command-r)
- ✅ Confidence threshold (default: 0.8)
- ✅ Auto-assign categories (default: true)

### **Deployment Requirements**
- ✅ Enhanced File Security enabled
- ✅ NetSuite LLM module access
- ✅ OCI Document Understanding credentials
- ✅ Appropriate user role permissions

This implementation plan provides a comprehensive roadmap for building the Receipt Capture & Expense Processing system with clear dependencies, time estimates, and technical specifications for each component.
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<customrecord scriptid="customrecord_ains_expense_capture">
    <label>AI NS Expense Capture</label>
    <recordname>AI NS Expense Capture</recordname>
    <description>Custom record for storing captured expense receipt data processed by AI</description>
    <isinactive>F</isinactive>
    <allowquicksearch>T</allowquicksearch>
    <allowduplicates>F</allowduplicates>
    <enableoptimisticlocking>F</enableoptimisticlocking>
    <showid>F</showid>
    <showowner>T</showowner>
    <showcreationdate>T</showcreationdate>
    <showmodified>T</showmodified>
    <enablenumbering>T</enablenumbering>
    <numberingprefix>AINS-</numberingprefix>
    <numberingsuffix></numberingsuffix>
    <numberingmindigits>4</numberingmindigits>
    <numberinginit>1</numberinginit>
    
    <customrecordcustomfields>
        <!-- Primary file attachment field -->
        <customrecordcustomfield scriptid="custrecord_ains_file_attachment">
            <label>Receipt File</label>
            <type>FILE</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>T</mandatory>
            <checkspelling>F</checkspelling>
            <help>The uploaded receipt file processed by OCR</help>
            <displaylength>0</displaylength>
        </customrecordcustomfield>
        
        <!-- Vendor information extracted from receipt -->
        <customrecordcustomfield scriptid="custrecord_ains_vendor_name">
            <label>Vendor Name</label>
            <type>FREEFORMTEXT</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>T</mandatory>
            <checkspelling>F</checkspelling>
            <help>Vendor name extracted from receipt by OCR/LLM</help>
            <displaylength>100</displaylength>
        </customrecordcustomfield>
        
        <!-- Financial data -->
        <customrecordcustomfield scriptid="custrecord_ains_expense_amount">
            <label>Expense Amount</label>
            <type>CURRENCY</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>T</mandatory>
            <help>Total expense amount extracted from receipt</help>
        </customrecordcustomfield>
        
        <customrecordcustomfield scriptid="custrecord_ains_expense_date">
            <label>Expense Date</label>
            <type>DATE</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>T</mandatory>
            <help>Date of expense transaction from receipt</help>
        </customrecordcustomfield>
        
        <!-- Category assignment - dynamically loaded -->
        <customrecordcustomfield scriptid="custrecord_ains_expense_category">
            <label>Expense Category</label>
            <type>SELECT</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>T</mandatory>
            <selectrecordtype>EXPENSE_CATEGORY</selectrecordtype>
            <help>Auto-assigned expense category based on LLM analysis</help>
        </customrecordcustomfield>
        
        <!-- Description/memo field -->
        <customrecordcustomfield scriptid="custrecord_ains_description">
            <label>Description</label>
            <type>TEXTAREA</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>F</mandatory>
            <checkspelling>T</checkspelling>
            <help>Expense description extracted or generated from receipt</help>
            <displaylength>500</displaylength>
        </customrecordcustomfield>
        
        <!-- Processing status tracking -->
        <customrecordcustomfield scriptid="custrecord_ains_processing_status">
            <label>Processing Status</label>
            <type>SELECT</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>T</mandatory>
            <help>Current status of receipt processing</help>
            <selectoptions>
                <selectoption>
                    <value>pending</value>
                    <text>Pending</text>
                </selectoption>
                <selectoption>
                    <value>processing</value>
                    <text>Processing</text>
                </selectoption>
                <selectoption>
                    <value>complete</value>
                    <text>Complete</text>
                </selectoption>
                <selectoption>
                    <value>error</value>
                    <text>Error</text>
                </selectoption>
            </selectoptions>
        </customrecordcustomfield>
        
        <!-- User tracking -->
        <customrecordcustomfield scriptid="custrecord_ains_created_by">
            <label>Created By</label>
            <type>SELECT</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>T</mandatory>
            <selectrecordtype>EMPLOYEE</selectrecordtype>
            <help>Employee who uploaded the receipt</help>
        </customrecordcustomfield>
        
        <!-- Import status for expense report integration -->
        <customrecordcustomfield scriptid="custrecord_ains_imported_to_er">
            <label>Imported to Expense Report</label>
            <type>CHECKBOX</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>F</mandatory>
            <defaultchecked>F</defaultchecked>
            <help>Indicates if this expense has been imported to an expense report</help>
        </customrecordcustomfield>
        
        <customrecordcustomfield scriptid="custrecord_ains_expense_report_id">
            <label>Expense Report ID</label>
            <type>SELECT</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>F</mandatory>
            <selectrecordtype>EXPENSE_REPORT</selectrecordtype>
            <help>Reference to the expense report this was imported to</help>
        </customrecordcustomfield>
        
        <!-- Technical/debugging fields -->
        <customrecordcustomfield scriptid="custrecord_ains_error_message">
            <label>Error Message</label>
            <type>LONGTEXT</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>F</mandatory>
            <checkspelling>F</checkspelling>
            <help>Error details if processing failed</help>
        </customrecordcustomfield>
        
        <customrecordcustomfield scriptid="custrecord_ains_raw_ocr_data">
            <label>Raw OCR Data</label>
            <type>LONGTEXT</type>
            <displaytype>HIDDEN</displaytype>
            <mandatory>F</mandatory>
            <checkspelling>F</checkspelling>
            <help>Raw response from OCI Document Understanding service</help>
        </customrecordcustomfield>
        
        <customrecordcustomfield scriptid="custrecord_ains_llm_response">
            <label>LLM Response</label>
            <type>LONGTEXT</type>
            <displaytype>HIDDEN</displaytype>
            <mandatory>F</mandatory>
            <checkspelling>F</checkspelling>
            <help>Structured response from NetSuite LLM processing</help>
        </customrecordcustomfield>
        
        <customrecordcustomfield scriptid="custrecord_ains_confidence_score">
            <label>Confidence Score</label>
            <type>FLOAT</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>F</mandatory>
            <help>Confidence score for the AI processing (0.0 - 1.0)</help>
        </customrecordcustomfield>
        
        <!-- Processing timestamps -->
        <customrecordcustomfield scriptid="custrecord_ains_processed_date">
            <label>Processed Date</label>
            <type>DATETIMETZ</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>F</mandatory>
            <help>Date and time when processing completed</help>
        </customrecordcustomfield>
        
        <!-- Additional metadata -->
        <customrecordcustomfield scriptid="custrecord_ains_file_size">
            <label>File Size (KB)</label>
            <type>INTEGER</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>F</mandatory>
            <help>Size of uploaded file in kilobytes</help>
        </customrecordcustomfield>
        
        <customrecordcustomfield scriptid="custrecord_ains_file_type">
            <label>File Type</label>
            <type>FREEFORMTEXT</type>
            <displaytype>NORMAL</displaytype>
            <mandatory>F</mandatory>
            <help>Type/extension of uploaded file</help>
            <displaylength>10</displaylength>
        </customrecordcustomfield>
    </customrecordcustomfields>
    
    <!-- Define tabs for better organization -->
    <customrecordtabs>
        <customrecordtab scriptid="tab_main">
            <label>Main</label>
            <fields>
                <field>custrecord_ains_file_attachment</field>
                <field>custrecord_ains_vendor_name</field>
                <field>custrecord_ains_expense_amount</field>
                <field>custrecord_ains_expense_date</field>
                <field>custrecord_ains_expense_category</field>
                <field>custrecord_ains_description</field>
                <field>custrecord_ains_processing_status</field>
                <field>custrecord_ains_confidence_score</field>
            </fields>
        </customrecordtab>
        
        <customrecordtab scriptid="tab_integration">
            <label>Integration</label>
            <fields>
                <field>custrecord_ains_created_by</field>
                <field>custrecord_ains_imported_to_er</field>
                <field>custrecord_ains_expense_report_id</field>
                <field>custrecord_ains_processed_date</field>
            </fields>
        </customrecordtab>
        
        <customrecordtab scriptid="tab_technical">
            <label>Technical</label>
            <fields>
                <field>custrecord_ains_file_size</field>
                <field>custrecord_ains_file_type</field>
                <field>custrecord_ains_error_message</field>
                <field>custrecord_ains_raw_ocr_data</field>
                <field>custrecord_ains_llm_response</field>
            </fields>
        </customrecordtab>
    </customrecordtabs>
    
    <!-- Permissions -->
    <permissions>
        <permission>
            <role>ADMINISTRATOR</role>
            <permlevel>FULL</permlevel>
        </permission>
        <permission>
            <role>EMPLOYEE_CENTER</role>
            <permlevel>CREATE</permlevel>
            <restriction>OWN</restriction>
        </permission>
    </permissions>
</customrecord>
```

```markdown
# AI NS Expense Capture System
## Technical Implementation Reference

### **System Overview**
This system provides automated receipt processing using Oracle OCI Document Understanding and NetSuite LLM integration, with seamless expense report integration.

### **Component Structure**

#### **Core Scripts**
```
Suitelets/
├── AINS_SL_ReceiptUpload.js         - Main upload interface
├── AINS_SL_ExpenseImportModal.js    - Expense selection modal
└── AINS_PL_EmployeeCenterPortlet.js - Dashboard portlet

MapReduce/
└── AINS_MR_ProcessReceipts.js       - Automated receipt processing

ClientScripts/
└── AINS_CS_ExpenseReportImport.js   - ER import button integration

Libraries/
├── AINS_LIB_OCIIntegration.js       - OCI API wrapper
├── AINS_LIB_LLMProcessor.js         - NetSuite LLM integration
└── AINS_LIB_Common.js               - Shared utilities

UserEvents/
└── AINS_UE_ExpenseCaptureValidation.js - Record validation
```

### **Key Features**
- **Enhanced File Security Integration**: Automatic per-user folder creation
- **Real-time Processing**: OCR + LLM processing via Map/Reduce
- **Multi-Role Support**: Full Access + Employee Center compatibility
- **Configurable Parameters**: File size, folders, confidence thresholds
- **No Blank Values**: AI-driven auto-assignment with confidence scoring

### **Processing Flow**
1. **Upload** → Enhanced File Security folder + custom record creation
2. **OCR Processing** → OCI Document Understanding extraction
3. **LLM Enhancement** → NetSuite LLM formatting with category assignment
4. **Import** → Seamless transfer to Expense Reports with file attachment

### **Configuration Parameters**
- `MAX_FILE_SIZE`: Upload limit (default: 10MB)
- `RESULTS_FOLDER_ID`: Processing results storage
- `LLM_MODEL`: Command R model selection
- `CONFIDENCE_THRESHOLD`: Auto-assignment confidence (default: 0.8)
- `AUTO_ASSIGN_CATEGORIES`: Enable/disable auto-assignment

### **Custom Record: customrecord_ains_expense_capture**
**Script ID**: `_ains_expense_capture`  
**Prefix**: `AINS-` (Auto-numbered)

#### **Key Fields**
- `custrecord_ains_file_attachment` - Receipt file (FILE)
- `custrecord_ains_vendor_name` - Extracted vendor (TEXT)
- `custrecord_ains_expense_amount` - Amount (CURRENCY)
- `custrecord_ains_expense_date` - Transaction date (DATE)
- `custrecord_ains_expense_category` - Auto-assigned category (SELECT)
- `custrecord_ains_processing_status` - Status tracking (SELECT)
- `custrecord_ains_confidence_score` - AI confidence (FLOAT)

### **Integration Points**
- **Enhanced File Security**: Auto-folder creation per user
- **OCI Document Understanding**: Receipt text extraction
- **NetSuite LLM**: Data formatting and category assignment
- **Expense Reports**: Import button with modal selection
- **Employee Center**: Dashboard portlet integration

### **Permission Model**
- **Full Access**: Complete CRUD access to all records
- **Employee Center**: Create/Read own records only
- **File Security**: User-specific folder access via Enhanced File Security

### **Deployment Requirements**
- NetSuite LLM module enabled
- Enhanced File Security feature active
- OCI Document Understanding API access
- Appropriate role permissions configured

### **Error Handling**
- File size validation (configurable limit)
- OCR processing failure recovery
- LLM response validation
- Auto-retry mechanisms for transient failures
- User-friendly error messaging

This system provides a comprehensive, scalable solution for automated expense receipt processing with seamless NetSuite integration.
```

```javascript
/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @description Common utilities and constants for AI NS Expense Capture system
 */

define(['N/runtime', 'N/log', 'N/url'],
function(runtime, log, url) {
    
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
            CONFIDENCE_SCORE: 'custrecord_ains_confidence_score',
            PROCESSED_DATE: 'custrecord_ains_processed_date',
            FILE_SIZE: 'custrecord_ains_file_size',
            FILE_TYPE: 'custrecord_ains_file_type'
        },
        
        STATUS: {
            PENDING: 'pending',
            PROCESSING: 'processing',
            COMPLETE: 'complete',
            ERROR: 'error'
        },
        
        SCRIPT_IDS: {
            UPLOAD_SUITELET: '_nsai_sl_receipt_upload',
            PROCESS_MR: '_nsai_mr_process_receipts',
            IMPORT_MODAL: '_nsai_sl_expense_import_modal',
            EMPLOYEE_PORTLET: '_nsai_pl_employee_center_portlet',
            ER_CLIENT_SCRIPT: '_nsai_cs_expense_report_import'
        },
        
        SCRIPT_PARAMS: {
            MAX_FILE_SIZE: 'custscript_ains_max_file_size',
            RESULTS_FOLDER_ID: 'custscript_ains_results_folder',
            LLM_MODEL: 'custscript_ains_llm_model',
            CONFIDENCE_THRESHOLD: 'custscript_ains_confidence_threshold',
            AUTO_ASSIGN_CATEGORIES: 'custscript_ains_auto_assign'
        }
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
     * @returns {boolean} True if valid, false if exceeds limit
     */
    function validateFileSize(fileSizeBytes) {
        const maxSizeMB = getScriptParameter(CONSTANTS.SCRIPT_PARAMS.MAX_FILE_SIZE, 10);
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return fileSizeBytes <= maxSizeBytes;
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
            const employeeCenterRoles = [14, 15, 16]; // Common Employee Center role IDs
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
    
    // Public interface
    return {
        CONSTANTS: CONSTANTS,
        getScriptParameter: getScriptParameter,
        getEnhancedFileSecurityUrl: getEnhancedFileSecurityUrl,
        validateFileSize: validateFileSize,
        getCurrentUser: getCurrentUser,
        formatErrorMessage: formatErrorMessage,
        logOperation: logOperation,
        isEmployeeCenterRole: isEmployeeCenterRole,
        generateTrackingId: generateTrackingId,
        validateRequiredFields: validateRequiredFields
    };
});
```

