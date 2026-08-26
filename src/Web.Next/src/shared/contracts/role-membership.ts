/**
 * Role membership contracts from PublicApi RoleMembershipEndpoints.
 * Wire names: camelCase (ASP.NET Core Web defaults).
 */

import type { ApplicationUserWire } from "./user";

export interface GetRoleMembershipRequest {
  roleName: string;
}

export interface GetRoleMembershipResponse {
  roleMembers: ApplicationUserWire[];
}

export interface DeleteUserFromRoleRequest {
  userId: string;
  roleId: string;
}
