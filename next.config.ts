import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude SCORM packages from serverless function bundles.
  // SCORM files in public/scorm/ are served as static assets by Vercel's CDN,
  // but the file tracer would otherwise bundle them into every function.
  outputFileTracingExcludes: {
    "/api/*": ["./public/scorm/**"],
    "/admin/*": ["./public/scorm/**"],
    "/dashboard/*": ["./public/scorm/**"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
