// FILE: app/api/search/route.ts
import axios from "axios";

const API_KEY = process.env.SEARCH_AI_API_KEY;
const API_URL = process.env.SEARCH_AI_API;

// Environment variable validation
if (!API_URL) {
  throw new Error("SEARCH_AI_API environment variable is not defined");
}
if (!API_KEY) {
  throw new Error("SEARCH_AI_API_KEY environment variable is not defined");
}

export async function POST(request: Request) {
  try {
    const { search } = await request.json();

    // Validate search input
    if (!search) {
      return new Response(
        JSON.stringify({ message: "Search query is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Making the API request
    const response = await axios.post(
      API_URL!,
      {
        search,
        queryType: "full",
        top: 10,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": API_KEY,
        },
      }
    );

    // Return successful response
    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      axios.isAxiosError(error) && error.response
        ? error.response.data
        : String(error);

    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ message: `Error: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}