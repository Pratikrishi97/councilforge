import { db } from "./db";

/**
 * Policy Engine — configurable restrictions for projects.
 * Enforces input, output, role, provider, data handling, and escalation rules.
 */

export type PolicyType =
  | "input_restriction"
  | "output_restriction"
  | "role_restriction"
  | "provider_restriction"
  | "data_handling"
  | "escalation";

export interface PolicyRule {
  type: PolicyType;
  rule: string;
  enforced: boolean;
}

export interface PolicyViolation {
  type: PolicyType;
  rule: string;
  message: string;
  severity: "block" | "warn";
}

/** Default policies applied to all projects. */
export const DEFAULT_POLICIES: PolicyRule[] = [
  {
    type: "data_handling",
    rule: "API keys must never appear in generated documents",
    enforced: true,
  },
  {
    type: "data_handling",
    rule: "PII must not be included in research evidence",
    enforced: true,
  },
  {
    type: "provider_restriction",
    rule: "Only OpenAI-compatible providers may be used with user keys",
    enforced: true,
  },
  {
    type: "escalation",
    rule: "High-severity risks require human review before finalizing",
    enforced: true,
  },
  {
    type: "input_restriction",
    rule: "Inputs containing credentials will be rejected",
    enforced: true,
  },
];

/** Check an input against policies. Returns violations (empty if OK). */
export function checkInputPolicies(
  input: string,
  policies: PolicyRule[],
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];
  const inputLower = input.toLowerCase();

  // credential detection
  if (
    inputLower.includes("api_key=") ||
    inputLower.includes("password=") ||
    inputLower.match(/sk-[a-z0-9]{20,}/i) ||
    inputLower.match(/-----begin [a-z ]+private key-----/i)
  ) {
    violations.push({
      type: "input_restriction",
      rule: "Inputs containing credentials will be rejected",
      message: "Input appears to contain API keys or credentials. Please remove sensitive data before generating.",
      severity: "block",
    });
  }

  // check custom input restrictions
  for (const p of policies) {
    if (p.type === "input_restriction" && p.enforced) {
      // simple keyword check
      const keywords = p.rule.match(/"([^"]+)"/g);
      if (keywords) {
        for (const kw of keywords) {
          const clean = kw.replace(/"/g, "").toLowerCase();
          if (inputLower.includes(clean)) {
            violations.push({
              type: p.type,
              rule: p.rule,
              message: `Input violates policy: ${p.rule}`,
              severity: "warn",
            });
          }
        }
      }
    }
  }

  return violations;
}

/** Check a generated document against output policies. */
export function checkOutputPolicies(
  document: string,
  policies: PolicyRule[],
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];
  const docLower = document.toLowerCase();

  // check for leaked secrets
  if (docLower.match(/sk-[a-z0-9]{20,}/i)) {
    violations.push({
      type: "data_handling",
      rule: "API keys must never appear in generated documents",
      message: "Document appears to contain an API key. This is a critical policy violation.",
      severity: "block",
    });
  }

  return violations;
}

/** Get policies for a project (defaults + project-specific). */
export async function getProjectPolicies(
  projectId?: string,
): Promise<PolicyRule[]> {
  const policies = [...DEFAULT_POLICIES];

  if (projectId) {
    const projectPolicies = await db.policy.findMany({
      where: { projectId },
    });
    for (const p of projectPolicies) {
      policies.push({
        type: p.type as PolicyType,
        rule: p.rule,
        enforced: p.enforced,
      });
    }
  }

  return policies;
}
