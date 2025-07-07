N/keyControl Module 579

**Value Sets Property To**

EQUALS equals

## Syntax

## Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/keyControl Module Script Samples.

```
require(['N/keyControl'],function(keyControl){
var keys = keyControl.findKeys({
name:{
value: 'test',
operator: keyControl.Operator.CONTAINS}
});
})
```
# N/llm Module

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

## Note: The content in this help topic pertains to SuiteScript 2.1.

The N/llm module supports generative artificial intelligence (AI) capabilities in SuiteScript. You can use this

module to send requests to the large language models (LLMs) supported by NetSuite and to receive LLM

responses to use in your scripts.

If you are new to using generative AI in SuiteScript, see the help topic SuiteScript 2.x Generative AI APIs. It

contains essential information about this feature.

## Important: SuiteScript Generative AI APIs (N/llm module) are available only for accounts

```
located in certain regions. For a list of these regions, see the help topic Generative AI Availability in
NetSuite.
```
## In This Help Topic

■ N/llm Module Members

■ ChatMessage Object Members

■ Citation Object Members

■ Document Object Members

■ EmbedResponse Object Members

■ Response Object Members

■ StreamedResponse Object Members


## N/llm Module Members

```
Member Type Name Return
Type / Value
Type
```
```
Supported Script
Types
```
```
Description
```
```
llm.ChatMessage Object Server scripts The chat message.
```
```
llm.Citation Object Server scripts A citation returned from the LLM.
```
```
llm.Document Object Server scripts A document to be used as source content
when calling the LLM.
```
```
llm.EmbedResponse Object Server scripts The embeddings response returned from
the LLM.
```
```
llm.Response Object Server scripts The response returned from the LLM.
```
```
Object
```
```
llm.StreamedResponse Object Server scripts The streamed response returned from the
LLM.
```
```
llm.createChatMessage(
options)
```
```
Object Server scripts Creates a chat message based on a
specified role and text.
```
```
llm.createDocument
(options)
```
```
Object Server scripts Creates a document to be used as source
content when calling the LLM.
```
```
llm.embed(options) Object Server scripts Returns the embeddings from the LLM for a
given input.
```
```
llm.embed.promise
(options)
```
```
void Server scripts Asynchronously returns the embeddings
from the LLM for a given input.
```
```
llm.evaluatePrompt
(options)
```
```
Object Server scripts Takes the ID of an existing prompt and
values for variables used in the prompt
and returns the response from the LLM.
When unlimited usage mode is used, it also
accepts the OCI configuration parameters.
```
```
llm.evaluatePrompt.
promise(options)
```
```
void Server scripts Takes the ID of an existing prompt and
values for variables used in the prompt and
asynchronously returns the response from
the LLM. When unlimited usage mode is
used, it also accepts the OCI configuration
parameters.
```
```
llm.evaluatePrompt
Streamed(options)
```
```
Object Server scripts Takes the ID of an existing prompt and
values for variables used in the prompt
and returns the streamed response from
the LLM. When unlimited usage mode is
used, it also accepts the OCI configuration
parameters.
```
```
llm.evaluatePrompt
Streamed.promise(
options)
```
```
void Server scripts Takes the ID of an existing prompt and
values for variables used in the prompt
and asynchronously returns the streamed
response from the LLM. When unlimited
usage mode is used, it also accepts the OCI
configuration parameters.
```
```
llm.generateText(options) Object Server scripts Takes a prompt and parameters for the LLM
and returns the response from the LLM.
When unlimited usage mode is used, it also
accepts the OCI configuration parameters.
```
```
Method
```
```
llm.generateText.promise
(options)
```
```
void Server scripts Takes a prompt and parameters for the LLM
and asynchronously returns the response
```

```
Member Type Name Return
Type / Value
Type
```
```
Supported Script
Types
```
```
Description
```
```
from the LLM. When unlimited usage mode
is used, it also accepts the OCI configuration
parameters.
```
```
llm.generateText
Streamed(options)
```
```
Object Server scripts Takes a prompt and parameters for the LLM
and returns the streamed response from
the LLM. When unlimited usage mode is
used, it also accepts the OCI configuration
parameters.
```
```
llm.generateText
Streamed.promise(
options)
```
```
void Server scripts Takes a prompt and parameters for the LLM
and asynchronously returns the streamed
response from the LLM. When unlimited
usage mode is used, it also accepts the OCI
configuration parameters.
```
```
llm.getRemainingFree
Usage()
```
```
number Server scripts Returns the number of free requests in the
current month.
```
```
llm.getRemainingFree
Usage.promise()
```
```
void Server scripts Asynchronously returns the number of free
requests in the current month.
```
```
llm.getRemainingFree
EmbedUsage()
```
```
number Server scripts Returns the number of free embeddings
requests in the current month.
```
```
llm.getRemainingFree
EmbedUsage.promise()
```
```
void Server scripts Asynchronously returns the number of free
embeddings requests in the current month.
```
```
llm.ChatRole enum Server scripts Holds the string values for the author (role)
of a chat message.
```
```
Use this enum to set the value of the
ChatMessage.role property.
```
```
llm.EmbedModelFamily enum Server scripts The large language model to be used to
generate embeddings.
```
```
Use this enum to set the value of the
options.embedModelFamily parameter in
llm.embed(options).
```
```
llm.ModelFamily enum Server scripts Holds the string values for the large
language model to be used.
```
```
Use this enum to set the options.model
parameter in llm.generateText(options).
```
```
Enum
```
```
llm.Truncate enum Server scripts The truncation method to use when
embeddings input exceeds 512 tokens.
```
```
Use this enum to set the value of
the options.truncate parameter in
llm.embed(options).
```
## ChatMessage Object Members

```
Member Type Name Return Type /
Value Type
```
```
Supported Script
Types
```
**Description**

```
Property ChatMessage.role string Server scripts The author (role) of the chat message.
Use the llm.ChatRole enum to set the
value.
```

```
Member Type Name Return Type /
Value Type
```
```
Supported Script
Types
```
**Description**

```
ChatMessage.text string Server scripts Text of the chat message. Can be
either the prompt sent by the script
or the response returned by the LLM.
```
## Citation Object Members

```
Member Type Name Return Type /
Value Type
```
```
Supported Script
Types
```
**Description**

```
Citation.documentIds string[] Server scripts The IDs of the documents
where the cited text is located.
```
```
Citation.end number Server scripts The ending position of the
cited text.
```
```
Citation.start number Server scripts The starting position of the
cited text.
```
Property

```
Citation.text string Server scripts The cited text from the
documents.
```
## Document Object Members

```
Member Type Name Return Type /
Value Type
```
```
Supported Script
Types
```
**Description**

Property Document.data string Server scripts The content of the document.

Document.id string Server scripts The ID of the document.

## EmbedResponse Object Members

```
Member Type Name Return Type /
Value Type
```
```
Supported Script
Types
```
**Description**

```
EmbedResponse.
embeddings
```
```
number[] Server scripts The embeddings returned
from the LLM.
```
```
EmbedResponse.inputs string[] Server scripts The list of inputs used to
generate the embeddings
response.
```
Property

```
EmbedResponse.model string Server scripts The model used to generate
the embeddings response.
```
## Response Object Members

```
Member Type Name Return Type / Value
Type
```
```
Supported Script
Types
```
**Description**

Property Response.chatHistory llm.ChatMessage[] Server scripts List of chat messages.


```
Member Type Name Return Type / Value
Type
```
```
Supported Script
Types
```
**Description**

```
Response.citations llm.Citation[] Server scripts List of citations used to
generate the response.
```
```
Response.documents llm.Document[] Server scripts List of documents
used to generate the
response.
```
```
Response.model string Server scripts Model used to produce
the LLM response.
```
```
Response.text string Server scripts Text returned by the
LLM.
```
## StreamedResponse Object Members

```
Member Type Name Return Type / Value
Type
```
```
Supported Script
Types
```
**Description**

```
StreamedResponse.chat
History
```
llm.ChatMessage[] Server scripts List of chat messages.

```
StreamedResponse.
citations
```
```
llm.Citation[] Server scripts List of citations used to
generate the streamed
response.
```
```
StreamedResponse.
documents
```
```
llm.Document[] Server scripts List of documents used
to generate the streamed
response.
```
```
StreamedResponse.
model
```
```
string Server scripts Model used to produce
the streamed response.
```
Property

StreamedResponse.text string Server scripts Text returned by the LLM.

## N/llm Module Script Samples

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

The following script samples demonstrate how to use the features of the N/llm module.

■ Send a Prompt to the LLM and Receive a Response

■ Clean Up Content for Text Area Fields After Saving a Record

■ Provide an LLM-based ChatBot for NetSuite Users

■ Evaluate an Existing Prompt and Receive a Response

■ Create a Prompt and Evaluate It

■ Provide Source Documents When Calling the LLM


### Send a Prompt to the LLM and Receive a Response

The following sample sends a "Hello World" prompt to the default NetSuite large language model (LLM)

and receives the response. It also shows the remaining free usage for the month.

For instructions about how to run a SuiteScript 2.1 code snippet in the debugger, see the help topic On-

Demand Debugging of SuiteScript 2.1 Scripts. Step through the code until the line before the end of the

script to see the response text returned from the LLM and the remaining free usage for the month.

###### Note: This sample script uses the require function so that you can copy it into the SuiteScript

```
Debugger and test it. You must use the define function in an entry point script (the script you
attach to a script record and deploy). For more information, see the help topics SuiteScript 2.x
Script Basics and SuiteScript 2.x Script Types.
```
```
/**
*@NApiVersion 2.
*/
// This example shows how to query the default LLM
require(['N/llm'],
function(llm) {
const response = llm.generateText({
// modelFamily is optional. When omitted, the Cohere Command R model is used.
// To try the Meta Llama model, remove the comment delimiter from the following line
// modelFamily: llm.ModelFamily.META_LLAMA,
prompt: "Hello World!",
modelParameters: {
maxTokens: 1000,
temperature: 0.2,
topK: 3,
topP: 0.7,
frequencyPenalty: 0.4,
presencePenalty: 0
}
});
const responseText = response.text;
const remainingUsage = llm.getRemainingFreeUsage(); // View remaining monthly free usage
});
```
### Clean Up Content for Text Area Fields After Saving a Record

The following sample uses the large language model (LLM) to correct the text for the purchase

description and the sales description fields of an inventory item record after the user saves the record.

This sample also shows how to use the llm.generateText.promise method.

##### To test this script after script deployment:

1. Go to Lists > Accounting > Items > New.
2. Select **Inventory Item**.
3. Enter an **Item Name** and optionally fill out any other fields.
4. Select a value for **Tax Schedule** in the **Accounting** subtab.
5. Enter text into the **Purchase Description** and **Sales Description** fields.
6. Click **Save**.

```
When you save, the script will trigger. The content in the Purchase Description and Sales
Description fields will be corrected, and the record will be submitted.
```

###### Note: This script sample uses the define function, which is required for an entry point script (a

```
script you attach to a script record and deploy). You must use the require function if you want to
copy the script into the SuiteScript Debugger and test it. For more information, see SuiteScript 2.x
Global Objects.
```
```
/**
* @NApiVersion 2.
* @NScriptType UserEventScript
*/
define(['N/llm'], (llm) => {
/**
* @param {Object} scriptContext The updated inventory item
* record to clean up typo errors for purchase description and
* sales description fields. The values are set before the record
* is submitted to be saved.
*/
function fixTypos(scriptContext) {
const purchaseDescription = scriptContext.newRecord.getValue({
fieldId: 'purchasedescription'
})
const salesDescription = scriptContext.newRecord.getValue({
fieldId: 'salesdescription'
})
```
```
const p1 = llm.generateText.promise({
prompt: `Please clean up typos in the following text:
${purchaseDescription} and return just the corrected text.
Return the text as is if there's no typo
or you don't understand the text.`
})
const p2 = llm.generateText.promise({
prompt: `Please clean up typos in the following text:
${salesDescription} and return just the corrected text.
Return the text as is if there's no typo
or you don't understand the text.`
})
```
```
// When both promises are resolved, set the updated values for the
// record
Promise.all([p1, p2]).then((results) => {
scriptContext.newRecord.setValue({
fieldId: 'purchasedescription',
value: results[0].value.text
})
scriptContext.newRecord.setValue({
fieldId: 'salesdescription',
value: results[1].value.text
})
})
}
```
```
return { beforeSubmit: fixTypos }
})
```
### Provide an LLM - based ChatBot for NetSuite Users

The following sample creates a custom NetSuite form titled **Chat Bot**. The user can enter a prompt

for the large language model (LLM) in the **Prompt** field. After the user clicks **Submit** , NetSuite sends

the request to the LLM. The LLM returns a response, which is displayed as part of the message history

displayed on the form.

The script includes code that handles the prompts and responses as a conversation between the user

and the LLM. The code associates the prompts the user enters as the USER messages (these messages

are labeled **You** on the form) and the responses from the LLM as CHATBOT messages (these messages

are labeled **ChatBot** on the form). The code also assembles a chat history and sends it along with the


prompt to the LLM. Without the chat history, it would treat each prompt as an unrelated request. For

example, if your first prompt asks a question about Las Vegas and your next prompt asks, “What are the

top 5 activities here?”, the chat history gives the LLM the information that “here” means Las Vegas and

may also help the LLM avoid repeating information it already provided.

###### Note: This script sample uses the define function, which is required for an entry point script (a

```
script you attach to a script record and deploy). You must use the require function if you want to
copy the script into the SuiteScript Debugger and test it. For more information, see SuiteScript 2.x
Global Objects.
```
```
/**
* @NApiVersion 2.
* @NScriptType Suitelet
*/
```
```
define(['N/ui/serverWidget', 'N/llm'], (serverWidget, llm) => {
/**
* Creates NetSuite form to communicate with LLM
*/
function onRequest (context) {
const form = serverWidget.createForm({
title: 'Chat Bot'
})
const fieldgroup = form.addFieldGroup({
id: 'fieldgroupid',
label: 'Chat'
})
fieldgroup.isSingleColumn = true
const historySize = parseInt(
context.request.parameters.custpage_num_chats || '0')
const numChats = form.addField({
id: 'custpage_num_chats',
type: serverWidget.FieldType.INTEGER,
container: 'fieldgroupid',
label: 'History Size'
})
numChats.updateDisplayType({
displayType: serverWidget.FieldDisplayType.HIDDEN
})
```
```
if (context.request.method === 'POST') {
numChats.defaultValue = historySize + 2
const chatHistory = []
for (let i = historySize - 2; i >= 0; i -= 2) {
const you = form.addField({
id: 'custpage_hist' + (i + 2),
type: serverWidget.FieldType.TEXTAREA,
label: 'You',
container: 'fieldgroupid'
})
const yourMessage = context.request.parameters['custpage_hist' + i]
you.defaultValue = yourMessage
you.updateDisplayType({
displayType: serverWidget.FieldDisplayType.INLINE
})
```
```
const chatbot = form.addField({
id: 'custpage_hist' + (i + 3),
type: serverWidget.FieldType.TEXTAREA,
label: 'ChatBot',
container: 'fieldgroupid'
})
const chatBotMessage =
context.request.parameters['custpage_hist' + (i + 1)]
chatbot.defaultValue = chatBotMessage
chatbot.updateDisplayType({
displayType: serverWidget.FieldDisplayType.INLINE
})
chatHistory.push({
```

```
role: llm.ChatRole.USER,
text: yourMessage
})
chatHistory.push({
role: llm.ChatRole.CHATBOT,
text: chatBotMessage
})
}
```
```
const prompt = context.request.parameters.custpage_text
const promptField = form.addField({
id: 'custpage_hist0',
type: serverWidget.FieldType.TEXTAREA,
label: 'You',
container: 'fieldgroupid'
})
promptField.defaultValue = prompt
promptField.updateDisplayType({
displayType: serverWidget.FieldDisplayType.INLINE
})
const result = form.addField({
id: 'custpage_hist1',
type: serverWidget.FieldType.TEXTAREA,
label: 'ChatBot',
container: 'fieldgroupid'
})
result.defaultValue = llm.generateText({
prompt: prompt,
chatHistory: chatHistory
}).text
result.updateDisplayType({
displayType: serverWidget.FieldDisplayType.INLINE
})
} else {
numChats.defaultValue = 0
}
```
```
form.addField({
id: 'custpage_text',
type: serverWidget.FieldType.TEXTAREA,
label: 'Prompt',
container: 'fieldgroupid'
})
```
```
form.addSubmitButton({
label: 'Submit'
})
```
```
context.response.writePage(form)
}
```
```
return {
onRequest: onRequest
}
})
```
### Evaluate an Existing Prompt and Receive a Response

The following sample evaluates an existing prompt, sends it to the default NetSuite large language model

(LLM), and receives the response. The sample also shows the remaining free usage for the month.

In this sample, the llm.evaluatePrompt(options) method loads an existing prompt with an ID of

stdprompt_gen_purch_desc_invt_item. This prompt applies to an inventory item record in NetSuite, and

it uses several variables that represent fields on this record type, such as item ID, stock description, and

vendor name. The method replaces the variables in the prompt with the values you specify, then sends it

to the LLM and returns the response.

You can create and manage prompts using Prompt Studio. You can also use Prompt Studio to generate

a SuiteScript example that uses the llm.evaluatePrompt(options) method and includes the variables for a


prompt in the correct format. When viewing a prompt in Prompt Studio, click Show SuiteScript Example

to generate SuiteScript code with all of the variables that prompt uses. You can then use this code in your

scripts and provide a value for each variable.

For instructions about how to run a SuiteScript 2.1 code snippet in the debugger, see the help topic On-

Demand Debugging of SuiteScript 2.1 Scripts. Step through the code until the line before the end of the

script to see the response text returned from the LLM and the remaining free usage for the month.

###### Note: This sample script uses the require function so that you can copy it into the SuiteScript

```
Debugger and test it. You must use the define function in an entry point script (the script you
attach to a script record and deploy). For more information, see the help topics SuiteScript 2.x
Script Basics and SuiteScript 2.x Script Types.
```
```
/**
* @NApiVersion 2.
*/
require(['N/llm'],
function(llm) {
const response = llm.evaluatePrompt({
id: 'stdprompt_gen_purch_desc_invt_item',
variables: {
"form": {
"itemid": "My Inventory Item",
"stockdescription": "This is the stock description of the item.",
"vendorname": "My Item Vendor Inc.",
"isdropshipitem": "false",
"isspecialorderitem": "true",
"displayname": "My Amazing Inventory Item"
},
"text": "This is the purchase description of the item."
}
});
const responseText = response.text;
const remainingUsage = llm.getRemainingFreeUsage(); // View remaining monthly free usage
});
```
### Create a Prompt and Evaluate It

The following sample creates a prompt record, populates the required record fields, and evaluates the

prompt by sending it to the default NetSuite large language model (LLM).

This sample creates a prompt record using the record.create(options) method of the N/record module,

and it sets the values of the following fields (which are required to be able to save a prompt record):

■ Name

■ Prompt Type

■ Model Family

■ Template

After the prompt record is saved, llm.evaluatePrompt(options) is called, but only the ID of the created

prompt is provided as a parameter. The method throws a TEMPLATE_PROCESSING_EXCEPTION error because

the prompt template includes a required variable (mandatoryVariable) that was not provided when the

method was called. The error is caught, and a debug message is logged.

Next, the sample calls llm.evaluatePrompt(options) again but provides values for the mandatoryVariable

and optionalVariable variables. This time, the call succeeds, and a debug message is logged. Finally,

the sample calls llm.evaluatePrompt.promise(options) and confirms that the call succeeds. When the call

succeeds, the prompt record is deleted.


You can create and manage prompts using Prompt Studio. You can also use Prompt Studio to generate

a SuiteScript example that uses the llm.evaluatePrompt(options) method and includes the variables for a

prompt in the correct format. When viewing a prompt in Prompt Studio, click Show SuiteScript Example

to generate SuiteScript code with all of the variables that prompt uses. You can then use this code in your

scripts and provide a value for each variable. For more information about Prompt Studio, see the help

topic Prompt Studio.

For instructions about how to run a SuiteScript 2.1 code snippet in the debugger, see the help topic On-

Demand Debugging of SuiteScript 2.1 Scripts. Step through the code until the line before the end of the

script to see the response text returned from the LLM and the remaining free usage for the month.

###### Note: This sample script uses the require function so that you can copy it into the SuiteScript

```
Debugger and test it. You must use the define function in an entry point script (the script you
attach to a script record and deploy). For more information, see the help topics SuiteScript 2.x
Script Basics and SuiteScript 2.x Script Types.
```
```
/**
* @NApiVersion 2.
*/
require(['N/record', 'N/llm'], function(record, llm) {
const rec = record.create({
type: "prompt"
});
```
```
rec.setValue({
fieldId: "name",
value: "Test"
});
rec.setValue({
fieldId: "prompttype",
value: "GENERIC"
});
rec.setValue({
fieldId: "modelfamily",
value: "COHERE_COMMAND_R"
});
rec.setValue({
fieldId: "template",
value: "${mandatoryVariable} <#if optionalVariable?has_content>${optionalVariable}<#else>World</#if>"
});
```
```
const id = rec.save();
```
```
try {
llm.evaluatePrompt({
id: id
});
}
catch (e) {
if (e.name === "TEMPLATE_PROCESSING_EXCEPTION")
log.debug("Exception", "Expected exception was thrown");
}
```
```
const response = llm.evaluatePrompt({
id: id,
variables: {
mandatoryVariable: "Hello",
optionalVariable: "People"
}
});
if ("Hello People" === response.chatHistory[0].text)
log.debug("Evaluation", "Correct prompt got evaluated");
```
```
llm.evaluatePrompt.promise({
id: id,
variables: {
mandatoryVariable: "Hello",
```

```
optionalVariable: "World"
}
}).then(function(response) {
if ("Hello World" === response.chatHistory[0].text)
log.debug("Evaluation", "Correct prompt got evaluated");
record.delete({
type: "prompt",
id: id
});
debugger;
})
});
```
### Provide Source Documents When Calling the LLM

The following code sample demonstrates how to provide source documents to the LLM when calling

llm.generateText(options).

This sample creates two documents using llm.createDocument(options) that contain information

about emperor penguins. These documents are provided as additional context when calling

llm.generateText(options). The LLM uses information in the provided documents to augment its response

using retrieval-augmented generation (RAG). For more information about RAG, see What is Retrieval-

Augmented Generation (RAG)?

If the LLM uses information in the provided documents to generate its response, the llm.Response object

that is returned from llm.generateText(options) includes a list of citations (as llm.Citation objects). These

citations indicate which source documents the information was taken from.

For instructions about how to run a SuiteScript 2.1 code snippet in the debugger, see the help topic On-

Demand Debugging of SuiteScript 2.1 Scripts.

###### Note: This sample script uses the require function so that you can copy it into the SuiteScript

```
Debugger and test it. You must use the define function in an entry point script (the script you
attach to a script record and deploy). For more information, see the help topics SuiteScript 2.x
Script Basics and SuiteScript 2.x Script Types.
```
```
/**
* @NApiVersion 2.
*/
require(['N/llm'], function(llm) {
const doc1 = llm.createDocument({
id: "doc1",
data: "Emperor penguins are the tallest."
});
const doc2 = llm.createDocument({
id: "doc2",
data: "Emperor penguins only live in the Sahara desert."
});
```
```
llm.generateText({
prompt: "Where do the tallest penguins live?",
documents: [doc1, doc2],
modelFamily: llm.ModelFamily.COHERE_COMMAND_R,
modelParameters: {
maxTokens: 1000,
temperature: 0.2,
topK: 3,
topP: 0.7,
frequencyPenalty: 0.4,
presencePenalty: 0
}
});
});
```

## Managing Prompts and Text Enhance Actions Using the N/

## llm Module

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

You can use the N/llm module in your scripts to send prompts to a large language model (LLM) and

receive a response. The module supports two approaches:

■ Use llm.generateText(options) or llm.generateText.promise(options) to send text to the LLM and

```
receive a response. When you call these methods, you can specify the model family and model
parameters that the LLM should use to provide the response.
```
■ Use llm.evaluatePrompt(options) or llm.evaluatePrompt.promise(options) to send a prompt that

```
already exists in NetSuite to the LLM and receive a response. When you call these methods, you can
specify the ID of an existing prompt and values for any variables that prompt uses.
```
You can use Prompt Studio to manage prompts and Text Enhance actions in the NetSuite UI, including

creating, updating, and deleting them. For more information about Prompt Studio, see the help topic

Prompt Studio.

The N/llm module works alongside Prompt Studio and lets you work with prompts and Text Enhance

actions in your scripts. You can do the following:

■ Create, Update, and Delete Prompts and Text Enhance Actions

■ Generate SuiteScript Code from an Existing Prompt

### Create, Update, and Delete Prompts and Text Enhance Actions

You can use the N/llm module and the N/record module together to manage prompts and Text Enhance

actions. For a complete code sample, see the help topic Create a Prompt and Evaluate It.

To create a prompt or Text Enhance action, use record.create(options) and specify prompt as the record

type to create a prompt record, or specify textenhanceaction as the record type to create a Text Enhance

action record.

```
const newPrompt = record.create({
type: "prompt"
});
```
```
const newTEAction = record.create({
type: "textenhanceaction"
});
```
You do not need to specify a script ID for new prompts or Text Enhance actions before saving them. If

you do not specify a script ID, a script ID is generated automatically for the saved prompt or Text Enhance

action when it is saved, and you can view this script ID in Prompt Studio.

You can load an existing prompt or Text Enhance action record using record.load(options). This method

accepts the type of record to load (prompt or textenhanceaction, as appropriate) and the internal ID (as

a number) of the record. You can find the ID of a prompt or Text Enhance action that you want to load in

Prompt Studio.


```
const loadedPrompt = record.load({
type: "prompt",
id: 5
});
```
```
const loadedTEAction = record.load({
type: "textenhanceaction",
id: 6
});
```
After you create or load a prompt or Text Enhance action record, you can use record.Record object

methods to work with the record. For example, you can use Record.setValue(options) to set the values of

fields on the record. You must populate all required fields on a record before you can save it. For prompt

records, the following fields are required:

■ name

■ prompttype

■ modelfamily

■ template

For Text Enhance action records, the following fields are required:

■ name

■ language

You can confirm which fields are required for prompt and Text Enhance action records in Prompt Studio

when creating or viewing a prompt or Text Enhance action. Required fields are marked with an asterisk

(*), and you can click the field name to see the field ID to use in your scripts.


```
// The newPrompt record object was created in a preceding sample
newPrompt.setValue({
fieldId: "name",
value: "Test Prompt"
});
```
```
newPrompt.setValue({
fieldId: "prompttype",
value: "CUSTOM"
});
```
```
newPrompt.setValue({
fieldId: "modelfamily",
value: "COHERE_COMMAND_R"
});
```
```
newPrompt.setValue({
fieldId: "template",
value: "${mandatoryVariable} <#if optionalVariable?has_content>${optionalVariable}<#else>World</#if>"
});
```
```
// The newTEAction record object was created in a preceding sample
newTEAction.setValue({
fieldId: "name",
value: "Test Text Enhance Action"
});
```
```
newTEAction.setValue({
fieldId: "language",
value: "en-us"
});
```
To save the prompt or Text Enhance action record, use Record.save(options). To delete the prompt or

Text Enhance action record, use record.delete(options).

```
// The newPrompt record object was created in a preceding sample
newPrompt.save();
```

```
// The newTEAction record object was created in a preceding sample
newTEAction.save();
```
```
record.delete({
type: "prompt",
id: 5
});
```
```
record.delete({
type: "textenhanceaction",
id: 6
});
```
### Generate SuiteScript Code from an Existing Prompt

When viewing a prompt in Prompt Studio, you can generate a SuiteScript code sample that demonstrates

how to work with the prompt. You can use the generated code sample directly in the SuiteScript 2.

debugger. For more information, see the help topic Debugging SuiteScript 2.1 Scripts. You can also

modify the sample and use it in your scripts.

To generate a code sample from a prompt, when viewing the prompt in Prompt Studio, click **Show**

**SuiteScript Example**.

The generated code sample calls llm.evaluatePrompt(options) and specifies the prompt information as

parameters. The generated code sample includes any required or optional variables that are used in the

prompt's template. If you specified values for the template variables in Prompt Studio, these values are


populated in the generated code sample. You can also provide your own values when you run the sample,

which can be useful for testing purposes.

## llm.ChatMessage

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Object Description** The chat message object returned by the llm.createChatMessage(options) method.

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Methods and Properties** ChatMessage Object Members

**Since** 2024.

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const myChatMessage = llm.createChatMessage({
role: llm.ChatRole.USER,
text: 'Hello World'
});
```
```
...
```

```
// Add additional code
```
### ChatMessage.text

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The text of the chat message.

**Type** string

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.ChatMessage

**Sibling Object Members** ChatMessage Object Members

**Since** 2024.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const myChatMessage = llm.createChatMessage({
role: llm.ChatRole.USER,
text: 'Hello World'
});
```
```
...
// Add additional code
```
### ChatMessage.role

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The author of the chat message.

**Type** string


**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.ChatMessage

**Sibling Object Members** ChatMessage Object Members

**Since** 2024.

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
chatHistory.push({
role: llm.ChatRole.CHATBOT,
text: chatBotMessage // this is a previously defined string
});
```
```
...
// Add additional code
```
## llm.Citation

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Object
Description
```
```
A citation returned from the LLM when source documents are provided to
llm.generateText(options) or llm.generateText.promise(options).
```
```
A citation represents the content from source documents where the LLM found relevant
information for its response. Citations are created using retrieval-augmented generation (RAG),
which lets you provide additional context that the LLM can use to generate its responses. For
more information about RAG, see What Is Retrieval-Augmented Generation (RAG)?
```
```
Citation objects are included in the llm.Response object that is returned from
llm.generateText(options) or llm.generateText.promise(options), if applicable, through the
Response.citations property. You can use the citation object to identify the documents that the
LLM used for its response, as well as where the cited text appears in the response. The object
includes properties that specify the documents used (Citation.documentIds), the start and end
points of the cited text (Citation.start and Citation.end), and the content itself (Citation.text).
```

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

```
Methods and
Properties
```
Citation Object Members

**Since** 2025.

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
// The documents doc1 and doc2 are created using llm.createDocument(options)
const response = llm.generateText({
prompt: "My test prompt",
documents: [doc1, doc2]
});
```
```
// If information in the provided documents is used to generate the response,
// the returned llm.Response object includes citations indicating where the
// cited information is located in the response
const citations = response.citations;
for (var i = 0; i < citations.length; i++) {
var documentIds = citations[i].documentIds;
var end = citations[i].end;
var start = citations[i].start;
var text = citations[i].text;
```
```
// Work with the citation properties
}
```
```
...
// Add additional code
```
### Citation.documentIds

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Property
Description
```
The IDs of the documents where the cited text is located.

```
When you call llm.createDocument(options), you specify the ID of the document using the
options.id parameter. If relevant information is found in the document and used in the LLM
response, the ID of that document is included in the citation.
```
```
This property contains multiple document IDs if information included in the response
is present in multiple documents that you provided to llm.generateText(options) or
llm.generateText.promise(options). For example, consider the following code sample:
```
```
const doc1 = llm.createDocument({
```

```
id: "doc1",
data: "Emperor penguins are the tallest."
});
const doc2 = llm.createDocument({
id: "doc2",
data: "Emperor penguins only live in the Sahara desert."
});
const doc3 = llm.createDocument({
id: "doc3",
data: "Emperor penguins only live in the Sahara desert."
});
```
```
const response = llm.generateText({
prompt: "Where do the tallest penguins live?",
documents: [doc1, doc2, doc3]
});
```
The response from the LLM might look similar to the following:

"Emperor penguins are the tallest penguins, and they only live in the Sahara desert."

```
For this example response, a llm.Citation object is generated with the following property
values:
```
```
{
"start": 52,
"end": 83,
"text": "only live in the Sahara desert.",
"documentIds": ["doc2", "doc3"]
}
```
```
Because the LLM used information in both doc2 and doc3 to generate the response (even
though in this example, these documents have identical content), the documentIds property
contains both document IDs.
```
**Type** string[]

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.Citation

```
Sibling Object
Members
```
Citation Object Members

**Since** 2025.1

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
// The documents doc1 and doc2 are created using llm.createDocument(options)
const response = llm.generateText({
prompt: "My test prompt",
documents: [doc1, doc2]
});
```
```
// If information in the provided documents is used to generate the response,
// the returned llm.Response object includes citations indicating where the
// cited information is located in the response
const citations = response.citations;
```

```
for (var i = 0; i < citations.length; i++) {
var documentIds = citations[i].documentIds;
var end = citations[i].end;
var start = citations[i].start;
var text = citations[i].text;
```
```
// Work with the citation properties
}
```
```
...
// Add additional code
```
### Citation.end

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The ending position in the response where the cited text is located.

```
The ending position is relative to the number of characters in the LLM response. For
example, consider the following code sample:
```
```
const doc1 = llm.createDocument({
id: "doc1",
data: "Emperor penguins are the tallest."
});
const doc2 = llm.createDocument({
id: "doc2",
data: "Emperor penguins only live in the Sahara desert."
});
```
```
const response = llm.generateText({
prompt: "Where do the tallest penguins live?",
documents: [doc1, doc2]
});
```
The response from the LLM might look similar to the following:

"Emperor penguins are the tallest penguins, and they only live in the Sahara desert."

```
For this example response, a llm.Citation object is generated with the following property
values:
```
```
{
"start": 52,
"end": 83,
"text": "only live in the Sahara desert.",
"documentIds": ["doc2"]
}
```
```
The value of the end property is the number of characters from the beginning of the
response where the cited text ends (that is, the end of the cited text in the response
occurs 83 characters from the beginning of the response text).
```
**Type** number

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.Citation


```
Sibling Object
Members
```
Citation Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
// The documents doc1 and doc2 are created using llm.createDocument(options)
const response = llm.generateText({
prompt: "My test prompt",
documents: [doc1, doc2]
});
```
```
// If information in the provided documents is used to generate the response,
// the returned llm.Response object includes citations indicating where the
// cited information is located in the response
const citations = response.citations;
for (var i = 0; i < citations.length; i++) {
var documentIds = citations[i].documentIds;
var end = citations[i].end;
var start = citations[i].start;
var text = citations[i].text;
```
```
// Work with the citation properties
}
```
```
...
// Add additional code
```
### Citation.start

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The starting position in the document where the cited text is located.

```
The starting position is relative to the number of characters in the LLM response. For
example, consider the following code sample:
```
```
const doc1 = llm.createDocument({
id: "doc1",
data: "Emperor penguins are the tallest."
```

```
});
const doc2 = llm.createDocument({
id: "doc2",
data: "Emperor penguins only live in the Sahara desert."
});
```
```
const response = llm.generateText({
prompt: "Where do the tallest penguins live?",
documents: [doc1, doc2]
});
```
The response from the LLM might look similar to the following:

"Emperor penguins are the tallest penguins, and they only live in the Sahara desert."

```
For this example response, a llm.Citation object is generated with the following property
values:
```
```
{
"start": 52,
"end": 83,
"text": "only live in the Sahara desert.",
"documentIds": ["doc2"]
}
```
```
The value of the start property is the number of characters from the beginning of the
response where the cited text starts (that is, the start of the cited text in the response
occurs 52 characters from the beginning of the response text).
```
**Type** number

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.Citation

```
Sibling Object
Members
```
Citation Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
// The documents doc1 and doc2 are created using llm.createDocument(options)
const response = llm.generateText({
prompt: "My test prompt",
documents: [doc1, doc2]
});
```

```
// If information in the provided documents is used to generate the response,
// the returned llm.Response object includes citations indicating where the
// cited information is located in the response
const citations = response.citations;
for (var i = 0; i < citations.length; i++) {
var documentIds = citations[i].documentIds;
var end = citations[i].end;
var start = citations[i].start;
var text = citations[i].text;
```
```
// Work with the citation properties
}
```
```
...
// Add additional code
```
### Citation.text

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The cited text from the document.

**Type** string

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.Citation

**Sibling Object Members** Citation Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
// The documents doc1 and doc2 are created using llm.createDocument(options)
const response = llm.generateText({
prompt: "My test prompt",
documents: [doc1, doc2]
```

```
});
```
```
// If information in the provided documents is used to generate the response,
// the returned llm.Response object includes citations indicating where the
// cited information is located in the response
const citations = response.citations;
for (var i = 0; i < citations.length; i++) {
var documentIds = citations[i].documentIds;
var end = citations[i].end;
var start = citations[i].start;
var text = citations[i].text;
```
```
// Work with the citation properties
}
```
```
...
// Add additional code
```
## llm.Document

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Object
Description
```
A document returned from llm.createDocument(options).

```
A document represents source content that you can provide as additional context to the LLM
when you call llm.generateText(options) or llm.generateText.promise(options). The LLM uses
information in the provided documents to augment its response using retrieval-augmented
generation (RAG). For more information about RAG, see What Is Retrieval-Augmented Generation
(RAG)?
```
```
Document objects are included in the llm.Response object that is returned from
llm.generateText(options) or llm.generateText.promise(options), if applicable, through the
Response.documents property. This property is an array of document objects, each representing
a document that was used to generate the response returned from llm.generateText(options)
or llm.generateText.promise(options). You can use the document object to confirm the content
that was used to generate the response. The object includes properties that specify the ID of the
document used (Document.id) and the content of the document (Document.data).
```
```
Documents are used to provide additional context for the response, and the information in
provided documents is processed together with ground truth information for the LLM model to
produce a more comprehensive response. For example, consider the following code sample:
```
```
const doc1 = llm.createDocument({
id: "doc1",
data: "Emperor penguins are the tallest."
});
const doc2 = llm.createDocument({
id: "doc2",
data: "Emperor penguins only live in the Sahara desert."
});
const doc3 = llm.createDocument({
id: "doc3",
data: "Emperor penguins only live in Antarctica."
});
```
```
const response = llm.generateText({
prompt: "Where do the tallest penguins live?",
documents: [doc1, doc2, doc3]
});
```
```
In this example, the provided documents include conflicting information about where emperor
penguins live. The LLM considers this information alongside its ground truth information about
```

```
penguins and the climates they typically live in, and it might produce a response similar to the
following:
```
```
"Emperor penguins are the tallest penguins, and they live in Antarctica. However, one source
suggests that emperor penguins only live in the Sahara desert. This seems unlikely, as the Sahara
is a desert and emperor penguins are native to cold climates."
```
```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

```
Methods and
Properties
```
Document Object Members

**Since** 2025.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
// The documents doc1 and doc2 are created using llm.createDocument(options)
const response = llm.generateText({
prompt: "My test prompt",
documents: [doc1, doc2]
});
```
```
// If information in the provided documents is used to generate the response,
// the returned llm.Response object includes the IDs of the documents that
// were used
const documents = response.documents;
for (var i = 0; i < documents.length; i++) {
var data = documents[i].data;
var id = documents[i].id;
```
```
// Work with the document properties
}
```
```
...
// Add additional code
```
### Document.data

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The content of the document.

```
You specify the content of a document using the options.data parameter when calling
llm.createDocument(options).
```
**Type** string


**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.Citation

**Sibling Object Members** Document Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
// The documents doc1 and doc2 are created using llm.createDocument(options)
const response = llm.generateText({
prompt: "My test prompt",
documents: [doc1, doc2]
});
```
```
// If information in the provided documents is used to generate the response,
// the returned llm.Response object includes the IDs of the documents that
// were used
const documents = response.documents;
for (var i = 0; i < documents.length; i++) {
var data = documents[i].data;
var id = documents[i].id;
```
```
// Work with the document properties
}
```
```
...
// Add additional code
```
### Document.id

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The ID of the document.

```
You specify the ID of a document using the options.id parameter when calling
llm.createDocument(options).
```

**Type** string

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.Citation

**Sibling Object Members** Document Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
// The documents doc1 and doc2 are created using llm.createDocument(options)
const response = llm.generateText({
prompt: "My test prompt",
documents: [doc1, doc2]
});
```
```
// If information in the provided documents is used to generate the response,
// the returned llm.Response object includes the IDs of the documents that
// were used
const documents = response.documents;
for (var i = 0; i < documents.length; i++) {
var data = documents[i].data;
var id = documents[i].id;
```
```
// Work with the document properties
}
```
```
...
// Add additional code
```
## llm.EmbedResponse

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Object Description** The embeddings response returned from the LLM.


```
Use the llm.embed(options) or the llm.embed.promise(options) method to retrieve an
embeddings response from the LLM.
```
**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Methods and Properties** EmbedResponse Object Members

**Since** 2025.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.embed({
inputs: ['Hello World']
});
```
```
...
// Add additional code
```
### EmbedResponse.embeddings

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The embeddings returned from the LLM.

**Type** number[]

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.EmbedResponse

**Sibling Object Members** EmbedResponse Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.


#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.embed({
inputs: ['Hello World']
});
const responseEmbeddings = response.embeddings;
```
```
...
// Add additional code
```
### EmbedResponse.inputs

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The list of inputs used to generate the embeddings response.

**Type** string[]

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.EmbedResponse

**Sibling Object Members** EmbedResponse Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
```

```
...
```
```
const response = llm.embed({
inputs: ['Hello World']
});
const responseInputs = response.inputs;
```
```
...
// Add additional code
```
### EmbedResponse.model

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The model used to generate the embeddings response.

**Type** string

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.EmbedResponse

**Sibling Object Members** EmbedResponse Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.embed({
inputs: ['My test prompt']
});
const responseModel = response.model;
```
```
...
// Add additional code
```

## llm.Response

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Object Description** The response returned from the LLM.

```
Use the llm.generateText(options) or the llm.generateText.promise(options) method to
retrieve a response from the LLM.
```
**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Methods and Properties** Response Object Members

**Since** 2024.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.generateText({
prompt: 'Hello World'
});
```
```
...
// Add additional code
```
### Response.chatHistory

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Object Description** The list of chat messages.

**Type** llm.ChatMessage[]

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module


**Parent Object** llm.Response

**Sibling Object Members** Response Object Members

**Since** 2024.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.generateText({
prompt: 'Hello World'
});
const responseChatHistory = response.chatHistory;
```
```
...
// Add additional code
```
### Response.citations

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Property
Description
```
The list of citations used to generate the response.

```
This property is an array of llm.Citation objects, each of which represents relevant
information that was taken from a document provided to llm.generateText(options) or
llm.generateText.promise(options). This property has a value only if a provided document was
used to generate the response.
```
**Type** llm.Citation[]

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.Response

```
Sibling Object
Members
```
Response Object Members


**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
// The documents doc1 and doc2 are created using llm.createDocument(options)
const response = llm.generateText({
prompt: "My test prompt",
documents: [doc1, doc2]
});
```
```
// If information in the provided documents is used to generate the response,
// the returned llm.Response object includes citations indicating where the
// cited information is located in the response
const citations = response.citations;
```
```
...
// Add additional code
```
### Response.documents

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Property
Description
```
The list of documents used to generate the response.

```
This property is an array of llm.Document objects, each of which represents a document
provided to llm.generateText(options) or llm.generateText.promise(options). This property has
a value only if a provided document was used to generate the response.
```
**Type** llm.Document[]

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.Response

```
Sibling Object
Members
```
Response Object Members

**Since** 2025.1


#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
// The documents doc1 and doc2 are created using llm.createDocument(options)
const response = llm.generateText({
prompt: "My test prompt",
documents: [doc1, doc2]
});
```
```
// If information in the provided documents is used to generate the response,
// the returned llm.Response object includes the provided documents
const documents = response.documents;
```
```
...
// Add additional code
```
### Response.model

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The model used to produce the LLM response.

**Type** string

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.Response

**Sibling Object Members** Response Object Members

**Since** 2024.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.


#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.generateText({
prompt: 'Hello World'
});
const responseModel = response.model;
```
```
...
// Add additional code
```
### Response.text

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The text returned by the LLM.

**Type** string

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.Response

**Sibling Object Members** Response Object Members

**Since** 2024.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.generateText({
prompt: 'Hello World'
});
const responseText = response.text;
```

```
...
// Add additional code
```
## llm.StreamedResponse

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Object
Description
```
The streamed response returned from the LLM.

Use the following methods to retrieve a streamed response from the LLM:

■ llm.generateTextStreamed(options)

■ llm.generateTextStreamed.promise(options)

■ llm.evaluatePromptStreamed(options)

■ llm.evaluatePromptStreamed.promise(options)

```
When calling these methods, you can access the partial response (using the
StreamedResponse.text property of the returned llm.StreamedResponse object)
before the entire response has been generated. You can also access the value
of the StreamedResponse.model property in this way. Other properties (such as
StreamedResponse.documents and StreamedResponse.citations) are accessible only after the
entire response has been generated.
```
```
You can use an iterator to examine each token returned by the LLM. For an example, see
llm.generateTextStreamed(options).
```
```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

```
Methods and
Properties
```
StreamedResponse Object Members

**Since** 2025.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.generateTextStreamed({
prompt: 'Hello World'
});
```
```
var iter = response.iterator();
iter.each(function(token) {
log.debug('token.value: ' + token.value);
log.debug('response.text: ' + response.text);
return true;
})
```

```
...
// Add additional code
```
### StreamedResponse.chatHistory

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The list of chat messages.

###### Note: The value of this property is not available until the entire response

from the LLM has been generated.

**Type** llm.ChatMessage[]

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.StreamedResponse

**Sibling Object Members** StreamedResponse Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.generateTextStreamed({
prompt: 'Hello World'
});
```
```
var iter = response.iterator();
iter.each(function(token) {
log.debug('token.value: ' + token.value);
log.debug('response.text: ' + response.text);
return true;
})
```
```
const responseChatHistory = response.chatHistory;
```
```
...
// Add additional code
```

### StreamedResponse.citations

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Property
Description
```
The list of citations used to generate the streamed response.

```
This property is an array of llm.Citation objects, each of which represents relevant information
that was taken from a document provided to llm.generateTextStreamed(options) or
llm.generateTextStreamed.promise(options). This property has a value only if a provided
document was used to generate the response.
```
###### Note: The value of this property is not available until the entire response from the

LLM has been generated.

**Type** llm.Citation[]

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.StreamedResponse

```
Sibling Object
Members
```
StreamedResponse Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
// The documents doc1 and doc2 are created using llm.createDocument(options)
const response = llm.generateTextStreamed({
prompt: 'My test prompt',
documents: [doc1, doc2]
});
```
```
var iter = response.iterator();
iter.each(function(token) {
log.debug('token.value: ' + token.value);
log.debug('response.text: ' + response.text);
return true;
})
```
```
// If information in the provided documents is used to generate the response,
```

```
// the returned llm.StreamedResponse object includes citations indicating where the
// cited information is located in the response
const responseCitations = response.citations;
```
```
...
// Add additional code
```
### StreamedResponse.documents

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Property
Description
```
The list of documents used to generate the streamed response.

```
This property is an array of llm.Document objects, each of which
represents a document provided to llm.generateTextStreamed(options) or
llm.generateTextStreamed.promise(options). This property has a value only if a provided
document was used to generate the response.
```
###### Note: The value of this property is not available until the entire response from the

LLM has been generated.

**Type** llm.Document[]

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.StreamedResponse

```
Sibling Object
Members
```
StreamedResponse Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
// The documents doc1 and doc2 are created using llm.createDocument(options)
const response = llm.generateTextStreamed({
prompt: 'My test prompt',
documents: [doc1, doc2]
});
```

```
var iter = response.iterator();
iter.each(function(token) {
log.debug('token.value: ' + token.value);
log.debug('response.text: ' + response.text);
return true;
})
```
```
// If information in the provided documents is used to generate the response,
// the returned llm.Response object includes the provided documents
const responseDocuments = response.documents;
```
```
...
// Add additional code
```
### StreamedResponse.model

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Property Description** The model used to produce the streamed response.

**Type** string

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.StreamedResponse

**Sibling Object Members** StreamedResponse Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.generateTextStreamed({
prompt: 'Hello World'
});
```
```
var iter = response.iterator();
iter.each(function(token) {
log.debug('token.value: ' + token.value);
log.debug('response.text: ' + response.text);
return true;
})
```

```
const responseModel = response.model;
```
```
...
// Add additional code
```
### StreamedResponse.text

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Property
Description
```
The text returned by the LLM.

```
After calling a streamed method (such as llm.generateTextStreamed(options) or
llm.evaluatePromptStreamed(options)), you can use this property to examine the partial
response returned from the LLM before the entire response has been generated, as the
following example shows:
```
```
var response = llm.generateTextStreamed("Write a 500 word pitch for a TV show about bears");
var iter = response.iterator();
iter.each(function(token){
log.debug("token.value: " + token.value);
log.debug("response.text: " + response.text);
return true;
})
```
```
In this example, token.value contains the values of each token returned by the LLM, and
response.text contains the partial response up to and including that token. For more
information about iterators in SuiteScript, see Iterator.
```
**Type** string

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Module** N/llm Module

**Parent Object** llm.StreamedResponse

```
Sibling Object
Members
```
StreamedResponse Object Members

**Since** 2025.1

#### Errors

**Error Code Thrown If**

READ_ONLY Setting the property is attempted.

#### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.generateTextStreamed({
```

```
prompt: 'Hello World'
});
```
```
var iter = response.iterator();
iter.each(function(token) {
log.debug('token.value: ' + token.value);
log.debug('response.text: ' + response.text);
return true;
})
```
```
const responseText = response.text;
```
```
...
// Add additional code
```
## llm.createChatMessage(options)

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Method Description Creates a chat message based on a specified role and text. Chat messages can be used in
the chatHistory parameter of the llm.generateText(options) method. Supported roles are
defined by the llm.ChatRole enum.
```
**Returns** llm.ChatMessage

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** None

**Module** N/llm Module

**Since** 2024.1

### Parameters

**Parameter Type Required / Optional Description Since**

options.role string required Author of the message (as a role).

Use llm.ChatRole to set the value.

2024.1

options.text string required Text of the chat. 2024.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const myChatMessage = llm.createChatMessage({
role: llm.ChatRole.USER,
text: 'Hello World'
});
```

```
...
// Add additional code
```
## llm.createDocument(options)

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Method
Description
```
Creates a document with the specified ID and content.

```
A document represents source content that you can provide as additional context to the LLM
when you call llm.generateText(options) or llm.generateText.promise(options). The LLM uses
information in the provided documents to augment its response using retrieval-augmented
generation (RAG). For more information about RAG, see What Is Retrieval-Augmented
Generation (RAG)?
```
```
You do not need to use this method to create a document before providing the document to
llm.generateText(options) or llm.generateText.promise(options). You can also provide a plain
JavaScript object that uses the id and data properties, similar to the following example:
```
```
var response = llm.generateText({
prompt: "My test prompt",
documents: [{
id: "doc1",
data: "Content of doc1"
},{
id: "doc2",
data: "Content of doc2"
}]
});
```
**Returns** llm.Document

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** None

**Module** N/llm Module

**Since** 2025.1

### Parameters

**Parameter Type Required / Optional Description Since**

options.data string required The content of the document. 2025.1

options.id string required The ID of the document. 2025.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
```

```
...
```
```
const doc1 = llm.createDocument({
id: "doc1",
data: "My document data"
});
```
```
...
// Add additional code
```
## llm.embed(options)

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Method
Description
```
Returns the embeddings from the LLM for a given input.

```
You can use embeddings to compare the similarity of a set of inputs, which is useful for finding
similar items based on item attributes, implementing semantic search, and applying text
classification or text clustering. For example, consider a scenario where you sell items, and if
an item is out of stock, you want to provide a list of similar items for customers to purchase
instead. Here is an example of how you might use embeddings to find similar items:
```
1. Generate embeddings for each item that you sell.
2. Generate embeddings for the original item that you want to find similar items for.
3. Calculate the cosine similarity between these embeddings, which gives you the
    similarity of each item with respect to the original item. For more information about
    cosine similarity, see Cosine similarity.

```
NetSuite supports specific embeddings models from Cohere. For a list of these models, see
llm.EmbedModelFamily.
```
**Returns** llm.EmbedResponse

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** 50

**Module** N/llm Module

**Since** 2025.1

### Parameters

```
Parameter Type Required /
Optional
```
**Description Since**

options.inputs string[] required An array of inputs to get embeddings for. 2025.1

```
options.embedModel
Family
```
string optional The embed model family to use.

```
Use values from llm.EmbedModelFamily to set
this value. If not specified, the Cohere Embed
Multilingual model is used.
```
2025.1

```
options.ociConfig Object optional Configuration needed for unlimited usage through
OCI Generative AI Service. Required only when
```
2025.1


```
Parameter Type Required /
Optional
```
**Description Since**

```
accessing the LLM through an Oracle Cloud
Account and the OCI Generative AI Service.
SuiteApps installed to target accounts are
prevented from using the free usage pool for N/llm
and must use the OCI configuration.
```
```
options.ociConfig.
compartmentId
```
```
string optional Compartment OCID. For more information, refer
to Managing Compartments in the Oracle Cloud
Infrastructure Documentation.
```
2025.1

```
options.ociConfig.
endpointId
```
```
string optional Endpoint ID. This value is needed only when a
custom OCI DAC (dedicated AI cluster) is to be
used. For more information, refer to Managing
an Endpoint in Generative AI in the Oracle Cloud
Infrastructure Documentation.
```
2025.1

```
options.ociConfig.
fingerprint
```
```
string optional Fingerprint of the public key (only a NetSuite
secret is accepted—see the help topic Creating
Secrets ). For more information, refer to Required
Keys and OCIDs in the Oracle Cloud Infrastructure
Documentation.
```
2025.1

```
options.ociConfig.
privateKey
```
```
string optional Private key of the OCI user (only a NetSuite secret
is accepted—see the help topic Creating Secrets
). For more information, refer to Required Keys
and OCIDs in the Oracle Cloud Infrastructure
Documentation.
```
2025.1

```
options.ociConfig.
tenancyId
```
```
string optional Tenancy OCID. For more information, refer
to Managing the Tenancy in the Oracle Cloud
Infrastructure Documentation.
```
2025.1

```
options.ociConfig.
userId
```
```
string optional User OCID. For more information, refer to
Managing Users in the Oracle Cloud Infrastructure
Documentation.
```
2025.1

```
options.timeout number optional The amount of time to wait for a response from the
LLM, in milliseconds.
```
If not specified, the default value is 30,000.

2025.1

```
options.truncate string optional The truncation method to use when embeddings
input exceeds 512 tokens.
```
```
Use values from llm.Truncate to set this value. If not
specified, no truncation method is used.
```
2025.1

### Errors

**Error Code Thrown If**

SSS_MISSING_REQD_ARGUMENT The options.inputs parameter was not provided.

```
UNRECOGNIZED_OCI_CONFIG_PARAMETERS One or more unrecognized parameters for the OCI
configuration were provided.
```
```
ONLY_API_SECRET_IS_ACCEPTED The options.ociConfig. privateKey or
options.ociConfig.fingerprint parameters are not
NetSuite API secrets.
```

```
Error Code Thrown If
For more information about API secrets, see the help
topic Secrets Management.
```
```
INVALID_MODEL_FAMILY_VALUE The value provided for the options.embedModelFamily
parameter is not included in the llm.EmbedModelFamily
enum.
```
```
MAXIMUM_PARALLEL_REQUESTS_LIMIT_EXCEEDED The number of parallel requests to the LLM is greater
than 5.
```
```
NO_INPUTS_TO_EMBED The value of the options.inputs parameter has a length
of 0.
```
```
CAN_EMBED_1_INPUTS_AT_MAXIMUM The value of the options.inputs parameter has a length
greater than 96.
```
```
You can provide a maximum of 96 inputs in a single call
to llm.embed(options).
```
```
INVALID_TRUNCATION_METHOD The value of the options.truncate parameter is not
included in the llm.Truncate enum.
```
UNSUPPORTED_NUMBER_OF_TOKENS Too many tokens were provided as embeddings input.

```
Use a truncation method from llm.Truncate to reduce the
size of the embeddings input.
```
### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.embed({
inputs: ["Hello World"],
embedModelFamily: llm.EmbedModelFamily.COHERE_EMBED_ENGLISH,
timeout: 10000,
truncate: llm.Truncate.START
});
```
```
...
// Add additional code
```
## llm.embed.promise(options)

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Method Description** Asynchronously returns the embeddings from the LLM for a given input.


###### Note: The parameters and errors thrown for this method are the same as

```
those for llm.embed(options). For more information about promises, see Promise
Object.
```
**Returns** Promise Object

**Synchronous Version** llm.embed(options)

**Supported Script Types** Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** 50

**Module** N/llm Module

**Since** 2025.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
llm.embed.promise({
inputs: ["Hello World"],
embedModelFamily: llm.EmbedModelFamily.COHERE_EMBED_ENGLISH,
timeout: 10000,
truncate: llm.Truncate.START
}).then(function(result) {
log.debug(result)
}).catch(function(reason) {
log.debug(reason)
})
```
```
...
// Add additional code
```
## llm.evaluatePrompt(options)

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Method
Description
```
```
Takes the ID of an existing prompt and values for variables used in the prompt and returns the
response from the LLM.
```
```
You can use this method to evaluate a prompt that is available in Prompt Studio by providing
values for any variables that the prompt uses. The resulting prompt is sent to the LLM, and this
method returns the LLM response, similar to the llm.generateText(options) method. For more
information about Prompt Studio, see the help topic Prompt Studio.
```

```
When unlimited usage mode is used, this method accepts the OCI configuration parameters.
You can also specify OCI configuration parameters on the SuiteScript tab of the AI Preferences
page. For more information, see the help topic Using Your Own OCI Configuration for
SuiteScript Generative AI APIs.
```
**Returns** llm.Response

**Aliases** llm.executePrompt(options)

###### Note: These aliases use the same parameters and can throw the same errors as the

llm.evaluatePrompt(options) method.

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** 100

**Module** N/llm Module

**Since** 2025.1

### Parameters

```
Parameter Type Required /
Optional
```
**Description Since**

```
options.id string |
number
```
required ID of the prompt to evaluate. 2025.1

```
options.ociConfig Object optional Configuration needed for unlimited usage through
OCI Generative AI Service. Required only when
accessing the LLM through an Oracle Cloud Account
and the OCI Generative AI Service. SuiteApps installed
to target accounts are prevented from using the
free usage pool for N/llm and must use the OCI
configuration.
```
```
Instead of specifying OCI configuration details
using this parameter, you can specify them on the
SuiteScript tab of the AI Preferences page. When
you do so, those OCI configuration details are used
for all scripts in your account that use N/llm module
methods, and unlimited usage mode is enabled for
those scripts. If you specify OCI configuration details
in both places (using this parameter and using the
SuiteScript tab of the AI Preferences page), the details
provided in this parameter override those that are
specified on the SuiteScript tab. For more information,
see the help topic Using Your Own OCI Configuration
for SuiteScript Generative AI APIs.
```
2025.1

```
options.ociConfig.
compartmentId
```
```
string optional Compartment OCID. For more information, refer
to Managing Compartments in the Oracle Cloud
Infrastructure Documentation.
```
2025.1

```
options.ociConfig.
endpointId
```
```
string optional Endpoint ID. This value is needed only when a custom
OCI DAC (dedicated AI cluster) is to be used. For
more information, refer to Managing an Endpoint
in Generative AI in the Oracle Cloud Infrastructure
Documentation.
```
2025.1


```
Parameter Type Required /
Optional
```
**Description Since**

```
options.ociConfig.
fingerprint
```
```
string optional Fingerprint of the public key (only a NetSuite secret is
accepted—see the help topic Creating Secrets ). For
more information, refer to Required Keys and OCIDs in
the Oracle Cloud Infrastructure Documentation.
```
2025.1

```
options.ociConfig.
privateKey
```
```
string optional Private key of the OCI user (only a NetSuite secret is
accepted—see the help topic Creating Secrets ). For
more information, refer to Required Keys and OCIDs in
the Oracle Cloud Infrastructure Documentation.
```
2025.1

```
options.ociConfig.
tenancyId
```
```
string optional Tenancy OCID. For more information, refer
to Managing the Tenancy in the Oracle Cloud
Infrastructure Documentation.
```
2025.1

```
options.ociConfig.
userId
```
```
string optional User OCID. For more information, refer to Managing
Users in the Oracle Cloud Infrastructure Documentation.
```
2025.1

options.timeout number optional Timeout in milliseconds, defaults to 30,000. 2025.1

```
options.variables Object optional Values for the variables that are used in the prompt.
Provide these values as an object with key-value pairs.
For an example, see the Syntax section.
```
```
You can use Prompt Studio to generate a SuiteScript
example that uses this method and includes the
variables for a prompt in the correct format. When
viewing a prompt in Prompt Studio, click Show
SuiteScript Example to generate SuiteScript code with
all of the variables that prompt uses. You can then use
this code in your scripts and provide a value for each
variable.
```
2025.1

### Errors

**Error Code Thrown If**

SSS_MISSING_REQD_ARGUMENT The options.id parameter is missing.

INVALID_ID_PREFIX The prefix of the options.id parameter is not custprompt.

```
UNRECOGNIZED_OCI_CONFIG_PARAMETERS One or more unrecognized parameters for OCI
configuration have been used.
```
```
ONLY_API_SECRET_IS_ACCEPTED The options.ociConfig. privateKey or
options.ociConfig.fingerprint parameters are not
NetSuite API secrets.
```
```
MAXIMUM_PARALLEL_REQUESTS_LIMIT_EXCEEDED The number of parallel requests to the LLM is greater than
5.
```
```
TEMPLATE_PROCESSING_EXCEPTION The template for the specified prompt contains errors and
cannot be processed. For example, this error is thrown in
the following cases:
```
```
■ The prompt template uses required variables that are
not specified in the options.variables parameter.
```

```
Error Code Thrown If
■ The prompt template contains syntax errors, such as
an opening if statement without a corresponding
closing one.
```
### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.evaluatePrompt({
id: -1,
variables: {
"form": {
"itemid": "My Item",
"stockdescription": "This is a custom item for my business.",
"vendorname": "Item Supplier Inc.",
"isdropshipitem": "false",
"isspecialorderitem": "true",
"displayname": "My Awesome Item"
},
"text": "This item increases productivity."
},
ociConfig: {
// Replace ociConfig values with your Oracle Cloud Account values
userId: 'ocid1.user.oc1..aaaaaaaanld....exampleuserid',
tenancyId: 'ocid1.tenancy.oc1..aaaaaaaabt....exampletenancyid',
compartmentId: 'ocid1.compartment.oc1..aaaaaaaaph....examplecompartmentid',
// Replace fingerprint and privateKey with your NetSuite API secret ID values
fingerprint: 'custsecret_oci_fingerprint',
privateKey: 'custsecret_oci_private_key'
}
});
```
```
...
// Add additional code
```
## llm.evaluatePrompt.promise(options)

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Method Description Takes the ID of an existing prompt and values for variables used in the prompt and returns
the response from the LLM asynchronously.
```
```
When unlimited usage mode is used, this method accepts the OCI configuration parameters.
You can also specify OCI configuration parameters on the SuiteScript tab of the AI
Preferences page. For more information, see the help topic Using Your Own OCI
Configuration for SuiteScript Generative AI APIs.
```
###### Note: The parameters and errors thrown for this method are the same as those

```
for llm.evaluatePrompt(options). For more information about promises, see Promise
Object.
```
**Returns** Promise Object


```
Synchronous
Version
```
llm.evaluatePrompt(options)

**Aliases** llm.executePrompt.promise(options)

###### Note: These aliases use the same parameters and can throw the same errors as

the llm.evaluatePrompt(options) method.

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** 100

**Module** N/llm Module

**Since** 2025.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete promise script example, see Promise Object.

```
// Add additional code
...
```
```
llm.evaluatePrompt.promise({
const response = llm.evaluatePrompt({
id: 'stdprompt_gen_purch_desc_invt_item',
variables: {
"form": {
"itemid": "My Item",
"stockdescription": "This is a custom item for my business.",
"vendorname": "Item Supplier Inc.",
"isdropshipitem": "false",
"isspecialorderitem": "true",
"displayname": "My Awesome Item"
},
"text": "This item increases productivity."
},
ociConfig: {
// Replace ociConfig values with your Oracle Cloud Account values
userId: 'ocid1.user.oc1..aaaaaaaanld....exampleuserid',
tenancyId: 'ocid1.tenancy.oc1..aaaaaaaabt....exampletenancyid',
compartmentId: 'ocid1.compartment.oc1..aaaaaaaaph....examplecompartmentid',
// Replace fingerprint and privateKey with your NetSuite API secret ID values
fingerprint: 'custsecret_oci_fingerprint',
privateKey: 'custsecret_oci_private_key'
}
}).then(function(result) {
log.debug(result)
}).catch(function(reason) {
log.debug(reason)
});
})
```
```
...
// Add additional code
```

## llm.evaluatePromptStreamed(options)

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Method
Description
```
```
Takes the ID of an existing prompt and values for variables used in the prompt and returns the
streamed response from the LLM.
```
```
You can use this method to evaluate a prompt that is available in Prompt Studio by providing
values for any variables that the prompt uses. The resulting prompt is sent to the LLM, and this
method returns the LLM response, similar to the llm.generateText(options) method. For more
information about Prompt Studio, see the help topic Prompt Studio.
```
```
This method is similar to llm.evaluatePrompt(options) but returns the LLM response
as a stream. After calling this method, you can access the partial response (using the
StreamedResponse.text property of the returned llm.StreamedResponse object) before the
entire response has been generated. You can also use an iterator to examine each token
returned by the LLM, as the following example shows:
```
```
var response = llm.evaluatePromptStreamed({
id: - 1
});
var iter = response.iterator();
iter.each(function(token){
log.debug("token.value: " + token.value);
log.debug("response.text: " + response.text);
return true;
})
```
```
In this example, token.value contains the values of each token returned by the LLM, and
response.text contains the partial response up to and including that token. For more
information about iterators in SuiteScript, see Iterator.
```
```
When unlimited usage mode is used, this method accepts the OCI configuration parameters.
You can also specify OCI configuration parameters on the SuiteScript tab of the AI Preferences
page. For more information, see the help topic Using Your Own OCI Configuration for
SuiteScript Generative AI APIs.
```
**Returns** llm.StreamedResponse

**Aliases** llm.executePromptStreamed(options)

###### Note: These aliases use the same parameters and can throw the same errors as the

llm.evaluatePromptStreamed(options) method.

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** 100

**Module** N/llm Module

**Since** 2025.1


### Parameters

```
Parameter Type Required /
Optional
```
**Description Since**

```
options.id string |
number
```
required ID of the prompt to evaluate. 2025.1

```
options.ociConfig Object optional Configuration needed for unlimited usage through
OCI Generative AI Service. Required only when
accessing the LLM through an Oracle Cloud Account
and the OCI Generative AI Service. SuiteApps installed
to target accounts are prevented from using the
free usage pool for N/llm and must use the OCI
configuration.
```
```
Instead of specifying OCI configuration details
using this parameter, you can specify them on the
SuiteScript tab of the AI Preferences page. When
you do so, those OCI configuration details are used
for all scripts in your account that use N/llm module
methods, and unlimited usage mode is enabled for
those scripts. If you specify OCI configuration details
in both places (using this parameter and using the
SuiteScript tab of the AI Preferences page), the details
provided in this parameter override those that are
specified on the SuiteScript tab. For more information,
see the help topic Using Your Own OCI Configuration
for SuiteScript Generative AI APIs.
```
2025.1

```
options.ociConfig.
compartmentId
```
```
string optional Compartment OCID. For more information, refer
to Managing Compartments in the Oracle Cloud
Infrastructure Documentation.
```
2025.1

```
options.ociConfig.
endpointId
```
```
string optional Endpoint ID. This value is needed only when a custom
OCI DAC (dedicated AI cluster) is to be used. For
more information, refer to Managing an Endpoint
in Generative AI in the Oracle Cloud Infrastructure
Documentation.
```
2025.1

```
options.ociConfig.
fingerprint
```
```
string optional Fingerprint of the public key (only a NetSuite secret is
accepted—see the help topic Creating Secrets ). For
more information, refer to Required Keys and OCIDs in
the Oracle Cloud Infrastructure Documentation.
```
2025.1

```
options.ociConfig.
privateKey
```
```
string optional Private key of the OCI user (only a NetSuite secret is
accepted—see the help topic Creating Secrets ). For
more information, refer to Required Keys and OCIDs in
the Oracle Cloud Infrastructure Documentation.
```
2025.1

```
options.ociConfig.
tenancyId
```
```
string optional Tenancy OCID. For more information, refer
to Managing the Tenancy in the Oracle Cloud
Infrastructure Documentation.
```
2025.1

```
options.ociConfig.
userId
```
```
string optional User OCID. For more information, refer to Managing
Users in the Oracle Cloud Infrastructure Documentation.
```
2025.1

options.timeout number optional Timeout in milliseconds, defaults to 30,000. 2025.1

```
options.variables Object optional Values for the variables that are used in the prompt.
Provide these values as an object with key-value pairs.
For an example, see the Syntax section.
```
2025.1


```
Parameter Type Required /
Optional
```
**Description Since**

```
You can use Prompt Studio to generate a SuiteScript
example that uses this method and includes the
variables for a prompt in the correct format. When
viewing a prompt in Prompt Studio, click Show
SuiteScript Example to generate SuiteScript code with
all of the variables that prompt uses. You can then use
this code in your scripts and provide a value for each
variable.
```
### Errors

**Error Code Thrown If**

SSS_MISSING_REQD_ARGUMENT The options.id parameter is missing.

INVALID_ID_PREFIX The prefix of the options.id parameter is not custprompt.

```
UNRECOGNIZED_OCI_CONFIG_PARAMETERS One or more unrecognized parameters for OCI
configuration have been used.
```
```
ONLY_API_SECRET_IS_ACCEPTED The options.ociConfig. privateKey or
options.ociConfig.fingerprint parameters are not
NetSuite API secrets.
```
```
MAXIMUM_PARALLEL_REQUESTS_LIMIT_EXCEEDED The number of parallel requests to the LLM is greater than
5.
```
```
TEMPLATE_PROCESSING_EXCEPTION The template for the specified prompt contains errors and
cannot be processed. For example, this error is thrown in
the following cases:
```
```
■ The prompt template uses required variables that are
not specified in the options.variables parameter.
```
```
■ The prompt template contains syntax errors, such as
an opening if statement without a corresponding
closing one.
```
### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.evaluatePromptStreamed({
id: -1,
variables: {
"form": {
"itemid": "My Item",
"stockdescription": "This is a custom item for my business.",
"vendorname": "Item Supplier Inc.",
"isdropshipitem": "false",
"isspecialorderitem": "true",
"displayname": "My Awesome Item"
},
```

```
"text": "This item increases productivity."
},
ociConfig: {
// Replace ociConfig values with your Oracle Cloud Account values
userId: 'ocid1.user.oc1..aaaaaaaanld....exampleuserid',
tenancyId: 'ocid1.tenancy.oc1..aaaaaaaabt....exampletenancyid',
compartmentId: 'ocid1.compartment.oc1..aaaaaaaaph....examplecompartmentid',
// Replace fingerprint and privateKey with your NetSuite API secret ID values
fingerprint: 'custsecret_oci_fingerprint',
privateKey: 'custsecret_oci_private_key'
}
});
```
```
var iter = response.iterator();
iter.each(function(token){
log.debug("token.value: " + token.value);
log.debug("response.text: " + response.text);
return true;
})
```
```
...
// Add additional code
```
## llm.evaluatePromptStreamed.promise(options)

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Method Description Takes the ID of an existing prompt and values for variables used in the prompt and returns
the streamed response from the LLM asynchronously.
```
```
When unlimited usage mode is used, this method accepts the OCI configuration parameters.
You can also specify OCI configuration parameters on the SuiteScript tab of the AI
Preferences page. For more information, see the help topic Using Your Own OCI
Configuration for SuiteScript Generative AI APIs.
```
###### Note: The parameters and errors thrown for this method are the same as those

```
for llm.evaluatePrompt(options). For more information about promises, see Promise
Object.
```
**Returns** Promise Object

```
Synchronous
Version
```
llm.evaluatePromptStreamed(options)

**Aliases** llm.executePromptStreamed.promise(options)

###### Note: These aliases use the same parameters and can throw the same errors as

the llm.evaluatePromptStreamed(options) method.

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** 100

**Module** N/llm Module


**Since** 2025.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete promise script example, see Promise Object.

```
// Add additional code
...
```
```
llm.evaluatePromptStreamed.promise({
const response = llm.evaluatePrompt({
id: 'stdprompt_gen_purch_desc_invt_item',
variables: {
"form": {
"itemid": "My Item",
"stockdescription": "This is a custom item for my business.",
"vendorname": "Item Supplier Inc.",
"isdropshipitem": "false",
"isspecialorderitem": "true",
"displayname": "My Awesome Item"
},
"text": "This item increases productivity."
},
ociConfig: {
// Replace ociConfig values with your Oracle Cloud Account values
userId: 'ocid1.user.oc1..aaaaaaaanld....exampleuserid',
tenancyId: 'ocid1.tenancy.oc1..aaaaaaaabt....exampletenancyid',
compartmentId: 'ocid1.compartment.oc1..aaaaaaaaph....examplecompartmentid',
// Replace fingerprint and privateKey with your NetSuite API secret ID values
fingerprint: 'custsecret_oci_fingerprint',
privateKey: 'custsecret_oci_private_key'
}
}).then(function(result) {
log.debug(result)
}).catch(function(reason) {
log.debug(reason)
});
})
```
```
...
// Add additional code
```
## llm.generateText(options)

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Method Description** Returns the response from the LLM for a given prompt.

```
When unlimited usage mode is used, this method accepts the OCI configuration parameters.
You can also specify OCI configuration parameters on the SuiteScript tab of the AI Preferences
page. For more information, see the help topic Using Your Own OCI Configuration for
SuiteScript Generative AI APIs.
```
**Returns** llm.Response

**Aliases** llm.chat(options)


###### Note: These aliases use the same parameters and can throw the same errors as

the llm.generateText(options) method.

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** 100

**Module** N/llm Module

**Since** 2024.1

### Parameters

```
Parameter Type Required /
Optional
```
```
Description Since
```
```
options.prompt string required Prompt for the LLM. 2024.1
```
```
options.chatHistory llm.ChatMessage[] optional Chat history to be taken into consideration. 2024.1
```
```
options.documents llm.Document[] optional A list of documents to provide additional context
for the LLM to generate the response.
```
```
2025.1
```
```
options.image file.File optional An image to query.
```
```
You can send an image (as a file.File object) to the
LLM and ask questions about the image and get
text outputs, such as:
```
```
■ Advanced image captions
■ Detailed description of an image
■ Answers to questions about an image
```
```
■ Information about charts and graphs in an
image
```
###### Note: Image processing

```
is available only when using
the Meta Llama 3.2 model
(meta.llama-3.2-90b-vision-instruct).
```
```
For more information about creating and loading
files, see N/file Module.
```
```
2025.1
```
```
options.modelFamily enum optional Specifies the LLM to use. Use llm.ModelFamily
to set the value. If not specified, the Cohere
Command R LLM is used.
```
###### Note: JavaScript does not include

```
an enumeration type. The SuiteScript
2.x documentation uses the term
enumeration (or enum) to describe
a plain JavaScript object with a flat,
map-like structure. In this object, each
key points to a read-only string value.
```
```
2024.2
```
```
options.model
Parameters
```
```
Object optional Parameters of the model. For more information
about the model parameters, refer to the Chat
Model Parameters topic in the Oracle Cloud
Infrastructure Documentation.
```
```
2024.1
```

**Parameter Type Required /
Optional**

```
Description Since
```
options.model
Parameters.frequency
Penalty

```
number optional A penalty that is assigned to a token when that
token appears frequently. The higher the value,
the stronger a penalty is applied to previously
present tokens, proportional to how many times
they have already appeared in the prompt or
prior generation. See Model Parameter Values by
LLM for valid values.
```
```
2024.1
```
options.model
Parameters.maxTokens

```
number optional The maximum number of tokens the LLM is
allowed to generate. The average number of
tokens per word is 3. See Model Parameter
Values by LLM for valid values.
```
```
2024.1
```
options.model
Parameters.presence
Penalty

```
number optional A penalty that is assigned to each token when it
appears in the output to encourage generating
outputs with tokens that haven't been used.
Similar to frequencyPenalty, except that this
penalty is applied equally to all tokens that have
already appeared, regardless of their exact
frequencies. See Model Parameter Values by LLM
for valid values.
```
```
2024.1
```
options.model
Parameters.temperature

```
number optional Defines a range of randomness for the response.
A lower temperature will lean toward the highest
probability tokens and expected answers, while a
higher temperature will deviate toward random
and unconventional responses. A lower value
works best for responses that must be more
factual or accurate, and a higher value works best
for getting more creative responses. See Model
Parameter Values by LLM for valid values.
```
```
2024.1
```
options.model
Parameters.topK

```
number optional Determines how many tokens are considered for
generation at each step. See Model Parameter
Values by LLM for valid values.
```
```
2024.1
```
options.model
Parameters.topP

```
number optional Sets the probability, which ensures that only the
most likely tokens with total probability mass of
p are considered for generation at each step. If
both topK and topP are set, topP acts after topK.
See Model Parameter Values by LLM for valid
values.
```
```
2024.1
```
options.ociConfig Object optional Configuration needed for unlimited usage
through OCI Generative AI Service. Required
only when accessing the LLM through an Oracle
Cloud Account and the OCI Generative AI Service.
SuiteApps installed to target accounts are
prevented from using the free usage pool for N/
llm and must use the OCI configuration.

```
2024.1
```
options.ociConfig.
compartmentId

```
string optional Compartment OCID. For more information, refer
to Managing Compartments in the Oracle Cloud
Infrastructure Documentation.
```
```
2024.1
```
options.ociConfig.
endpointId

```
string optional Endpoint ID. This value is needed only when a
custom OCI DAC (dedicated AI cluster) is to be
used. For more information, refer to Managing
an Endpoint in Generative AI in the Oracle Cloud
Infrastructure Documentation.
```
```
2024.1
```
options.ociConfig.
fingerprint

```
string optional Fingerprint of the public key (only a NetSuite
secret is accepted—see the help topic Creating
Secrets ). For more information, refer to Required
```
```
2024.1
```

```
Parameter Type Required /
Optional
```
```
Description Since
```
```
Keys and OCIDs in the Oracle Cloud Infrastructure
Documentation.
```
```
options.ociConfig.
privateKey
```
```
string optional Private key of the OCI user (only a NetSuite secret
is accepted—see the help topic Creating Secrets
). For more information, refer to Required Keys
and OCIDs in the Oracle Cloud Infrastructure
Documentation.
```
```
2024.1
```
```
options.ociConfig.
tenancyId
```
```
string optional Tenancy OCID. For more information, refer
to Managing the Tenancy in the Oracle Cloud
Infrastructure Documentation.
```
```
2024.1
```
```
options.ociConfig.
userId
```
```
string optional User OCID. For more information, refer to
Managing Users in the Oracle Cloud Infrastructure
Documentation.
```
```
2024.1
```
```
options.preamble string optional Preamble override for the LLM. A preamble is the
Initial context or guiding message for an LLM.
For more details about using a preamble, refer
to About the Chat Models in Generative AI (Chat
Model Parameters section) in the Oracle Cloud
Infrastructure Documentation.
```
###### Note: Only valid for the Cohere

```
Command R model.
```
```
2024.1
```
```
options.timeout number optional Timeout in milliseconds, defaults to 30,000. 2024.1
```
### Errors

**Error Code Thrown If**

SSS_MISSING_REQD_ARGUMENT The options.prompt parameter is missing.

```
MUTUALLY_EXCLUSIVE_ARGUMENTS Both options.modelParameters.presencePenalty and
options.modelParameters.frequencyPenalty parameters are used when
options.modelFamily is set to COHERE_COMMAND_R. You can use a value greater than zero
for one or the other, but not both.
```
UNRECOGNIZED_MODEL_PARAMETERS One or more unrecognized model parameters have been used.

```
UNRECOGNIZED_OCI_CONFIG_
PARAMETERS
```
One or more unrecognized parameters for OCI configuration have been used.

```
ONLY_API_SECRET_IS_ACCEPTED The options.ociConfig. privateKey or options.ociConfig.fingerprint parameters are
not NetSuite API secrets.
```
```
INVALID_MODEL_FAMILY_VALUE The options.modelFamily parameter was not set to a valid option (for example, there
may have been a typo in the value or in the enum).
```
```
MODEL_1_DOES_NOT_ACCEPT_
PREAMBLE
```
```
The options.preamble parameter was provided but the model does not support a
preamble (for example, when a Meta Llama model is used).
```
```
MODEL_1_DOES_NOT_ACCEPT_
DOCUMENTS
```
```
The options.documents parameter was provided but the model does not support
retrieval-augmented generation (RAG).
```
```
MODEL_1_DOES_NOT_ACCEPT_IMAGE The options.image parameter was provided but the model does not support image
processing.
```
DOCUMENT_IDS_MUST_BE_UNIQUE Documents provided using the options.documents parameter have duplicate IDs.


**Error Code Thrown If**

```
INVALID_MAX_TOKENS_VALUE The options.modelParameters.maxTokens parameter value is incorrect for the model. See
Model Parameter Values by LLM for valid values.
```
```
INVALID_TEMPERATURE_VALUE The options.modelParameters.temperature parameter value is incorrect for the model.
See Model Parameter Values by LLM for valid values.
```
```
INVALID_TOP_K_VALUE The options.modelParameters.topK parameter value is incorrect for the model. See
Model Parameter Values by LLM for valid values.
```
```
INVALID_TOP_P_VALUE The options.modelParameters.topP parameter value is incorrect for the model. See
Model Parameter Values by LLM for valid values.
```
```
INVALID_FREQUENCY_PENALTY_
VALUE
```
```
The options.modelParameters.frequencyPenalty parameter value is incorrect for the
model. See Model Parameter Values by LLM for valid values.
```
```
INVALID_PRESENCE_PENALTY_VALUE The options.modelParameters.presencePenalty parameter value is incorrect for the
model. See Model Parameter Values by LLM for valid values.
```
```
MAXIMUM_PARALLEL_REQUESTS_
LIMIT_EXCEEDED
```
The number of parallel requests to the LLM is greater than 5.

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.generateText({
// preamble is optional for Cohere and must not be used for Meta Llama
preamble: "You are a successful salesperson. Answer in an enthusiastic, professional tone.",
prompt: "Hello World!",
documents: [doc1, doc2], // create documents using llm.createDocument(options)
modelFamily: llm.ModelFamily.COHERE_COMMAND_R, // uses COHERE_COMMAND_R when modelFamily is omitted
modelParameters: {
maxTokens: 1000,
temperature: 0.2,
topK: 3,
topP: 0.7,
frequencyPenalty: 0.4,
presencePenalty: 0
},
ociConfig: {
// Replace ociConfig values with your Oracle Cloud Account values
userId: 'ocid1.user.oc1..aaaaaaaanld....exampleuserid',
tenancyId: 'ocid1.tenancy.oc1..aaaaaaaabt....exampletenancyid',
compartmentId: 'ocid1.compartment.oc1..aaaaaaaaph....examplecompartmentid',
// Replace fingerprint and privateKey with your NetSuite API secret ID values
fingerprint: 'custsecret_oci_fingerprint',
privateKey: 'custsecret_oci_private_key'
}
});
```
```
...
// Add additional code
```

### Model Parameter Values by LLM

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

The following table shows the model parameter values for the supported large language model families.

These parameters are used by the llm.generateText(options) and llm.generateText.promise(options)

methods. For more information about the model parameters, refer to Chat Model Parameters topic in the

_Oracle Cloud Infrastructure Documentation_.

```
Parameter Cohere Command R and Command
R + Values
```
**Meta Llama Values**

```
maxTokens Number between 1 and 4,000 with a
default of 2,000. Average tokens per word
is 3 (or about 4 characters per token).
```
```
Number between 1 and 8,192 with a default of
2,000. Average tokens per word is 3 (or about 4
characters per token).
```
```
frequencyPenalty Number between 0 and 1 with a default of
0.
```
```
Must be 0 if presencePenalty is greater
than 1.
```
```
Number between -2 and 2, with a default of 0
(frequencePenalty not used).
```
```
Positive numbers encourage the model to use
new tokens and negative numbers encourage
the model to repeat the tokens.
```
```
presencePenalty Number between 0 and 1 with a default of
0.
```
```
Must be 0 if frequencyPenalty is greater
than 1.
```
```
Number between -2 and 2, with a default of 0
(presencePenalty not used).
```
```
prompt Input token limit is 128,000. Split between input and output tokens. Limit of
128,000 tokens for both combined.
```
```
temperature Number between 0 and 1 with a default of
0.2
```
Number between 0 and 2 with a default of 0.2

```
topK Number between 0 and 500 with a default
of 500.
```
```
Number that is either -1 (topK not used) or
between 1 and 500 with a default of 500.
```
```
topP Number between 0 and 1 with a default of
0.7.
```
Number between 0 and 1 with a default of 0.7.

## llm.generateText.promise(options)

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Method Description** Asynchronously returns the response from the LLM.

```
When unlimited usage mode is used, this method accepts the OCI configuration
parameters. You can also specify OCI configuration parameters on the SuiteScript tab of
the AI Preferences page. For more information, see the help topic Using Your Own OCI
Configuration for SuiteScript Generative AI APIs.
```

###### Note: The parameters and errors thrown for this method are the same as those

```
for llm.generateText(options). For more information about promises, see Promise
Object.
```
**Returns** Promise Object

```
Synchronous
Version
```
llm.generateText(options)

**Aliases** llm.chat.promise(options)

###### Note: These aliases use the same parameters and can throw the same errors as

the llm.generateText(options) method.

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** 100

**Module** N/llm Module

**Since** 2024.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete promise script example, see Promise Object.

```
// Add additional code
...
```
```
llm.generateText.promise({
// preamble is optional for Cohere and must not be used for Meta Llama
preamble: "You are a successful salesperson. Answer in an enthusiastic, professional tone.",
prompt: "Hello World!",
documents: [doc1, doc2], // create documents using llm.createDocument(options)
modelFamily: llm.ModelFamily.COHERE_COMMAND_R, // uses COHERE_COMMAND_R when modelFamily is omitted
modelParameters: {
maxTokens: 1000,
temperature: 0.2,
topK: 3,
topP: 0.7,
frequencyPenalty: 0.4,
presencePenalty: 0
},
ociConfig: {
// Replace ociConfig values with your Oracle Cloud Account values
userId: 'ocid1.user.oc1..aaaaaaaanld....exampleuserid',
tenancyId: 'ocid1.tenancy.oc1..aaaaaaaabt....exampletenancyid',
compartmentId: 'ocid1.compartment.oc1..aaaaaaaaph....examplecompartmentid',
// Replace fingerprint and privateKey with your NetSuite API secret ID values
fingerprint: 'custsecret_oci_fingerprint',
privateKey: 'custsecret_oci_private_key'
}
}).then(function(result) {
log.debug(result)
}).catch(function(reason) {
log.debug(reason)
})
})
```
```
...
```

```
// Add additional code
```
## llm.generateTextStreamed(options)

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

```
Method
Description
```
Returns the streamed response from the LLM for a given prompt.

```
This method is similar to llm.generateText(options) but returns the LLM response as
a stream. After calling this method, you can access the partial response (using the
StreamedResponse.text property of the returned llm.StreamedResponse object) before the
entire response has been generated. You can also use an iterator to examine each token
returned by the LLM, as the following example shows:
```
```
var response = llm.generateTextStreamed("Write a 500 word pitch for a TV show about bears");
var iter = response.iterator();
iter.each(function(token){
log.debug("token.value: " + token.value);
log.debug("response.text: " + response.text);
return true;
})
```
```
In this example, token.value contains the values of each token returned by the LLM, and
response.text contains the partial response up to and including that token. For more
information about iterators in SuiteScript, see Iterator.
```
```
When unlimited usage mode is used, this method accepts the OCI configuration parameters.
You can also specify OCI configuration parameters on the SuiteScript tab of the AI Preferences
page. For more information, see the help topic Using Your Own OCI Configuration for
SuiteScript Generative AI APIs.
```
**Returns** llm.StreamedResponse

**Aliases** llm.chatStreamed(options)

###### Note: These aliases use the same parameters and can throw the same errors as the

llm.generateTextStreamed(options) method.

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** 100

**Module** N/llm Module

**Since** 2025.1

### Parameters

```
Parameter Type Required /
Optional
```
```
Description Since
```
```
options.prompt string required Prompt for the LLM. 2024.1
```
```
options.chatHistory llm.ChatMessage[] optional Chat history to be taken into consideration. 2024.1
```

**Parameter Type Required /
Optional**

```
Description Since
```
options.documents llm.Document[] optional A list of documents to provide additional context
for the LLM to generate the response.

```
2025.1
```
options.image file.File optional An image to query.

```
You can send an image (as a file.File object) to the
LLM and ask questions about the image and get
text outputs, such as:
```
```
■ Advanced image captions
■ Detailed description of an image
■ Answers to questions about an image
```
```
■ Information about charts and graphs in an
image
```
###### Note: Image processing

```
is available only when using
the Meta Llama 3.2 model
(meta.llama-3.2-90b-vision-instruct).
```
```
For more information about creating and loading
files, see N/file Module.
```
```
2025.1
```
options.modelFamily enum optional Specifies the LLM to use. Use llm.ModelFamily
to set the value. If not specified, the Cohere
Command R LLM is used.

###### Note: JavaScript does not include

```
an enumeration type. The SuiteScript
2.x documentation uses the term
enumeration (or enum) to describe
a plain JavaScript object with a flat,
map-like structure. In this object, each
key points to a read-only string value.
```
```
2024.2
```
options.model
Parameters

```
Object optional Parameters of the model. For more information
about the model parameters, refer to the Chat
Model Parameters topic in the Oracle Cloud
Infrastructure Documentation.
```
```
2024.1
```
options.model
Parameters.frequency
Penalty

```
number optional A penalty that is assigned to a token when that
token appears frequently. The higher the value,
the stronger a penalty is applied to previously
present tokens, proportional to how many times
they have already appeared in the prompt or
prior generation. See Model Parameter Values by
LLM for valid values.
```
```
2024.1
```
options.model
Parameters.maxTokens

```
number optional The maximum number of tokens the LLM is
allowed to generate. The average number of
tokens per word is 3. See Model Parameter
Values by LLM for valid values.
```
```
2024.1
```
options.model
Parameters.presence
Penalty

```
number optional A penalty that is assigned to each token when it
appears in the output to encourage generating
outputs with tokens that haven't been used.
Similar to frequencyPenalty, except that this
penalty is applied equally to all tokens that have
already appeared, regardless of their exact
frequencies. See Model Parameter Values by LLM
for valid values.
```
```
2024.1
```

**Parameter Type Required /
Optional**

```
Description Since
```
options.model
Parameters.temperature

```
number optional Defines a range of randomness for the response.
A lower temperature will lean toward the highest
probability tokens and expected answers, while a
higher temperature will deviate toward random
and unconventional responses. A lower value
works best for responses that must be more
factual or accurate, and a higher value works best
for getting more creative responses. See Model
Parameter Values by LLM for valid values.
```
```
2024.1
```
options.model
Parameters.topK

```
number optional Determines how many tokens are considered for
generation at each step. See Model Parameter
Values by LLM for valid values.
```
```
2024.1
```
options.model
Parameters.topP

```
number optional Sets the probability, which ensures that only the
most likely tokens with total probability mass of
p are considered for generation at each step. If
both topK and topP are set, topP acts after topK.
See Model Parameter Values by LLM for valid
values.
```
```
2024.1
```
options.ociConfig Object optional Configuration needed for unlimited usage
through OCI Generative AI Service. Required
only when accessing the LLM through an Oracle
Cloud Account and the OCI Generative AI Service.
SuiteApps installed to target accounts are
prevented from using the free usage pool for N/
llm and must use the OCI configuration.

```
2024.1
```
options.ociConfig.
compartmentId

```
string optional Compartment OCID. For more information, refer
to Managing Compartments in the Oracle Cloud
Infrastructure Documentation.
```
```
2024.1
```
options.ociConfig.
endpointId

```
string optional Endpoint ID. This value is needed only when a
custom OCI DAC (dedicated AI cluster) is to be
used. For more information, refer to Managing
an Endpoint in Generative AI in the Oracle Cloud
Infrastructure Documentation.
```
```
2024.1
```
options.ociConfig.
fingerprint

```
string optional Fingerprint of the public key (only a NetSuite
secret is accepted—see the help topic Creating
Secrets ). For more information, refer to Required
Keys and OCIDs in the Oracle Cloud Infrastructure
Documentation.
```
```
2024.1
```
options.ociConfig.
privateKey

```
string optional Private key of the OCI user (only a NetSuite secret
is accepted—see the help topic Creating Secrets
). For more information, refer to Required Keys
and OCIDs in the Oracle Cloud Infrastructure
Documentation.
```
```
2024.1
```
options.ociConfig.
tenancyId

```
string optional Tenancy OCID. For more information, refer
to Managing the Tenancy in the Oracle Cloud
Infrastructure Documentation.
```
```
2024.1
```
options.ociConfig.
userId

```
string optional User OCID. For more information, refer to
Managing Users in the Oracle Cloud Infrastructure
Documentation.
```
```
2024.1
```
options.preamble string optional Preamble override for the LLM. A preamble is the
Initial context or guiding message for an LLM.
For more details about using a preamble, refer
to About the Chat Models in Generative AI (Chat
Model Parameters section) in the _Oracle Cloud
Infrastructure Documentation_.

```
2024.1
```

```
Parameter Type Required /
Optional
```
```
Description Since
```
###### Note: Only valid for the Cohere

```
Command R model.
```
```
options.timeout number optional Timeout in milliseconds, defaults to 30,000. 2024.1
```
### Errors

**Error Code Thrown If**

SSS_MISSING_REQD_ARGUMENT The options.prompt parameter is missing.

```
MUTUALLY_EXCLUSIVE_ARGUMENTS Both options.modelParameters.presencePenalty and
options.modelParameters.frequencyPenalty parameters are used when
options.modelFamily is set to COHERE_COMMAND_R. You can use a value greater than zero
for one or the other, but not both.
```
UNRECOGNIZED_MODEL_PARAMETERS One or more unrecognized model parameters have been used.

```
UNRECOGNIZED_OCI_CONFIG_
PARAMETERS
```
One or more unrecognized parameters for OCI configuration have been used.

```
ONLY_API_SECRET_IS_ACCEPTED The options.ociConfig. privateKey or options.ociConfig.fingerprint parameters are
not NetSuite API secrets.
```
```
INVALID_MODEL_FAMILY_VALUE The options.modelFamily parameter was not set to a valid options. (For example, there
may have been a typo in the value or in the enum.)
```
```
MODEL_1_DOES_NOT_ACCEPT_
PREAMBLE
```
```
The options.preamble parameter was provided but the model does not support a
preamble (for example, when a Meta Llama model is used).
```
```
MODEL_1_DOES_NOT_ACCEPT_
DOCUMENTS
```
```
The options.documents parameter was provided but the model does not support
retrieval-augmented generation (RAG).
```
```
MODEL_1_DOES_NOT_ACCEPT_IMAGE The options.image parameter was provided but the model does not support image
processing.
```
DOCUMENT_IDS_MUST_BE_UNIQUE Documents provided using the options.documents parameter have duplicate IDs.

```
INVALID_MAX_TOKENS_VALUE The options.modelParameters.maxTokens parameter value is incorrect for the model. See
Model Parameter Values by LLM for valid values.
```
```
INVALID_TEMPERATURE_VALUE The options.modelParameters.temperature parameter value is incorrect for the model.
See Model Parameter Values by LLM for valid values.
```
```
INVALID_TOP_K_VALUE The options.modelParameters.topK parameter value is incorrect for the model. See
Model Parameter Values by LLM for valid values.
```
```
INVALID_TOP_P_VALUE The options.modelParameters.topP parameter value is incorrect for the model. See
Model Parameter Values by LLM for valid values.
```
```
INVALID_FREQUENCY_PENALTY_
VALUE
```
```
The options.modelParameters.frequencyPenalty parameter value is incorrect for the
model. See Model Parameter Values by LLM for valid values.
```
```
INVALID_PRESENCE_PENALTY_VALUE The options.modelParameters.presencePenalty parameter value is incorrect for the
model. See Model Parameter Values by LLM for valid values.
```
```
MAXIMUM_PARALLEL_REQUESTS_
LIMIT_EXCEEDED
```
The number of parallel requests to the LLM is greater than 5.


### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.generateTextStreamed({
// preamble is optional for Cohere and must not be used for Meta Llama
preamble: "You are a successful salesperson. Answer in an enthusiastic, professional tone.",
prompt: "Hello World!",
documents: [doc1, doc2], // create documents using llm.createDocument(options)
modelFamily: llm.ModelFamily.COHERE_COMMAND_R, // uses COHERE_COMMAND_R when modelFamily is omitted
modelParameters: {
maxTokens: 1000,
temperature: 0.2,
topK: 3,
topP: 0.7,
frequencyPenalty: 0.4,
presencePenalty: 0
},
ociConfig: {
// Replace ociConfig values with your Oracle Cloud Account values
userId: 'ocid1.user.oc1..aaaaaaaanld....exampleuserid',
tenancyId: 'ocid1.tenancy.oc1..aaaaaaaabt....exampletenancyid',
compartmentId: 'ocid1.compartment.oc1..aaaaaaaaph....examplecompartmentid',
// Replace fingerprint and privateKey with your NetSuite API secret ID values
fingerprint: 'custsecret_oci_fingerprint',
privateKey: 'custsecret_oci_private_key'
}
});
```
```
var iter = response.iterator();
iter.each(function(token){
log.debug("token.value: " + token.value);
log.debug("response.text: " + response.text);
return true;
})
```
```
...
// Add additional code
```
## llm.generateTextStreamed.promise(options)

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Method Description** Asynchronously returns the streamed response from the LLM.

```
When unlimited usage mode is used, this method accepts the OCI configuration parameters.
You can also specify OCI configuration parameters on the SuiteScript tab of the AI
Preferences page. For more information, see the help topic Using Your Own OCI
Configuration for SuiteScript Generative AI APIs.
```
###### Note: The parameters and errors thrown for this method are the same as those

```
for llm.generateTextStreamed(options). For more information about promises, see
Promise Object.
```
**Returns** Promise Object


```
Synchronous
Version
```
llm.generateTextStreamed(options)

**Aliases** llm.chatStreamed.promise(options)

###### Note: These aliases use the same parameters and can throw the same errors as

the llm.generateTextStreamed(options) method.

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** 100

**Module** N/llm Module

**Since** 2025.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete promise script example, see Promise Object.

```
// Add additional code
...
```
```
llm.generateTextStreamed.promise({
// preamble is optional for Cohere and must not be used for Meta Llama
preamble: "You are a successful salesperson. Answer in an enthusiastic, professional tone.",
prompt: "Hello World!",
documents: [doc1, doc2], // create documents using llm.createDocument(options)
modelFamily: llm.ModelFamily.COHERE_COMMAND_R, // uses COHERE_COMMAND_R when modelFamily is omitted
modelParameters: {
maxTokens: 1000,
temperature: 0.2,
topK: 3,
topP: 0.7,
frequencyPenalty: 0.4,
presencePenalty: 0
},
ociConfig: {
// Replace ociConfig values with your Oracle Cloud Account values
userId: 'ocid1.user.oc1..aaaaaaaanld....exampleuserid',
tenancyId: 'ocid1.tenancy.oc1..aaaaaaaabt....exampletenancyid',
compartmentId: 'ocid1.compartment.oc1..aaaaaaaaph....examplecompartmentid',
// Replace fingerprint and privateKey with your NetSuite API secret ID values
fingerprint: 'custsecret_oci_fingerprint',
privateKey: 'custsecret_oci_private_key'
}
}).then(function(result) {
log.debug(result)
}).catch(function(reason) {
log.debug(reason)
})
})
```
```
...
// Add additional code
```

## llm.getRemainingFreeUsage()

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Method Description** Returns the remaining number of free LLM requests for the current month.

```
This method tracks free requests for non-embed API calls, such as
llm.generateText(options). To track free requests for embed API calls (such as
llm.embed(options)), use llm.getRemainingFreeEmbedUsage() instead.
```
**Returns** number

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** None

**Module** N/llm Module

**Since** 2024.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const usage = llm.getRemainingFreeUsage();
```
```
...
// Add additional code
```
## llm.getRemainingFreeUsage.promise()

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Method Description** Asynchronously returns the number of free requests in the current month.

###### Note: The parameters and errors thrown for this method are the same as

```
those for llm.getRemainingFreeUsage(). For more information about promises, see
Promise Object.
```
**Returns** Promise Object

**Synchronous Version** llm.getRemainingFreeUsage()


```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** None

**Module** N/llm Module

**Since** 2024.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete promise script example, see Promise Object.

```
// Add additional code
...
```
```
llm.getRemainingFreeUsage.promise().then(function(result) {
// Work with the result
});
```
```
...
// Add additional code
```
## llm.getRemainingFreeEmbedUsage()

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Method Description** Returns the number of free embeddings requests in the current month.

```
This method tracks free requests for embed API calls, such as llm.embed(options). To
track free requests for non-embed API calls (such as llm.generateText(options)), use
llm.getRemainingFreeUsage() instead.
```
**Returns** number

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** None

**Module** N/llm Module

**Since** 2025.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```

```
const embedUsage = llm.getRemainingFreeEmbedUsage();
```
```
...
// Add additional code
```
## llm.getRemainingFreeEmbedUsage.promise()

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Method Description** Asynchronously returns the number of free embeddings requests in the current month.

###### Note: The parameters and errors thrown for this method are the same as those

```
for llm.getRemainingFreeEmbedUsage(). For more information about promises, see
Promise Object.
```
**Returns** Promise Object

**Synchronous Version** llm.getRemainingFreeEmbedUsage()

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Governance** None

**Module** N/llm Module

**Since** 2025.1

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete promise script example, see Promise Object.

```
// Add additional code
...
```
```
llm.getRemainingFreeEmbedUsage.promise().then(function(result) {
// Work with the result
});
```
```
...
// Add additional code
```
## llm.ChatRole

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Enum Description** The author of the chat message.


```
Use this enum to set the value of the options.role parameter in
llm.createChatMessage(options).
```
###### Note: JavaScript does not include an enumeration type. The SuiteScript 2.x

```
documentation uses the term enumeration (or enum) to describe a plain JavaScript
object with a flat, map-like structure. In this object, each key points to a read-only
string value.
```
**Module** N/llm Module

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Since** 2024.1

### Values

**Value Notes**

USER Identifies the author of the chat message (prompt) sent to the large language model.

CHATBOT Identifies the author of the chat message (response text) received from the large language model.

### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
chatHistory.push({
role:llm.ChatRole.USER,
text: yourMessage
});
chatHistory.push({
role:llm.ChatRole.CHATBOT,
text: chatBotMessage
});
```
```
...
// Add additional code
```
## llm.EmbedModelFamily

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Enum Description** The large language model to be used to generate embeddings.

```
Use this enum to set the value of the options.embedModelFamily parameter in
llm.embed(options).
```

###### Note: JavaScript does not include an enumeration type. The SuiteScript 2.x

```
documentation uses the term enumeration (or enum) to describe a plain JavaScript
object with a flat, map-like structure. In this object, each key points to a read-only
string value.
```
**Module** N/llm Module

```
Sibling Module
Members
```
N/llm Module Members.

**Since** 2025.1

### Values

**Enum Value Notes**

EmbedModelFamily.COHERE_EMBED_ENGLISH cohere.embed-english-v3.0 —

```
EmbedModelFamily.COHERE_EMBED_ENGLISH_LIGHT cohere.embed-english-light-v3.0Light versions of embedding models
might generate embeddings faster than
regular embedding models, but the
output might not be as accurate.
```
EmbedModelFamily.COHERE_EMBED_MULTILINGUAL cohere.embed-multilingual-v3.0—

```
EmbedModelFamily.COHERE_EMBED_MULTILINGUAL_
LIGHT
```
```
cohere.embed-multilingual-lightLight versions of embedding models-v3.0
might generate embeddings faster than
regular embedding models, but the
output might not be as accurate.
```
### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.embed({
inputs: "Hello World!",
embedModelFamily: llm.EmbedModelFamily.COHERE_EMBED_ENGLISH,
...
});
```
```
...
// Add additional code
```
## llm.ModelFamily

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Enum Description** The large language model to be used.


```
Use this enum to set the value of the options.modelFamily parameter in
llm.generateText(options).
```
###### Note: JavaScript does not include an enumeration type. The SuiteScript 2.x

```
documentation uses the term enumeration (or enum) to describe a plain JavaScript
object with a flat, map-like structure. In this object, each key points to a read-only
string value.
```
**Module** N/llm Module

```
Sibling Module
Members
```
N/llm Module Members.

**Since** 2024.2

### Values

**Enum Value Notes**

```
ModelFamily.COHERE_COMMAND_R cohere.command-r- 08 - 2024 Cohere Command R is the default model used
when the options.modelFamily parameter is
omitted in llm.generateText(options).
```
ModelFamily.COHERE_COMMAND_R_PLUS cohere.command-r-plus- 08 - 2024 —

ModelFamily.META_LLAMA meta.llama-3.3-70b-instruct —

```
ModelFamily.META_LLAMA_VISION meta.llama-3.2-90b-vision-instructThis model is the only one that supports image
processing (using the options.image parameter of
llm.generateText(options)).
```
### Syntax

###### Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.generateText({
prompt: "Hello World!",
modelFamily: llm.ModelFamily.COHERE_COMMAND_R,
...
});
```
```
...
// Add additional code
```
## llm.Truncate

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

###### Note: The content in this help topic pertains to SuiteScript 2.1.

**Enum Description** The truncation method to use when embeddings input exceeds 512 tokens.


Use this enum to set the value of the options.truncate parameter in llm.embed(options).

## Note: JavaScript does not include an enumeration type. The SuiteScript 2.x

```
documentation uses the term enumeration (or enum) to describe a plain JavaScript
object with a flat, map-like structure. In this object, each key points to a read-only
string value.
```
**Module** N/llm Module

```
Supported Script
Types
```
Server scripts

For more information, see the help topic SuiteScript 2.x Script Types.

**Since** 2025.1

## Values

**Enum Value Notes**

Truncate.END END Truncates the embeddings input from the end of the input string.

Truncate.NONE NONE Does not truncate the embeddings input.

Truncate.START START Truncates the embeddings input from the start of the input string.

## Syntax

## Important: The following code sample shows the syntax for this member. It is not a functional

example. For a complete script example, see N/llm Module Script Samples.

```
// Add additional code
...
```
```
const response = llm.embed({
inputs: ["Hello World!"],
truncate: llm.Truncate.START,
...
});
```
```
...
// Add additional code
```
# N/log Module

**Applies to:** SuiteScript 2.x | APIs | SuiteCloud Developer

Use the N/log module to manually access methods for logging script execution details. These methods

can also be accessed using the global log object. For more information about the global log object, see

log Object.

Log messages appear on the Execution Log tab of the script deployment for deployed scripts, or on the

Execution Log tab of the SuiteScript Debugger if you are debugging a script. Log messages also appear

on the Script Execution Logs page at Customization > Scripting > Script Execution Logs.


