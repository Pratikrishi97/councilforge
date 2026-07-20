/**
 * Document diffing utilities — section-aware + line-level.
 * Used by the "living document" version comparison feature.
 */
import { diffLines, diffWordsWithSpace } from "diff";

export interface DocSection {
  heading: string;
  level: number; // 1, 2, 3...
  /** Raw markdown body of the section (heading line + content until next heading of same/higher level). */
  body: string;
}

export interface SectionDiff {
  heading: string;
  status: "added" | "removed" | "changed" | "unchanged";
  /** Line-level diff fragments for rendering. */
  lines: { type: "added" | "removed" | "unchanged"; value: string }[];
}

export interface DocDiffResult {
  sections: SectionDiff[];
  summary: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
  };
  /** Per-section line-diff of the full documents (for a flat view). */
  fullLineDiff: { type: "added" | "removed" | "unchanged"; value: string }[];
}

/** Split a markdown document into top-level sections by H1/H2 headings. */
export function splitSections(markdown: string): DocSection[] {
  const lines = markdown.split("\n");
  const sections: DocSection[] = [];
  let current: DocSection | null = null;

  const pushCurrent = () => {
    if (current && current.body.trim()) {
      sections.push(current);
    }
  };

  for (const line of lines) {
    const m = line.match(/^(#{1,4})\s+(.*)$/);
    if (m) {
      const level = m[1].length;
      // New top-level section (H1 or H2). H3+ belong to the current section.
      if (level <= 2) {
        pushCurrent();
        current = { heading: m[2].trim(), level, body: line };
      } else if (current) {
        current.body += "\n" + line;
      } else {
        current = { heading: m[2].trim(), level, body: line };
      }
    } else if (current) {
      current.body += "\n" + line;
    } else {
      // preamble before any heading
      if (line.trim()) {
        current = { heading: "(preamble)", level: 0, body: line };
      }
    }
  }
  pushCurrent();
  return sections;
}

/** Compute a section-aware + line-level diff between two markdown documents. */
export function diffDocuments(
  oldDoc: string,
  newDoc: string,
): DocDiffResult {
  const oldSections = splitSections(oldDoc ?? "");
  const newSections = splitSections(newDoc ?? "");

  const oldMap = new Map(oldSections.map((s) => [normalizeHeading(s.heading), s]));
  const newMap = new Map(newSections.map((s) => [normalizeHeading(s.heading), s]));

  const orderedHeadings: string[] = [];
  const seen = new Set<string>();
  for (const s of newSections) {
    const k = normalizeHeading(s.heading);
    if (!seen.has(k)) {
      orderedHeadings.push(k);
      seen.add(k);
    }
  }
  for (const s of oldSections) {
    const k = normalizeHeading(s.heading);
    if (!seen.has(k)) {
      orderedHeadings.push(k);
      seen.add(k);
    }
  }

  const sections: SectionDiff[] = [];
  const summary = { added: 0, removed: 0, changed: 0, unchanged: 0 };

  for (const key of orderedHeadings) {
    const oldS = oldMap.get(key);
    const newS = newMap.get(key);
    let status: SectionDiff["status"];
    let lines: SectionDiff["lines"] = [];

    if (!oldS && newS) {
      status = "added";
      summary.added++;
      lines = toLineFragments(diffLines("", newS.body));
    } else if (oldS && !newS) {
      status = "removed";
      summary.removed++;
      lines = toLineFragments(diffLines(oldS.body, ""));
    } else if (oldS && newS) {
      if (oldS.body.trim() === newS.body.trim()) {
        status = "unchanged";
        summary.unchanged++;
        lines = toLineFragments(diffLines(oldS.body, newS.body));
      } else {
        status = "changed";
        summary.changed++;
        // word-level diff for changed sections reads better
        lines = toWordFragments(diffWordsWithSpace(oldS.body, newS.body));
      }
    } else {
      continue;
    }

    sections.push({
      heading: newS?.heading ?? oldS?.heading ?? key,
      status,
      lines,
    });
  }

  const fullLineDiff = toLineFragments(diffLines(oldDoc ?? "", newDoc ?? ""));

  return { sections, summary, fullLineDiff };
}

function normalizeHeading(h: string): string {
  return h.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function toLineFragments(parts: { added?: boolean; removed?: boolean; value: string }[]) {
  return parts.flatMap((p) =>
    p.value
      .split("\n")
      .filter((l) => l.length > 0)
      .map((l) => ({
        type: p.added ? "added" : p.removed ? "removed" : "unchanged",
        value: l,
      })),
  );
}

function toWordFragments(parts: { added?: boolean; removed?: boolean; value: string }[]) {
  // group word diff into lines for rendering; treat newlines as separators
  const out: { type: "added" | "removed" | "unchanged"; value: string }[] = [];
  let buf = "";
  let bufType: "added" | "removed" | "unchanged" | null = null;
  for (const p of parts) {
    const t: "added" | "removed" | "unchanged" = p.added
      ? "added"
      : p.removed
        ? "removed"
        : "unchanged";
    if (bufType === null) {
      bufType = t;
      buf = p.value;
    } else if (t === bufType) {
      buf += p.value;
    } else {
      if (buf.trim()) out.push({ type: bufType, value: buf });
      bufType = t;
      buf = p.value;
    }
  }
  if (buf.trim()) out.push({ type: bufType!, value: buf });
  return out;
}
