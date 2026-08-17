import type {
  CatalogBrandFixture,
  CatalogItemFixture,
  CatalogTypeFixture,
  RoleFixture,
  UserFixture,
} from "@/shared/fixtures";
import type {
  SeededCatalogCounts,
  SeededCatalogItemRow,
  SeededIdentityCounts,
  SeededUserRow,
  SeedStore,
} from "./seed-store";

type BrandRow = CatalogBrandFixture;
type TypeRow = CatalogTypeFixture;
type ItemRow = CatalogItemFixture;
type RoleRow = RoleFixture & { concurrencyStamp: string };
type UserRow = {
  id: string;
  userName: string;
  email: string;
  passwordHash: string;
  securityStamp: string;
};
type UserRoleRow = { userId: string; roleId: string };

/**
 * Deterministic in-memory backend for unit/system tests when SQL Server is
 * unavailable. Mirrors the SeedStore contract used by the SQL Server adapter.
 */
export class InMemorySeedStore implements SeedStore {
  private schemaReady = false;
  private brands = new Map<number, BrandRow>();
  private types = new Map<number, TypeRow>();
  private items = new Map<number, ItemRow>();
  private roles = new Map<string, RoleRow>();
  private users = new Map<string, UserRow>();
  private userRoles: UserRoleRow[] = [];
  private baskets = 0;
  private orders = 0;
  hilo = {
    catalog_brand_hilo: 1,
    catalog_type_hilo: 1,
    catalog_hilo: 1,
  };

  async ensureSchema(): Promise<void> {
    this.schemaReady = true;
  }

  async reset(): Promise<void> {
    this.brands.clear();
    this.types.clear();
    this.items.clear();
    this.roles.clear();
    this.users.clear();
    this.userRoles = [];
    this.baskets = 0;
    this.orders = 0;
  }

  async insertBrands(brands: readonly CatalogBrandFixture[]): Promise<void> {
    this.assertSchema();
    for (const brand of brands) {
      if (!this.brands.has(brand.id)) {
        this.brands.set(brand.id, brand);
      }
    }
  }

  async insertTypes(types: readonly CatalogTypeFixture[]): Promise<void> {
    this.assertSchema();
    for (const type of types) {
      if (!this.types.has(type.id)) {
        this.types.set(type.id, type);
      }
    }
  }

  async insertItems(items: readonly CatalogItemFixture[]): Promise<void> {
    this.assertSchema();
    for (const item of items) {
      if (
        !this.brands.has(item.catalogBrandId) ||
        !this.types.has(item.catalogTypeId)
      ) {
        throw new Error(`Catalog FK missing for item ${item.id}`);
      }
      if (!this.items.has(item.id)) {
        this.items.set(item.id, item);
      }
    }
  }

  async setHiloRestart(values: {
    catalog_brand_hilo: number;
    catalog_type_hilo: number;
    catalog_hilo: number;
  }): Promise<void> {
    this.hilo = { ...values };
  }

  async insertRoles(roles: readonly RoleFixture[]): Promise<void> {
    this.assertSchema();
    for (const role of roles) {
      if (!this.roles.has(role.id)) {
        this.roles.set(role.id, {
          ...role,
          concurrencyStamp: crypto.randomUUID(),
        });
      }
    }
  }

  async insertUser(
    user: UserFixture,
    passwordHash: string,
    securityStamp: string,
  ): Promise<void> {
    this.assertSchema();
    if (!this.users.has(user.id)) {
      this.users.set(user.id, {
        id: user.id,
        userName: user.userName,
        email: user.email,
        passwordHash,
        securityStamp,
      });
    }
  }

  async assignUserRole(userId: string, roleId: string): Promise<void> {
    if (!this.users.has(userId) || !this.roles.has(roleId)) {
      throw new Error("Cannot assign role: user or role missing");
    }
    if (
      !this.userRoles.some((r) => r.userId === userId && r.roleId === roleId)
    ) {
      this.userRoles.push({ userId, roleId });
    }
  }

  async catalogCounts(): Promise<SeededCatalogCounts> {
    return {
      brands: this.brands.size,
      types: this.types.size,
      items: this.items.size,
      baskets: this.baskets,
      orders: this.orders,
    };
  }

  async identityCounts(): Promise<SeededIdentityCounts> {
    return {
      roles: this.roles.size,
      users: this.users.size,
      userRoles: this.userRoles.length,
    };
  }

  async getCatalogItem(id: number): Promise<SeededCatalogItemRow | null> {
    const item = this.items.get(id);
    if (!item) return null;
    return {
      id: item.id,
      name: item.name,
      price: item.price,
      catalogTypeId: item.catalogTypeId,
      catalogBrandId: item.catalogBrandId,
    };
  }

  async getUserByUserName(userName: string): Promise<SeededUserRow | null> {
    const user = [...this.users.values()].find((u) => u.userName === userName);
    if (!user) return null;
    const roleNames: string[] = [];
    for (const ur of this.userRoles) {
      if (ur.userId !== user.id) continue;
      const name = this.roles.get(ur.roleId)?.name;
      if (name) roleNames.push(name);
    }
    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
      passwordHash: user.passwordHash,
      roleNames,
    };
  }

  async listBrandNames(): Promise<string[]> {
    return [...this.brands.values()]
      .sort((a, b) => a.id - b.id)
      .map((b) => b.brand);
  }

  async close(): Promise<void> {
    // nothing to dispose
  }

  private assertSchema(): void {
    if (!this.schemaReady) {
      throw new Error("Schema not ensured");
    }
  }
}
