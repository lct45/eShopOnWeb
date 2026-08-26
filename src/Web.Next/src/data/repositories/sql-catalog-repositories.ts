import type { SqlExecutor, SqlRow } from "@/data/sql/sql-executor";
import {
  CatalogBrandColumns,
  CatalogItemColumns,
  CatalogSequences,
  CatalogTables,
  CatalogTypeColumns,
} from "@/data/sql/catalog-schema";
import type {
  CatalogBrandRepository,
  CatalogItemRepository,
  CatalogTypeRepository,
} from "@/domain/catalog/repository-ports";
import type {
  CatalogBrand,
  CatalogItem,
  CatalogItemFilter,
  CatalogItemPage,
  CatalogType,
  NewCatalogBrand,
  NewCatalogItem,
  NewCatalogType,
} from "@/domain/catalog/types";

function requireNumber(row: SqlRow, key: string): number {
  const value = row[key];
  if (typeof value === "number") return value;
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  throw new Error(`Expected numeric column ${key}`);
}

function requireString(row: SqlRow, key: string): string {
  const value = row[key];
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function mapBrand(row: SqlRow): CatalogBrand {
  return {
    id: requireNumber(row, CatalogBrandColumns.id),
    brand: requireString(row, CatalogBrandColumns.brand),
  };
}

function mapType(row: SqlRow): CatalogType {
  return {
    id: requireNumber(row, CatalogTypeColumns.id),
    type: requireString(row, CatalogTypeColumns.type),
  };
}

function mapItem(row: SqlRow): CatalogItem {
  return {
    id: requireNumber(row, CatalogItemColumns.id),
    name: requireString(row, CatalogItemColumns.name),
    description: requireString(row, CatalogItemColumns.description),
    price: requireNumber(row, CatalogItemColumns.price),
    pictureUri: requireString(row, CatalogItemColumns.pictureUri),
    catalogTypeId: requireNumber(row, CatalogItemColumns.catalogTypeId),
    catalogBrandId: requireNumber(row, CatalogItemColumns.catalogBrandId),
  };
}

function buildItemFilter(filter: CatalogItemFilter | undefined): {
  where: string;
  params: Array<string | number | boolean | Date | null>;
} {
  const clauses: string[] = [];
  const params: Array<string | number | boolean | Date | null> = [];
  if (filter?.brandId != null) {
    clauses.push(`[${CatalogItemColumns.catalogBrandId}] = ?`);
    params.push(filter.brandId);
  }
  if (filter?.typeId != null) {
    clauses.push(`[${CatalogItemColumns.catalogTypeId}] = ?`);
    params.push(filter.typeId);
  }
  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

const ITEM_SELECT = `
  [${CatalogItemColumns.id}], [${CatalogItemColumns.name}],
  [${CatalogItemColumns.description}], [${CatalogItemColumns.price}],
  [${CatalogItemColumns.pictureUri}], [${CatalogItemColumns.catalogTypeId}],
  [${CatalogItemColumns.catalogBrandId}]
`;

export class SqlCatalogBrandRepository implements CatalogBrandRepository {
  constructor(private readonly db: SqlExecutor) {}

  async getById(id: number): Promise<CatalogBrand | null> {
    const result = await this.db.query(
      `SELECT [${CatalogBrandColumns.id}], [${CatalogBrandColumns.brand}]
       FROM [dbo].[${CatalogTables.brands}]
       WHERE [${CatalogBrandColumns.id}] = ?`,
      [id],
    );
    const row = result.rows[0];
    return row ? mapBrand(row) : null;
  }

  async list(): Promise<CatalogBrand[]> {
    const result = await this.db.query(
      `SELECT [${CatalogBrandColumns.id}], [${CatalogBrandColumns.brand}]
       FROM [dbo].[${CatalogTables.brands}]
       ORDER BY [${CatalogBrandColumns.id}]`,
    );
    return result.rows.map(mapBrand);
  }

  async create(brand: NewCatalogBrand): Promise<CatalogBrand> {
    const insert = await this.db.query(
      `INSERT INTO [dbo].[${CatalogTables.brands}]
        ([${CatalogBrandColumns.id}], [${CatalogBrandColumns.brand}])
       OUTPUT INSERTED.[${CatalogBrandColumns.id}], INSERTED.[${CatalogBrandColumns.brand}]
       VALUES (NEXT VALUE FOR [dbo].[${CatalogSequences.brand}], ?)`,
      [brand.brand],
    );
    const created = insert.rows[0];
    if (!created) throw new Error("Failed to insert catalog brand");
    return mapBrand(created);
  }

  async update(brand: CatalogBrand): Promise<CatalogBrand> {
    await this.db.query(
      `UPDATE [dbo].[${CatalogTables.brands}]
       SET [${CatalogBrandColumns.brand}] = ?
       WHERE [${CatalogBrandColumns.id}] = ?`,
      [brand.brand, brand.id],
    );
    const loaded = await this.getById(brand.id);
    if (!loaded) throw new Error("Catalog brand not found after update");
    return loaded;
  }

  async delete(id: number): Promise<void> {
    await this.db.query(
      `DELETE FROM [dbo].[${CatalogTables.brands}]
       WHERE [${CatalogBrandColumns.id}] = ?`,
      [id],
    );
  }
}

export class SqlCatalogTypeRepository implements CatalogTypeRepository {
  constructor(private readonly db: SqlExecutor) {}

  async getById(id: number): Promise<CatalogType | null> {
    const result = await this.db.query(
      `SELECT [${CatalogTypeColumns.id}], [${CatalogTypeColumns.type}]
       FROM [dbo].[${CatalogTables.types}]
       WHERE [${CatalogTypeColumns.id}] = ?`,
      [id],
    );
    const row = result.rows[0];
    return row ? mapType(row) : null;
  }

  async list(): Promise<CatalogType[]> {
    const result = await this.db.query(
      `SELECT [${CatalogTypeColumns.id}], [${CatalogTypeColumns.type}]
       FROM [dbo].[${CatalogTables.types}]
       ORDER BY [${CatalogTypeColumns.id}]`,
    );
    return result.rows.map(mapType);
  }

  async create(type: NewCatalogType): Promise<CatalogType> {
    const insert = await this.db.query(
      `INSERT INTO [dbo].[${CatalogTables.types}]
        ([${CatalogTypeColumns.id}], [${CatalogTypeColumns.type}])
       OUTPUT INSERTED.[${CatalogTypeColumns.id}], INSERTED.[${CatalogTypeColumns.type}]
       VALUES (NEXT VALUE FOR [dbo].[${CatalogSequences.type}], ?)`,
      [type.type],
    );
    const created = insert.rows[0];
    if (!created) throw new Error("Failed to insert catalog type");
    return mapType(created);
  }

  async update(type: CatalogType): Promise<CatalogType> {
    await this.db.query(
      `UPDATE [dbo].[${CatalogTables.types}]
       SET [${CatalogTypeColumns.type}] = ?
       WHERE [${CatalogTypeColumns.id}] = ?`,
      [type.type, type.id],
    );
    const loaded = await this.getById(type.id);
    if (!loaded) throw new Error("Catalog type not found after update");
    return loaded;
  }

  async delete(id: number): Promise<void> {
    await this.db.query(
      `DELETE FROM [dbo].[${CatalogTables.types}]
       WHERE [${CatalogTypeColumns.id}] = ?`,
      [id],
    );
  }
}

export class SqlCatalogItemRepository implements CatalogItemRepository {
  constructor(private readonly db: SqlExecutor) {}

  async getById(id: number): Promise<CatalogItem | null> {
    const result = await this.db.query(
      `SELECT ${ITEM_SELECT}
       FROM [dbo].[${CatalogTables.items}]
       WHERE [${CatalogItemColumns.id}] = ?`,
      [id],
    );
    const row = result.rows[0];
    return row ? mapItem(row) : null;
  }

  async list(filter: CatalogItemFilter = {}): Promise<CatalogItem[]> {
    const { where, params } = buildItemFilter(filter);
    const result = await this.db.query(
      `SELECT ${ITEM_SELECT}
       FROM [dbo].[${CatalogTables.items}]
       ${where}
       ORDER BY [${CatalogItemColumns.name}]`,
      params,
    );
    return result.rows.map(mapItem);
  }

  async listPaged(
    filter: CatalogItemFilter,
    page: CatalogItemPage,
  ): Promise<CatalogItem[]> {
    const { where, params } = buildItemFilter(filter);
    const result = await this.db.query(
      `SELECT ${ITEM_SELECT}
       FROM [dbo].[${CatalogTables.items}]
       ${where}
       ORDER BY [${CatalogItemColumns.name}]
       OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
      [...params, page.skip, page.take],
    );
    return result.rows.map(mapItem);
  }

  async count(filter: CatalogItemFilter = {}): Promise<number> {
    const { where, params } = buildItemFilter(filter);
    const result = await this.db.query(
      `SELECT COUNT(*) AS [count]
       FROM [dbo].[${CatalogTables.items}]
       ${where}`,
      params,
    );
    const row = result.rows[0];
    if (!row) return 0;
    return requireNumber(row, "count");
  }

  async create(item: NewCatalogItem): Promise<CatalogItem> {
    const insert = await this.db.query(
      `INSERT INTO [dbo].[${CatalogTables.items}]
        ([${CatalogItemColumns.id}], [${CatalogItemColumns.name}],
         [${CatalogItemColumns.description}], [${CatalogItemColumns.price}],
         [${CatalogItemColumns.pictureUri}], [${CatalogItemColumns.catalogTypeId}],
         [${CatalogItemColumns.catalogBrandId}])
       OUTPUT INSERTED.[${CatalogItemColumns.id}], INSERTED.[${CatalogItemColumns.name}],
              INSERTED.[${CatalogItemColumns.description}], INSERTED.[${CatalogItemColumns.price}],
              INSERTED.[${CatalogItemColumns.pictureUri}], INSERTED.[${CatalogItemColumns.catalogTypeId}],
              INSERTED.[${CatalogItemColumns.catalogBrandId}]
       VALUES (NEXT VALUE FOR [dbo].[${CatalogSequences.item}], ?, ?, ?, ?, ?, ?)`,
      [
        item.name,
        item.description,
        item.price,
        item.pictureUri,
        item.catalogTypeId,
        item.catalogBrandId,
      ],
    );
    const created = insert.rows[0];
    if (!created) throw new Error("Failed to insert catalog item");
    return mapItem(created);
  }

  async update(item: CatalogItem): Promise<CatalogItem> {
    await this.db.query(
      `UPDATE [dbo].[${CatalogTables.items}]
       SET [${CatalogItemColumns.name}] = ?,
           [${CatalogItemColumns.description}] = ?,
           [${CatalogItemColumns.price}] = ?,
           [${CatalogItemColumns.pictureUri}] = ?,
           [${CatalogItemColumns.catalogTypeId}] = ?,
           [${CatalogItemColumns.catalogBrandId}] = ?
       WHERE [${CatalogItemColumns.id}] = ?`,
      [
        item.name,
        item.description,
        item.price,
        item.pictureUri,
        item.catalogTypeId,
        item.catalogBrandId,
        item.id,
      ],
    );
    const loaded = await this.getById(item.id);
    if (!loaded) throw new Error("Catalog item not found after update");
    return loaded;
  }

  async delete(id: number): Promise<void> {
    await this.db.query(
      `DELETE FROM [dbo].[${CatalogTables.items}]
       WHERE [${CatalogItemColumns.id}] = ?`,
      [id],
    );
  }
}

export type CatalogRepositories = {
  brands: CatalogBrandRepository;
  types: CatalogTypeRepository;
  items: CatalogItemRepository;
};

export function createSqlCatalogRepositories(
  db: SqlExecutor,
): CatalogRepositories {
  return {
    brands: new SqlCatalogBrandRepository(db),
    types: new SqlCatalogTypeRepository(db),
    items: new SqlCatalogItemRepository(db),
  };
}
