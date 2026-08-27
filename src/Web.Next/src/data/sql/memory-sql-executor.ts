import type {
  SqlExecutor,
  SqlParameter,
  SqlQueryResult,
  SqlRow,
} from "@/data/sql/sql-executor";
import {
  CATALOG_HILO_INCREMENT,
  CatalogSequences,
} from "@/data/sql/catalog-schema";
import {
  CATALOG_BRANDS,
  CATALOG_HILO_RESTART,
  CATALOG_ITEMS,
  CATALOG_TYPES,
  type CatalogBrandFixture,
  type CatalogItemFixture,
  type CatalogTypeFixture,
} from "@/shared/fixtures/catalog";

type BrandRow = { Id: number; Brand: string };
type TypeRow = { Id: number; Type: string };
type ItemRow = {
  Id: number;
  Name: string;
  Description: string;
  Price: number;
  PictureUri: string | null;
  CatalogTypeId: number;
  CatalogBrandId: number;
};

type DbState = {
  brands: BrandRow[];
  types: TypeRow[];
  items: ItemRow[];
  nextBrandId: number;
  nextTypeId: number;
  nextItemId: number;
};

function cloneState(state: DbState): DbState {
  return {
    brands: state.brands.map((r) => ({ ...r })),
    types: state.types.map((r) => ({ ...r })),
    items: state.items.map((r) => ({ ...r })),
    nextBrandId: state.nextBrandId,
    nextTypeId: state.nextTypeId,
    nextItemId: state.nextItemId,
  };
}

function emptyState(): DbState {
  return {
    brands: [],
    types: [],
    items: [],
    nextBrandId: 1,
    nextTypeId: 1,
    nextItemId: 1,
  };
}

function seededState(): DbState {
  return {
    brands: CATALOG_BRANDS.map((b: CatalogBrandFixture) => ({
      Id: b.id,
      Brand: b.brand,
    })),
    types: CATALOG_TYPES.map((t: CatalogTypeFixture) => ({
      Id: t.id,
      Type: t.type,
    })),
    items: CATALOG_ITEMS.map((i: CatalogItemFixture) => ({
      Id: i.id,
      Name: i.name,
      Description: i.description,
      Price: i.price,
      PictureUri: i.pictureUri,
      CatalogTypeId: i.catalogTypeId,
      CatalogBrandId: i.catalogBrandId,
    })),
    nextBrandId: CATALOG_HILO_RESTART.catalog_brand_hilo,
    nextTypeId: CATALOG_HILO_RESTART.catalog_type_hilo,
    nextItemId: CATALOG_HILO_RESTART.catalog_hilo,
  };
}

function normalizeSql(sqlText: string): string {
  return sqlText.replace(/\s+/g, " ").trim();
}

function filterItems(
  items: ItemRow[],
  params: SqlParameter[],
  sql: string,
): { rows: ItemRow[]; nextParam: number } {
  let filtered = [...items];
  const hasBrand = /\[CatalogBrandId\]\s*=\s*\?/i.test(sql);
  const hasType = /\[CatalogTypeId\]\s*=\s*\?/i.test(sql);
  let paramIndex = 0;
  if (hasBrand) {
    const brandId = Number(params[paramIndex++]);
    filtered = filtered.filter((i) => i.CatalogBrandId === brandId);
  }
  if (hasType) {
    const typeId = Number(params[paramIndex++]);
    filtered = filtered.filter((i) => i.CatalogTypeId === typeId);
  }
  return { rows: filtered, nextParam: paramIndex };
}

/**
 * In-memory executor that understands the catalog SQL issued by Sql*Repository.
 * Enforces Catalog → Brand/Type CASCADE like SQL Server EF mappings.
 */
export class MemorySqlExecutor implements SqlExecutor {
  private state: DbState;
  private readonly transactionStack: DbState[] = [];

  constructor(seed: "empty" | "catalog" = "empty") {
    this.state = seed === "catalog" ? seededState() : emptyState();
  }

  static withSeededCatalog(): MemorySqlExecutor {
    return new MemorySqlExecutor("catalog");
  }

  snapshot(): DbState {
    return cloneState(this.state);
  }

  private nextSequenceValue(sequence: string): number {
    if (sequence === CatalogSequences.brand) {
      const value = this.state.nextBrandId;
      this.state.nextBrandId += CATALOG_HILO_INCREMENT;
      return value;
    }
    if (sequence === CatalogSequences.type) {
      const value = this.state.nextTypeId;
      this.state.nextTypeId += CATALOG_HILO_INCREMENT;
      return value;
    }
    if (sequence === CatalogSequences.item) {
      const value = this.state.nextItemId;
      this.state.nextItemId += CATALOG_HILO_INCREMENT;
      return value;
    }
    throw new Error(`MemorySqlExecutor: unknown sequence ${sequence}`);
  }

  async query(
    sqlText: string,
    params: SqlParameter[] = [],
  ): Promise<SqlQueryResult> {
    const sql = normalizeSql(sqlText);

    const nextValueMatch = /^SELECT NEXT VALUE FOR \[dbo\]\.\[([^\]]+)\]/i.exec(
      sql,
    );
    if (nextValueMatch) {
      const value = this.nextSequenceValue(nextValueMatch[1]!);
      return { rows: [{ value }], rowsAffected: 0 };
    }

    if (/^INSERT INTO \[dbo\]\.\[CatalogBrands\]/i.test(sql)) {
      const usesHilo = /NEXT VALUE FOR/i.test(sql);
      const id = usesHilo
        ? this.nextSequenceValue(CatalogSequences.brand)
        : Number(params[0]);
      const brand = String(usesHilo ? params[0] : params[1]);
      if (this.state.brands.some((b) => b.Id === id)) {
        throw new Error(`PK violation: CatalogBrands.Id=${id}`);
      }
      const row: BrandRow = { Id: id, Brand: brand };
      this.state.brands.push(row);
      if (/OUTPUT INSERTED/i.test(sql)) {
        return { rows: [{ ...row }], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 1 };
    }

    if (/^INSERT INTO \[dbo\]\.\[CatalogTypes\]/i.test(sql)) {
      const usesHilo = /NEXT VALUE FOR/i.test(sql);
      const id = usesHilo
        ? this.nextSequenceValue(CatalogSequences.type)
        : Number(params[0]);
      const type = String(usesHilo ? params[0] : params[1]);
      if (this.state.types.some((t) => t.Id === id)) {
        throw new Error(`PK violation: CatalogTypes.Id=${id}`);
      }
      const row: TypeRow = { Id: id, Type: type };
      this.state.types.push(row);
      if (/OUTPUT INSERTED/i.test(sql)) {
        return { rows: [{ ...row }], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 1 };
    }

    if (/^INSERT INTO \[dbo\]\.\[Catalog\]/i.test(sql)) {
      const usesHilo = /NEXT VALUE FOR/i.test(sql);
      const id = usesHilo
        ? this.nextSequenceValue(CatalogSequences.item)
        : Number(params[0]);
      const offset = usesHilo ? 0 : 1;
      const name = String(params[offset]);
      const description = String(params[offset + 1]);
      const price = Number(params[offset + 2]);
      const pictureUri =
        params[offset + 3] == null ? null : String(params[offset + 3]);
      const catalogTypeId = Number(params[offset + 4]);
      const catalogBrandId = Number(params[offset + 5]);

      if (!this.state.brands.some((b) => b.Id === catalogBrandId)) {
        throw new Error("FK violation: Catalog.CatalogBrandId");
      }
      if (!this.state.types.some((t) => t.Id === catalogTypeId)) {
        throw new Error("FK violation: Catalog.CatalogTypeId");
      }
      if (this.state.items.some((i) => i.Id === id)) {
        throw new Error(`PK violation: Catalog.Id=${id}`);
      }

      const row: ItemRow = {
        Id: id,
        Name: name,
        Description: description,
        Price: price,
        PictureUri: pictureUri,
        CatalogTypeId: catalogTypeId,
        CatalogBrandId: catalogBrandId,
      };
      this.state.items.push(row);
      if (/OUTPUT INSERTED/i.test(sql)) {
        return { rows: [{ ...row }], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 1 };
    }

    if (/^UPDATE \[dbo\]\.\[CatalogBrands\]/i.test(sql)) {
      const brand = String(params[0]);
      const id = Number(params[1]);
      const row = this.state.brands.find((b) => b.Id === id);
      if (!row) return { rows: [], rowsAffected: 0 };
      row.Brand = brand;
      return { rows: [], rowsAffected: 1 };
    }

    if (/^UPDATE \[dbo\]\.\[CatalogTypes\]/i.test(sql)) {
      const type = String(params[0]);
      const id = Number(params[1]);
      const row = this.state.types.find((t) => t.Id === id);
      if (!row) return { rows: [], rowsAffected: 0 };
      row.Type = type;
      return { rows: [], rowsAffected: 1 };
    }

    if (/^UPDATE \[dbo\]\.\[Catalog\]/i.test(sql)) {
      const name = String(params[0]);
      const description = String(params[1]);
      const price = Number(params[2]);
      const pictureUri = params[3] == null ? null : String(params[3]);
      const catalogTypeId = Number(params[4]);
      const catalogBrandId = Number(params[5]);
      const id = Number(params[6]);

      if (!this.state.brands.some((b) => b.Id === catalogBrandId)) {
        throw new Error("FK violation: Catalog.CatalogBrandId");
      }
      if (!this.state.types.some((t) => t.Id === catalogTypeId)) {
        throw new Error("FK violation: Catalog.CatalogTypeId");
      }

      const row = this.state.items.find((i) => i.Id === id);
      if (!row) return { rows: [], rowsAffected: 0 };
      row.Name = name;
      row.Description = description;
      row.Price = price;
      row.PictureUri = pictureUri;
      row.CatalogTypeId = catalogTypeId;
      row.CatalogBrandId = catalogBrandId;
      return { rows: [], rowsAffected: 1 };
    }

    if (/^DELETE FROM \[dbo\]\.\[CatalogBrands\]/i.test(sql)) {
      const id = Number(params[0]);
      const before = this.state.brands.length;
      this.state.brands = this.state.brands.filter((b) => b.Id !== id);
      this.state.items = this.state.items.filter(
        (i) => i.CatalogBrandId !== id,
      );
      return {
        rows: [],
        rowsAffected: before === this.state.brands.length ? 0 : 1,
      };
    }

    if (/^DELETE FROM \[dbo\]\.\[CatalogTypes\]/i.test(sql)) {
      const id = Number(params[0]);
      const before = this.state.types.length;
      this.state.types = this.state.types.filter((t) => t.Id !== id);
      this.state.items = this.state.items.filter((i) => i.CatalogTypeId !== id);
      return {
        rows: [],
        rowsAffected: before === this.state.types.length ? 0 : 1,
      };
    }

    if (/^DELETE FROM \[dbo\]\.\[Catalog\]/i.test(sql)) {
      const id = Number(params[0]);
      const before = this.state.items.length;
      this.state.items = this.state.items.filter((i) => i.Id !== id);
      return {
        rows: [],
        rowsAffected: before === this.state.items.length ? 0 : 1,
      };
    }

    if (/^SELECT .+ FROM \[dbo\]\.\[CatalogBrands\]/i.test(sql)) {
      let rows: SqlRow[] = this.state.brands.map((r) => ({ ...r }));
      if (/WHERE \[Id\]\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        rows = rows.filter((r) => r.Id === id);
      } else {
        rows = rows.sort((a, b) => Number(a.Id) - Number(b.Id));
      }
      return { rows, rowsAffected: 0 };
    }

    if (/^SELECT .+ FROM \[dbo\]\.\[CatalogTypes\]/i.test(sql)) {
      let rows: SqlRow[] = this.state.types.map((r) => ({ ...r }));
      if (/WHERE \[Id\]\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        rows = rows.filter((r) => r.Id === id);
      } else {
        rows = rows.sort((a, b) => Number(a.Id) - Number(b.Id));
      }
      return { rows, rowsAffected: 0 };
    }

    if (/^SELECT COUNT/i.test(sql) && /FROM \[dbo\]\.\[Catalog\]/i.test(sql)) {
      const { rows } = filterItems(this.state.items, params, sql);
      return { rows: [{ count: rows.length }], rowsAffected: 0 };
    }

    if (/^SELECT .+ FROM \[dbo\]\.\[Catalog\]/i.test(sql)) {
      if (/WHERE \[Id\]\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        const row = this.state.items.find((i) => i.Id === id);
        return {
          rows: row ? [{ ...row }] : [],
          rowsAffected: 0,
        };
      }

      const { rows: filtered, nextParam } = filterItems(
        this.state.items,
        params,
        sql,
      );
      let rows = filtered.map((r) => ({ ...r })).sort((a, b) => a.Id - b.Id);

      if (/OFFSET\s*\?\s*ROWS\s*FETCH\s+NEXT\s*\?\s*ROWS\s*ONLY/i.test(sql)) {
        const skip = Number(params[nextParam]);
        const take = Number(params[nextParam + 1]);
        rows = rows.slice(skip, skip + take);
      }

      return { rows, rowsAffected: 0 };
    }

    throw new Error(`MemorySqlExecutor: unsupported SQL: ${sql}`);
  }

  async transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    this.transactionStack.push(cloneState(this.state));
    try {
      const result = await work(this);
      this.transactionStack.pop();
      return result;
    } catch (error) {
      const previous = this.transactionStack.pop();
      if (previous) this.state = previous;
      throw error;
    }
  }
}
