import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type TenantContext = {
  id: string
  source: "header" | "domain" | "default"
  domain?: string
}

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || "default"

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function resolveTenantFromHeaders(req: MedusaRequest): string | undefined {
  const explicit =
    firstHeaderValue(req.headers["x-medusa-tenant-id"] as any) ||
    firstHeaderValue(req.headers["x-tenant-id"] as any)

  return explicit?.trim() || undefined
}

function resolveTenantFromDomain(req: MedusaRequest): { tenantId?: string; domain?: string } {
  const baseDomain = (process.env.TENANT_BASE_DOMAIN || "").trim().toLowerCase()
  if (!baseDomain) {
    return {}
  }

  const forwardedHost = firstHeaderValue(req.headers["x-forwarded-host"] as any)
  const host = (forwardedHost || firstHeaderValue(req.headers.host as any) || "").toLowerCase()
  const domain = host.split(",")[0]?.trim()
  if (!domain) {
    return {}
  }

  if (domain === baseDomain) {
    return {}
  }

  if (!domain.endsWith(`.${baseDomain}`)) {
    return {}
  }

  const tenantId = domain.slice(0, -(baseDomain.length + 1))
  if (!tenantId) {
    return {}
  }

  return { tenantId, domain }
}

export function resolveTenantContext(req: MedusaRequest): TenantContext {
  const headerTenant = resolveTenantFromHeaders(req)
  if (headerTenant) {
    return { id: headerTenant, source: "header" }
  }

  const domainResolution = resolveTenantFromDomain(req)
  if (domainResolution.tenantId) {
    return {
      id: domainResolution.tenantId,
      source: "domain",
      domain: domainResolution.domain,
    }
  }

  return { id: DEFAULT_TENANT_ID, source: "default" }
}

export async function setTenantContext(
  req: MedusaRequest,
  _: MedusaResponse,
  next: MedusaNextFunction
) {
  const tenant = resolveTenantContext(req)
  req.context = {
    ...(req.context || {}),
    tenant,
    tenant_id: tenant.id,
  }

  return next()
}

