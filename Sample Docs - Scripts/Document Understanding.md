# documentUnderstanding

## Summary

The documentUnderstanding exposes OCI document service. It can extract words, lines, key-value pairs, and tables from attached documents.

## General Info

```
Owning Team NS-AI: Product Engineering: Endurance
```
```
Supported Script Types Server scripts
```
```
Contains Restricted Methods Yes
```
```
Reviewed by SuiteScript Team No
```
```
Reviewed by Functional Team Yes
```
```
Client Side Implementation Complete No
```
```
Server Side Implementation Complete Yes
```
## Module

```
Member JSDoc Recomendation Usage FIle Restrictions Promise
Version?
```
```
Returns 1.
Equivalent
```
```
QA
```
```
extractConte
nt(options)
```
```
/**
```
```
* @name
documentUnderstanding#extract
Content
```
```
*
```
```
* @description Extracts text from
a pdfFile
```
```
* @param {Object} options
```
```
* @param {File} options.file - file
to extract from
```
```
* @param {number} [options.
timeout] - timeout in milliseconds,
defaults to minimum value
allowed 30000
```
```
* @return {FileContent} - an
object with a list of segments
```
```
* @throws {SuiteScriptEr ror}
UNSUPPORTED_FILE_TYPE_
_USE_2 if file type is not
supported
```
```
* @throws {SuiteScriptError}
FILE_CANNOT_BE_EMPTY if
file is empty
```
```
* @throws {SuiteScriptError}
DATA_EXTRACTION_TIMED_O
UT is custom or default timeout
is exceeded
```
```
* @throws {SuiteScriptError}
INSUFFICIENT_PERMISSION if
the user does not have access to
the file
```
```
*/
```
```
Use documentUnderstanding.extractContent
(options) is intended to be simple to use with the N
/llm API. It extracts text in an LLM friendly manner for
further querying and supports a single PDF file.
```
```
Future plans:
```
```
Allow for returning breaking up the text into
meaningful chunks to help the LLM better answer
complex questions
Multiple files could be passed
Support other file formats
```
```
File extensions
supported: PDF
Non-
encrypted files
only
```
```
extractConten
t().promise()
File Content Object
```
##### {

```
id:
<document-
id>,
```
```
segments: {
```
```
id: "entire-
content",
```
```
data: <all
content in text
form>
}
};
```
```
N/A
```
```
analyzeDocu
ment
(options)
```
```
/**
```
```
* @name
documentUnderstanding#analyze
Document
```
```
analyzeDocu
ment.
promise()
```
```
N/A
```
```
N/documentUnderstanding module availability
```
```
Please be aware, that N/documentUnderstanding SuiteScript module is available only in 2.1 script version.
```

*

* @description Analyzes
document and returns tables, key
value pairs, words and lines

* @param {Object} options

* @param {string[]} [options.
features] - list of features to be
extracted from attached file
(defaults to
["TEXT_EXTRACTION",
"TABLE_EXTRACTION"]) Check
ENUMS

* @param {string} [options.
documentType] - type of the
document (defaults to "others").
This parameters is required if
your specify the FIELD
EXTRACTION (TBD: Do we
want to expose this field or
FIELD EXTRACTION Pavel
Pyskaty )Check ENUMS

* @param {string} [options.
language] - language of the
document (defaults to english
"ENG") Check ENUMS

* @param {number} [options.
timeout] - timeout in milliseconds,
defaults to 120000

* @param {File} options.file -
input file

* @param {Object} [options.
ociConfig] - config needed for
unlimited usage (all params
ociConfig.* must be passed)

* @param {string} [options.
ociConfig.tenancyId] - tenancy
OCID

* @param {string} [options.
ociConfig.compartmentId] -
compartment OCID

* @param {string} [options.
ociConfig.userId] - user OCID

* @param {string} [options.
ociConfig.endpointId] - endpoint
id (needed when custom OCI
cluster is to be used)

* @param {string} [options.
ociConfig.fingerprint] - fingerprint
of the public key (only secret is
accepted)

* @param {string} [options.
ociConfig.privateKey] -
privateKey of the OCI user (only
secret is accepted)

* @return {Document} -
Response returned by OCI DU
service

* @throws {SuiteScriptError}
SSS_MISSING_REQD_ARGUM
ENT if file parameter is missing

* @throws {SuiteScriptError}
UNSUPPORTED_FILE_TYPE if
file is not one of PDF, TIFF,
PNG, JPG

* @throws {SuiteScriptError}
INVALID_LANGUAGE if
provided language is outside of
Language enum

* @throws {SuiteScriptError}
INVALID_DOCUMENT_TYPE if
provided document type is
outside of DocumentType enum

* @throws {SuiteScriptError}
FEATURES_CANNOT_BE_EMP
TY if list of features to extract is
empty

* @throws {SuiteScriptError}
UNRECOGNIZED_OCI_CONFIG
_PARAMETERS if unknown
parameter for OCI configuration
has been used

* @throws {SuiteScriptError}
ONLY_API_SECRET_IS_ACCEP
TED if privateKey or fingerprint
are not API secrets

```
Use documentUnderstanding.analyzeDocument
(options) if you would like to leverage OCI Document
Understanding without having to learn how to be an OCI
Admin.
```
```
This method supports the OCI DU synchronous API that
only accepts documents of upto 5 pages; for larger
documents use we've provided an asynchronous task to
handle.
```
```
Note: There is a limit of 2000 API calls that are free per
month.
```
```
A current workaround to the 2000 API call limit is to bring
your own license - you can specify OCI credentials using
TBD: Mike Chepesky could you link to existing
documentation on AI Preferences here?
```
```
Check OciConfig for usages
```
```
File extensions
supported: PNG,
JPG, TIFF, PDF
Non-
encrypted files
only
Files containing
up to 5 pages only
```
```
Document Object
```
```
result:
{
pages:
_pages,
```
```
mimeType:
_mimeType
}
```
```
result.pages[0]:
{
words:
_words,
lines:
_lines,
tables:
_tables,
fields:
_fields,
```
```
detectedDocument
Types:
_detectedDocumen
tTypes
}
```
```
result.pages[0].
lines[0]:
{
text:
_text,
```
```
confidence:
_confidence
};
```
```
Check Objects for more details
```

```
* @throws {SuiteScriptError}
MAXIMUM_PARALLEL_REQUE
STS_LIMIT_EXCEEDED if
number of parallel requests to
LLM is greater than 5
```
```
* @throws {SuiteScriptError} DO
CUMENT_TOO_LONG if
Attached document has too
many pages
```
```
* @throws {SuiteScriptError}
DATA_EXTRACTION_TIMED_O
UT is custom or default timeout
is exceeded
```
```
* @throws {SuiteScriptError}
INSUFFICIENT_PERMISSION if
the user does not have access to
the file.
```
```
*/
```
```
Async Task
for
Document
Understanding
```
```
When creating an asynchronous
task for documentUnderstanding,
```
```
all the same parameters that
would be used for the
synchronous call can be passed
directly through the task
submission.
```
```
Use documentUnderstanding.analyzeDocument
(options) if you would like to leverage OCI Document
Understanding without having to learn how to be an OCI
Admin.
```
```
For processing larger documents (beyond the 5-page
limit for the synchronous method) or for scenarios where
you need to offload document analysis to a background
process, use the asynchronous task submission. This
also leverages Oracle OCI Document Understanding
services and accepts all the same parameters as the
synchronous analyzeDocument method. Remember to
submit this via a workqueue task.
```
```
Check ENUMS for features, documentTypes and
language params.
```
```
Check OciConfig for usages
```
```
The asynchronous
version of analyzeDocum
ent cannot be called
directly from the documen
tUnderstanding
module. Instead, it must
be submitted as a
workqueue task.
```
```
N/A
```
```
parseAnalysi
sResult
(options)
```
```
/**
```
```
* Convert a JSON file (from
analyseDocument(option)) into a
Document object type.
```
```
*
```
```
* @param {Object} options
```
```
* @param {File} options.file The
JSON file to parse analysis result
from
```
```
* @return {Document} The
parsed document resulting from
the analysis
```
```
* @throws {SuiteScriptError}
UNSUPPORTED_FILE_TYPE_
_USE_2 when the file type is not
JSON
```
```
* @throws {SuiteScriptError}
INSUFFICIENT_PERMISSION if
the user does not have access to
the file
```
```
*/
```
```
N/A
```
## Objects and Usage for extractContent

### Example of extractContent

```
documentUnderstanding.extractContent({file: file.load(42)})
```

```
extractContent return format
```
##### {

```
id: <document-id>,
segments: {
id: "entire-content",
data: <all content in text form>
}
};
```
### Usages with llm APIs

#### Generate Text

```
documentUnderstanding.extractContent + llm.generateText
```
```
require(["N/file", "N/documentUnderstanding", "N/llm"], function (file, documentUnderstanding, llm) {
const extractedData = documentUnderstanding.extractContent({file:file.load("15")}); // "15" is the
unique id of a PDF file stored in the file cabinet.
```
```
const response = llm.generateText({
modelFamily: llm.ModelFamily.COHERE_COMMAND_A,
prompt: "What is this invoice for?",
documents: extractedData.segments
});
```
```
log.debug('Answer: ', response.text);
log.debug('Citations: ', response.citations);
});
```
## Objects and Usage for analyzeDocument

### Examples of analyzeDocument - Syncronous

Example 1: Extract text, tables, and key-value pairs from the input file (PDF document stored in the file cabinet). ()

Input file: Output result:

```
Example 1 script code
```
```
require(["N/file", "N/documentUnderstanding"], function (file, documentUnderstanding) {
```
```
const extractedData = documentUnderstanding.analyzeDocument({
file:file.load("109279"),
features: ["TEXT_EXTRACTION", "TABLE_EXTRACTION", "FIELD_EXTRACTION"],
documentType: "INVOICE"
})
log.debug('Extracted Data: ', extractedData);
});
```

Example 2: Extract content from an Invoice, converts the result into a string object and pass to the LLM as data through "documents" param along with
some question into "prompt" param.

Output result:

```
Answer: : This invoice is for web design services.
Citations: : [{"start":20,"end":30,"text":"web design","documentIds":["1"]}]
```
```
Converts the JSON returned result into a string object.
```
```
require(["N/file", "N/documentUnderstanding", "N/llm"], function (file, documentUnderstanding, llm) {
const extractedData = documentUnderstanding.analyzeDocument({
file:file.load("14"),
features: ["TEXT_EXTRACTION", "TABLE_EXTRACTION", "FIELD_EXTRACTION"],
documentType: "INVOICE"
});
```
```
const response = llm.chat({
preamble: "Your task is to parse JSON document and answer to any query about that document",
prompt: "What is this invoice for?",
documents: [{id:"1", data:JSON.stringify(extractedData)}]
});
log.debug('Answer: ', response.text);
log.debug('Citations: ', response.citations);
});
```
For a specific use-case you may want to process the result in a different way before converting to text (perhaps converting tables to markdown)

### Examples of Asynchronous Tasks

To text on a scrumbox, Timer Service has to be enabled first.

```
Enable Time Service on Runbox
```
```
ssh nsbuild@<runbox-address.com>
nsh 'scfg runTimerService true'
nlrestart
```
#### Submitting a Task

The synchronous method only supports documents with up to 5 pages. For larger documents, you'll need to submit a workqueue task directly from
SuiteScript.

##### /**

```
* @NApiVersion 2.
* @NScriptType restlet
*/
require(['N/task', 'N/file'],function(task, file){
```
```
var docTask = task.create(task.TaskType.DOCUMENT_UNDERSTANDING); // Creates the Task
docTask.documentType = "INVOICE";
docTask.inputFile = file.load("443"); // unique id of a file saved in the
file cabinet
docTask.outputFilePath="SuiteScripts/result.json";
```
```
docTask.submit(); // submit the task, result.json will
be saved on specified folder after few minutes
})
```
#### Result Processing


This example converts the returned JSON file directly into a string. However, for most real-world scenarios, you'll want to process the JSON data more
thoroughly before converting it to text. For instance, if your document contains tables, you might want to transform them into Markdown format for better
usability.

```
Example, parsing result file saved on FileStorage
```
##### /**

```
* @NApiVersion 2.
* @NScriptType restlet
*/
require(["N/file", "N/documentUnderstanding"], function (file, documentUnderstanding) {
const resultJSON = file.load({ id: "109182" });
```
```
const parsedResult = documentUnderstanding.parseAnalysisResult(resultJSON);
log.debug('Extracted Data: ', parsedResult);
debugger;
});
```
#### Submitting a Task & Result Processing

This example that demonstrates a more advanced use case: submit a task utilizing a deployed SuiteScript to process the result file. This script can then p
arse the extracted information and send specific questions to llm module.

```
Example of task creating and runing deployed script after
```
```
require(['N/task', 'N/file'],function(task, file){
```
```
var docTask = task.create(task.TaskType.DOCUMENT_UNDERSTANDING); // create the Task
docTask.documentType = "INVOICE";
docTask.inputFile = file.load("443"); // unique id of the file saved in the
file cabinet that you want to ask questions from
docTask.outputFilePath="SuiteScripts/result.json"; // the location where the JSON file
will be saved
```
```
var scheduledScript = task.create(task.TaskType.SCHEDULED_SCRIPT); // add scheduled script to process the
result of the task run
scheduledScript.scriptId = 106; // unique id of the deployed script to
run
docTask.addInboundDependency(scheduledScript);
```
```
docTask.submit(); // submit the task
})
```

```
Example of a deployed script to run
```
##### /**

```
* @NApiVersion 2.
* @NScriptType ScheduledScript
* @NModuleScope SameAccount
*/
define(['N/documentUnderstanding', 'N/file', 'N/llm'],
function(docUnd, file, llm) {
function execute(scriptContext) {
const resultFile = file.load("SuiteScripts/result.json");
var result = docUnd.parseAnalysisResult(resultFile);
const response = llm.chat({
preamble: "Your task is to parse JSON document and answer to any query about that document",
prompt: "What is this invoice for?", //Or Ask specific Question about the file content
documents:[{
id:"1",
data:JSON.stringify(result)
}]
});
log.debug("response", response.text);
}
return {
execute: execute
};
});
```
## Objects

```
Object Comment
```
```
Document Resulting document object
```
```
Page Page of the document
```
```
Word Extracted word
```
```
Line Extracted line
```
```
Field Extracted field
```
```
FieldLabel Label of the field
```
```
FieldValue Value of the field
```
```
Table Extracted table
```
```
TableRow Row of the table
```
```
Cell Cell of the table
```
```
FileContent Content of the file (processed)
```
```
FileSegment Segment of the processed file
```
### Document

```
Member JSDoc Comment
```

```
mimeType /**
* MimeType of the document
* @name Document#mimeType
* @type {string}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
pages /**
* Pages of the analyzed document
* @name Document#pages
* @type {Page[]}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
### Page

```
Member JSDoc Comment
```
```
words /**
* Words found in the document
* @name Page#words
* @type {Word[]}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
lines /**
* Lines found in the document
* @name Page#lines
* @type {Line[]}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
tables /**
* Tables found in the document
* @name Page#tables
* @type {Table[]}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
fields /**
* Fields found in the document
* @name Page#fields
* @type {Field[]}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
### Word

```
Member JSDoc Comment
```

```
text /**
* Text of the word
* @name Word#text
* @type {string}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
confidence /**
* Confidence of the word's detection accuracy
* @name Word#confidence
* @type {number}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
### Line

```
Member JSDoc Comment
```
```
text /**
* Text of the line
* @name Line#text
* @type {string}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
confidence /**
* Confidence of the line's detection accuracy
* @name Line#confidence
* @type {number}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
### Field

```
Member JSDoc Comment
```
```
label /**
* Label of the field
* @name Field#label
* @type {FieldLabel}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
value /**
* Value of the field
* @name Field#value
* @type {FieldValue}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```

```
type /**
* Type of the field (from the FieldType enum)
* @name Field#type
* @type {string}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
### FieldLabel

```
Member JSDoc Comment
```
```
name /**
* name of the field label
* @name FieldLabel#name
* @type {string}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when setting
the property is attempted
*
* @since 2025.
*/
```
```
confidence /**
* Confidence of the field label's detection accuracy
* @name FieldLabel#confidence
* @type {number}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when setting
the property is attempted
*
* @since 2025.
*/
```
### FieldValue

```
Member JSDoc Comment
```
```
text /**
* text of the field
* @name FieldValue#text
* @type {string}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when setting
the property is attempted
*
* @since 2025.
*/
```
```
confidence /**
* Confidence of the field value's detection accuracy
* @name FieldValue#confidence
* @type {number}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when setting
the property is attempted
*
* @since 2025.
*/
```
### Table

```
Member JSDoc Comment
```

```
rowCount /**
* Row count of the table
* @name Table#rowCount
* @type {number}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
columnCount /**
* Column count of the table
* @name Table#columnCount
* @type {number}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
confidence /**
* Confidence of the table detection
* @name Table#confidence
* @type {number}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
headerRows /**
* Header rows of the table
* @name Table#headerRows
* @type {TableRow[]}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
bodyRows /**
* Body rows of the table
* @name Table#bodyRows
* @type {TableRow[]}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
footerRows /**
* Footer rows of the table
* @name Table#footerRows
* @type {TableRow[]}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
### TableRow

```
Member JSDoc Comment
```

```
cells /**
* cells of the row
* @name TableRow#cells
* @type {Cell[]}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
### Cell

```
Member JSDoc Comment
```
```
text /**
* text of the cell
* @name Cell#text
* @type {string}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
confidence /**
* Confidence of the cell value's detection
* @name Cell#confidence
* @type {number}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
### FileContent

```
Member JSDoc Comment
```
```
id /**
* Id of the FileContent
* @name FileContent#id
* @type {string}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
segments /**
* Segments of the file content
* @name FileContent#segments
* @type {FileSegment[]}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
readAll() /**
* Returns the entire extracted content
* @type {string}
* @return extracted file content in plain text
*
* @since 2025.
*/
```
### FileSegment


```
Member JSDoc Comment
```
```
id /**
* Id of the FileSegment
* @name FileSegment#id
* @type {string}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
```
data /**
* data of the segment
* @name FileSegment#data
* @type {string}
* @readonly
* @throws {SuiteScriptError} READ_ONLY when
setting the property is attempted
*
* @since 2025.
*/
```
## Enums

```
Name Values Usages
```
```
Feature TEXT_EXT
RACTION
```
##### TABLE_EX

##### TRACTION

##### FIELD_EX

##### TRACTION

##### DOCUMENT

##### _CLASSIF

##### ICATION

```
The features parameter allow us to specify which types of information to extract from a document, such as text, tables, or
key-value pairs.
```
```
FieldTypeLINE_ITEM
_GROUP
```
##### LINE_ITEM

##### LINE_ITEM

##### _FIELD

##### KEY_VALUE

##### UNKNOWN

```
The FieldType enum describes the category or type of data extracted for a specific field (e.g., DATE, ADDRESS, NUMBER). It
adds semantic meaning to the extracted information, aiding in structured processing and better understanding of the results.
```

```
Docume
ntType
```
##### INVOICE

##### RECEIPT

##### RESUME

##### TAX_FORM

##### DRIVE_LIC

##### ENSE

##### PASSPORT

##### BANK_STA

##### TEMENT

##### CHECK

##### PAYSLIP

##### HEALTH_I

##### NSURANC

##### E_ID

##### OTHERS

```
The documentType has to be used in conjuction with feature: ["TEXT_EXTRACTION"]
```
```
Essentially the documentType parameter helps the service apply pre-trained models specifically optimized for certain
document categories. When documentType (e.g., "INVOICE", "RECEIPT", "PASSPORT"), is specified we are essentially
telling the service what kind of document it's analyzing.
```
```
Example:
```
```
documentUnderstanding.analyzeDocument({
file:file.load("14"),
features: ["FIELD_EXTRACTION"],
documentType: "RECEIPT"
});
```
```
LanguageENG Supported languages
```
## OciConfig

```
If an ociConfig is explicitly passed as a parameter to the method, it will override any ociConfig settings configured within NetSuite's AI
Preferences.
If no ociConfig parameter is provided, the system will then check if a custom ociConfig is set in NetSuite's AI Preferences. If one is found,
that configuration will be used.
If neither an ociConfig parameter is passed nor a custom ociConfig is set in AI Preferences, a default ociConfig will be applied.
```
### How to pass the OciConfig to analyzeDocument?

The OciConfig object must contain all parameters as shown is this example:

```
OciConfig Object
```
```
ociConfig = {
userId: 'user-ocid',
tenancyId: 'user-tenancy',
compartmentId: 'user-compartment',
fingerprint: 'custsecret_secret_fingerprint_id',
privateKey: 'custsecret_secret_privatekey_id',
objectStorageNamespace: 'oraclenetsuite',
outputBucketName: 'in-bucket-name',
inputBucketName: 'out-bucket-name'
};
```
### Enable and Configure OCI Credentials for AI in NetSuite

### When a custom OciConfig should used?

### Understanding the limits for default OciConfig?


