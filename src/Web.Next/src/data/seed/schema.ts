/**
 * Minimal CatalogDb + Identity schema matching the current EF SQL Server model.
 * Idempotent CREATE statements — safe on an empty database.
 */

export const CATALOG_SCHEMA_SQL = `
IF OBJECT_ID(N'dbo.Baskets', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Baskets (
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    BuyerId NVARCHAR(256) NOT NULL
  );
END;

IF OBJECT_ID(N'dbo.BasketItems', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.BasketItems (
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    BasketId INT NOT NULL,
    CatalogItemId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_BasketItems_Baskets FOREIGN KEY (BasketId) REFERENCES dbo.Baskets(Id) ON DELETE CASCADE
  );
END;

IF OBJECT_ID(N'dbo.CatalogBrands', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CatalogBrands (
    Id INT NOT NULL PRIMARY KEY,
    Brand NVARCHAR(100) NOT NULL
  );
END;

IF OBJECT_ID(N'dbo.CatalogTypes', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CatalogTypes (
    Id INT NOT NULL PRIMARY KEY,
    Type NVARCHAR(100) NOT NULL
  );
END;

IF OBJECT_ID(N'dbo.Catalog', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Catalog (
    Id INT NOT NULL PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    PictureUri NVARCHAR(MAX) NULL,
    CatalogTypeId INT NOT NULL,
    CatalogBrandId INT NOT NULL,
    CONSTRAINT FK_Catalog_CatalogTypes FOREIGN KEY (CatalogTypeId) REFERENCES dbo.CatalogTypes(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Catalog_CatalogBrands FOREIGN KEY (CatalogBrandId) REFERENCES dbo.CatalogBrands(Id) ON DELETE CASCADE
  );
END;

IF OBJECT_ID(N'dbo.Orders', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Orders (
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    BuyerId NVARCHAR(256) NOT NULL,
    OrderDate DATETIMEOFFSET NOT NULL,
    ShipToAddress_Street NVARCHAR(180) NOT NULL CONSTRAINT DF_Orders_Street DEFAULT (N''),
    ShipToAddress_City NVARCHAR(100) NOT NULL CONSTRAINT DF_Orders_City DEFAULT (N''),
    ShipToAddress_State NVARCHAR(60) NOT NULL CONSTRAINT DF_Orders_State DEFAULT (N''),
    ShipToAddress_Country NVARCHAR(90) NOT NULL CONSTRAINT DF_Orders_Country DEFAULT (N''),
    ShipToAddress_ZipCode NVARCHAR(18) NOT NULL CONSTRAINT DF_Orders_Zip DEFAULT (N'')
  );
END;

IF OBJECT_ID(N'dbo.OrderItems', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.OrderItems (
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderId INT NULL,
    ItemOrdered_CatalogItemId INT NOT NULL CONSTRAINT DF_OrderItems_CatalogItemId DEFAULT (0),
    ItemOrdered_ProductName NVARCHAR(50) NOT NULL CONSTRAINT DF_OrderItems_ProductName DEFAULT (N''),
    ItemOrdered_PictureUri NVARCHAR(MAX) NOT NULL CONSTRAINT DF_OrderItems_PictureUri DEFAULT (N''),
    UnitPrice DECIMAL(18,2) NOT NULL,
    Units INT NOT NULL,
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id)
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'catalog_brand_hilo')
  CREATE SEQUENCE dbo.catalog_brand_hilo AS INT START WITH 1 INCREMENT BY 10;
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'catalog_type_hilo')
  CREATE SEQUENCE dbo.catalog_type_hilo AS INT START WITH 1 INCREMENT BY 10;
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'catalog_hilo')
  CREATE SEQUENCE dbo.catalog_hilo AS INT START WITH 1 INCREMENT BY 10;
`;

export const IDENTITY_SCHEMA_SQL = `
IF OBJECT_ID(N'dbo.AspNetRoles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AspNetRoles (
    Id NVARCHAR(450) NOT NULL PRIMARY KEY,
    Name NVARCHAR(256) NULL,
    NormalizedName NVARCHAR(256) NULL,
    ConcurrencyStamp NVARCHAR(MAX) NULL
  );
  CREATE UNIQUE INDEX RoleNameIndex ON dbo.AspNetRoles(NormalizedName) WHERE NormalizedName IS NOT NULL;
END;

IF OBJECT_ID(N'dbo.AspNetUsers', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AspNetUsers (
    Id NVARCHAR(450) NOT NULL PRIMARY KEY,
    UserName NVARCHAR(256) NULL,
    NormalizedUserName NVARCHAR(256) NULL,
    Email NVARCHAR(256) NULL,
    NormalizedEmail NVARCHAR(256) NULL,
    EmailConfirmed BIT NOT NULL CONSTRAINT DF_Users_EmailConfirmed DEFAULT (0),
    PasswordHash NVARCHAR(MAX) NULL,
    SecurityStamp NVARCHAR(MAX) NULL,
    ConcurrencyStamp NVARCHAR(MAX) NULL,
    PhoneNumber NVARCHAR(MAX) NULL,
    PhoneNumberConfirmed BIT NOT NULL CONSTRAINT DF_Users_PhoneConfirmed DEFAULT (0),
    TwoFactorEnabled BIT NOT NULL CONSTRAINT DF_Users_TwoFactor DEFAULT (0),
    LockoutEnd DATETIMEOFFSET NULL,
    LockoutEnabled BIT NOT NULL CONSTRAINT DF_Users_LockoutEnabled DEFAULT (0),
    AccessFailedCount INT NOT NULL CONSTRAINT DF_Users_AccessFailed DEFAULT (0)
  );
  CREATE INDEX EmailIndex ON dbo.AspNetUsers(NormalizedEmail);
  CREATE UNIQUE INDEX UserNameIndex ON dbo.AspNetUsers(NormalizedUserName) WHERE NormalizedUserName IS NOT NULL;
END;

IF OBJECT_ID(N'dbo.AspNetUserRoles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AspNetUserRoles (
    UserId NVARCHAR(450) NOT NULL,
    RoleId NVARCHAR(450) NOT NULL,
    PRIMARY KEY (UserId, RoleId),
    CONSTRAINT FK_UserRoles_Users FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers(Id) ON DELETE CASCADE,
    CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (RoleId) REFERENCES dbo.AspNetRoles(Id) ON DELETE CASCADE
  );
END;

IF OBJECT_ID(N'dbo.AspNetRoleClaims', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AspNetRoleClaims (
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    RoleId NVARCHAR(450) NOT NULL,
    ClaimType NVARCHAR(MAX) NULL,
    ClaimValue NVARCHAR(MAX) NULL,
    CONSTRAINT FK_RoleClaims_Roles FOREIGN KEY (RoleId) REFERENCES dbo.AspNetRoles(Id) ON DELETE CASCADE
  );
END;

IF OBJECT_ID(N'dbo.AspNetUserClaims', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AspNetUserClaims (
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserId NVARCHAR(450) NOT NULL,
    ClaimType NVARCHAR(MAX) NULL,
    ClaimValue NVARCHAR(MAX) NULL,
    CONSTRAINT FK_UserClaims_Users FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers(Id) ON DELETE CASCADE
  );
END;

IF OBJECT_ID(N'dbo.AspNetUserLogins', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AspNetUserLogins (
    LoginProvider NVARCHAR(450) NOT NULL,
    ProviderKey NVARCHAR(450) NOT NULL,
    ProviderDisplayName NVARCHAR(MAX) NULL,
    UserId NVARCHAR(450) NOT NULL,
    PRIMARY KEY (LoginProvider, ProviderKey),
    CONSTRAINT FK_UserLogins_Users FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers(Id) ON DELETE CASCADE
  );
END;

IF OBJECT_ID(N'dbo.AspNetUserTokens', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AspNetUserTokens (
    UserId NVARCHAR(450) NOT NULL,
    LoginProvider NVARCHAR(450) NOT NULL,
    Name NVARCHAR(450) NOT NULL,
    Value NVARCHAR(MAX) NULL,
    PRIMARY KEY (UserId, LoginProvider, Name),
    CONSTRAINT FK_UserTokens_Users FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers(Id) ON DELETE CASCADE
  );
END;
`;
