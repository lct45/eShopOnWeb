import sql from "mssql";
import type {
  CatalogBrandFixture,
  CatalogItemFixture,
  CatalogTypeFixture,
  RoleFixture,
  UserFixture,
} from "@/shared/fixtures";
import { normalizeKey } from "./identity-password";
import { CATALOG_SCHEMA_SQL, IDENTITY_SCHEMA_SQL } from "./schema";
import type {
  SeededCatalogCounts,
  SeededCatalogItemRow,
  SeededIdentityCounts,
  SeededUserRow,
  SeedStore,
} from "./seed-store";

export type SqlServerSeedConfig = {
  catalogConnectionString: string;
  identityConnectionString: string;
};

function requireConfig(): SqlServerSeedConfig {
  const catalogConnectionString =
    process.env.ESHOP_CATALOG_CONNECTION ?? process.env.CatalogConnection ?? "";
  const identityConnectionString =
    process.env.ESHOP_IDENTITY_CONNECTION ??
    process.env.IdentityConnection ??
    "";

  if (!catalogConnectionString || !identityConnectionString) {
    throw new Error(
      "Set ESHOP_CATALOG_CONNECTION and ESHOP_IDENTITY_CONNECTION (SQL Server connection strings).",
    );
  }

  return { catalogConnectionString, identityConnectionString };
}

async function connect(connectionString: string): Promise<sql.ConnectionPool> {
  const pool = new sql.ConnectionPool(connectionString);
  await pool.connect();
  return pool;
}

/**
 * SQL Server SeedStore for local + CI. Uses T-SQL against CatalogDb / Identity.
 */
export class SqlServerSeedStore implements SeedStore {
  private catalog!: sql.ConnectionPool;
  private identity!: sql.ConnectionPool;

  static async create(
    config?: SqlServerSeedConfig,
  ): Promise<SqlServerSeedStore> {
    const resolved = config ?? requireConfig();
    const store = new SqlServerSeedStore();
    store.catalog = await connect(resolved.catalogConnectionString);
    store.identity = await connect(resolved.identityConnectionString);
    return store;
  }

  async ensureSchema(): Promise<void> {
    await this.catalog.request().batch(CATALOG_SCHEMA_SQL);
    await this.identity.request().batch(IDENTITY_SCHEMA_SQL);
  }

  async reset(): Promise<void> {
    await this.catalog.request().batch(`
DELETE FROM dbo.OrderItems;
DELETE FROM dbo.Orders;
DELETE FROM dbo.BasketItems;
DELETE FROM dbo.Baskets;
DELETE FROM dbo.Catalog;
DELETE FROM dbo.CatalogTypes;
DELETE FROM dbo.CatalogBrands;
`);
    await this.identity.request().batch(`
DELETE FROM dbo.AspNetUserTokens;
DELETE FROM dbo.AspNetUserLogins;
DELETE FROM dbo.AspNetUserClaims;
DELETE FROM dbo.AspNetUserRoles;
DELETE FROM dbo.AspNetRoleClaims;
DELETE FROM dbo.AspNetUsers;
DELETE FROM dbo.AspNetRoles;
`);
  }

  async insertBrands(brands: readonly CatalogBrandFixture[]): Promise<void> {
    for (const brand of brands) {
      await this.catalog
        .request()
        .input("id", sql.Int, brand.id)
        .input("brand", sql.NVarChar(100), brand.brand)
        .query(
          `IF NOT EXISTS (SELECT 1 FROM dbo.CatalogBrands WHERE Id = @id)
 INSERT INTO dbo.CatalogBrands (Id, Brand) VALUES (@id, @brand);`,
        );
    }
  }

  async insertTypes(types: readonly CatalogTypeFixture[]): Promise<void> {
    for (const type of types) {
      await this.catalog
        .request()
        .input("id", sql.Int, type.id)
        .input("type", sql.NVarChar(100), type.type)
        .query(
          `IF NOT EXISTS (SELECT 1 FROM dbo.CatalogTypes WHERE Id = @id)
 INSERT INTO dbo.CatalogTypes (Id, Type) VALUES (@id, @type);`,
        );
    }
  }

  async insertItems(items: readonly CatalogItemFixture[]): Promise<void> {
    for (const item of items) {
      await this.catalog
        .request()
        .input("id", sql.Int, item.id)
        .input("name", sql.NVarChar(50), item.name)
        .input("description", sql.NVarChar(sql.MAX), item.description)
        .input("price", sql.Decimal(18, 2), item.price)
        .input("pictureUri", sql.NVarChar(sql.MAX), item.pictureUri)
        .input("catalogTypeId", sql.Int, item.catalogTypeId)
        .input("catalogBrandId", sql.Int, item.catalogBrandId)
        .query(
          `IF NOT EXISTS (SELECT 1 FROM dbo.Catalog WHERE Id = @id)
 INSERT INTO dbo.Catalog (Id, Name, Description, Price, PictureUri, CatalogTypeId, CatalogBrandId)
 VALUES (@id, @name, @description, @price, @pictureUri, @catalogTypeId, @catalogBrandId);`,
        );
    }
  }

  async setHiloRestart(values: {
    catalog_brand_hilo: number;
    catalog_type_hilo: number;
    catalog_hilo: number;
  }): Promise<void> {
    await this.catalog.request().batch(`
ALTER SEQUENCE dbo.catalog_brand_hilo RESTART WITH ${values.catalog_brand_hilo};
ALTER SEQUENCE dbo.catalog_type_hilo RESTART WITH ${values.catalog_type_hilo};
ALTER SEQUENCE dbo.catalog_hilo RESTART WITH ${values.catalog_hilo};
`);
  }

  async insertRoles(roles: readonly RoleFixture[]): Promise<void> {
    for (const role of roles) {
      await this.identity
        .request()
        .input("id", sql.NVarChar(450), role.id)
        .input("name", sql.NVarChar(256), role.name)
        .input("normalizedName", sql.NVarChar(256), role.normalizedName)
        .input("concurrencyStamp", sql.NVarChar(sql.MAX), crypto.randomUUID())
        .query(
          `IF NOT EXISTS (SELECT 1 FROM dbo.AspNetRoles WHERE Id = @id)
 INSERT INTO dbo.AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
 VALUES (@id, @name, @normalizedName, @concurrencyStamp);`,
        );
    }
  }

  async insertUser(
    user: UserFixture,
    passwordHash: string,
    securityStamp: string,
  ): Promise<void> {
    await this.identity
      .request()
      .input("id", sql.NVarChar(450), user.id)
      .input("userName", sql.NVarChar(256), user.userName)
      .input(
        "normalizedUserName",
        sql.NVarChar(256),
        normalizeKey(user.userName),
      )
      .input("email", sql.NVarChar(256), user.email)
      .input("normalizedEmail", sql.NVarChar(256), normalizeKey(user.email))
      .input("passwordHash", sql.NVarChar(sql.MAX), passwordHash)
      .input("securityStamp", sql.NVarChar(sql.MAX), securityStamp)
      .input("concurrencyStamp", sql.NVarChar(sql.MAX), crypto.randomUUID())
      .query(
        `IF NOT EXISTS (SELECT 1 FROM dbo.AspNetUsers WHERE Id = @id)
 INSERT INTO dbo.AspNetUsers (
   Id, UserName, NormalizedUserName, Email, NormalizedEmail,
   EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp,
   PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount
 ) VALUES (
   @id, @userName, @normalizedUserName, @email, @normalizedEmail,
   1, @passwordHash, @securityStamp, @concurrencyStamp,
   0, 0, 1, 0
 );`,
      );
  }

  async assignUserRole(userId: string, roleId: string): Promise<void> {
    await this.identity
      .request()
      .input("userId", sql.NVarChar(450), userId)
      .input("roleId", sql.NVarChar(450), roleId)
      .query(
        `IF NOT EXISTS (SELECT 1 FROM dbo.AspNetUserRoles WHERE UserId = @userId AND RoleId = @roleId)
 INSERT INTO dbo.AspNetUserRoles (UserId, RoleId) VALUES (@userId, @roleId);`,
      );
  }

  async catalogCounts(): Promise<SeededCatalogCounts> {
    const result = await this.catalog.request().query(`
SELECT
  (SELECT COUNT(*) FROM dbo.CatalogBrands) AS brands,
  (SELECT COUNT(*) FROM dbo.CatalogTypes) AS types,
  (SELECT COUNT(*) FROM dbo.Catalog) AS items,
  (SELECT COUNT(*) FROM dbo.Baskets) AS baskets,
  (SELECT COUNT(*) FROM dbo.Orders) AS orders;
`);
    const row = result.recordset[0] as SeededCatalogCounts;
    return {
      brands: Number(row.brands),
      types: Number(row.types),
      items: Number(row.items),
      baskets: Number(row.baskets),
      orders: Number(row.orders),
    };
  }

  async identityCounts(): Promise<SeededIdentityCounts> {
    const result = await this.identity.request().query(`
SELECT
  (SELECT COUNT(*) FROM dbo.AspNetRoles) AS roles,
  (SELECT COUNT(*) FROM dbo.AspNetUsers) AS users,
  (SELECT COUNT(*) FROM dbo.AspNetUserRoles) AS userRoles;
`);
    const row = result.recordset[0] as SeededIdentityCounts;
    return {
      roles: Number(row.roles),
      users: Number(row.users),
      userRoles: Number(row.userRoles),
    };
  }

  async getCatalogItem(id: number): Promise<SeededCatalogItemRow | null> {
    const result = await this.catalog
      .request()
      .input("id", sql.Int, id)
      .query(
        `SELECT Id AS id, Name AS name, Price AS price, CatalogTypeId AS catalogTypeId, CatalogBrandId AS catalogBrandId
 FROM dbo.Catalog WHERE Id = @id`,
      );
    const row = result.recordset[0] as SeededCatalogItemRow | undefined;
    if (!row) return null;
    return {
      id: Number(row.id),
      name: String(row.name),
      price: Number(row.price),
      catalogTypeId: Number(row.catalogTypeId),
      catalogBrandId: Number(row.catalogBrandId),
    };
  }

  async getUserByUserName(userName: string): Promise<SeededUserRow | null> {
    const userResult = await this.identity
      .request()
      .input("userName", sql.NVarChar(256), userName)
      .query(
        `SELECT Id AS id, UserName AS userName, Email AS email, PasswordHash AS passwordHash
 FROM dbo.AspNetUsers WHERE UserName = @userName`,
      );
    const user = userResult.recordset[0] as
      | { id: string; userName: string; email: string; passwordHash: string }
      | undefined;
    if (!user) return null;

    const rolesResult = await this.identity
      .request()
      .input("userId", sql.NVarChar(450), user.id)
      .query(
        `SELECT r.Name AS name
 FROM dbo.AspNetUserRoles ur
 INNER JOIN dbo.AspNetRoles r ON r.Id = ur.RoleId
 WHERE ur.UserId = @userId`,
      );

    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
      passwordHash: user.passwordHash,
      roleNames: rolesResult.recordset.map((r: { name: string }) => r.name),
    };
  }

  async listBrandNames(): Promise<string[]> {
    const result = await this.catalog
      .request()
      .query(`SELECT Brand AS brand FROM dbo.CatalogBrands ORDER BY Id`);
    return result.recordset.map((r: { brand: string }) => r.brand);
  }

  async close(): Promise<void> {
    await Promise.all([this.catalog.close(), this.identity.close()]);
  }
}
