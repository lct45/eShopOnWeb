/**
 * Catalog request/response contracts aligned with PublicApi and BlazorShared.
 *
 * Wire field names follow ASP.NET Core `JsonSerializerDefaults.Web` (camelCase).
 * PublicApi integration tests deserialize with case-insensitive matching, so both
 * camelCase responses and PascalCase request bodies used in tests remain valid.
 */

/** PublicApi `CatalogItemDto` / BlazorShared catalog item payload. */
export interface CatalogItemDto {
  id: number;
  name: string;
  description: string;
  price: number;
  pictureUri: string;
  catalogTypeId: number;
  catalogBrandId: number;
}

/**
 * BlazorAdmin enriched catalog item (adds resolved brand/type names and optional
 * image upload fields). Not all fields are present on every PublicApi response.
 */
export interface CatalogItem extends CatalogItemDto {
  catalogType?: string;
  catalogBrand?: string;
  pictureBase64?: string;
  pictureName?: string;
}

export interface CatalogBrandDto {
  id: number;
  name: string;
}

export interface CatalogTypeDto {
  id: number;
  name: string;
}

export type LookupData = CatalogBrandDto | CatalogTypeDto;

export interface ListCatalogBrandsResponse {
  catalogBrands: CatalogBrandDto[];
}

export interface ListCatalogTypesResponse {
  catalogTypes: CatalogTypeDto[];
}

export interface ListPagedCatalogItemRequest {
  pageSize: number;
  pageIndex: number;
  catalogBrandId?: number | null;
  catalogTypeId?: number | null;
}

export interface ListPagedCatalogItemResponse {
  catalogItems: CatalogItemDto[];
  pageCount: number;
}

export interface GetByIdCatalogItemRequest {
  catalogItemId: number;
}

export interface GetByIdCatalogItemResponse {
  catalogItem: CatalogItemDto;
}

export interface CreateCatalogItemRequest {
  catalogBrandId: number;
  catalogTypeId: number;
  description: string;
  name: string;
  pictureUri?: string;
  pictureBase64?: string;
  pictureName?: string;
  price: number;
}

export interface CreateCatalogItemResponse {
  catalogItem: CatalogItemDto;
}

export interface UpdateCatalogItemRequest {
  id: number;
  catalogBrandId: number;
  catalogTypeId: number;
  description: string;
  name: string;
  pictureBase64?: string;
  pictureUri?: string;
  pictureName?: string;
  price: number;
}

export interface UpdateCatalogItemResponse {
  catalogItem: CatalogItemDto;
}

export interface DeleteCatalogItemRequest {
  catalogItemId: number;
}

/** BlazorShared edit result shape (`EditCatalogItemResult`). */
export interface EditCatalogItemResult {
  catalogItem: CatalogItem;
}

export interface ErrorDetails {
  statusCode: number;
  message: string;
}
