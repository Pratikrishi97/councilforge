/**
 * JSON extraction + repair utilities (used by the pipeline after a routed
 * LLM call returns content). The actual LLM execution lives in
 * provider-router.ts so each call can be routed to the right provider.
 */

export function extractJson<T = unknown>(raw: string): T {
  let text = raw.trim();
  // strip code fences
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  // Remove stray control characters that break JSON.parse (newlines inside strings, etc.)
  text = sanitizeControlChars(text);

  // Try a direct parse first.
  try {
    return JSON.parse(text) as T;
  } catch {
    /* fall through to extraction */
  }

  // Find the outermost balanced object by scanning brace depth.
  const start = text.indexOf("{");
  if (start === -1) {
    throw new Error("No JSON object found in model response");
  }
  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) {
    // truncated — attempt to repair by closing open strings + structures.
    let repaired = text.slice(start);
    if (inString) {
      repaired += '"';
    }
    const openArr = (repaired.match(/\[/g) || []).length;
    const closeArr = (repaired.match(/\]/g) || []).length;
    repaired += "]".repeat(Math.max(0, openArr - closeArr));
    const openObj = (repaired.match(/\{/g) || []).length;
    const closeObj = (repaired.match(/\}/g) || []).length;
    repaired += "}".repeat(Math.max(0, openObj - closeObj));
    repaired = repaired.replace(/,\s*([}\]])/g, "$1");
    text = repaired;
  } else {
    text = text.slice(start, end + 1);
  }

  // Conservative missing-comma repair (after } or ] before a value opener).
  text = text.replace(/([}\]])(\s*)(["{\[])/g, "$1$2,$3");

  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new Error(
      `Failed to parse JSON from model response: ${e instanceof Error ? e.message : "unknown"}`,
    );
  }
}

/** Escape literal newlines/tabs inside string values so JSON.parse succeeds. */
function sanitizeControlChars(text: string): string {
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      out += ch;
      escape = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString) {
      if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else out += ch;
    } else {
      out += ch;
    }
  }
  return out;
}
