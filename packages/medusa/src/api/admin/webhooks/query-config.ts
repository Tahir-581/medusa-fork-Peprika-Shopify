export const listTransformQueryConfig = {
  defaults: [
    "id",
    "topic",
    "url",
    "status",
    "failure_count",
    "last_failure_at",
    "last_success_at",
    "disabled_at",
    "disabled_reason",
    "max_in_flight",
    "min_interval_ms",
    "created_at",
    "updated_at",
  ],
  isList: true,
}

export const retrieveTransformQueryConfig = {
  defaults: [
    "id",
    "topic",
    "url",
    "status",
    "headers",
    "failure_count",
    "last_failure_at",
    "last_success_at",
    "disabled_at",
    "disabled_reason",
    "max_in_flight",
    "min_interval_ms",
    "last_attempt_at",
    "created_at",
    "updated_at",
  ],
  isList: false,
}

export const listDeliveriesTransformQueryConfig = {
  defaults: [
    "id",
    "subscription_id",
    "topic",
    "status",
    "attempt",
    "max_attempts",
    "next_attempt_at",
    "response_code",
    "last_error",
    "last_duration_ms",
    "sent_at",
    "created_at",
  ],
  isList: true,
}

