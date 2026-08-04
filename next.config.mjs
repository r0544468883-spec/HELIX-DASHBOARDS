/** @type {import('next').NextConfig} */
const nextConfig = {
  // resvg-wasm must not be webpack-bundled — it loads a .wasm blob at runtime.
  // Keeping it external makes Next `require()` it from node_modules on the server.
  serverExternalPackages: ['@resvg/resvg-wasm'],
  // The vendored nyyon renderer reads its wasm + TTF fonts from disk at runtime
  // (lib/nyyon/assets). Next's file tracer can't see those readFileSync paths,
  // so force them into the serverless bundle for every route that renders figures.
  outputFileTracingIncludes: {
    '/api/digest': ['./lib/nyyon/assets/**'],
    '/api/cron/digest': ['./lib/nyyon/assets/**'],
    '/api/telegram': ['./lib/nyyon/assets/**'],
  },
};
export default nextConfig;
