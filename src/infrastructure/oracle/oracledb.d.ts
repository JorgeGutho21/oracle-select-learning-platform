// node-oracledb no publica tipos; el adaptador declara la parte que usa (`OracleDriver`).
declare module 'oracledb' {
  const oracledb: unknown;
  export default oracledb;
}
