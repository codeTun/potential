import axios from "axios";
import { getChatHistory, saveChatToHistory } from "@/utils/chatHistory";
import dotenv from "dotenv";

dotenv.config();

const SYSTEM_PROMPT = "You are the Abu Dhabi's open data platform AI assistant. You are helpful and friendly and you only respond to images that you receive and analyze or questions that you can help with in providing the best datasets from the open data platform. You are interactive to help the user get the best dataset he's searching for. You might receive an image from the user without context, analyze it along with the data you have in case the user intent is some data based on that image.\nThis is the data from the search engine you have:\nin the certificate of completion form.\",\r\n        \"descriptionlear\": \"إجمالي عدد المباني على الأرض المخصصة للبناء والمضمنة في شهادة نموذج الإنجاز.\",\r\n        \"issued\": \"2023-10-30T08:55:07+00:00\",\r\n        \"modified\": \"2024-08-23T06:19:47+00:00\",\r\n        \"license\": \"https://data.abudhabi/opendata/addata_open_license\",\r\n        \"licenselear\": \"https://data.abudhabi/opendata/node/6041?language=ar\",\r\n        \"publisher\": {\r\n            \"data\": {\r\n                \"@type\": \"org:Organization\",\r\n                \"name\": \"Department of Municipalities and Transport\"\r\n            }\r\n        },\r\n        \"publisherlear\": {\r\n            \"data\": {\r\n                \"@type\": \"org:Organization\",\r\n                \"name\": \"دائرة البلديات والنقل\"\r\n            }\r\n        },\r\n        \"contactPoint\": {\r\n            \"fn\": \"Mohamed Alzaabi\",\r\n            \"fnlear\": \"محمد الزعابي\",\r\n            \"hasEmail\": \"mohamed.alzaabi@dmt.gov.ae\"\r\n        },\r\n        \"theme\": [\r\n            {\r\n                \"data\": \"Economy\"\r\n            }\r\n        ],\r\n        \"themelear\": [\r\n            {\r\n                \"data\": \"الاقتصاد\"\r\n            }\r\n        ],\r\n        \"keyword\": [\r\n            {\r\n                \"data\": \"AbuDhabi\"\r\n            },\r\n            {\r\n                \"data\": \"Housing\"\r\n            }\r\n        ],\r\n        \"keywordlear\": [\r\n            {\r\n                \"data\": \"أبوظبي\"\r\n            },\r\n            {\r\n                \"data\": \"المساكن\"\r\n            }\r\n        ],\r\n        \"distribution\": [\r\n            {\r\n                \"data\": {\r\n                    \"descriptionlear\": null,\r\n                    \"format\": \"excel\",\r\n                    \"mediaType\": null,\r\n                    \"downloadURL\": \"https://data.abudhabi/opendata/sites/default/files/uploaded_resources/Number%20of%20Building%20Completion%20-%20Emirates%20of%20Abu%20Dhabi.xlsx\"\r\n                }\r\n            }\r\n        ]\r\n    },\r\n    {\r\n        \"title\": \"Number of Building completions by region\", }\r\n        },\r\n        \"publisherlear\": {\r\n            \"data\": {\r\n                \"@type\": \"org:Organization\",\r\n                \"name\": \"دائرة البلديات والنقل\"\r\n            }\r\n        },\r\n        \"contactPoint\": {\r\n            \"fn\": \"Mohamed Alzaabi\",\r\n            \"fnlear\": \"محمد الزعابي\",\r\n            \"hasEmail\": \"mohamed.alzaabi@dmt.gov.ae\"\r\n        },\r\n        \"theme\": [\r\n            {\r\n                \"data\": \"Economy\"\r\n            }\r\n        ],\r\n        \"themelear\": [\r\n            {\r\n                \"data\": \"الاقتصاد\"\r\n            }\r\n        ],\r\n        \"keyword\": [\r\n            {\r\n                \"data\": \"AbuDhabi\"\r\n            }\r\n        ],\r\n        \"keywordlear\": [\r\n            {\r\n                \"data\": \"أبوظبي\"\r\n            }\r\n        ],\r\n        \"distribution\": [\r\n            {\r\n                \"data\": {\r\n                    \"descriptionlear\": null,\r\n                    \"format\": \"excel\",\r\n                    \"mediaType\": null,\r\n                    \"downloadURL\": \"https://data.abudhabi/opendata/sites/default/files/uploaded_resources/Number%20of%20Building%20Completion%20by%20Region%20-%20Abu%20Dhabi.xlsx\"\r\n                }\r\n            }\r\n        ]\r\n    },\r\n    {\r\n        \"title\": \"Residential unit completions - Emirate of Abu Dhabi\",\r\n        \"titlear\": \" الوحدات السكنية المنجزة - إمارة أبوظبي\",\r\n        \"identifier\": \"74fdde80-b8ec-4289-8803-5d4e3db55476\",\r\n        \"description\": \"Residential units are residential buildings with different architectural forms and used for residential purposes.\\r\\n\",\r\n        \"descriptionlear\": \" المباني السكنية ذات الأشكال المعمارية المختلفة والمستخدمة للأغراض السكنية\",\r\n        \"issued\": \"2023-11-02T09:45:33+00:00\",\r\n        \"modified\": \"2024-08-23T06:22:15+00:00\",\r\n        \"license\": \"https://data.abudhabi/opendata/addata_open_license\",\r\n        \"licenselear\": \"https://data.abudhabi/opendata/node/6041?language=ar\",\r\n        \"publisher\": {\r\n            \"data\": {\r\n                \"@type\": \"org:Organization\",\nYou only return your response in this structure \"[[datasets_identifiers_separated_by_comma_each_in_a_list_you_only_put_the_first_identifier_of_each_dataset_in_case_you_wanted_to_return_more_than_one_dataset],your_response]\""; // Define SYSTEM_PROMPT

export async function POST(request: Request) {
    try {
      // Parse the incoming JSON body
      const requestBody = await request.json();
      console.log("Received request body:", requestBody); // Log the received body
  
      const { messages } = requestBody;
  
      // Validate messages input
      if (!messages || !Array.isArray(messages)) {
        return new Response(
          JSON.stringify({ message: "Messages array is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
  
      // Fetch chat history and merge with new messages
      const chatHistory = getChatHistory();
      console.log("Chat history:", chatHistory); // Log chat history to ensure it's being retrieved correctly
  
      const combinedMessages = [SYSTEM_PROMPT, ...chatHistory, ...messages];
      console.log("Combined messages:", combinedMessages); // Log the combined messages before making the API call
  
      // Use environment variables for API key and endpoint
      const apiKey = process.env.GPT_API_KEY;  // Access API key from .env file
      const endpoint = process.env.GPT_API;  // Access endpoint from .env file
  
      if (!apiKey || !endpoint) {
        throw new Error('API key or endpoint is missing in the environment variables');
      }
  
      // Make the API request to GPT
      const response = await axios.post(
        endpoint,  // Make sure to use your endpoint from .env
        {
          messages: combinedMessages,
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 800,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,  // Using API key instead of Bearer token
          },
        }
      );
      console.log("GPT API response:", response.data); // Log the GPT API response
  
      // Save the latest message to history (but exclude system prompt)
      saveChatToHistory(messages);
      console.log("Chat history saved after message:", messages); // Log after saving to history
  
      // Return GPT response
      return new Response(JSON.stringify(response.data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      // Detailed error handling with more context
      const errorMessage =
        axios.isAxiosError(error) && error.response
          ? error.response.data
          : String(error);
  
      console.error("Error occurred:", errorMessage); // Log the error to help diagnose the issue
  
      // Return a detailed error message to the client
      return new Response(
        JSON.stringify({
          message: `Error: ${errorMessage}`,
          stack: error instanceof Error ? error.stack : undefined, // Optionally include stack trace for deeper debugging
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }