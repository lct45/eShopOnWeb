/**
 * Authentication contracts from PublicApi AuthEndpoints.
 * Wire names: camelCase (ASP.NET Core Web defaults).
 */

export interface AuthenticateRequest {
  username: string;
  password: string;
}

export interface AuthenticateResponse {
  result: boolean;
  token: string;
  username: string;
  isLockedOut: boolean;
  isNotAllowed: boolean;
  requiresTwoFactor: boolean;
}

export interface ClaimValue {
  type: string;
  value: string;
}

export interface UserInfo {
  isAuthenticated: boolean;
  nameClaimType: string;
  roleClaimType: string;
  claims: ClaimValue[];
}
