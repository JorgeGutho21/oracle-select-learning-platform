// Asigna el rol de una cuenta de DB LAB (docs/AUTH_ARCHITECTURE.md, «Rol de profesor»).
//
//   node --env-file=.env.local scripts/assign-role.mjs correo@dominio teacher
//   node --env-file=.env.local scripts/assign-role.mjs correo@dominio student
//
// Usa SUPABASE_URL y la clave secreta del proyecto (SUPABASE_SECRET_KEY o, en proyectos
// antiguos, SUPABASE_SERVICE_ROLE_KEY), que solo existen en el servidor o en la máquina del
// responsable. Llama a public.admin_set_role, que nadie más puede ejecutar. La cuenta debe
// existir: la persona se registra (o entra con Microsoft) antes de recibir el rol.
// No imprime claves ni datos de otras cuentas.

const [email, role] = process.argv.slice(2);
const url = process.env.SUPABASE_URL?.trim();
const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!email || !['teacher', 'student'].includes(role ?? '')) {
  console.error(
    'Uso: node --env-file=.env.local scripts/assign-role.mjs <correo> <teacher|student>',
  );
  process.exit(2);
}
if (!url || !key) {
  console.error('Faltan SUPABASE_URL y la clave secreta del proyecto en el entorno.');
  process.exit(2);
}

const response = await fetch(`${url}/rest/v1/rpc/admin_set_role`, {
  method: 'POST',
  headers: {
    apikey: key,
    // Las claves antiguas (JWT) también deben ir como Authorization; las nuevas no lo necesitan.
    ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ p_email: email, p_role: role }),
});
if (!response.ok) {
  console.error(`Supabase respondió ${response.status}. ¿Está aplicada la migración de cuentas?`);
  process.exit(1);
}
const result = await response.json();
if (result?.status === 'updated') {
  console.log(`Rol «${role}» asignado a ${email}.`);
} else {
  console.error(`No hay ninguna cuenta con el correo ${email}. Debe registrarse primero.`);
  process.exit(1);
}
