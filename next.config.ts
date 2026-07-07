import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export so the whole site can be served by GitHub Pages
  // (no Node server at runtime). Emits an `out/` folder on `next build`.
  output: "export",
  // Pages has no image-optimization server, so serve images as-is.
  images: { unoptimized: true },
  // Multiple lockfiles exist above this folder; pin the workspace root here.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
