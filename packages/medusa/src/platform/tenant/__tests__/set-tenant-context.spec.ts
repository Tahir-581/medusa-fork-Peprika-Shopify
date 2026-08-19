import { resolveTenantContext } from "../set-tenant-context"

describe("resolveTenantContext", () => {
  it("prefers x-medusa-tenant-id", () => {
    const req = {
      headers: {
        "x-medusa-tenant-id": "tenant_a",
        "x-tenant-id": "tenant_b",
      },
    } as any

    expect(resolveTenantContext(req)).toEqual({ id: "tenant_a", source: "header" })
  })

  it("falls back to x-tenant-id", () => {
    const req = {
      headers: {
        "x-tenant-id": "tenant_b",
      },
    } as any

    expect(resolveTenantContext(req)).toEqual({ id: "tenant_b", source: "header" })
  })

  it("falls back to DEFAULT_TENANT_ID when no header/domain", () => {
    const original = process.env.DEFAULT_TENANT_ID
    process.env.DEFAULT_TENANT_ID = "default_tenant"

    jest.resetModules()
    const { resolveTenantContext: resolveFresh } = require("../set-tenant-context")

    const req = { headers: {} } as any
    expect(resolveFresh(req)).toEqual({ id: "default_tenant", source: "default" })

    process.env.DEFAULT_TENANT_ID = original
  })
})

