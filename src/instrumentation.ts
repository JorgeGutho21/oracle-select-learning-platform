/**
 * Arranque del servidor (Next llama a `register` una vez, antes de atender peticiones).
 * Precalienta el grupo de conexiones y la salud de Oracle: la primera consulta de un
 * estudiante no paga la creación del grupo ni la primera sesión, que tras un reinicio
 * pueden superar el plazo de 5 s. Si Oracle no responde, el arranque no espera más de 8 s.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { oracleExecutor } = await import('./composition/oracle/oracle-server');
  await Promise.race([
    oracleExecutor().status(),
    new Promise((resolve) => setTimeout(resolve, 8000)),
  ]);
}
