// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Expose environment variables
  env: {
    FORM_RECOGNIZER_ENDPOINT: process.env.FORM_RECOGNIZER_ENDPOINT,
    FORM_RECOGNIZER_KEY: process.env.FORM_RECOGNIZER_KEY,
    SEARCH_AI_API: process.env.SEARCH_AI_API,
    SEARCH_AI_API_KEY: process.env.SEARCH_AI_API_KEY,
    GPT_API: process.env.GPT_API,
    GPT_API_KEY: process.env.GPT_API_KEY,
  },
  async headers() {
    return [
      {
        // Apply to all routes except API routes, robots.txt, and favicon.ico
        source: "/((?!api|robots.txt|favicon.ico).*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "index, follow",
          },
        ],
      },
      {
        // Specifically apply noindex to API routes
        source: "/api/(.*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        // Ensure robots.txt is accessible and not noindexed
        source: "/robots.txt",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "none",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
