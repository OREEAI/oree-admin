/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mirrors the customer app's deploy convention. Emits .next/standalone/
  // so the container can run with `node server.js` and only the minimal
  // node_modules it actually uses.
  output: "standalone",
};

export default nextConfig;
