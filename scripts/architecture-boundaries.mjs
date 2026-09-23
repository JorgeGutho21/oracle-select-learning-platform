import path from 'node:path';

const layers = new Set(['presentation', 'application', 'domain', 'infrastructure']);
const allowed = {
  app: new Set(['app', 'presentation', 'application', 'styles']),
  presentation: new Set(['presentation', 'application', 'styles']),
  application: new Set(['application', 'domain']),
  domain: new Set(['domain']),
  infrastructure: new Set(['infrastructure', 'application', 'domain']),
};

function layerOf(filePath, sourceRoot) {
  const relative = path.relative(sourceRoot, filePath).replaceAll('\\', '/');
  if (relative.startsWith('../') || path.isAbsolute(relative)) return undefined;
  const parts = relative.split('/');
  if (parts[0] === 'features') return layers.has(parts[2]) ? parts[2] : undefined;
  return parts[0];
}

/** Comprueba importaciones reales resueltas, incluidas rutas relativas. */
const dependencyRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Mantiene la dirección de dependencias de ARCHITECTURE.md.' },
    schema: [],
    messages: {
      forbidden: 'La capa {{from}} no puede depender de {{to}} ({{source}}).',
      externalDomain: 'El dominio no depende de paquetes, navegador o red: {{source}}.',
      externalApplication:
        'Aplicación mantiene contratos propios; este adaptador pertenece a infraestructura: {{source}}.',
      unclassified:
        'El código de src debe pertenecer a una capa; clasifica {{source}} antes de importarlo.',
    },
  },
  create(context) {
    const sourceRoot = path.resolve(context.cwd, 'src');
    const filename = context.filename;
    const from = layerOf(filename, sourceRoot);
    if (!allowed[from]) return {};

    function inspect(node, source) {
      if (typeof source !== 'string') return;
      const internal = source.startsWith('@/') || source.startsWith('.');
      if (!internal) {
        if (from === 'domain') {
          context.report({ node, messageId: 'externalDomain', data: { source } });
        } else if (
          from === 'application' &&
          /^(?:react(?:-dom)?(?:\/|$)|next(?:\/|$)|@supabase\/|(?:node:)|oracledb$|bootstrap(?:\/|$))/.test(
            source,
          )
        ) {
          context.report({ node, messageId: 'externalApplication', data: { source } });
        }
        return;
      }
      const resolved = source.startsWith('@/')
        ? path.resolve(sourceRoot, source.slice(2))
        : path.resolve(path.dirname(filename), source);
      const to = layerOf(resolved, sourceRoot);
      if (!to || !(to in allowed || to === 'styles')) {
        context.report({ node, messageId: 'unclassified', data: { source } });
      } else if (!allowed[from].has(to)) {
        context.report({ node, messageId: 'forbidden', data: { from, to, source } });
      }
    }

    return {
      ImportDeclaration: (node) => inspect(node, node.source.value),
      ExportNamedDeclaration: (node) => node.source && inspect(node, node.source.value),
      ExportAllDeclaration: (node) => inspect(node, node.source.value),
      ImportExpression: (node) => inspect(node, node.source.value),
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'require') {
          inspect(node, node.arguments[0]?.value);
        }
      },
    };
  },
};

const architecturePlugin = { rules: { dependencies: dependencyRule } };
export default architecturePlugin;
