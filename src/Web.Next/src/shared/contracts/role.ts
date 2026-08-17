/**
 * Role management contracts from PublicApi RoleManagementEndpoints.
 * Wire names: camelCase (ASP.NET Core Web defaults).
 */

/** ASP.NET Identity `IdentityRole` as serialized by PublicApi. */
export interface IdentityRoleDto {
  id: string;
  name?: string | null;
  normalizedName?: string | null;
  concurrencyStamp?: string | null;
}

export interface CreateRoleRequest {
  name: string;
}

export interface CreateRoleResponse {
  role: IdentityRoleDto;
}

export interface UpdateRoleRequest {
  id: string;
  name: string;
}

export interface UpdateRoleResponse {
  role: IdentityRoleDto;
}

export interface GetByIdRoleRequest {
  roleId: string;
}

export interface GetByIdRoleResponse {
  role: IdentityRoleDto;
}

export interface DeleteRoleRequest {
  roleId: string;
}

export interface RoleListResponse {
  roles: IdentityRoleDto[];
}
