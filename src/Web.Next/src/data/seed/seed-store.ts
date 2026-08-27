import type {
  CatalogBrandFixture,
  CatalogItemFixture,
  CatalogTypeFixture,
  RoleFixture,
  UserFixture,
} from "@/shared/fixtures";

export type SeededCatalogCounts = {
  brands: number;
  types: number;
  items: number;
  baskets: number;
  orders: number;
};

export type SeededIdentityCounts = {
  roles: number;
  users: number;
  userRoles: number;
};

export type SeededUserRow = {
  id: string;
  userName: string;
  email: string;
  passwordHash: string;
  roleNames: string[];
};

export type SeededCatalogItemRow = {
  id: number;
  name: string;
  price: number;
  catalogTypeId: number;
  catalogBrandId: number;
};

/**
 * Persistence adapter for shared fixtures. SQL Server and in-memory test
 * backends both implement this so reset/seed/verify share one code path.
 */
export interface SeedStore {
  ensureSchema(): Promise<void>;
  reset(): Promise<void>;
  insertBrands(brands: readonly CatalogBrandFixture[]): Promise<void>;
  insertTypes(types: readonly CatalogTypeFixture[]): Promise<void>;
  insertItems(items: readonly CatalogItemFixture[]): Promise<void>;
  setHiloRestart(values: {
    catalog_brand_hilo: number;
    catalog_type_hilo: number;
    catalog_hilo: number;
  }): Promise<void>;
  insertRoles(roles: readonly RoleFixture[]): Promise<void>;
  insertUser(
    user: UserFixture,
    passwordHash: string,
    securityStamp: string,
  ): Promise<void>;
  assignUserRole(userId: string, roleId: string): Promise<void>;
  catalogCounts(): Promise<SeededCatalogCounts>;
  identityCounts(): Promise<SeededIdentityCounts>;
  getCatalogItem(id: number): Promise<SeededCatalogItemRow | null>;
  getUserByUserName(userName: string): Promise<SeededUserRow | null>;
  listBrandNames(): Promise<string[]>;
  close(): Promise<void>;
}
