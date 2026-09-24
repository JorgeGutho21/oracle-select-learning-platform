import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  // El driver de Oracle se carga desde node_modules en el servidor, sin empaquetarlo.
  serverExternalPackages: ['oracledb'],
  sassOptions: {
    quietDeps: true,
    // Rutas nativas también para imports internos de Bootstrap en Windows.
    loadPaths: [path.resolve('node_modules'), path.resolve('node_modules/bootstrap/scss')],
    silenceDeprecations: ['import'],
  },
};

export default nextConfig;
