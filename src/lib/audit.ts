import { db } from "./db";

/**
 * Audit log helper — records significant actions for enterprise governance.
 * Never logs API keys or sensitive content.
 */
export interface AuditEntry {
  action: string;
  projectId?: string;
  versionId?: string;
  actor?: string;
  details?: Record<string, unknown>;
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: entry.action,
        projectId: entry.projectId ?? null,
        versionId: entry.versionId ?? null,
        actor: entry.actor ?? "user",
        details: entry.details ? JSON.stringify(entry.details) : null,
      },
    });
  } catch {
    /* audit logging is best-effort — never block on it */
  }
}

/** Common audit actions. */
export const AuditActions = {
  GENERATE: "generate",
  EXPORT: "export",
  PROVIDER_KEY_ADDED: "provider_key_added",
  PROVIDER_KEY_REMOVED: "provider_key_removed",
  GATE_APPROVED: "gate_approved",
  GATE_REVISED: "gate_revised",
  MODE_CHANGED: "mode_changed",
  REGISTRY_REFRESHED: "registry_refreshed",
  ONBOARDING_COMPLETED: "onboarding_completed",
} as const;
