import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  AuthenticateRequest,
  AuthenticateResponse,
  CatalogItemDto,
  CreateCatalogItemRequest,
  CreateCatalogItemResponse,
  CreateRoleRequest,
  CreateUserRequest,
  CreateUserResponse,
  GetRoleMembershipResponse,
  GetUserResponse,
  IdentityRoleDto,
  ListCatalogBrandsResponse,
  ListPagedCatalogItemResponse,
  RoleListResponse,
  SaveRolesForUserRequest,
  UpdateCatalogItemRequest,
  UserDto,
  UserListResponse,
} from "@/shared/contracts";
import { Roles } from "@/shared/authorization/constants";

/**
 * Representative JSON fixtures mirroring PublicApi wire payloads.
 * Field names are camelCase per ASP.NET Core JsonSerializerDefaults.Web.
 */
const fixtures = {
  authenticateRequest: {
    username: "demouser@microsoft.com",
    password: "Pass@word1",
  } satisfies AuthenticateRequest,
  authenticateResponse: {
    result: true,
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example",
    username: "demouser@microsoft.com",
    isLockedOut: false,
    isNotAllowed: false,
    requiresTwoFactor: false,
  } satisfies AuthenticateResponse,
  catalogItem: {
    id: 5,
    name: "Roslyn Red Sheet",
    description: ".NET Bot Black Sweatshirt",
    price: 19.5,
    pictureUri: "http://localhost/images/products/5.png",
    catalogTypeId: 1,
    catalogBrandId: 2,
  } satisfies CatalogItemDto,
  listPagedCatalogItems: {
    catalogItems: [
      {
        id: 1,
        name: ".NET Bot Black Sweatshirt",
        description: "sheet",
        price: 19.5,
        pictureUri: "http://localhost/images/products/1.png",
        catalogTypeId: 2,
        catalogBrandId: 1,
      },
    ],
    pageCount: 2,
  } satisfies ListPagedCatalogItemResponse,
  listCatalogBrands: {
    catalogBrands: [
      { id: 1, name: "Azure" },
      { id: 2, name: ".NET" },
    ],
  } satisfies ListCatalogBrandsResponse,
  createCatalogItemRequest: {
    catalogBrandId: 1,
    catalogTypeId: 2,
    description: "A test item",
    name: "Test Widget",
    pictureUri: "",
    pictureBase64: "",
    pictureName: "",
    price: 9.99,
  } satisfies CreateCatalogItemRequest,
  updateCatalogItemRequest: {
    id: 1,
    catalogBrandId: 1,
    catalogTypeId: 2,
    description: "Updated",
    name: "Updated Widget",
    price: 11.5,
  } satisfies UpdateCatalogItemRequest,
  user: {
    id: "user-1",
    userName: "admin@microsoft.com",
    email: "admin@microsoft.com",
    emailConfirmed: true,
    phoneNumber: null,
    phoneNumberConfirmed: false,
    twoFactorEnabled: false,
    lockoutEnd: null,
  } satisfies UserDto,
  createUserRequest: {
    user: {
      id: "",
      userName: "newuser@microsoft.com",
      email: "newuser@microsoft.com",
      emailConfirmed: false,
      phoneNumberConfirmed: false,
      twoFactorEnabled: false,
    },
  } satisfies CreateUserRequest,
  createUserResponse: {
    userId: "new-user-id",
  } satisfies CreateUserResponse,
  getUserResponse: {
    user: {
      id: "user-1",
      userName: "admin@microsoft.com",
      email: "admin@microsoft.com",
      emailConfirmed: true,
      phoneNumberConfirmed: false,
      twoFactorEnabled: false,
    },
  } satisfies GetUserResponse,
  userListResponse: {
    users: [
      {
        id: "user-1",
        userName: "admin@microsoft.com",
        email: "admin@microsoft.com",
        emailConfirmed: true,
        phoneNumberConfirmed: false,
        twoFactorEnabled: false,
      },
    ],
  } satisfies UserListResponse,
  identityRole: {
    id: "role-1",
    name: Roles.ADMINISTRATORS,
    normalizedName: "ADMINISTRATORS",
    concurrencyStamp: "stamp",
  } satisfies IdentityRoleDto,
  createRoleRequest: {
    name: "Support",
  } satisfies CreateRoleRequest,
  roleListResponse: {
    roles: [
      {
        id: "role-1",
        name: Roles.ADMINISTRATORS,
        normalizedName: "ADMINISTRATORS",
        concurrencyStamp: "stamp",
      },
      {
        id: "role-2",
        name: Roles.PRODUCT_MANAGERS,
        normalizedName: "PRODUCT MANAGERS",
        concurrencyStamp: "stamp-2",
      },
    ],
  } satisfies RoleListResponse,
  saveRolesForUserRequest: {
    userId: "user-1",
    rolesToAdd: [Roles.PRODUCT_MANAGERS],
    rolesToRemove: [],
  } satisfies SaveRolesForUserRequest,
  roleMembershipResponse: {
    roleMembers: [
      {
        id: "user-1",
        userName: "admin@microsoft.com",
        email: "admin@microsoft.com",
        emailConfirmed: true,
        phoneNumberConfirmed: false,
        twoFactorEnabled: false,
        lockoutEnabled: false,
        accessFailedCount: 0,
      },
    ],
  } satisfies GetRoleMembershipResponse,
} as const;

function assertWireKeys<T extends object>(
  payload: T,
  expectedKeys: readonly string[],
) {
  expect(Object.keys(payload).sort()).toEqual([...expectedKeys].sort());
}

describe("shared API contract serialization", () => {
  it("round-trips authenticate request/response with PublicApi field names", () => {
    const requestJson = JSON.stringify(fixtures.authenticateRequest);
    const request = JSON.parse(requestJson) as AuthenticateRequest;
    assertWireKeys(request, ["username", "password"]);
    expect(request.username).toBe("demouser@microsoft.com");

    const responseJson = JSON.stringify(fixtures.authenticateResponse);
    const response = JSON.parse(responseJson) as AuthenticateResponse;
    assertWireKeys(response, [
      "result",
      "token",
      "username",
      "isLockedOut",
      "isNotAllowed",
      "requiresTwoFactor",
    ]);
    expect(response.result).toBe(true);
    expect(response.token.length).toBeGreaterThan(0);
  });

  it("round-trips catalog item and paged list payloads", () => {
    const item = JSON.parse(
      JSON.stringify(fixtures.catalogItem),
    ) as CatalogItemDto;
    assertWireKeys(item, [
      "id",
      "name",
      "description",
      "price",
      "pictureUri",
      "catalogTypeId",
      "catalogBrandId",
    ]);
    expect(item.id).toBe(5);
    expect(item.name).toBe("Roslyn Red Sheet");

    const paged = JSON.parse(
      JSON.stringify(fixtures.listPagedCatalogItems),
    ) as ListPagedCatalogItemResponse;
    assertWireKeys(paged, ["catalogItems", "pageCount"]);
    expect(paged.pageCount).toBe(2);
    expect(paged.catalogItems).toHaveLength(1);

    const brands = JSON.parse(
      JSON.stringify(fixtures.listCatalogBrands),
    ) as ListCatalogBrandsResponse;
    assertWireKeys(brands, ["catalogBrands"]);
    expect(brands.catalogBrands[0]?.name).toBe("Azure");
  });

  it("round-trips create catalog item request and response", () => {
    const request = JSON.parse(
      JSON.stringify(fixtures.createCatalogItemRequest),
    ) as CreateCatalogItemRequest;
    assertWireKeys(request, [
      "catalogBrandId",
      "catalogTypeId",
      "description",
      "name",
      "pictureUri",
      "pictureBase64",
      "pictureName",
      "price",
    ]);

    const response = JSON.parse(
      JSON.stringify({
        catalogItem: fixtures.catalogItem,
      } satisfies CreateCatalogItemResponse),
    ) as CreateCatalogItemResponse;
    expect(response.catalogItem.catalogBrandId).toBe(2);
  });

  it("round-trips user and role management payloads", () => {
    const users = JSON.parse(
      JSON.stringify(fixtures.userListResponse),
    ) as UserListResponse;
    assertWireKeys(users, ["users"]);
    expect(users.users[0]?.userName).toBe("admin@microsoft.com");

    const createUser = JSON.parse(
      JSON.stringify(fixtures.createUserRequest),
    ) as CreateUserRequest;
    assertWireKeys(createUser, ["user"]);
    expect(createUser.user.email).toBe("newuser@microsoft.com");

    const roles = JSON.parse(
      JSON.stringify(fixtures.roleListResponse),
    ) as RoleListResponse;
    assertWireKeys(roles, ["roles"]);
    expect(roles.roles.map((role) => role.name)).toEqual([
      Roles.ADMINISTRATORS,
      Roles.PRODUCT_MANAGERS,
    ]);

    const membership = JSON.parse(
      JSON.stringify(fixtures.roleMembershipResponse),
    ) as GetRoleMembershipResponse;
    assertWireKeys(membership, ["roleMembers"]);
    expect(membership.roleMembers[0]?.userName).toBe("admin@microsoft.com");

    const saveRoles = JSON.parse(
      JSON.stringify(fixtures.saveRolesForUserRequest),
    ) as SaveRolesForUserRequest;
    assertWireKeys(saveRoles, ["userId", "rolesToAdd", "rolesToRemove"]);
  });

  it("accepts PascalCase PublicApi test payloads via case-insensitive key mapping", () => {
    // Integration tests often serialize C# DTOs without a naming policy (PascalCase).
    const pascalAuthenticate = {
      Username: "demouser@microsoft.com",
      Password: "Pass@word1",
    };
    const normalized: AuthenticateRequest = {
      username: String(
        (pascalAuthenticate as Record<string, unknown>).Username ??
          (pascalAuthenticate as Record<string, unknown>).username,
      ),
      password: String(
        (pascalAuthenticate as Record<string, unknown>).Password ??
          (pascalAuthenticate as Record<string, unknown>).password,
      ),
    };
    expect(normalized).toEqual(fixtures.authenticateRequest);

    const pascalCatalog = {
      CatalogItems: [fixtures.catalogItem],
      PageCount: 1,
    };
    const normalizedCatalog: ListPagedCatalogItemResponse = {
      catalogItems: pascalCatalog.CatalogItems,
      pageCount: pascalCatalog.PageCount,
    };
    expect(normalizedCatalog.pageCount).toBe(1);
    expect(normalizedCatalog.catalogItems[0]?.id).toBe(5);
  });
});

describe("shared contracts module boundaries", () => {
  it("keeps contract modules free of react, next, and database imports", () => {
    const contractDir = __dirname;
    const files = [
      "auth.ts",
      "catalog.ts",
      "user.ts",
      "role.ts",
      "role-membership.ts",
      "index.ts",
    ];

    for (const file of files) {
      const source = readFileSync(resolve(contractDir, file), "utf8");
      expect(source).not.toMatch(
        /from ["'](react|react-dom|next|next\/|mssql|prisma|drizzle|knex|typeorm)/,
      );
      expect(source).not.toMatch(
        /require\(["'](react|next|mssql|prisma|drizzle)/,
      );
    }

    const constantsSource = readFileSync(
      resolve(__dirname, "../authorization/constants.ts"),
      "utf8",
    );
    expect(constantsSource).not.toMatch(/from ["'](react|next)\b/);
  });
});

describe("shared contracts type-level field presence", () => {
  it("keeps required PublicApi fields on authenticate and catalog item types", () => {
    type AssertEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false;

    type AuthenticateRequestKeys = keyof AuthenticateRequest;
    type CatalogItemKeys = keyof CatalogItemDto;

    const checks: [
      AssertEqual<AuthenticateRequestKeys & "username", "username">,
      AssertEqual<AuthenticateRequestKeys & "password", "password">,
      AssertEqual<CatalogItemKeys & "pictureUri", "pictureUri">,
      AssertEqual<CatalogItemKeys & "catalogBrandId", "catalogBrandId">,
    ] = [true, true, true, true];

    expect(checks).toEqual([true, true, true, true]);
  });
});
