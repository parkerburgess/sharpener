import sql from "mssql";

declare global {
  var _sqlPool: sql.ConnectionPool | undefined;
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!global._sqlPool || !global._sqlPool.connected) {
    global._sqlPool = await new sql.ConnectionPool({
      server:   process.env.DB_SERVER!,
      database: process.env.DB_DATABASE!,
      user:     process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      options: {
        encrypt:                true,
        trustServerCertificate: false,
      },
    }).connect();
  }
  return global._sqlPool;
}
