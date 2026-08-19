import {
  Context,
  DAL,
  InternalModuleDeclaration,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import {
  InjectManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils"
import { WebhookDelivery, WebhookSubscription } from "@models"

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
  webhookSubscriptionService: ModulesSdkTypes.IMedusaInternalService<
    typeof WebhookSubscription
  >
  webhookDeliveryService: ModulesSdkTypes.IMedusaInternalService<
    typeof WebhookDelivery
  >
}

type CreateSubscriptionInput = {
  tenant_id: string
  topic: string
  url: string
  secret: string
  status?: "active" | "disabled"
  headers?: Record<string, unknown>
  max_in_flight?: number
  min_interval_ms?: number
}

type UpdateSubscriptionInput = {
  id: string
  topic?: string
  url?: string
  secret?: string
  status?: "active" | "disabled"
  headers?: Record<string, unknown> | null
  max_in_flight?: number | null
  min_interval_ms?: number | null
}

type CreateDeliveryInput = {
  tenant_id: string
  subscription_id: string
  topic: string
  payload: Record<string, unknown>
  event_id?: string
  idempotency_key?: string
  max_attempts?: number
  next_attempt_at?: Date
}

type MarkDeliveryProcessingInput = {
  id: string
  locked_by: string
  locked_at: Date
}

type ResetDeliveryInput = {
  tenant_id: string
  subscription_id: string
  delivery_id: string
  next_attempt_at?: Date
}

type ResetFailedDeliveriesInput = {
  tenant_id: string
  subscription_id: string
  limit?: number
}

type RotateSecretInput = {
  tenant_id: string
  subscription_id: string
  secret: string
}

type CreateTestDeliveryInput = {
  tenant_id: string
  subscription_id: string
  topic: string
  payload: Record<string, unknown>
}

type UpdateSubscriptionHealthInput = {
  tenant_id: string
  subscription_id: string
  failure_count?: number | null
  last_failure_at?: Date | null
  last_success_at?: Date | null
  disabled_at?: Date | null
  disabled_reason?: string | null
  status?: "active" | "disabled"
  last_attempt_at?: Date | null
}

type PruneDeliveriesInput = {
  before: Date
  statuses?: string[]
  take?: number
}

type RescheduleDeliveryInput = {
  tenant_id: string
  subscription_id: string
  delivery_id: string
  next_attempt_at: Date
  reason?: string
}

export default class WebhookModuleService extends MedusaService<{
  WebhookSubscription: { dto: any }
  WebhookDelivery: { dto: any }
}>({ WebhookSubscription, WebhookDelivery }) {
  protected baseRepository_: DAL.RepositoryService
  protected webhookSubscriptionService_: ModulesSdkTypes.IMedusaInternalService<
    typeof WebhookSubscription
  >
  protected webhookDeliveryService_: ModulesSdkTypes.IMedusaInternalService<
    typeof WebhookDelivery
  >

  constructor(
    {
      baseRepository,
      webhookSubscriptionService,
      webhookDeliveryService,
    }: InjectedDependencies,
    protected readonly moduleDeclaration: InternalModuleDeclaration
  ) {
    // @ts-ignore
    super(...arguments)
    this.baseRepository_ = baseRepository
    this.webhookSubscriptionService_ = webhookSubscriptionService
    this.webhookDeliveryService_ = webhookDeliveryService
  }

  @InjectManager()
  async createSubscriptions(
    data: CreateSubscriptionInput | CreateSubscriptionInput[],
    @MedusaContext() sharedContext: Context = {}
  ) {
    const normalized = Array.isArray(data) ? data : [data]

    const created = await this.webhookSubscriptionService_.create(
      normalized.map((s) => ({
        tenant_id: s.tenant_id,
        topic: s.topic,
        url: s.url,
        secret: s.secret,
        status: s.status ?? "active",
        headers: s.headers ?? null,
        max_in_flight: s.max_in_flight ?? 5,
        min_interval_ms: s.min_interval_ms ?? 0,
      })),
      sharedContext
    )

    const serialized = await this.baseRepository_.serialize(created)
    return Array.isArray(data) ? serialized : serialized[0]
  }

  @InjectManager()
  async updateSubscriptions(
    data: UpdateSubscriptionInput | UpdateSubscriptionInput[],
    @MedusaContext() sharedContext: Context = {}
  ) {
    const normalized = Array.isArray(data) ? data : [data]
    const updated = await this.webhookSubscriptionService_.update(
      normalized.map((s) => ({
        id: s.id,
        ...(s.topic !== undefined ? { topic: s.topic } : {}),
        ...(s.url !== undefined ? { url: s.url } : {}),
        ...(s.secret !== undefined ? { secret: s.secret } : {}),
        ...(s.status !== undefined ? { status: s.status } : {}),
        ...(s.headers !== undefined ? { headers: s.headers } : {}),
        ...(s.max_in_flight !== undefined ? { max_in_flight: s.max_in_flight } : {}),
        ...(s.min_interval_ms !== undefined ? { min_interval_ms: s.min_interval_ms } : {}),
      })),
      sharedContext
    )

    const serialized = await this.baseRepository_.serialize(updated)
    return Array.isArray(data) ? serialized : serialized[0]
  }

  @InjectManager()
  async deleteSubscriptions(
    ids: string[] | string,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const normalized = Array.isArray(ids) ? ids : [ids]
    await this.webhookSubscriptionService_.delete(normalized, sharedContext)
  }

  @InjectManager()
  async listSubscriptions(
    filters: Record<string, unknown> = {},
    config: Record<string, unknown> = {},
    @MedusaContext() sharedContext: Context = {}
  ) {
    const data = await this.webhookSubscriptionService_.list(
      filters,
      config,
      sharedContext
    )
    return this.baseRepository_.serialize(data)
  }

  @InjectManager()
  async retrieveSubscription(
    id: string,
    config: Record<string, unknown> = {},
    @MedusaContext() sharedContext: Context = {}
  ) {
    const entity = await this.webhookSubscriptionService_.retrieve(
      id,
      config,
      sharedContext
    )
    return this.baseRepository_.serialize(entity)
  }

  @InjectManager()
  async createDeliveries(
    data: CreateDeliveryInput | CreateDeliveryInput[],
    @MedusaContext() sharedContext: Context = {}
  ) {
    const normalized = Array.isArray(data) ? data : [data]
    const now = new Date()

    const withIdempotency = normalized.filter(
      (d) => d.idempotency_key || (d.event_id && d.subscription_id)
    )

    const idempotencyKeys = withIdempotency
      .map((d) => d.idempotency_key || `${d.subscription_id}:${d.event_id}`)
      .filter(Boolean)

    if (idempotencyKeys.length) {
      const existing = await this.webhookDeliveryService_.list(
        {
          idempotency_key: idempotencyKeys,
        },
        { select: ["id", "idempotency_key"] },
        sharedContext
      )

      const existingKeys = new Set(
        (existing || [])
          .map((e: any) => e.idempotency_key)
          .filter(Boolean) as string[]
      )

      const filtered = normalized.filter((d) => {
        const key = d.idempotency_key || (d.event_id ? `${d.subscription_id}:${d.event_id}` : null)
        return !key || !existingKeys.has(key)
      })

      if (!filtered.length) {
        return Array.isArray(data) ? [] : null
      }

      const created = await this.webhookDeliveryService_.create(
        filtered.map((d) => ({
          tenant_id: d.tenant_id,
          subscription_id: d.subscription_id,
          topic: d.topic,
          payload: d.payload,
          event_id: d.event_id ?? null,
          idempotency_key:
            d.idempotency_key || (d.event_id ? `${d.subscription_id}:${d.event_id}` : null),
          attempt: 0,
          max_attempts: d.max_attempts ?? 10,
          next_attempt_at: d.next_attempt_at ?? now,
          status: "pending",
        })),
        sharedContext
      )

      const serialized = await this.baseRepository_.serialize(created)
      return Array.isArray(data) ? serialized : serialized[0]
    }

    const created = await this.webhookDeliveryService_.create(
      normalized.map((d) => ({
        tenant_id: d.tenant_id,
        subscription_id: d.subscription_id,
        topic: d.topic,
        payload: d.payload,
        event_id: d.event_id ?? null,
        idempotency_key: d.idempotency_key ?? null,
        attempt: 0,
        max_attempts: d.max_attempts ?? 10,
        next_attempt_at: d.next_attempt_at ?? now,
        status: "pending",
      })),
      sharedContext
    )

    const serialized = await this.baseRepository_.serialize(created)
    return Array.isArray(data) ? serialized : serialized[0]
  }

  @InjectManager()
  async listDeliveries(
    filters: Record<string, unknown> = {},
    config: Record<string, unknown> = {},
    @MedusaContext() sharedContext: Context = {}
  ) {
    const data = await this.webhookDeliveryService_.list(
      filters,
      config,
      sharedContext
    )
    return this.baseRepository_.serialize(data)
  }

  @InjectManager()
  async deleteDeliveries(
    ids: string[] | string,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const normalized = Array.isArray(ids) ? ids : [ids]
    await this.webhookDeliveryService_.delete(normalized, sharedContext)
  }

  @InjectManager()
  async pruneDeliveries(
    input: PruneDeliveriesInput,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const statuses = input.statuses ?? ["success", "failed", "skipped"]
    const take = input.take ?? 500

    const deliveries = await this.webhookDeliveryService_.list(
      {
        status: statuses,
        sent_at: { $lt: input.before } as any,
      },
      {
        select: ["id"],
        take,
        order: { sent_at: "ASC" },
      },
      sharedContext
    )

    const ids = (deliveries || []).map((d: any) => d.id).filter(Boolean)
    if (!ids.length) {
      return { deleted: 0 }
    }

    await this.webhookDeliveryService_.delete(ids, sharedContext)
    return { deleted: ids.length }
  }

  @InjectManager()
  async rescheduleDelivery(
    input: RescheduleDeliveryInput,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const existing = await this.webhookDeliveryService_.list(
      {
        id: input.delivery_id,
        tenant_id: input.tenant_id,
        subscription_id: input.subscription_id,
      },
      { take: 1 },
      sharedContext
    )

    if (!existing?.[0]) {
      return null
    }

    const updated = await this.webhookDeliveryService_.update(
      [
        {
          id: input.delivery_id,
          status: "retrying",
          next_attempt_at: input.next_attempt_at,
          last_error: input.reason ?? null,
          locked_at: null,
          locked_by: null,
        },
      ],
      sharedContext
    )

    return this.baseRepository_.serialize(updated[0])
  }

  @InjectManager()
  async markDeliveryAttempt(
    id: string,
    data: {
      attempt: number
      next_attempt_at: Date
      status: string
      response_code?: number | null
      last_error?: string | null
      last_request_headers?: Record<string, unknown> | null
      last_response_headers?: Record<string, unknown> | null
      last_response_body?: string | null
      last_duration_ms?: number | null
      sent_at?: Date | null
    },
    @MedusaContext() sharedContext: Context = {}
  ) {
    const updated = await this.webhookDeliveryService_.update(
      [
        {
          id,
          attempt: data.attempt,
          next_attempt_at: data.next_attempt_at,
          status: data.status,
          response_code: data.response_code ?? null,
          last_error: data.last_error ?? null,
          last_request_headers:
            data.last_request_headers !== undefined
              ? data.last_request_headers
              : undefined,
          last_response_headers:
            data.last_response_headers !== undefined
              ? data.last_response_headers
              : undefined,
          last_response_body:
            data.last_response_body !== undefined
              ? data.last_response_body
              : undefined,
          last_duration_ms:
            data.last_duration_ms !== undefined
              ? data.last_duration_ms
              : undefined,
          sent_at: data.sent_at ?? null,
          locked_at: null,
          locked_by: null,
        },
      ],
      sharedContext
    )

    return this.baseRepository_.serialize(updated[0])
  }

  @InjectManager()
  async markDeliveriesProcessing(
    data: MarkDeliveryProcessingInput | MarkDeliveryProcessingInput[],
    @MedusaContext() sharedContext: Context = {}
  ) {
    const normalized = Array.isArray(data) ? data : [data]
    const updated = await this.webhookDeliveryService_.update(
      normalized.map((d) => ({
        id: d.id,
        status: "processing",
        locked_at: d.locked_at,
        locked_by: d.locked_by,
      })),
      sharedContext
    )

    const serialized = await this.baseRepository_.serialize(updated)
    return Array.isArray(data) ? serialized : serialized[0]
  }

  @InjectManager()
  async resetDeliveryForRedelivery(
    input: ResetDeliveryInput,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const existing = await this.webhookDeliveryService_.list(
      {
        id: input.delivery_id,
        tenant_id: input.tenant_id,
        subscription_id: input.subscription_id,
      },
      { take: 1 },
      sharedContext
    )

    if (!existing?.[0]) {
      return null
    }

    const nextAttemptAt = input.next_attempt_at ?? new Date()

    const updated = await this.webhookDeliveryService_.update(
      [
        {
          id: input.delivery_id,
          status: "pending",
          attempt: 0,
          next_attempt_at: nextAttemptAt,
          response_code: null,
          last_error: null,
          sent_at: null,
          locked_at: null,
          locked_by: null,
        },
      ],
      sharedContext
    )

    return this.baseRepository_.serialize(updated[0])
  }

  @InjectManager()
  async resetFailedDeliveriesForRedelivery(
    input: ResetFailedDeliveriesInput,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const subscription = await this.webhookSubscriptionService_.list(
      {
        id: input.subscription_id,
        tenant_id: input.tenant_id,
      },
      { take: 1 },
      sharedContext
    )

    if (!subscription?.[0]) {
      return null
    }

    const take = Math.min(Math.max(Number(input.limit ?? 100), 1), 500)
    const deliveries = await this.webhookDeliveryService_.list(
      {
        tenant_id: input.tenant_id,
        subscription_id: input.subscription_id,
        status: "failed",
      },
      { select: ["id"], take },
      sharedContext
    )

    const ids = (deliveries || []).map((d: any) => d.id).filter(Boolean)
    if (!ids.length) {
      return { reset: 0 }
    }

    const now = new Date()
    await this.webhookDeliveryService_.update(
      ids.map((id) => ({
        id,
        status: "pending",
        attempt: 0,
        next_attempt_at: now,
        response_code: null,
        last_error: null,
        last_request_headers: null,
        last_response_headers: null,
        last_response_body: null,
        last_duration_ms: null,
        sent_at: null,
        locked_at: null,
        locked_by: null,
      })),
      sharedContext
    )

    return { reset: ids.length }
  }

  @InjectManager()
  async rotateSubscriptionSecret(
    input: RotateSecretInput,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const existing = await this.webhookSubscriptionService_.list(
      {
        id: input.subscription_id,
        tenant_id: input.tenant_id,
      },
      { take: 1 },
      sharedContext
    )

    if (!existing?.[0]) {
      return null
    }

    const updated = await this.webhookSubscriptionService_.update(
      [
        {
          id: input.subscription_id,
          secret: input.secret,
        },
      ],
      sharedContext
    )

    return this.baseRepository_.serialize(updated[0])
  }

  @InjectManager()
  async createTestDelivery(
    input: CreateTestDeliveryInput,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const subscription = await this.webhookSubscriptionService_.list(
      {
        id: input.subscription_id,
        tenant_id: input.tenant_id,
      },
      { take: 1 },
      sharedContext
    )

    if (!subscription?.[0]) {
      return null
    }

    return await this.createDeliveries(
      {
        tenant_id: input.tenant_id,
        subscription_id: input.subscription_id,
        topic: input.topic,
        payload: input.payload,
        max_attempts: 1,
        next_attempt_at: new Date(),
      },
      sharedContext
    )
  }

  @InjectManager()
  async updateSubscriptionHealth(
    input: UpdateSubscriptionHealthInput,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const existing = await this.webhookSubscriptionService_.list(
      {
        id: input.subscription_id,
        tenant_id: input.tenant_id,
      },
      { take: 1 },
      sharedContext
    )

    if (!existing?.[0]) {
      return null
    }

    const updated = await this.webhookSubscriptionService_.update(
      [
        {
          id: input.subscription_id,
          ...(input.failure_count !== undefined
            ? { failure_count: input.failure_count }
            : {}),
          ...(input.last_failure_at !== undefined
            ? { last_failure_at: input.last_failure_at }
            : {}),
          ...(input.last_success_at !== undefined
            ? { last_success_at: input.last_success_at }
            : {}),
          ...(input.last_attempt_at !== undefined
            ? { last_attempt_at: input.last_attempt_at }
            : {}),
          ...(input.disabled_at !== undefined
            ? { disabled_at: input.disabled_at }
            : {}),
          ...(input.disabled_reason !== undefined
            ? { disabled_reason: input.disabled_reason }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
      ],
      sharedContext
    )

    return this.baseRepository_.serialize(updated[0])
  }
}

