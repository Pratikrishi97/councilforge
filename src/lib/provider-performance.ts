import { db } from "./db";

/**
 * Provider Performance Tracker — records and analyzes provider performance
 * over time. Enables adaptive routing based on real usage data.
 */

export interface ProviderStats {
  providerId: string;
  totalCalls: number;
  successRate: number;
  avgDurationMs: number;
  fallbackRate: number;
  avgTokenUsage: number;
  bestStage: string | null;
  worstStage: string | null;
}

/**
 * Record a provider performance event.
 */
export async function recordPerformance(params: {
  providerId: string;
  stage: string;
  role?: string;
  durationMs: number;
  status: string;
  tokenUsage?: number;
  qualityScore?: number;
  projectId?: string;
  versionId?: string;
}): Promise<void> {
  try {
    await db.providerPerformance.create({
      data: {
        providerId: params.providerId,
        stage: params.stage,
        role: params.role ?? null,
        durationMs: params.durationMs,
        status: params.status,
        tokenUsage: params.tokenUsage ?? null,
        qualityScore: params.qualityScore ?? null,
        projectId: params.projectId ?? null,
        versionId: params.versionId ?? null,
      },
    });
  } catch {
    /* best-effort */
  }
}

/**
 * Get aggregated performance stats per provider.
 */
export async function getProviderStats(): Promise<ProviderStats[]> {
  const events = await db.providerPerformance.findMany({
    take: 1000,
    orderBy: { createdAt: "desc" },
  });

  const byProvider = new Map<string, typeof events>();
  for (const e of events) {
    const arr = byProvider.get(e.providerId) ?? [];
    arr.push(e);
    byProvider.set(e.providerId, arr);
  }

  const stats: ProviderStats[] = [];
  for (const [providerId, evts] of byProvider) {
    const total = evts.length;
    const successes = evts.filter((e) => e.status === "success").length;
    const fallbacks = evts.filter((e) => e.status === "fallback").length;
    const avgDuration = Math.round(
      evts.reduce((sum, e) => sum + e.durationMs, 0) / total,
    );
    const avgTokens = evts.reduce((sum, e) => sum + (e.tokenUsage ?? 0), 0) / total;

    // find best/worst stage by success rate
    const byStage = new Map<string, { total: number; success: number }>();
    for (const e of evts) {
      const s = byStage.get(e.stage) ?? { total: 0, success: 0 };
      s.total++;
      if (e.status === "success") s.success++;
      byStage.set(e.stage, s);
    }
    let bestStage: string | null = null;
    let worstStage: string | null = null;
    let bestRate = -1;
    let worstRate = 2;
    for (const [stage, s] of byStage) {
      const rate = s.success / s.total;
      if (rate > bestRate) {
        bestRate = rate;
        bestStage = stage;
      }
      if (rate < worstRate) {
        worstRate = rate;
        worstStage = stage;
      }
    }

    stats.push({
      providerId,
      totalCalls: total,
      successRate: Math.round((successes / total) * 100),
      avgDurationMs: avgDuration,
      fallbackRate: Math.round((fallbacks / total) * 100),
      avgTokenUsage: Math.round(avgTokens),
      bestStage,
      worstStage,
    });
  }

  return stats.sort((a, b) => b.totalCalls - a.totalCalls);
}
