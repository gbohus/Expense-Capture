Summary
=======

N/documentUnderstanding module availability

Please be aware, that N/documentUnderstanding SuiteScript module is available only in 2.1 script version.

The **documentUnderstanding** exposes OCI document service. It can extract words, lines, key-value pairs, and tables from attached documents.

General Info
------------

Owning Team

NS-AI: Product Engineering: Endurance

Supported Script Types

Server scripts

Contains Restricted Methods

Yes

Reviewed by SuiteScript Team

No

Reviewed by Functional Team

Yes

Client Side Implementation Complete

No

Server Side Implementation Complete

Yes

Module
------





Member

JSDoc

Recomendation Usage

FIle Restrictions

Promise Version?

Returns

1.0 Equivalent

QA

/\*\*

\* @name documentUnderstanding#extractContent

\*

\* @description Extracts text from a pdfFile

\* @param {Object} options

\* @param {File} options.file - file to extract from

\* @param {number} \[options.timeout\] - timeout in milliseconds, defaults to minimum value allowed 30000

\* @return {FileContent} - an object with a list of segments

 \* @throws {SuiteScriptEr ror} UNSUPPORTED\_FILE\_TYPE\_1\_USE\_2 if file type is not supported

\* @throws {SuiteScriptError} FILE\_CANNOT\_BE\_EMPTY if file is empty

 \* @throws {SuiteScriptError} DATA\_EXTRACTION\_TIMED\_OUT is custom or default timeout is exceeded

\* @throws {SuiteScriptError} INSUFFICIENT\_PERMISSION if the user does not have access to the file

\*/

Use `documentUnderstanding.extractContent(options)` when you need to extract all text from a PDF file for direct use with the N/llm API (e.g., for `generateText` or `embed`). This method is ideal for processing any size or page count of a PDF, It leverages Apache PDFBox for robust text extraction.

*   File extensions supported: **PDF**
*   Non-encrypted  files only



extractContent().promise()

File Content Object ,                             segments: { id: "entire-content", data: } };\]\]>

N/A

/\*\*

\* @name documentUnderstanding#analyzeDocument

\*

\* @description Analyzes document and returns tables, key value pairs, words and lines

\* @param {Object} options

\* @param {string\[\]} \[options.features\] - list of features to be extracted from attached file (defaults to \["TEXT\_EXTRACTION", "TABLE\_EXTRACTION"\])

\* @param {string} \[options.documentType\] - type of the document (defaults to "others")

\* @param {string} \[options.language\] - language of the document (defaults to english "ENG")  

\* @param {number} \[options.timeout\] - timeout in milliseconds, defaults to  120000

\* @param {File} options.file - input file

 \* @param {Object} \[options.ociConfig\] - config needed for unlimited usage (all params ociConfig.\*  must be passed)

\* @param {string} \[options.ociConfig.tenancyId\] - tenancy OCID

\* @param {string} \[options.ociConfig.compartmentId\] - compartment OCID

\* @param {string} \[options.ociConfig.userId\] - user OCID

\* @param {string} \[options.ociConfig.endpointId\] - endpoint id (needed when custom OCI cluster is to be used)

\* @param {string} \[options.ociConfig.fingerprint\] - fingerprint of the public key (only secret is accepted)

\* @param {string} \[options.ociConfig.privateKey\] - privateKey of the OCI user (only secret is accepted)

\* @return {Document} - Document with all the extracted data

\* @throws {SuiteScriptError} SSS\_MISSING\_REQD\_ARGUMENT if file parameter is missing

\* @throws {SuiteScriptError} UNSUPPORTED\_FILE\_TYPE if file is not one of PDF, TIFF, PNG, JPG

\* @throws {SuiteScriptError} INVALID\_LANGUAGE if provided language is outside of Language enum

\* @throws {SuiteScriptError} INVALID\_DOCUMENT\_TYPE if provided document type is outside of DocumentType enum

\* @throws {SuiteScriptError} FEATURES\_CANNOT\_BE\_EMPTY if list of features to extract is empty

\* @throws {SuiteScriptError} UNRECOGNIZED\_OCI\_CONFIG\_PARAMETERS if unknown parameter for OCI configuration has been used

\* @throws {SuiteScriptError} ONLY\_API\_SECRET\_IS\_ACCEPTED if privateKey or fingerprint are not API secrets

\* @throws {SuiteScriptError} MAXIMUM\_PARALLEL\_REQUESTS\_LIMIT\_EXCEEDED if number of parallel requests to LLM is greater than 5

 \* @throws {SuiteScriptError} DOCUMENT\_TOO\_LONG if Attached document has too many pages

\* @throws {SuiteScriptError} DATA\_EXTRACTION\_TIMED\_OUT is custom or default timeout is exceeded

 \* @throws {SuiteScriptError} INSUFFICIENT\_PERMISSION if the user does not have access to the file.

 \*/




 Use `documentUnderstanding.analyzeDocument(options)` when you need to extract structured data, such as key-value pairs and tables, in addition to text, from documents. This method is suitable for PNG, JPG, TIFF, or PDF files (up to 5 pages) and leverages Oracle OCI Document Understanding services for advanced extraction. The output is a JSON object containing the extracted data, ready for processing or direct use with the N/llm API (e.g., `generateText` or `embed`).

Check  for features, documentTypes and language params.



Check  for usages

*   File extensions supported:  **PNG, JPG, TIFF, PDF**
*   Non-encrypted  files only
*   Files containing **up to 5 pages** only












analyzeDocument.promise()

Document Object



Check for more details





N/A

When creating an asynchronous task for documentUnderstanding, 

all the same parameters that would be used for the synchronous call can be passed directly through the task submission.






For processing larger documents (beyond the 5-page limit for the synchronous method) or for scenarios where you need to offload document analysis to a background process, use the asynchronous task submission. This also leverages Oracle OCI Document Understanding services and accepts all the same parameters as the synchronous `analyzeDocument` method. Remember to submit this via a workqueue task. 


Check  for features, documentTypes and language params.

Check  for usages

The asynchronous version of `analyzeDocument` cannot be called directly from the `documentUnderstanding` module. Instead, it must be submitted as a workqueue task.





N/A



/\*\*

\* Convert a JSON file (from analyseDocument(option)) into a Document object type.

\*

\* @param {Object} options

\* @param {File} options.file The JSON file to parse analysis result from

\* @return {Document} The parsed document resulting from the analysis

\* @throws {SuiteScriptError} UNSUPPORTED\_FILE\_TYPE\_1\_USE\_2 when the file type is not JSON

\* @throws {SuiteScriptError} INSUFFICIENT\_PERMISSION if the user does not have access to the file

 \*/




 







N/A



extractContent Objects and Usage for extractContent 
----------------------------------------------------

### Example of extractContent

extractContent return format , segments: { id: "entire-content", data: } }; \]\]>

### Usages with llm APIs

#### Generate Text 

documentUnderstanding.extractContent + llm.generateText

analyzeDocument Objects and Usage for analyzeDocument
-----------------------------------------------------

### sync Examples of analyzeDocument - Syncronous

**Example 1**: Extract text, tables, and key-value pairs from the input file (PDF document stored in the file cabinet). ()

Input file:  150     Output result:  150

Example 1 script code



**Example 2**: Extract content from an Invoice, converts the result into a string object and pass to the LLM as data through "documents" param along with some question into "prompt" param.

Output result:

Answer: : This invoice is for web design services.
Citations: : \[{"start":20,"end":30,"text":"web design","documentIds":\["1"\]}\]

js Converts the JSON returned result into a string object. 

For a specific use-case you may want to process the result in a different way before converting to text (perhaps converting tables to markdown)

### async Examples of Asynchronous Tasks

To text on a scrumbox, Timer Service has to be enabled first.  

bash Enable Time Service on Runbox true nsh 'scfg runTimerService true' nlrestart\]\]>



#### **Submitting a Task**

The synchronous method only supports documents with **up to 5 pages**. For larger documents, you'll need to submit a workqueue task directly from SuiteScript.

js



#### **Process Result Processing**

This example converts the returned JSON file directly into a string. However, for most real-world scenarios, you'll want to **process the JSON data** more thoroughly before converting it to text. For instance, if your document contains tables, you might want to transform them into **Markdown format** for better usability.

Example, parsing result file saved on FileStorage



#### **Submitting a Task &** **Result Processing**

This example that demonstrates a more advanced use case: submit a task utilizing a **deployed SuiteScript** to process the result file. This script can then **parse the extracted information** and send specific questions to  llm module.

Example of task creating and runing deployed script after



js Example of a deployed script to run



objects Objects
---------------



Object

Comment

Resulting document object

Page of the document

Extracted word

Extracted line

Extracted field

Label of the field

Value of the field

Extracted table

Row of the table

Cell of the table

Content of the file (processed)

Segment of the processed file

### Document



Member

JSDoc

Comment

mimeType

          /\*\*

               \* MimeType of the document
               \* @name
              Document#mimeType

              \* @type
              {string}

              \* @readonly

              \* @throws
              {SuiteScriptError}
              READ\_ONLY when setting the property is attempted

               \*
               \* @since
              2025.1
               \*/





pages

          /\*\*

          \* Pages of the analyzed document

          \*
          @name
          Document#pages


          \*
          @type
          {Page\[\]}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




### Page



Member

JSDoc

Comment

words

          /\*\*

          \* Words found in the document

          \*
          @name
          Page#words


          \*
          @type
          {Word\[\]}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




lines

          /\*\*

          \* Lines found in the document

          \*
          @name
          Page#lines


          \*
          @type
          {Line\[\]}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




tables

          /\*\*

          \* Tables found in the document

          \*
          @name
          Page#tables


          \*
          @type
          {Table\[\]}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




fields

          /\*\*

          \* Fields found in the document

          \*
          @name
          Page#fields


          \*
          @type
          {Field\[\]}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




### Word



Member

JSDoc

Comment

text

          /\*\*

          \* Text of the word

          \*
          @name
          Word#text


          \*
          @type
          {string}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




confidence

          /\*\*

          \* Confidence of the word's detection accuracy

          \*
          @name
          Word#confidence


          \*
          @type
          {number}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




### Line



Member

JSDoc

Comment

text

          /\*\*

          \* Text of the line

          \*
          @name
          Line#text


          \*
          @type
          {string}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




confidence

          /\*\*

          \* Confidence of the line's detection accuracy

          \*
          @name
          Line#confidence


          \*
          @type
          {number}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




### Field



Member

JSDoc

Comment

label

          /\*\*

          \* Label of the field

          \*
          @name
          Field#label


          \*
          @type
          {FieldLabel}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




value

          /\*\*

          \* Value of the field

          \*
          @name
          Field#value


          \*
          @type
          {FieldValue}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




type

          /\*\*

          \* Type of the field (from the FieldType enum)

          \*
          @name
          Field#type


          \*
          @type
          {string}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




### FieldLabel



Member

JSDoc

Comment

name

          /\*\*

          \* name of the field label

          \*
          @name
          FieldLabel#name


          \*
          @type
          {string}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




confidence

          /\*\*

          \* Confidence of the field label's detection accuracy

          \*
          @name
          FieldLabel#confidence


          \*
          @type
          {number}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




### FieldValue



Member

JSDoc

Comment

text

          /\*\*

          \* text of the field

          \*
          @name
          FieldValue#text


          \*
          @type
          {string}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




confidence

          /\*\*

          \* Confidence of the field value's detection accuracy

          \*
          @name
          FieldValue#confidence


          \*
          @type
          {number}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




### Table



Member

JSDoc

Comment

rowCount

          /\*\*

          \* Row count of the table

          \*
          @name
          Table#rowCount


          \*
          @type
          {number}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




columnCount

          /\*\*

          \* Column count of the table

          \*
          @name
          Table#columnCount


          \*
          @type
          {number}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




confidence

          /\*\*

          \* Confidence of the table detection

          \*
          @name
          Table#confidence


          \*
          @type
          {number}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




headerRows

          /\*\*

          \* Header rows of the table

          \*
          @name
          Table#headerRows


          \*
          @type
          {TableRow\[\]}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




bodyRows

          /\*\*

          \* Body rows of the table

          \*
          @name
          Table#bodyRows


          \*
          @type
          {TableRow\[\]}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




footerRows

          /\*\*

          \* Footer rows of the table

          \*
          @name
          Table#footerRows


          \*
          @type
          {TableRow\[\]}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




### TableRow



Member

JSDoc

Comment

cells

          /\*\*

          \* cells of the row

          \*
          @name
          TableRow#cells


          \*
          @type
          {Cell\[\]}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




### Cell



Member

JSDoc

Comment

text

          /\*\*

          \* text of the cell

          \*
          @name
          Cell#text


          \*
          @type
          {string}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




confidence

          /\*\*

          \* Confidence of the cell value's detection

          \*
          @name
          Cell#confidence


          \*
          @type
          {number}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




### FileContent



Member

JSDoc

Comment

id


            /\*\*

             \* Id of the FileContent
             \* @name
            FileContent#id

            \* @type
            {string}

            \* @readonly

            \* @throws
            {SuiteScriptError}
            READ\_ONLY when setting the property is attempted

             \*
             \* @since
            2025.1
             \*/




segments

          /\*\*

          \* Segments of the file content

          \*
          @name
          FileContent#segments


          \*
          @type
          {FileSegment\[\]}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




readAll()

          /\*\*

          \* Returns the entire extracted content


          \*
          @type
          {string}


          \*
          @return
          extracted file content in plain text




          \*

          \*
          @since
          2025.1

           \*/




### FileSegment



Member

JSDoc

Comment

id

          /\*\*

          \* Id of the FileSegment

          \*
          @name
          FileSegment#id


          \*
          @type
          {string}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




data

          /\*\*

          \* data of the segment

          \*
          @name
          FileSegment#data


          \*
          @type
          {string}


          \*
          @readonly


          \*
          @throws
          {SuiteScriptError}
          READ\_ONLY when setting the property is attempted

          \*

          \*
          @since
          2025.1

           \*/




Enums Enums
-----------



Name 

Values

Usages

Feature

TEXT\_EXTRACTION

TABLE\_EXTRACTION

FIELD\_EXTRACTION

DOCUMENT\_CLASSIFICATION

The `features` parameter allow us to specify which types of information to extract from a document, such as text, tables, or key-value pairs.

FieldType

LINE\_ITEM\_GROUP

LINE\_ITEM

LINE\_ITEM\_FIELD

KEY\_VALUE

UNKNOWN

The `FieldType` enum describes the category or type of data extracted for a specific field (e.g., `DATE`, `ADDRESS`, `NUMBER`). It adds semantic meaning to the extracted information, aiding in structured processing and better understanding of the results.

DocumentType

INVOICE

RECEIPT

RESUME

TAX\_FORM

DRIVE\_LICENSE

PASSPORT

BANK\_STATEMENT

CHECK

PAYSLIP

HEALTH\_INSURANCE\_ID

OTHERS

**The `documentType` has to be used in conjuction with feature: \["TEXT\_EXTRACTION"\]**



Essentially the `documentType` parameter helps the service apply pre-trained models specifically optimized for certain document categories. When `documentType` (e.g., "INVOICE", "RECEIPT", "PASSPORT"), is specified we are essentially telling the service what kind of document it's analyzing.

Example: 

documentUnderstanding.analyzeDocument({
    file:file.load("14"),
    features: \["FIELD\_EXTRACTION"\],
    documentType: "RECEIPT"
});



Language

ENG

Supported languages



ociconfig OciConfig
-------------------

*   If an `ociConfig` is explicitly passed as a parameter to the method, it will override any `ociConfig` settings configured within NetSuite's AI Preferences.

*   If no `ociConfig` parameter is provided, the system will then check if a custom `ociConfig` is set in NetSuite's AI Preferences. If one is found, that configuration will be used.

*   If neither an `ociConfig` parameter is passed nor a custom `ociConfig` is set in AI Preferences, a default `ociConfig` will be applied.


### How to pass the OciConfig to analyzeDocument? 

The OciConfig object must contain all parameters as shown is this example:

OciConfig Object

### [Enable and Configure OCI Credentials for AI in NetSuite](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_101442278.html#subsect_0204102201)

### When a custom OciConfig should used?

### Understanding the limits for default OciConfig?