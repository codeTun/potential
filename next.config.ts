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
};

export default nextConfig;
