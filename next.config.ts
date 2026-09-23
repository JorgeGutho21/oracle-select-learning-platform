import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  sassOptions: {
    quietDeps: true,
    // Rutas nativas también para imports internos de Bootstrap en Windows.
    loadPaths: [path.resolve('node_modules'), path.resolve('node_modules/bootstrap/scss')],
    silenceDeprecations: ['import'],
  },
};

export default nextConfig;
