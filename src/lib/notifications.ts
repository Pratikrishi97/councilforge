import { db } from "./db";

/**
 * Notification helper — creates notifications for meaningful project events.
 */

export interface NotificationInput {
  projectId?: string;
  type: string;
  title: string;
  message: string;
  severity?: "high" | "medium" | "low";
  details?: Record<string, unknown>;
}

export async function notify(input: NotificationInput): Promise<void> {
  try {
    await db.notification.create({
      data: {
        projectId: input.projectId ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        severity: input.severity ?? "medium",
        details: input.details ? JSON.stringify(input.details) : null,
      },
    });
  } catch {
    /* best-effort */
  }
}

export const NotificationTypes = {
  VALIDATION_FAILED: "validation_failed",
  CONSENSUS_BLOCKED: "consensus_blocked",
  PROVIDER_FALLBACK: "provider_fallback",
  DRIFT_DETECTED: "drift_detected",
  POLICY_VIOLATION: "policy_violation",
  HEALTH_DROPPED: "health_dropped",
  BENCHMARK_REGRESSION: "benchmark_regression",
  REVIEW_PENDING: "review_pending",
  VERSION_CHANGED: "version_changed",
  RELEASE_GATE: "release_gate",
  GENERATION_COMPLETE: "generation_complete",
  GENERATION_FAILED: "generation_failed",
} as const;
