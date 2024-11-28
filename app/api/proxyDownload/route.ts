// app/api/proxyDownload/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  // Security check to allow only specific domains
  if (!url.startsWith("https://data.abudhabi/")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
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
  } catch (error) {
    console.error("Error fetching the file:", error);
    return NextResponse.json(
      { error: "Error fetching the file" },
      { status: 500 }
    );
  }
}
