/**
 * Identity DB table and column names matching AppIdentityDbContextModelSnapshot.
 * Do not rename — existing AspNet* rows must round-trip without schema changes.
 */

export const IdentityTables = {
  users: "AspNetUsers",
  roles: "AspNetRoles",
  userRoles: "AspNetUserRoles",
  userClaims: "AspNetUserClaims",
  roleClaims: "AspNetRoleClaims",
  userLogins: "AspNetUserLogins",
  userTokens: "AspNetUserTokens",
} as const;

export const UserColumns = {
  id: "Id",
  userName: "UserName",
  normalizedUserName: "NormalizedUserName",
  email: "Email",
  normalizedEmail: "NormalizedEmail",
  emailConfirmed: "EmailConfirmed",
  passwordHash: "PasswordHash",
  securityStamp: "SecurityStamp",
  concurrencyStamp: "ConcurrencyStamp",
  phoneNumber: "PhoneNumber",
  phoneNumberConfirmed: "PhoneNumberConfirmed",
  twoFactorEnabled: "TwoFactorEnabled",
  lockoutEnd: "LockoutEnd",
  lockoutEnabled: "LockoutEnabled",
  accessFailedCount: "AccessFailedCount",
} as const;

export const RoleColumns = {
  id: "Id",
  name: "Name",
  normalizedName: "NormalizedName",
  concurrencyStamp: "ConcurrencyStamp",
} as const;

export const UserRoleColumns = {
  userId: "UserId",
  roleId: "RoleId",
} as const;

export const ClaimColumns = {
  id: "Id",
  claimType: "ClaimType",
  claimValue: "ClaimValue",
  userId: "UserId",
  roleId: "RoleId",
} as const;

export const LoginColumns = {
  loginProvider: "LoginProvider",
  providerKey: "ProviderKey",
  providerDisplayName: "ProviderDisplayName",
  userId: "UserId",
} as const;

export const TokenColumns = {
  userId: "UserId",
  loginProvider: "LoginProvider",
  name: "Name",
  value: "Value",
} as const;

/**
 * Test-only DDL recreating the Identity subset of AppIdentityDbContext.
 * Not applied against production databases by application code.
 */
export const IDENTITY_SCHEMA_DDL = `
IF OBJECT_ID(N'[dbo].[AspNetUserTokens]', N'U') IS NOT NULL DROP TABLE [dbo].[AspNetUserTokens];
IF OBJECT_ID(N'[dbo].[AspNetUserLogins]', N'U') IS NOT NULL DROP TABLE [dbo].[AspNetUserLogins];
IF OBJECT_ID(N'[dbo].[AspNetUserClaims]', N'U') IS NOT NULL DROP TABLE [dbo].[AspNetUserClaims];
IF OBJECT_ID(N'[dbo].[AspNetRoleClaims]', N'U') IS NOT NULL DROP TABLE [dbo].[AspNetRoleClaims];
IF OBJECT_ID(N'[dbo].[AspNetUserRoles]', N'U') IS NOT NULL DROP TABLE [dbo].[AspNetUserRoles];
IF OBJECT_ID(N'[dbo].[AspNetUsers]', N'U') IS NOT NULL DROP TABLE [dbo].[AspNetUsers];
IF OBJECT_ID(N'[dbo].[AspNetRoles]', N'U') IS NOT NULL DROP TABLE [dbo].[AspNetRoles];

CREATE TABLE [dbo].[AspNetRoles] (
  [Id] NVARCHAR(450) NOT NULL PRIMARY KEY,
  [Name] NVARCHAR(256) NULL,
  [NormalizedName] NVARCHAR(256) NULL,
  [ConcurrencyStamp] NVARCHAR(MAX) NULL
);
CREATE UNIQUE INDEX [RoleNameIndex] ON [dbo].[AspNetRoles]([NormalizedName]) WHERE [NormalizedName] IS NOT NULL;

CREATE TABLE [dbo].[AspNetUsers] (
  [Id] NVARCHAR(450) NOT NULL PRIMARY KEY,
  [UserName] NVARCHAR(256) NULL,
  [NormalizedUserName] NVARCHAR(256) NULL,
  [Email] NVARCHAR(256) NULL,
  [NormalizedEmail] NVARCHAR(256) NULL,
  [EmailConfirmed] BIT NOT NULL,
  [PasswordHash] NVARCHAR(MAX) NULL,
  [SecurityStamp] NVARCHAR(MAX) NULL,
  [ConcurrencyStamp] NVARCHAR(MAX) NULL,
  [PhoneNumber] NVARCHAR(MAX) NULL,
  [PhoneNumberConfirmed] BIT NOT NULL,
  [TwoFactorEnabled] BIT NOT NULL,
  [LockoutEnd] DATETIMEOFFSET NULL,
  [LockoutEnabled] BIT NOT NULL,
  [AccessFailedCount] INT NOT NULL
);
CREATE INDEX [EmailIndex] ON [dbo].[AspNetUsers]([NormalizedEmail]);
CREATE UNIQUE INDEX [UserNameIndex] ON [dbo].[AspNetUsers]([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL;

CREATE TABLE [dbo].[AspNetUserRoles] (
  [UserId] NVARCHAR(450) NOT NULL,
  [RoleId] NVARCHAR(450) NOT NULL,
  PRIMARY KEY ([UserId], [RoleId]),
  CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId]
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers]([Id]) ON DELETE CASCADE,
  CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId]
    FOREIGN KEY ([RoleId]) REFERENCES [dbo].[AspNetRoles]([Id]) ON DELETE CASCADE
);
CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [dbo].[AspNetUserRoles]([RoleId]);

CREATE TABLE [dbo].[AspNetUserClaims] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [UserId] NVARCHAR(450) NOT NULL,
  [ClaimType] NVARCHAR(MAX) NULL,
  [ClaimValue] NVARCHAR(MAX) NULL,
  CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId]
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers]([Id]) ON DELETE CASCADE
);
CREATE INDEX [IX_AspNetUserClaims_UserId] ON [dbo].[AspNetUserClaims]([UserId]);

CREATE TABLE [dbo].[AspNetRoleClaims] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [RoleId] NVARCHAR(450) NOT NULL,
  [ClaimType] NVARCHAR(MAX) NULL,
  [ClaimValue] NVARCHAR(MAX) NULL,
  CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId]
    FOREIGN KEY ([RoleId]) REFERENCES [dbo].[AspNetRoles]([Id]) ON DELETE CASCADE
);
CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [dbo].[AspNetRoleClaims]([RoleId]);

CREATE TABLE [dbo].[AspNetUserLogins] (
  [LoginProvider] NVARCHAR(450) NOT NULL,
  [ProviderKey] NVARCHAR(450) NOT NULL,
  [ProviderDisplayName] NVARCHAR(MAX) NULL,
  [UserId] NVARCHAR(450) NOT NULL,
  PRIMARY KEY ([LoginProvider], [ProviderKey]),
  CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId]
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers]([Id]) ON DELETE CASCADE
);
CREATE INDEX [IX_AspNetUserLogins_UserId] ON [dbo].[AspNetUserLogins]([UserId]);

CREATE TABLE [dbo].[AspNetUserTokens] (
  [UserId] NVARCHAR(450) NOT NULL,
  [LoginProvider] NVARCHAR(450) NOT NULL,
  [Name] NVARCHAR(450) NOT NULL,
  [Value] NVARCHAR(MAX) NULL,
  PRIMARY KEY ([UserId], [LoginProvider], [Name]),
  CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId]
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers]([Id]) ON DELETE CASCADE
);
`;
