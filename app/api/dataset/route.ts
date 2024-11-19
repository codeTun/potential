// FILE: app/api/dataset/route.ts
import axios from "axios";

const API_DATASET_BASE_URL = process.env.GPT_DATASET_API;

// Since 'show-reference-ids=false' is a constant, we can append it directly.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get("datasetId");

  if (!datasetId) {
    return new Response(JSON.stringify({ message: "Dataset ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    console.log("Fetching dataset details for ID:", datasetId);
    const response = await axios.get(
      `${API_DATASET_BASE_URL}${datasetId}?show-reference-ids=false`
    );

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
    return new Response(JSON.stringify({ message: `Error: ${errorMessage}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
