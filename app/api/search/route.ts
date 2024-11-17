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

export async function POST(req: Request) {
  const { search } = await req.json();

  // Validate search input
  if (!search) {
    return new Response(
      JSON.stringify({ message: "Search query is required" }),
      { status: 400 }
    );
  }

  try {
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
          "x-api-key": API_KEY,
        },
      }
    );

    // Return successful response
    return new Response(JSON.stringify(response.data), { status: 200 });
  } catch (error) {
    // Enhanced error handling
    if (axios.isAxiosError(error)) {
      // Axios specific error handling
      console.error(
        "Axios error:",
        error.response ? error.response.data : error.message
      );
      return new Response(
        JSON.stringify({ message: `Axios error: ${error.message}` }),
        { status: 500 }
      );
    } else {
      // General error handling
      console.error("Unexpected error:", error);
      return new Response(
        JSON.stringify({ message: "Internal server error" }),
        { status: 500 }
      );
    }
  }
}
