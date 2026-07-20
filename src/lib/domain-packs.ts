/**
 * Domain Packs — specialized configuration per project domain.
 *
 * Each pack layers domain-specific roles, risk checklists, document
 * structure, policy rules, scoring rubrics, and recommended LLM providers
 * on top of the base 8-member AI Council. The dynamic-council and pipeline
 * stages can consume these to tailor their outputs to the project's domain.
 *
 * Base 8 council roles (always present):
 *   productManager, businessAnalyst, solutionsArchitect, engineeringLead,
 *   qaLead, securityReviewer, uxReviewer, deliveryManager
 *
 * Optional specialist roles layered on per-domain:
 *   complianceReviewer, devopsReviewer, financeReviewer, domainExpert,
 *   dataReviewer
 */

/** A single scoring rubric line item with a normalized weight (0..1). */
export interface DomainRubric {
  /** Short name of the evaluation criterion. */
  criterion: string;
  /** Weight in the overall quality score, in the range (0, 1]. */
  weight: number;
}

/** Configuration for a single domain pack. */
export interface DomainPackConfig {
  /** URL-friendly slug, e.g. "fintech". */
  packId: string;
  /** Human-friendly pack name. */
  name: string;
  /** One-paragraph description of what this pack is for. */
  description: string;
  /** Council roles active for this domain (base 8 + specialists). */
  roles: string[];
  /** Domain-specific risk items the pipeline must surface + mitigate. */
  riskChecklists: string[];
  /** Canonical document sections enforced for this domain. */
  docStructure: string[];
  /** Hard policy rules the generated plan/document must honor. */
  policyRules: string[];
  /** Scoring rubrics used by validation/quality gates. Weights sum to 1.0. */
  rubrics: DomainRubric[];
  /** Provider IDs (from provider-catalog.ts) well-suited to this domain. */
  recommendedProviders: string[];
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Base 8 roles — shared across every pack.                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const BASE_ROLES: string[] = [
  "productManager",
  "businessAnalyst",
  "solutionsArchitect",
  "engineeringLead",
  "qaLead",
  "securityReviewer",
  "uxReviewer",
  "deliveryManager",
];

/* ────────────────────────────────────────────────────────────────────────── */
/* Domain packs                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

export const DOMAIN_PACKS: DomainPackConfig[] = [
  /* ── 1. fintech ──────────────────────────────────────────────────────── */
  {
    packId: "fintech",
    name: "Fintech & Payments",
    description:
      "Financial services, payments, ledgers, and money-movement systems. Emphasizes PCI-DSS scope, KYC/AML, transaction integrity, reconciliation, and regulatory sign-off.",
    roles: [
      ...BASE_ROLES,
      "complianceReviewer",
      "financeReviewer",
      "domainExpert",
    ],
    riskChecklists: [
      "PCI-DSS scope is mapped and minimized (tokenization gateway isolates cardholder data)",
      "All money-movement flows are idempotent with deterministic request IDs",
      "Reconciliation plan covers settlement, chargebacks, refunds, and ACH returns",
      "KYC/AML screening integrated with sanctions list and PEP checks",
      "Dual authorization required for any ledger adjustment above threshold",
      "Audit log is append-only, immutable, retained 7 years, and tamper-evident",
      "Fraud detection rules + velocity checks cover payment, login, and account-takeover",
      "Regulatory reporting (e.g. 8300, SAR, PSD2 SCA) covered with submission SLAs",
      "Currency rounding + precision rules documented (no float for money)",
      "Chargeback + dispute workflow defined end-to-end",
      "Reversal + compensation logic tested for each payment rail",
      "PCI tokenization + P2PE validated for any cardholder data path",
    ],
    docStructure: [
      "Executive Summary",
      "Business Context & Regulatory Landscape",
      "Stakeholder Map (issuer, acquirer, processor, scheme, regulator)",
      "Compliance & Regulatory Requirements (PCI-DSS, KYC/AML, SOX, PSD2)",
      "Functional Requirements — Payment Flows & Rails",
      "Functional Requirements — Ledger & Reconciliation",
      "Non-Functional Requirements (txn integrity, latency, durability)",
      "Data Classification, Retention & Residency",
      "Security Controls (mTLS, KMS, tokenization, HSM)",
      "Audit Trail Specification",
      "Fraud & Risk Controls",
      "Rollout, Cutover & Backout",
      "Operational Runbook & On-Call Procedures",
      "Regulatory Sign-off & Compliance Attestation",
    ],
    policyRules: [
      "No production PII or PAN in non-production environments; synthetic data only",
      "All money movement requires dual approval above the configured threshold",
      "Cardholder data must never be stored — tokenization through a PCI-scoped gateway is mandatory",
      "Audit logs are append-only and retained for 7 years with tamper-evident hashing",
      "All inter-service calls require mTLS with rotated certificates",
      "Money is represented as integer minor units (no floating-point arithmetic)",
      "Every payment rail integration requires a documented reconciliation + reversal procedure",
      "Encryption at rest uses KMS-managed keys with rotation <= 90 days",
    ],
    rubrics: [
      { criterion: "Regulatory coverage (PCI/KYC/AML/SOX)", weight: 0.25 },
      { criterion: "Transaction integrity & idempotency", weight: 0.2 },
      { criterion: "Audit trail completeness", weight: 0.15 },
      { criterion: "Security control efficacy", weight: 0.15 },
      { criterion: "Reconciliation & settlement correctness", weight: 0.1 },
      { criterion: "Non-functional requirement coverage", weight: 0.1 },
      { criterion: "Rollout & cutover safety", weight: 0.05 },
    ],
    recommendedProviders: [
      "openrouter",
      "google-ai-studio",
      "cohere",
      "groq",
      "sambanova",
    ],
  },

  /* ── 2. healthcare ───────────────────────────────────────────────────── */
  {
    packId: "healthcare",
    name: "Healthcare & Clinical",
    description:
      "Patient-facing or clinical systems handling PHI. Emphasizes HIPAA privacy/security rules, HITRUST controls, clinical safety, EHR interoperability (HL7/FHIR), and breach response.",
    roles: [
      ...BASE_ROLES,
      "complianceReviewer",
      "domainExpert",
      "dataReviewer",
    ],
    riskChecklists: [
      "PHI inventory mapped with classification + minimum-necessary access",
      "HIPAA Privacy + Security Rule controls mapped (164.308/310/312)",
      "BAA in place with every vendor that creates, receives, maintains, or transmits PHI",
      "Clinical safety hazards identified via STPA or FMEA where applicable",
      "Patient consent capture + provenance tracked for every disclosure",
      "De-identification follows Safe Harbor (§164.514) for any analytics dataset",
      "Access logs retained 6 years, reviewable, and alert on anomalous access",
      "EHR/FHIR integration tested for USCDI v3 data elements",
      "Breach notification workflow meets 60-day notification requirement",
      "FDA SaMD classification reviewed if the feature is a medical device",
      "Audit logging covers PHI read/write/export with user + purpose",
      "Emergency access (break-glass) procedure documented and tested",
    ],
    docStructure: [
      "Executive Summary",
      "Clinical Context & Use Case",
      "Stakeholder & Patient Journey Map",
      "HIPAA & Regulatory Requirements",
      "Functional Requirements — Clinical Workflows",
      "Clinical Safety Requirements",
      "Interoperability (HL7 v2 / FHIR / USCDI)",
      "Data Governance & PHI Controls",
      "Access Control & Audit Logging",
      "Consent Management",
      "Breacht Response & Notification Plan",
      "Validation & Clinical Evidence",
      "Rollout, Training & Go-Live Readiness",
      "Compliance Attestation",
    ],
    policyRules: [
      "BAAs are required with every vendor handling PHI before integration",
      "Minimum-necessary access enforced via ABAC on every PHI read",
      "All PHI access is logged with user, purpose, and timestamp; logs are reviewable",
      "Encryption at rest (AES-256) and in transit (TLS 1.2+); no exceptions",
      "No PHI in non-production environments; de-identified or synthetic data only",
      "De-identification per Safe Harbor before any data leaves the trust boundary",
      "Breach notification workflow able to meet the 60-day HIPAA deadline",
      "Break-glass access is logged, alerted, and reviewed within 24 hours",
    ],
    rubrics: [
      { criterion: "HIPAA Privacy + Security coverage", weight: 0.25 },
      { criterion: "Clinical safety rigor", weight: 0.2 },
      { criterion: "PHI protection & data governance", weight: 0.2 },
      { criterion: "Interoperability (HL7/FHIR/USCDI)", weight: 0.1 },
      { criterion: "Audit & access-control completeness", weight: 0.1 },
      { criterion: "Consent + breach-response readiness", weight: 0.1 },
      { criterion: "Go-live readiness & training", weight: 0.05 },
    ],
    recommendedProviders: [
      "openrouter",
      "google-ai-studio",
      "cohere",
      "sambanova",
      "mistral-la-plateforme",
    ],
  },

  /* ── 3. enterprise-workflow ──────────────────────────────────────────── */
  {
    packId: "enterprise-workflow",
    name: "Enterprise Workflow & Internal Ops",
    description:
      "Internal-facing tools and workflow platforms for enterprise operations. Emphasizes SSO/RBAC, change governance, SOW-grade deliverables, integration with systems of record, and operational continuity.",
    roles: [
      ...BASE_ROLES,
      "complianceReviewer",
      "devopsReviewer",
    ],
    riskChecklists: [
      "SSO integration with corporate IdP (SAML/OIDC) tested for all user populations",
      "RBAC model covers every workflow action with least-privilege defaults",
      "Change Advisory Board (CAB) gates mapped to deployment pipeline",
      "Integration with systems of record (ERP, CRM, HRIS) documented with contract tests",
      "Business continuity + DR RTO/RPO defined and tested",
      "Backward compatibility with in-flight workflows during releases",
      "Audit trail captures who/what/when/why for every state transition",
      "Data residency honored for cross-region workflows",
      "Performance under enterprise-scale concurrency (10k+ concurrent users)",
      "Offboarding workflow revokes access across all integrated systems",
      "Governance approval gates enforced for high-risk workflow changes",
      "Operational runbook + escalation paths documented per workflow",
    ],
    docStructure: [
      "Executive Summary",
      "Engagement Scope & Objectives",
      "Deliverables & Acceptance Criteria",
      "Statement of Work",
      "Roles & Responsibilities (RACI)",
      "Timeline & Milestones",
      "Governance & Steering Model",
      "Change Control Process",
      "Risk & Issue Management",
      "Assumptions & Dependencies",
      "Pricing & Payment Schedule",
      "Acceptance & Sign-off",
    ],
    policyRules: [
      "All changes require CAB approval before production deployment",
      "RBAC enforced with least privilege; quarterly access reviews mandatory",
      "All integrations exposed through the enterprise API gateway",
      "Change windows respected; out-of-window changes require incident-tier approval",
      "Rollback plan mandatory for every release; tested in pre-prod",
      "Offboarding workflow revokes access within 4 hours across all integrated systems",
      "Every workflow state transition is auditable with actor + reason",
    ],
    rubrics: [
      { criterion: "Scope clarity & deliverable specificity", weight: 0.2 },
      { criterion: "Deliverable acceptance criteria", weight: 0.2 },
      { criterion: "Governance & change-control rigor", weight: 0.15 },
      { criterion: "RACI completeness", weight: 0.15 },
      { criterion: "Change control process", weight: 0.1 },
      { criterion: "Timeline realism", weight: 0.1 },
      { criterion: "Risk coverage", weight: 0.1 },
    ],
    recommendedProviders: [
      "openrouter",
      "google-ai-studio",
      "mistral-la-plateforme",
      "cohere",
      "sambanova",
    ],
  },

  /* ── 4. developer-tools ──────────────────────────────────────────────── */
  {
    packId: "developer-tools",
    name: "Developer Tools, APIs & SDKs",
    description:
      "APIs, SDKs, CLIs, frameworks, and developer platforms. Emphasizes API/SDK design, backward compatibility, code-quality rubrics, documentation accuracy, and supply-chain safety.",
    roles: [
      ...BASE_ROLES,
      "domainExpert",
      "devopsReviewer",
    ],
    riskChecklists: [
      "API versioning strategy documented (SemVer + deprecation policy)",
      "Backward compatibility verified with contract tests across N-2 versions",
      "Authentication options cover OAuth2, PAT, and machine-to-machine flows",
      "Rate limiting + fair-use policy documented and enforced",
      "SDK stability matrix maintained across supported language versions",
      "Documentation accuracy verified against live API surface (no drift)",
      "Dependency supply chain: pinned versions, SBOM, sigstore verification",
      "Breaking-change deprecation cycle defined (>=2 minor versions)",
      "Telemetry is opt-in only with PII redaction",
      "Onboarding time-to-first-call under 5 minutes for new developers",
      "Error model consistent, machine-parseable, and versioned",
      "Idempotency keys supported for any non-safe API",
    ],
    docStructure: [
      "Overview & Goals",
      "Background & Motivation",
      "Goals / Non-Goals",
      "Detailed Design (architecture, components, data model)",
      "API Surface & Versioning",
      "Backward Compatibility Plan",
      "Security & Authentication",
      "Observability (metrics, logs, traces)",
      "Performance & Scalability Targets",
      "Failure Modes & Resilience",
      "Rollout Plan",
      "Open Questions",
      "Alternatives Considered",
    ],
    policyRules: [
      "SemVer enforced; no breaking changes in patch or minor releases",
      "Breaking changes require a deprecation cycle of at least 2 minor versions",
      "All public APIs documented in an OpenAPI 3.1 specification, kept in sync",
      "Dependencies pinned with SBOM published per release",
      "Telemetry is opt-in only; no PII collected without explicit consent",
      "Every release ships with a changelog and migration notes",
    ],
    rubrics: [
      { criterion: "Technical depth & design rigor", weight: 0.2 },
      { criterion: "API/SDK design quality", weight: 0.2 },
      { criterion: "Backward compatibility plan", weight: 0.15 },
      { criterion: "Documentation quality & accuracy", weight: 0.15 },
      { criterion: "Security posture", weight: 0.1 },
      { criterion: "Observability design", weight: 0.1 },
      { criterion: "Rollout & deprecation safety", weight: 0.1 },
    ],
    recommendedProviders: [
      "openrouter",
      "mistral-codestral",
      "groq",
      "cerebras",
      "github-models",
      "fireworks",
    ],
  },

  /* ── 5. consumer-app ─────────────────────────────────────────────────── */
  {
    packId: "consumer-app",
    name: "Consumer App & Growth",
    description:
      "B2C mobile and web products with growth, retention, and monetization focus. Emphasizes user insight, north-star metrics, activation loops, accessibility, and GTM realism.",
    roles: [
      ...BASE_ROLES,
      "domainExpert",
      "dataReviewer",
    ],
    riskChecklists: [
      "Onboarding friction mapped; time-to-value under 2 minutes",
      "Retention cohorts + DAU/MAU targets defined with measurement plan",
      "Growth loops (viral, content, referral) documented with mechanics + guardrails",
      "Monetization avoids dark patterns; pricing transparency reviewed",
      "Accessibility WCAG 2.1 AA verified across critical user journeys",
      "Performance budget enforced (LCP < 2.5s, INP < 200ms, CLS < 0.1)",
      "Privacy compliance (GDPR/COPPA/CCPA) for tracking + data collection",
      "Push-notification frequency + opt-out honored across channels",
      "Brand consistency verified across surfaces + locales",
      "Crash-free rate >= 99.5% with triage SLAs",
      "A/B test design valid (sample size, guardrail metrics, peeking rules)",
      "Localization readiness for launch markets",
    ],
    docStructure: [
      "Vision & Target Users",
      "Problem Statement",
      "Market & Competitive Landscape",
      "User Personas & Journeys",
      "Success Metrics (North Star + supporting)",
      "Feature Spec (MVP + roadmap)",
      "UX & Design Principles",
      "Onboarding & Activation",
      "Growth & Retention Loops",
      "Monetization Model",
      "Risks & Mitigations",
      "Launch & GTM Plan",
    ],
    policyRules: [
      "Every growth change ships behind an A/B test with guardrail metrics",
      "Accessibility WCAG 2.1 AA is the minimum bar; no critical-path regressions",
      "No dark patterns; pricing + data disclosures reviewed by UX + legal",
      "Tracking is opt-in by default with clear consent UI",
      "Crash-free rate must stay >= 99.5% in production",
      "Performance budgets enforced in CI; regressions block merge",
    ],
    rubrics: [
      { criterion: "User-insight depth (personas, journeys)", weight: 0.2 },
      { criterion: "Metric clarity & measurement plan", weight: 0.15 },
      { criterion: "Feature prioritization rigor", weight: 0.15 },
      { criterion: "UX & design rigor", weight: 0.15 },
      { criterion: "Growth-loop validity", weight: 0.1 },
      { criterion: "Accessibility & inclusivity", weight: 0.1 },
      { criterion: "GTM realism", weight: 0.1 },
      { criterion: "Risk mitigation", weight: 0.05 },
    ],
    recommendedProviders: [
      "openrouter",
      "google-ai-studio",
      "groq",
      "cohere",
      "sambanova",
    ],
  },

  /* ── 6. analytics ────────────────────────────────────────────────────── */
  {
    packId: "analytics",
    name: "Analytics & Data Platform",
    description:
      "Data warehouses, BI platforms, semantic layers, and analytics products. Emphasizes data-model correctness, lineage, data-quality rules, freshness SLAs, and metric governance.",
    roles: [
      ...BASE_ROLES,
      "dataReviewer",
      "domainExpert",
      "devopsReviewer",
    ],
    riskChecklists: [
      "Data quality rules cover completeness, uniqueness, validity, timeliness, consistency",
      "Schema evolution policy + backward-compatible migration path",
      "Column-level lineage captured for every metric and dimension",
      "PII tagged at column level with access policies enforced",
      "Freshness SLAs defined per dataset with alerting on misses",
      "Query cost guardrails prevent runaway scans (warehouse credits)",
      "Backfill procedure documented with idempotency + validation",
      "Single source of truth enforced via semantic layer (no metric sprawl)",
      "Access controls (row-level, column-level) tested for each role",
      "Metric drift monitoring with anomaly detection + alerting",
      "Reprocessing plan covers late-arriving data + deduplication",
      "Catalog entries documented with owners + SLAs + refresh cadence",
    ],
    docStructure: [
      "Executive Summary",
      "Business Questions & KPIs",
      "Data Sources & Lineage",
      "Conceptual Data Model",
      "Logical & Physical Schema",
      "Entity Definitions & Grain",
      "Metrics & Dimensions Catalog",
      "Transformation Logic (dbt / SQL)",
      "Data Quality Rules",
      "Refresh Schedule & SLAs",
      "Access & Governance",
      "Backfill & Reprocessing Plan",
    ],
    policyRules: [
      "All datasets documented in the catalog with owner + SLA + grain",
      "PII tagged at column level; access enforced via policy layer",
      "Schema changes require PR review + tested backfill plan",
      "No SELECT * in production models; explicit column lists required",
      "All metrics versioned in the semantic layer; no ad-hoc metric definitions in dashboards",
      "Freshness SLAs alert within 2x the expected cadence",
    ],
    rubrics: [
      { criterion: "Data model correctness & grain", weight: 0.25 },
      { criterion: "Metric clarity & semantic layer", weight: 0.15 },
      { criterion: "Lineage completeness", weight: 0.15 },
      { criterion: "Data-quality rigor", weight: 0.15 },
      { criterion: "SLA realism & alerting", weight: 0.1 },
      { criterion: "Access governance", weight: 0.1 },
      { criterion: "Transformation correctness", weight: 0.1 },
    ],
    recommendedProviders: [
      "openrouter",
      "google-ai-studio",
      "cohere",
      "mistral-la-plateforme",
      "sambanova",
    ],
  },

  /* ── 7. ai-product ───────────────────────────────────────────────────── */
  {
    packId: "ai-product",
    name: "AI / ML Product",
    description:
      "LLM-powered apps, ML products, RAG systems, and inference platforms. Emphasizes model-risk management, eval rigor, safety guardrails, prompt/data provenance, and cost-latency discipline.",
    roles: [
      ...BASE_ROLES,
      "domainExpert",
      "dataReviewer",
      "devopsReviewer",
    ],
    riskChecklists: [
      "Hallucination rate bounded by eval harness with golden set",
      "Bias + fairness evaluated across protected attributes",
      "Data drift + concept drift monitoring on inputs + outputs",
      "Model versioning + reproducibility (training data, code, config pinned)",
      "Offline + online eval harness run before every model bump",
      "Prompt-injection + jailbreak resistance tested with red-team suite",
      "Cost guardrails prevent runaway inference spend (per-tenant budgets)",
      "Latency SLOs defined per endpoint with p50/p95/p99 targets",
      "Safety guardrails (input + output filtering) deployed inline",
      "PII redaction verified before any prompt reaches a third-party model",
      "Training data provenance documented with licensing + consent",
      "Human-in-the-loop required for high-stakes or irreversible outputs",
    ],
    docStructure: [
      "Overview & Use Cases",
      "ML Problem Framing",
      "Data Requirements & Provenance",
      "Model Architecture & Approach",
      "Training & Evaluation Methodology",
      "Metrics (Offline + Online)",
      "Serving Architecture",
      "Prompt / Inference Design",
      "Guardrails & Safety",
      "Cost & Latency Budget",
      "Monitoring (Drift, Fairness, Quality)",
      "Rollout & A/B Plan",
      "Risks & Mitigations",
    ],
    policyRules: [
      "All model outputs pass the safety filter before delivery to users",
      "Eval harness must pass before every model bump to production",
      "Prompts are logged + sampled for human review on a fixed cadence",
      "No PII sent to third-party models without a DPA in place",
      "Model cards published for all production models",
      "Human-in-the-loop required for any high-stakes or irreversible decision",
      "Per-tenant cost budgets enforced; overages alert + throttle",
    ],
    rubrics: [
      { criterion: "ML problem framing & approach", weight: 0.15 },
      { criterion: "Eval rigor (offline + online)", weight: 0.2 },
      { criterion: "Safety guardrails", weight: 0.15 },
      { criterion: "Data provenance + licensing", weight: 0.1 },
      { criterion: "Serving & inference design", weight: 0.15 },
      { criterion: "Cost & latency discipline", weight: 0.1 },
      { criterion: "Monitoring (drift, fairness, quality)", weight: 0.1 },
      { criterion: "Rollout & A/B safety", weight: 0.05 },
    ],
    recommendedProviders: [
      "openrouter",
      "google-ai-studio",
      "mistral-la-plateforme",
      "groq",
      "cerebras",
      "together-ai",
      "hyperbolic",
    ],
  },

  /* ── 8. migration ────────────────────────────────────────────────────── */
  {
    packId: "migration",
    name: "Migration & Modernization",
    description:
      "Legacy modernization, platform migrations, and cloud replatforming. Emphasizes compatibility, cutover safety, data-integrity validation, dual-run periods, and rollback rigor.",
    roles: [
      ...BASE_ROLES,
      "domainExpert",
      "devopsReviewer",
      "dataReviewer",
    ],
    riskChecklists: [
      "Source-system inventory complete with dependencies + downstream consumers",
      "Data loss risk mitigated with checksums + reconciliation",
      "Downtime window defined with business approval + rollback buffer",
      "API + schema + behavioral compatibility verified with contract tests",
      "Rollback plan tested end-to-end within the cutover window",
      "Data integrity validated against source checksums post-migration",
      "Cutover runbook with named owners, step-by-step, and verification gates",
      "Dependency mapping covers scheduled jobs, ETL, and external integrations",
      "Performance parity verified (no >10% regression on critical paths)",
      "Regression coverage at parity with the legacy system",
      "Dual-run period defined for critical paths with reconciliation",
      "Communication plan covers user + stakeholder notification windows",
    ],
    docStructure: [
      "Executive Summary",
      "Current State (Source System Inventory)",
      "Target State",
      "Migration Strategy (Lift-Shift / Replatform / Refactor / Rewrite)",
      "Data Migration Plan",
      "Code & Application Migration Plan",
      "Integration & Compatibility",
      "Cutover Plan (with Runbook)",
      "Validation & Testing",
      "Rollback Plan",
      "Risk & Mitigation",
      "Timeline & Migration Waves",
      "Communication & Stakeholder Plan",
    ],
    policyRules: [
      "No big-bang cutover without a tested rollback window",
      "All migrated data validated against source checksums before cutover sign-off",
      "Dual-run period mandatory for critical paths with daily reconciliation",
      "Cutover requires CAB sign-off + named incident commander",
      "All integrations contract-tested before cutover (zero failures in dry-run)",
      "Rollback procedure tested end-to-end in pre-prod within the cutover window",
    ],
    rubrics: [
      { criterion: "Cutover safety & runbook rigor", weight: 0.2 },
      { criterion: "Rollback plan completeness", weight: 0.2 },
      { criterion: "Data integrity validation", weight: 0.15 },
      { criterion: "Compatibility coverage", weight: 0.15 },
      { criterion: "Testing depth", weight: 0.1 },
      { criterion: "Timeline realism & wave plan", weight: 0.1 },
      { criterion: "Communication & stakeholder plan", weight: 0.1 },
    ],
    recommendedProviders: [
      "openrouter",
      "google-ai-studio",
      "mistral-la-plateforme",
      "groq",
      "sambanova",
    ],
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/** Look up a domain pack by id. Returns undefined if not found. */
export function getDomainPack(packId: string): DomainPackConfig | undefined {
  return DOMAIN_PACKS.find((p) => p.packId === packId);
}

/**
 * Coerce any value (string, array, nested object) into a flat lowercase
 * text blob suitable for keyword matching.
 */
function asText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(asText).join(" ");
  if (typeof v === "object") return Object.values(v).map(asText).join(" ");
  return String(v);
}

/** Domain detection keyword rules. Highest-scoring match wins. */
const DETECTION_RULES: { packId: string; keywords: string[] }[] = [
  {
    packId: "fintech",
    keywords: [
      "fintech",
      "payment",
      "payments",
      "pci",
      "stripe",
      "plaid",
      "kyc",
      "aml",
      "ledger",
      "banking",
      "transaction",
      "wallet",
      "checkout",
      "ach",
      "cardholder",
      "issuer",
      "acquirer",
    ],
  },
  {
    packId: "healthcare",
    keywords: [
      "healthcare",
      "hipaa",
      "phi",
      "patient",
      "clinical",
      "ehr",
      "fhir",
      "medical",
      "hospital",
      "telehealth",
      "telemedicine",
      "bedrock-clinical",
      "epic",
      "cerner",
    ],
  },
  {
    packId: "enterprise-workflow",
    keywords: [
      "enterprise workflow",
      "internal tool",
      "internal ops",
      "rbac",
      "sso",
      "saml",
      "bpm",
      "governance",
      "cab",
      "change advisory",
      "back office",
      "workflow automation",
    ],
  },
  {
    packId: "developer-tools",
    keywords: [
      "sdk",
      "developer tool",
      "devtool",
      "cli",
      "framework",
      "library",
      "openapi",
      "webhook",
      "ide plugin",
      "api platform",
      "developer platform",
    ],
  },
  {
    packId: "consumer-app",
    keywords: [
      "consumer app",
      "mobile app",
      "b2c",
      "growth",
      "retention",
      "onboarding",
      "subscription",
      "marketplace",
      "social app",
      "ios",
      "android",
      "app store",
    ],
  },
  {
    packId: "analytics",
    keywords: [
      "analytics",
      "dashboard",
      "etl",
      "data warehouse",
      "bi",
      "business intelligence",
      "metrics",
      "reporting",
      "dbt",
      "snowflake",
      "bigquery",
      "looker",
      "tableau",
      "data pipeline",
      "semantic layer",
    ],
  },
  {
    packId: "ai-product",
    keywords: [
      "llm",
      "ai product",
      "ml",
      "machine learning",
      "rag",
      "embedding",
      "inference",
      "gpt",
      "fine-tune",
      "fine-tuning",
      "model serving",
      "prompt",
      "chatbot",
      "agent",
      "transformer",
    ],
  },
  {
    packId: "migration",
    keywords: [
      "migration",
      "legacy",
      "modernization",
      "lift and shift",
      "replatform",
      "refactor",
      "cutover",
      "rewriting",
      "mainframe",
      "monolith to",
      "cloud migration",
    ],
  },
];

/**
 * Infer the most likely domain pack from a context map. Inspects the
 * techStack, whatItIs, and description fields for keyword matches.
 * Returns the packId of the highest-scoring pack, or null if no keywords
 * matched any pack.
 */
export function detectDomain(contextMap: Record<string, unknown>): string | null {
  const haystack = asText({
    techStack: contextMap.techStack,
    whatItIs: contextMap.whatItIs,
    description: contextMap.description,
  }).toLowerCase();

  if (!haystack.trim()) return null;

  let best: { packId: string; score: number } | null = null;
  for (const rule of DETECTION_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (haystack.includes(kw)) score += 1;
    }
    if (score > 0 && (best === null || score > best.score)) {
      best = { packId: rule.packId, score };
    }
  }

  return best ? best.packId : null;
}
