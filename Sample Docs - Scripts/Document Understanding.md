# Summary

<p style="color: rgb(23,43,77);background-color: rgb(255,250,230);border-color: rgb(255,235,173);border-width: 1px;border-style: solid;border-radius: 3px;padding: 10px;font-size: 14px;line-height: 20px;"><b style="color: rgb(23,43,77);">N/documentUnderstanding module availability</b><br style="color: rgb(23,43,77);">Please be aware, that N/documentUnderstanding SuiteScript module is available only in 2.1 script version.</p>

The **documentUnderstanding** exposes OCI document service. It can extract words, lines, key value pairs and tables from within attached document

# General Info

| Owning Team | Supported Script Types | Contains Restricted Methods | Reviewed by SuiteScript Team | Reviewed by Functional Team | Client Side Implementation Complete | Server Side Implementation Complete |
| --- | --- | --- | --- | --- | --- | --- |
| NS-AI: Product Engineering: Endurance | Server scripts | Yes | No | Yes | No | Yes |

# Module

```

```

| Member | JSDoc | 1.0 Equivalent | Restrictions | Promise Version? | Comments | Future Enhancements | QA |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [extractContent(options)](#extractContent) | ``` /**
 * @name documentUnderstanding#extractContent
 * @function
 * @description Extracts text from a pdfFile
 * @param {Object} options
 * @param {File} options.file - file to extract from
 * @param {number} [options.timeout] - timeout in milliseconds, defaults to minimum value allowed 30000
 * @return {FileContent} - an object with a list of segments
 * @throws {SuiteScriptError} UNSUPPORTED_FILE_TYPE_1_USE_2 if file type is not supported
 * @throws {SuiteScriptError} FILE_CANNOT_BE_EMPTY if file is empty
 * @since 2025.1
 */ ``` | N/A | File type supported: **PDF** Non-encrypted files only  | extractContent().promise() | Extracts LLM-friendly text from a single, non-encrypted PDF file of any size or page count, ready to be sent directly to the N/llm API (generateText or embed). Return type ``` {
	id: <document-id>,						  	segments: {
		id: "entire-content",
		data: <all content in text form>
	}
}; ``` | To support encrypted files Chunking of content Additional processing to the output content to support tables and other formatting | ![](Screen%20Shot%202014-04-16%20at%208.21.10%20AM.png) |
| [analyzeDocument(options)](#analyzeDocument) | ``` /**
 * Analyzes document and returns tables, key value pairs, words and lines
 *
 * @param {Object} options
 * @param {string[]} [options.features] - list of features to be extracted from attached file (defaults to all TEXT_EXTRACTION & TABLE_EXTRACTION)
 * @param {string} [options.documentType] - type of the document (defaults to others)
 * @param {string} [options.language] - language of the document (defaults to english)
 * @param {number} [options.timeout] - timeout in milliseconds, defaults to 30000
 * @param {File} options.file - input file
 * @param {Object} [options.ociConfig] - config needed for unlimited usage
 * @param {string} [options.ociConfig.tenancyId] - tenancy OCID
 * @param {string} [options.ociConfig.compartmentId] - compartment OCID
 * @param {string} [options.ociConfig.userId] - user OCID
 * @param {string} [options.ociConfig.endpointId] - endpoint id (needed when custom OCI cluster is to be used)
 * @param {string} [options.ociConfig.fingerprint] - fingerprint of the public key (only secret is accepted)
 * @param {string} [options.ociConfig.privateKey] - privateKey of the OCI user (only secret is accepted)
 * @return {Document} - Document with all the extracted data
 *
 * @throws {SuiteScriptError} SSS_MISSING_REQD_ARGUMENT if file parameter is missing
 * @throws {SuiteScriptError} UNSUPPORTED_FILE_TYPE if file is not one of PDF, TIFF, PNG, JPG
 * @throws {SuiteScriptError} INVALID_LANGUAGE if provided language is outside of Language enum
 * @throws {SuiteScriptError} INVALID_DOCUMENT_TYPE if provided document type is outside of DocumentType enum
 * @throws {SuiteScriptError} FEATURES_CANNOT_BE_EMPTY if list of features to extract is empty
 * @throws {SuiteScriptError} UNRECOGNIZED_OCI_CONFIG_PARAMETERS if unknown parameter for OCI configuration has been used
 * @throws {SuiteScriptError} ONLY_API_SECRET_IS_ACCEPTED if privateKey or fingerprint are not API secrets
 * @throws {SuiteScriptError} MAXIMUM_PARALLEL_REQUESTS_LIMIT_EXCEEDED if number of parallel requests to LLM is greater
 *     than 5
 *
 * @since 2025.1
 */ ``` | N/A | File type supported: **PNG, JPG, TIFF, PDF** Non-encrypted files only  Files containing** up to 5 pages** only | analyzeDocument.promise() | Leverages more advanced extraction techniques for key-value pairs and tables to generate LLM-friendly text from documents in PNG, JPG, TIFF, or PDF format (up to 5 pages). The extracted text is ready for use with the N/llm API (generateText or embed). You can specify 'features' as: TEXT_EXTRACTION, TABLE_EXTRACTION, FIELD_EXTRACTION, DOCUMENT_CLASSIFICATION, or leave it blank to default to TABLE_EXTRACTION and TEXT_EXTRACTION. | **Change the return type of AnalyzeDocument to match the same as extractContent (FileContent).** - Advantages: One method can be swapped in place of the other without any script changes 1. More readable, less noise sent to llm by removing words and lines from the output 2. segments can directly be passed to llm documents | ![](Screen%20Shot%202014-04-16%20at%208.21.10%20AM.png) |
| [Async Task for Document Understanding](#async) | The asynchronous version of analyzeDocument cannot be invoked directly from the documentUnderstanding module; A workqueue task has to be submitted. Parameters that can be specified when submitting: ``` * file loaded from the file cabinet to extract content
 * language - (defaults to english)
 * documentType - type of the document (defaults to others)
 * features - list of features to be extracted from attached file (defaults to all TEXT_EXTRACTION & TABLE_EXTRACTION)
 * outputFilePath - Path location where a JSON result (the response of the call from OCI DU) that will be parsed to text
 * completionScripts - suiteScript used by the scheduled script that will parse the result
 * @param ociConfig - OCI configuration
 * @throws {SuiteScriptError} Throws permission errors if the user does not have access to the file.
 ``` ```
 ``` | N/A | The asynchronous version of analyzeDocument cannot be invoked directly from the documentUnderstanding module; it must be submitted as a workqueue task. | | Same as [analyzeDocument(options)](#analyzeDocument), but for larger documents (bigger than 5 pages) | Call async method using **analyzeDocument(options)** as well | |
| [parseAnalysisResult(options)](#Process) | ``` /**
 * Convert a JSON file (from analyseDocument(option)) into a Document object type.
 *
 * @param {Object} options
 * @param {File} options.file The JSON file to parse analysis result from
 * @return {Document} The parsed document resulting from the analysis
 * @throws {SuiteScriptError} UNSUPPORTED_FILE_TYPE_1_USE_2 when the file type is not JSON
 */ ``` | N/A | | | | | |

## <a name="extractContent"></a>Objects and Usage for extractContent

### Example of extractContent

```
documentUnderstanding.extractContent(file.load(42))
```

```
extractContent return format
{
    id: <document-id>,
    segments: {
        id: "entire-content",
        data: <all content in text form>
    }
};
```

### Usages with llm APIs

"15" → The unique identifier of a PDF file stored in the file cabinet.

#### Generate Text

```
documentUnderstanding.extractContent + llm.generateText
require(["N/file", "N/documentUnderstanding", "N/llm"], function (file, documentUnderstanding, llm) {  
	const extractedData = documentUnderstanding.extractContent({file:file.load("15")});

    const response = llm.generateText({
                modelFamily: llm.ModelFamily.COHERE_COMMAND_A,
                prompt:  "What is this invoice for?",
                documents: extractedData.segments
            });

    log.debug('Answer: ', response.text);
    log.debug('Citations: ', response.citations);
});
```

#### Embed

```
embed
require(["N/file", "N/documentUnderstanding", "N/llm"], function (file, documentUnderstanding, llm) {
    const extractedData = documentUnderstanding.extractContent({file:file.load("15")});

    const resp = llm.embed(
     {
	   modelFamily: llm.ModelFamily.COHERE_EMBED_MULTILINGUAL,
       prompt: "questions",
       inputs: extractedData.segments.map(docSegment => docSegment.data)
     })
});
```

Can be used to create embeddings of multiple documents in a RAG pipeline

## <a name="analyzeDocument"></a>Objects and Usage for analyzeDocument

| Object | Comment |
| --- | --- |
| [Document](#objects_Document) | Resulting document object |
| [Page](#objects_Page) | Page of the document |
| [Word](#objects_Word) | Extracted word |
| [Line](#objects_Line) | Extracted line |
| [Field](#objects_Field) | Extracted field |
| [FieldLabel](#objects_FieldLabel) | Label of the field |
| [FieldValue](#objects_FieldValue) | Value of the field |
| [Table](#objects_Table) | Extracted table |
| [TableRow](#objects_TableRow) | Row of the table |
| [Cell](#objects_Cell) | Cell of the table |
| [FileContent](#objects_FileContent) | Content of the file (processed) |
| [FileSegment](#objects_FileSegment) | Segment of the processed file |

### <a name="objects_Document"></a>Document

| Member | JSDoc | Comment |
| --- | --- | --- |
| mimeType | ``` /**
 * MimeType of the document
 * @name Document#mimeType
 * @type {string}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| pages | ``` /**
 * Pages of the analyzed document
 * @name Document#pages
 * @type {Page[]}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |

### <a name="objects_Page"></a>Page

| Member | JSDoc | Comment |
| --- | --- | --- |
| words | ``` /**
 * Words found in the document
 * @name Page#words
 * @type {Word[]}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| lines | ``` /**
 * Lines found in the document
 * @name Page#lines
 * @type {Line[]}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| tables | ``` /**
 * Tables found in the document
 * @name Page#tables
 * @type {Table[]}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| fields | ``` /**
 * Fields found in the document
 * @name Page#fields
 * @type {Field[]}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |

### <a name="objects_Word"></a>Word

| Member | JSDoc | Comment |
| --- | --- | --- |
| text | ``` /**
 * Text of the word
 * @name Word#text
 * @type {string}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| confidence | ``` /**
 * Confidence of the word's detection accuracy
 * @name Word#confidence
 * @type {number}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |

### <a name="objects_Line"></a>Line

| Member | JSDoc | Comment |
| --- | --- | --- |
| text | ``` /**
 * Text of the line
 * @name Line#text
 * @type {string}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| confidence | ``` /**
 * Confidence of the line's detection accuracy
 * @name Line#confidence
 * @type {number}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |

### <a name="objects_Field"></a>Field

| Member | JSDoc | Comment |
| --- | --- | --- |
| label | ``` /**
 * Label of the field
 * @name Field#label
 * @type {FieldLabel}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| value | ``` /**
 * Value of the field
 * @name Field#value
 * @type {FieldValue}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| type | ``` /**
 * Type of the field (from the FieldType enum)
 * @name Field#type
 * @type {string}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |

### <a name="objects_FieldLabel"></a>FieldLabel

| Member | JSDoc | Comment |
| --- | --- | --- |
| name | ``` /**
 * name of the field label
 * @name FieldLabel#name
 * @type {string}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| confidence | ``` /**
 * Confidence of the field label's detection accuracy
 * @name FieldLabel#confidence
 * @type {number}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |

### <a name="objects_FieldValue"></a>FieldValue

| Member | JSDoc | Comment |
| --- | --- | --- |
| text | ``` /**
 * text of the field
 * @name FieldValue#text
 * @type {string}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| confidence | ``` /**
 * Confidence of the field value's detection accuracy
 * @name FieldValue#confidence
 * @type {number}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |

### <a name="objects_Table"></a>Table

| Member | JSDoc | Comment |
| --- | --- | --- |
| rowCount | ``` /**
 * Row count of the table
 * @name Table#rowCount
 * @type {number}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| columnCount | ``` /**
 * Column count of the table
 * @name Table#columnCount
 * @type {number}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| confidence | ``` /**
 * Confidence of the table detection
 * @name Table#confidence
 * @type {number}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| headerRows | ``` /**
 * Header rows of the table
 * @name Table#headerRows
 * @type {TableRow[]}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| bodyRows | ``` /**
 * Body rows of the table
 * @name Table#bodyRows
 * @type {TableRow[]}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| footerRows | ``` /**
 * Footer rows of the table
 * @name Table#footerRows
 * @type {TableRow[]}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |

### <a name="objects_TableRow"></a>TableRow

| Member | JSDoc | Comment |
| --- | --- | --- |
| cells | ``` /**
 * cells of the row
 * @name TableRow#cells
 * @type {Cell[]}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |

### <a name="objects_Cell"></a>Cell

| Member | JSDoc | Comment |
| --- | --- | --- |
| text | ``` /**
 * text of the cell
 * @name Cell#text
 * @type {string}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| confidence | ``` /**
 * Confidence of the cell value's detection
 * @name Cell#confidence
 * @type {number}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |

### <a name="objects_FileContent"></a>FileContent

| Member | JSDoc | Comment |
| --- | --- | --- |
| id | ``` /**
 * Id of the FileContent
 * @name FileContent#id
 * @type {string}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| segments | ``` /**
 * Segments of the file content
 * @name FileContent#segments
 * @type {FileSegment[]}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| readAll() | ``` /**
 * Returns the entire extracted content
 * @type {string}
 * @return extracted file content in plain text
 *
 * @since 2025.1
 */ ``` | |

### <a name="objects_FileContent"></a>FileSegment

| Member | JSDoc | Comment |
| --- | --- | --- |
| id | ``` /**
 * Id of the FileSegment
 * @name FileSegment#id
 * @type {string}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |
| data | ``` /**
 * data of the segment
 * @name FileSegment#data
 * @type {string}
 * @readonly
 * @throws {SuiteScriptError} READ_ONLY when setting the property is attempted
 *
 * @since 2025.1
 */ ``` | |

### Enums

| | |
| --- | --- |
| Feature | TEXT_EXTRACTION TABLE_EXTRACTION FIELD_EXTRACTION
DOCUMENT_CLASSIFICATION |
| FieldType | LINE_ITEM_GROUP LINE_ITEM LINE_ITEM_FIELD KEY_VALUE UNKNOWN |
| DocumentType | INVOICE RECEIPT RESUME TAX_FORM DRIVE_LICENSE PASSPORT BANK_STATEMENT CHECK PAYSLIP HEALTH_INSURANCE_ID OTHERS |

### Examples of analyzeDocument

```
documentUnderstanding.analyzeDocument({file:file.load("443"), documentType:"INVOICE"})
```

#### <a name="async"></a>Syncronous

This example simply converts the JSON returned to a string object.

For a specific use-case you may want to process the result in a different way before converting to text (perhaps converting tables to markdown)

```js
require(["N/file", "N/documentUnderstanding", "N/llm"], function (file, documentUnderstanding, llm) {
    const extractedData = documentUnderstanding.analyzeDocument({
        file:file.load("14"),
        documentType: "INVOICE"
    });

    const response = llm.chat({
        preamble: "Your task is to parse JSON document and answer to any query about that document",
        prompt:  "What is this invoice for?",
        documents: [{id:"1", data:JSON.stringify(extractedData)}]
});
    log.debug('Answer: ', response.text);
    log.debug('Citations: ', response.citations);
});

```

#### <a name="async"></a>Asyncronous Task Usage

#### Setup and Configuration

To enable the Timer Service on the runbox, execute the following commands:

```bash
ssh nsbuild@<runbox-address.com>
nsh 'scfg runTimerService true'
nlrestart
```

**Submitting a Task**

```js
require(['N/task', 'N/file'],function(task, file){

    //Create the Task
    var docTask = task.create(task.TaskType.DOCUMENT_UNDERSTANDING);
    docTask.documentType = "INVOICE";
    docTask.inputFile = file.load("443"); // unique id of a file saved in the file cabinet
    docTask.outputFilePath="SuiteScripts/Archive-Not-Used-Files/result.json";

    //Add a scheduled script to process the result of the task run
    var scheduledScript = task.create(task.TaskType.SCHEDULED_SCRIPT);
    scheduledScript.scriptId = 106; // unique id of the script to run
    docTask.addInboundDependency(scheduledScript);

    //Submit the task
    docTask.submit();
})
```

#### **<a name="Process"></a>Processing the result**

This example simply converts the JSON returned to a string object.

For a specific use-case you may want to process the result in a different way before converting to text (perhaps converting tables to markdown)

```js
the deployed script to be executed
/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/documentUnderstanding', 'N/file', 'N/llm'],
	function(docUnd, file, llm) {
		function execute(scriptContext) {
			const resultFile = file.load("SuiteScripts/Archive-Not-Used-Files/result.json");
			var result = docUnd.parseAnalysisResult(resultFile);
			const response = llm.chat({
            							preamble: "Your task is to parse JSON document and answer to any query about that document",
            							prompt: "What is this invoice for?", //Or Ask specific Question about the file content
            							documents:[
													{
														id:"1",
														data:JSON.stringify(result)
													}
												  ]
        						  });
           log.debug("response", response.text);
		}
		return {
			execute: execute
		};
});
```