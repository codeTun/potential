import axios from "axios";
import { getChatHistory, saveChatToHistory } from "@/utils/chatHistory";
import dotenv from "dotenv";

dotenv.config();

const SYSTEM_PROMPT = {
  role: "system",
  content: "You are a helpful assistant. Please answer the user's queries accurately and concisely.",
};

export async function POST(request: Request) {
  try {
    // Parse the incoming JSON body
    const requestBody = await request.json();
    console.log("Received request body:", requestBody);

    const { messages } = requestBody;

    // Validate the 'messages' input
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ message: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch chat history and merge with new messages
    const chatHistory = getChatHistory();
    console.log("Chat history:", chatHistory);

    const combinedMessages = [...chatHistory, ...messages];
    combinedMessages.unshift(SYSTEM_PROMPT);
    console.log("Combined messages:", JSON.stringify(combinedMessages, null, 2));

    // Use environment variables for API key and endpoint
    const apiKey = process.env.GPT_API_KEY;
    const endpoint = process.env.GPT_API;

    if (!apiKey || !endpoint) {
      throw new Error("API key or endpoint is missing in the environment variables");
    }

    // Make the API request to GPT
    const response = await axios.post(
      endpoint,
      {
        messages: combinedMessages,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 800,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
      }
    );

    console.log("GPT API response:", response.data);

    // Save the latest user message to history (exclude system prompt)
    saveChatToHistory(messages);
    console.log("Chat history saved after message:", messages);

    // Return GPT response
    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      axios.isAxiosError(error) && error.response
        ? error.response.data
        : String(error);

    console.error("Error occurred:", errorMessage);

    return new Response(
      JSON.stringify({
        message: `Error: ${errorMessage}`,
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
