import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const encodedUrl = searchParams.get("url");

    if (!encodedUrl) {
      return new NextResponse("Missing url parameter", { status: 400 });
    }

    // Decode the URL
    const url = decodeURIComponent(encodedUrl);

    // Make a request to the decoded URL
    const response = await axios.get(url, {
      responseType: "arraybuffer", // Use 'arraybuffer' for binary data
      timeout: 10000, // Timeout in milliseconds
    });

    // Set appropriate headers
    const headers = new Headers();
    headers.set(
      "Content-Type",
      response.headers["content-type"] || "application/octet-stream"
    );
    headers.set(
      "Content-Disposition",
      `attachment; filename="${url.split("/").pop()}"`
    );

    return new NextResponse(response.data, { status: 200, headers });
  } catch (error: any) {
    console.error("Error in proxyDownload:", error);
    return new NextResponse("Error fetching the file", { status: 500 });
  }
}
