import sql from "mssql";

const CATALOG_DB = "Microsoft.eShopOnWeb.CatalogDb";
const IDENTITY_DB = "Microsoft.eShopOnWeb.Identity";

/**
 * Build catalog/identity connection strings from either explicit env vars or a
 * shared server connection (ESHOP_SQLSERVER) used for local/CI bootstrap.
 */
export function resolveSeedConnectionStrings(): {
  catalogConnectionString: string;
  identityConnectionString: string;
  serverConnectionString: string | null;
} {
  const catalogConnectionString =
    process.env.ESHOP_CATALOG_CONNECTION ?? process.env.CatalogConnection ?? "";
  const identityConnectionString =
    process.env.ESHOP_IDENTITY_CONNECTION ??
    process.env.IdentityConnection ??
    "";
  const serverConnectionString = process.env.ESHOP_SQLSERVER ?? null;

  if (catalogConnectionString && identityConnectionString) {
    return {
      catalogConnectionString,
      identityConnectionString,
      serverConnectionString,
    };
  }

  if (serverConnectionString) {
    return {
      catalogConnectionString: withDatabase(serverConnectionString, CATALOG_DB),
      identityConnectionString: withDatabase(
        serverConnectionString,
        IDENTITY_DB,
      ),
      serverConnectionString,
    };
  }

  throw new Error(
    "Set ESHOP_CATALOG_CONNECTION + ESHOP_IDENTITY_CONNECTION, or ESHOP_SQLSERVER for local/CI bootstrap.",
  );
}

function withDatabase(
  serverConnectionString: string,
  database: string,
): string {
  const cleaned = serverConnectionString
    .replace(/;(Initial Catalog|Database)=[^;]*/gi, "")
    .replace(/;+$/, "");
  return `${cleaned};Database=${database}`;
}

export async function ensureDatabasesExist(
  serverConnectionString: string,
): Promise<void> {
  const pool = await new sql.ConnectionPool(
    withDatabase(serverConnectionString, "master"),
  ).connect();
  try {
    for (const name of [CATALOG_DB, IDENTITY_DB]) {
      await pool.request().input("name", sql.NVarChar(128), name).query(`
IF DB_ID(@name) IS NULL
BEGIN
  DECLARE @sql nvarchar(300) = N'CREATE DATABASE [' + @name + N']';
  EXEC(@sql);
END
`);
    }
  } finally {
    await pool.close();
  }
}
