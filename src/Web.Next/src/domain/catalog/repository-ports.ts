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

/**
 * ORM-agnostic persistence ports for catalog aggregates.
 * Implementations live in `@/data`; domain services must depend only on these.
 */

export interface CatalogBrandRepository {
  getById(id: number): Promise<CatalogBrand | null>;
  list(): Promise<CatalogBrand[]>;
  create(brand: NewCatalogBrand): Promise<CatalogBrand>;
  update(brand: CatalogBrand): Promise<CatalogBrand>;
  delete(id: number): Promise<void>;
}

export interface CatalogTypeRepository {
  getById(id: number): Promise<CatalogType | null>;
  list(): Promise<CatalogType[]>;
  create(type: NewCatalogType): Promise<CatalogType>;
  update(type: CatalogType): Promise<CatalogType>;
  delete(id: number): Promise<void>;
}

export interface CatalogItemRepository {
  getById(id: number): Promise<CatalogItem | null>;
  /** Filtered list without paging (CatalogFilterSpecification). */
  list(filter?: CatalogItemFilter): Promise<CatalogItem[]>;
  /** Filtered + paged list (CatalogFilterPaginatedSpecification). */
  listPaged(
    filter: CatalogItemFilter,
    page: CatalogItemPage,
  ): Promise<CatalogItem[]>;
  /** Count matching filter (used with paging for pageCount). */
  count(filter?: CatalogItemFilter): Promise<number>;
  create(item: NewCatalogItem): Promise<CatalogItem>;
  update(item: CatalogItem): Promise<CatalogItem>;
  delete(id: number): Promise<void>;
}
