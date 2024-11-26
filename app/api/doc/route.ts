import { NextRequest, NextResponse } from "next/server";
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";

// Azure credentials and endpoint
const endpoint = "https://potential-document-intelligence.cognitiveservices.azure.com/";
const apiKey = "DC8qmCTHr9JYyPhI9W9QyBtjpWbgs538PUentjEE90tfvbG5YpzrJQQJ99AKACYeBjFXJ3w3AAALACOGbVyp";

const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));

export async function POST(req: NextRequest) {
  try {
    const { fileUrl } = await req.json(); // Expecting a JSON payload with a `fileUrl` field

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided." }, { status: 400 });
    }

    // Analyze the document using the URL
    const poller = await client.beginAnalyzeDocumentFromUrl("prebuilt-document", fileUrl);

    // Wait for the operation to finish and get the result
    const { documents } = await poller.pollUntilDone();

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: "No document content found." }, { status: 400 });
    }

    // Extract text from the documents
    const extractedText = documents[0].fields?.content?.content || "No content found";

    return NextResponse.json({ result: extractedText });
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json({ error: "Error processing the document." }, { status: 500 });
  }
}
