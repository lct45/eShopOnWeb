/**
 * Auth module — ASP.NET Identity password compatibility (LCFM-6).
 * Session/Auth.js wiring lands in LCFM-11; this package only exposes the hasher.
 */

export {
  hashPassword,
  newConcurrencyStamp,
  newSecurityStamp,
  normalizeKey,
  verifyPassword,
} from "@/auth/aspnet-identity-password";
export type { HashPasswordOptions } from "@/auth/aspnet-identity-password";
