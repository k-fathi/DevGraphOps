import type { EvidenceSnippet } from "@/lib/repositoryParser";

export type EvidenceSelection = { path: string; title: string; relationship?: string };
export type EvidenceToken = { text: string; kind?: "comment" | "string" | "property" | "keyword" | "number" };

export function createEvidenceSelection(path: string | undefined, title: string, relationship?: string): EvidenceSelection | null {
  return path ? { path, title, relationship } : null;
}

export function selectNodeEvidence(evidence: string | undefined, label: string): EvidenceSelection | null {
  return createEvidenceSelection(evidence, label);
}

export function selectRelationshipEvidence(evidence: string | undefined, source: string, target: string, label: string): EvidenceSelection | null {
  return createEvidenceSelection(evidence, `${source} → ${target}`, label);
}

export function tokenizeEvidenceLine(line: string, language: EvidenceSnippet["language"]): EvidenceToken[] {
  const pattern = language === "terraform"
    ? /(#.*$)|("(?:\\.|[^"\\])*")|(\b(?:resource|data|module|variable|output|provider|locals|true|false|null)\b)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w-]*\s*=)/g
    : language === "yaml"
      ? /(#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(^\s*[\w.-]+(?=\s*:))|(\b(?:true|false|null)\b)|(\b\d+(?:\.\d+)?\b)/g
      : language === "docker"
        ? /(#.*$)|(\b(?:FROM|RUN|COPY|WORKDIR|EXPOSE|CMD|ENTRYPOINT|ARG|ENV|AS)\b)|("(?:\\.|[^"\\])*")/g
        : /(#.*$)/g;
  const tokens: EvidenceToken[] = [];
  let cursor = 0;

  for (const match of Array.from(line.matchAll(pattern))) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push({ text: line.slice(cursor, index) });
    const kind = match[1] ? "comment" : match[2] ? "string" : match[3] ? "property" : match[4] ? "keyword" : match[5] ? "number" : undefined;
    tokens.push({ text: match[0], kind });
    cursor = index + match[0].length;
  }
  if (cursor < line.length) tokens.push({ text: line.slice(cursor) });
  return tokens.length ? tokens : [{ text: line }];
}
