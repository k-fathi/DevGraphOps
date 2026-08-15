/**
 * Repogram repository intelligence: public GitHub, GitLab, and Bitbucket repositories are
 * normalized into one model; selected YAML and Terraform files add concrete deployment stages and resource links.
 */
import { parseAllDocuments } from "yaml";

export type RepositoryProvider = "github" | "gitlab" | "bitbucket";
export type ArchitectureDomain = "user" | "pipeline" | "infrastructure" | "cluster";
export type RelationKind = "traffic" | "deployment" | "observability" | "dependency";

export type RepositoryIdentity = {
  provider: RepositoryProvider;
  owner: string;
  repo: string;
  branch: string;
  url: string;
  fetchRef?: string;
};

export type RepositorySignals = {
  githubActions: boolean;
  gitlabCi: boolean;
  bitbucketPipelines: boolean;
  jenkins: boolean;
  sonarQube: boolean;
  nexus: boolean;
  terraform: boolean;
  ansible: boolean;
  aws: boolean;
  route53: boolean;
  kubernetes: boolean;
  argoCd: boolean;
  nginx: boolean;
  docker: boolean;
  dockerHub: boolean;
  dockerCompose: boolean;
  react: boolean;
  postgres: boolean;
  mongodb: boolean;
  prometheus: boolean;
  grafana: boolean;
};

export type ExtractedComponent = {
  id: string;
  label: string;
  icon: string;
  domain: ArchitectureDomain;
  evidence?: string;
};

export type ArchitectureRelation = {
  id: string;
  source: string;
  target: string;
  label: string;
  kind: RelationKind;
  evidence?: string;
};

export type RepositoryAnalysis = {
  repository: RepositoryIdentity;
  signals: RepositorySignals;
  fileCount: number;
  detectedFiles: string[];
  components: ExtractedComponent[];
  relations: ArchitectureRelation[];
  isPreview?: boolean;
};

type JsonRecord = Record<string, unknown>;
type RepositoryDescriptor = { branch: string; url: string; paths: string[]; fetchRef?: string };
type ContentFile = { path: string; content: string };
type TerraformBlock = { key: string; id: string; body: string; path: string; label: string; icon: string };
type KubernetesResource = { id: string; kind: string; name: string; source: string; data: JsonRecord };

// Conservative limits keep public, unauthenticated provider APIs responsive while still surfacing core deployment evidence.
const MAX_TREE_ENTRIES = 800;
const MAX_CONFIG_FILES = 16;
const MAX_FILE_BYTES = 160_000;
const providerHeaders = { "User-Agent": "Repogram/1.0 (public repository analysis)" };

const emptySignals = (): RepositorySignals => ({
  githubActions: false,
  gitlabCi: false,
  bitbucketPipelines: false,
  jenkins: false,
  sonarQube: false,
  nexus: false,
  terraform: false,
  ansible: false,
  aws: false,
  route53: false,
  kubernetes: false,
  argoCd: false,
  nginx: false,
  docker: false,
  dockerHub: false,
  dockerCompose: false,
  react: false,
  postgres: false,
  mongodb: false,
  prometheus: false,
  grafana: false,
});

function asRecord(value: unknown): JsonRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as JsonRecord) : undefined;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function referencedNames(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => typeof item === "string" ? [item] : [asString(asRecord(item)?.job)]).filter(Boolean);
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function encodedPath(path: string) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function decodeContent(content: string) {
  try {
    return atob(content.replace(/\s/g, ""));
  } catch {
    return "";
  }
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function uniqueRelations(items: ArchitectureRelation[]) {
  return Array.from(new Map(items.map((item) => [`${item.source}-${item.target}-${item.label}`, item])).values());
}

function parseUrl(rawUrl: string) {
  const normalized = rawUrl.trim().replace(/^git\+/, "").replace(/\.git\/?$/, "");
  const ssh = normalized.match(/^git@([^:]+):(.+)$/i);
  const safeUrl = ssh ? `https://${ssh[1]}/${ssh[2]}` : normalized;
  try {
    return new URL(safeUrl.startsWith("http") ? safeUrl : `https://${safeUrl}`);
  } catch {
    throw new Error("Enter a public GitHub, GitLab, or Bitbucket repository URL.");
  }
}

export function parsePublicRepositoryUrl(rawUrl: string): Omit<RepositoryIdentity, "branch"> {
  const url = parseUrl(rawUrl);
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (host === "github.com") {
    const [owner, repo] = segments;
    if (!owner || !repo) throw new Error("Use the GitHub format: github.com/owner/repository.");
    return { provider: "github", owner, repo, url: `https://github.com/${owner}/${repo}` };
  }

  if (host === "gitlab.com") {
    const gitlabSegments = segments.slice(0, segments.indexOf("-") > -1 ? segments.indexOf("-") : segments.length);
    const repo = gitlabSegments.at(-1);
    const owner = gitlabSegments.slice(0, -1).join("/");
    if (!owner || !repo) throw new Error("Use the GitLab format: gitlab.com/group/repository.");
    return { provider: "gitlab", owner, repo, url: `https://gitlab.com/${owner}/${repo}` };
  }

  if (host === "bitbucket.org") {
    const [owner, repo] = segments;
    if (!owner || !repo) throw new Error("Use the Bitbucket format: bitbucket.org/workspace/repository.");
    return { provider: "bitbucket", owner, repo, url: `https://bitbucket.org/${owner}/${repo}` };
  }

  throw new Error("Unsupported provider. Use a public GitHub, GitLab, or Bitbucket repository.");
}

function deriveSignals(paths: string[]): { signals: RepositorySignals; detectedFiles: string[] } {
  const lower = paths.map((path) => path.toLowerCase());
  const signals = emptySignals();
  signals.githubActions = lower.some((path) => path.startsWith(".github/workflows/"));
  signals.gitlabCi = lower.some((path) => path === ".gitlab-ci.yml" || path.includes("gitlab-ci"));
  signals.bitbucketPipelines = lower.some((path) => path === "bitbucket-pipelines.yml");
  signals.jenkins = lower.some((path) => /(^|\/)jenkinsfile$|jenkins/.test(path));
  signals.sonarQube = lower.some((path) => /sonar(project|\.|-)/.test(path));
  signals.nexus = lower.some((path) => /(nexus|nexus3|sonatype)/.test(path));
  signals.terraform = lower.some((path) => path.endsWith(".tf") || path.includes("terraform/"));
  signals.ansible = lower.some((path) => /(ansible|playbooks?\/|roles\/)/.test(path));
  signals.aws = lower.some((path) => /(aws|cloudformation|route53|lambda|cdk)/.test(path));
  signals.route53 = lower.some((path) => /(route53|route_53|aws_route53)/.test(path));
  signals.kubernetes = lower.some((path) => /(k8s|kubernetes|helm|chart\.yaml|values\.ya?ml|deployment\.ya?ml|service\.ya?ml|ingress\.ya?ml)/.test(path));
  signals.argoCd = lower.some((path) => /(argocd|argo-cd|application\.ya?ml)/.test(path));
  signals.nginx = lower.some((path) => /(nginx|ingress-nginx)/.test(path));
  signals.docker = lower.some((path) => /(^|\/)(dockerfile|docker-compose[^/]*\.ya?ml)$/.test(path));
  signals.dockerCompose = lower.some((path) => /(^|\/)docker-compose[^/]*\.ya?ml$/.test(path));
  signals.react = lower.some((path) => /(src\/app\.(tsx|jsx)|vite\.config|next\.config|react)/.test(path));
  signals.postgres = lower.some((path) => /(postgres|postgresql|pgdata)/.test(path));
  signals.mongodb = lower.some((path) => /(mongodb|mongo)/.test(path));
  signals.prometheus = lower.some((path) => /(prometheus|prometheus\.ya?ml|prometheus-operator)/.test(path));
  signals.grafana = lower.some((path) => /(grafana|dashboards?\/.*\.json)/.test(path));

  const detected = paths.filter((path) => /\.github\/workflows|\.gitlab-ci|bitbucket-pipelines|jenkinsfile|\.tf$|dockerfile|docker-compose|kubernetes|k8s|helm|argocd|prometheus|grafana/i.test(path));
  return { signals, detectedFiles: detected.slice(0, 10) };
}

function isConfigCandidate(path: string) {
  const lower = path.toLowerCase();
  return (
    lower.endsWith(".tf") ||
    lower.endsWith(".tfvars") ||
    lower.endsWith(".yaml") ||
    lower.endsWith(".yml") ||
    /(^|\/)dockerfile$/.test(lower) ||
    /(^|\/)jenkinsfile$/.test(lower) ||
    lower === ".gitlab-ci.yml" ||
    lower === "bitbucket-pipelines.yml"
  );
}

export function candidatePaths(paths: string[]) {
  const candidates = paths.filter(isConfigCandidate).sort((a, b) => a.localeCompare(b));
  const kubernetesPriority = (path: string) => {
    const lower = path.toLowerCase();
    return [
      /(kubernetes-manifests|all-in-one|manifests?\.ya?ml)$/.test(lower) ? 0 : 1,
      /(ingress|gateway|frontend)/.test(lower) ? 0 : 1,
      /(service|deployment|statefulset|daemonset|pod)/.test(lower) ? 0 : 1,
      /(release|manifest|kubernetes-manifests|k8s|kubernetes)/.test(lower) ? 0 : 1,
      lower,
    ].join(":");
  };
  const categories: Array<{ paths: string[]; limit: number }> = [
    { paths: candidates.filter((path) => /docker-compose|(^|\/)dockerfile$/i.test(path)), limit: 3 },
    { paths: candidates.filter((path) => /(^|\/)jenkinsfile$|\.github\/workflows|\.gitlab-ci|bitbucket-pipelines/i.test(path)), limit: 3 },
    { paths: candidates.filter((path) => /\.tf$/i.test(path)), limit: 3 },
    { paths: candidates.filter((path) => /(deployment|service|ingress|statefulset|daemonset|helm|chart\.yaml|values\.ya?ml|k8s|kubernetes|manifest)/i.test(path)).sort((a, b) => kubernetesPriority(a).localeCompare(kubernetesPriority(b))), limit: 5 },
    { paths: candidates.filter((path) => /\.ya?ml$/i.test(path)), limit: 3 },
  ];
  const selected: string[] = [];
  const add = (path: string) => {
    if (selected.length < MAX_CONFIG_FILES && !selected.includes(path)) selected.push(path);
  };
  for (const category of categories) category.paths.slice(0, category.limit).forEach(add);
  candidates.forEach(add);
  return selected;
}

function prioritizeRepositoryPaths(paths: string[]) {
  const selectedConfig = candidatePaths(paths);
  const remaining = paths.filter((path) => !selectedConfig.includes(path)).slice(0, Math.max(0, MAX_TREE_ENTRIES - selectedConfig.length));
  return [...selectedConfig, ...remaining];
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const response = await fetch(url, { headers: { ...providerHeaders, ...headers } });
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()) as T;
}

async function getGitHubRepository(identity: Omit<RepositoryIdentity, "branch">): Promise<RepositoryDescriptor> {
  const headers = { Accept: "application/vnd.github+json" };
  const repository = await fetchJson<{ default_branch: string; html_url: string }>(`https://api.github.com/repos/${identity.owner}/${identity.repo}`, headers);
  const tree = await fetchJson<{ tree?: Array<{ path: string; type: string }> }>(`https://api.github.com/repos/${identity.owner}/${identity.repo}/git/trees/${encodeURIComponent(repository.default_branch)}?recursive=1`, headers);
  return { branch: repository.default_branch, url: repository.html_url || identity.url, paths: prioritizeRepositoryPaths((tree.tree ?? []).filter((entry) => entry.type === "blob").map((entry) => entry.path)) };
}

async function getGitLabRepository(identity: Omit<RepositoryIdentity, "branch">): Promise<RepositoryDescriptor> {
  const project = await fetchJson<{ id: number; default_branch: string; web_url: string }>(`https://gitlab.com/api/v4/projects/${encodeURIComponent(`${identity.owner}/${identity.repo}`)}`);
  const paths: string[] = [];
  let page = 1;
  while (page && paths.length < MAX_TREE_ENTRIES) {
    const response = await fetch(`https://gitlab.com/api/v4/projects/${project.id}/repository/tree?recursive=true&per_page=100&page=${page}&ref=${encodeURIComponent(project.default_branch)}`, { headers: providerHeaders });
    if (!response.ok) break;
    const entries = (await response.json()) as Array<{ path: string; type: string }>;
    paths.push(...entries.filter((entry) => entry.type === "blob").map((entry) => entry.path));
    const nextPage = response.headers.get("x-next-page");
    page = nextPage ? Number(nextPage) : 0;
  }
  return { branch: project.default_branch, url: project.web_url || identity.url, paths: prioritizeRepositoryPaths(paths) };
}

async function getBitbucketRepository(identity: Omit<RepositoryIdentity, "branch">): Promise<RepositoryDescriptor> {
  const bitbucketApi = "https://bitbucket.org/api/2.0";
  const repository = await fetchJson<{ mainbranch?: { name?: string }; links?: { html?: { href?: string } } }>(`${bitbucketApi}/repositories/${identity.owner}/${identity.repo}`);
  const branch = repository.mainbranch?.name || "main";
  const rootResponse = await fetch(`${bitbucketApi}/repositories/${identity.owner}/${identity.repo}/src/?pagelen=100`, { headers: providerHeaders });
  if (!rootResponse.ok) throw new Error(String(rootResponse.status));
  const fetchRef = rootResponse.url.match(/\/src\/([^/]+)/)?.[1] || encodeURIComponent(branch);
  const paths: string[] = [];
  const pending = [""];
  const seenDirectories = new Set<string>();

  while (pending.length && paths.length < MAX_TREE_ENTRIES) {
    const directory = pending.shift()!;
    if (seenDirectories.has(directory)) continue;
    seenDirectories.add(directory);
    let next = `${bitbucketApi}/repositories/${identity.owner}/${identity.repo}/src/${fetchRef}/${directory ? `${encodedPath(directory)}/` : ""}?pagelen=100`;

    while (next && paths.length < MAX_TREE_ENTRIES) {
      const response = await fetch(next, { headers: providerHeaders });
      if (!response.ok) break;
      const page = (await response.json()) as { values?: Array<{ path?: string; type?: string }>; next?: string };
      for (const entry of page.values ?? []) {
        if (!entry.path) continue;
        if (entry.type === "commit_directory") pending.push(entry.path);
        if (entry.type === "commit_file") paths.push(entry.path);
      }
      next = page.next ?? "";
    }
  }
  return { branch, url: repository.links?.html?.href || identity.url, paths: prioritizeRepositoryPaths(paths), fetchRef };
}

async function fetchConfigFile(identity: RepositoryIdentity, path: string): Promise<ContentFile | undefined> {
  try {
    if (identity.provider === "github") {
      const response = await fetch(`https://api.github.com/repos/${identity.owner}/${identity.repo}/contents/${encodedPath(path)}?ref=${encodeURIComponent(identity.branch)}`, { headers: { ...providerHeaders, Accept: "application/vnd.github+json" } });
      if (!response.ok) return undefined;
      const file = (await response.json()) as { content?: string; size?: number };
      if (!file.content || (file.size ?? 0) > MAX_FILE_BYTES) return undefined;
      return { path, content: decodeContent(file.content).slice(0, MAX_FILE_BYTES) };
    }

    const base = identity.provider === "gitlab"
      ? `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${identity.owner}/${identity.repo}`)}/repository/files/${encodeURIComponent(path)}/raw?ref=${encodeURIComponent(identity.branch)}`
      : `https://bitbucket.org/api/2.0/repositories/${identity.owner}/${identity.repo}/src/${identity.fetchRef ?? encodeURIComponent(identity.branch)}/${encodedPath(path)}`;
    const response = await fetch(base, { headers: providerHeaders });
    if (!response.ok) return undefined;
    const size = Number(response.headers.get("content-length") || 0);
    if (size > MAX_FILE_BYTES) return undefined;
    return { path, content: (await response.text()).slice(0, MAX_FILE_BYTES) };
  } catch {
    return undefined;
  }
}

function terraformIcon(type: string) {
  if (/route53|dns/i.test(type)) return "Route 53";
  if (/load_balancer|\balb\b|\belb\b|aws_lb/i.test(type)) return "Load Balancer";
  if (/aws|ec2|lambda|s3/i.test(type)) return "AWS";
  if (/kubernetes/i.test(type)) return "Kubernetes";
  return "Terraform";
}

function terraformLabel(type: string, name: string) {
  return `${type.replace(/[_-]/g, " ")}: ${name}`;
}

export function parseTerraform(files: ContentFile[]) {
  const components: ExtractedComponent[] = [];
  const blocks: TerraformBlock[] = [];
  const relations: ArchitectureRelation[] = [];
  const declaration = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([\s\S]*?)^\}/gm;

  for (const file of files.filter((entry) => entry.path.toLowerCase().endsWith(".tf"))) {
    for (const match of Array.from(file.content.matchAll(declaration))) {
      const [, type, name, body] = match;
      const key = `${type}.${name}`;
      const id = `tf-${slug(file.path)}-${slug(type)}-${slug(name)}`;
      const block = { key, id, body, path: file.path, label: terraformLabel(type, name), icon: terraformIcon(type) };
      blocks.push(block);
      components.push({ id, label: block.label, icon: block.icon, domain: "infrastructure", evidence: file.path });
    }
  }

  const lookup = new Map(blocks.map((block) => [block.key, block]));
  for (const block of blocks) {
    const references = Array.from(block.body.matchAll(/\b([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\b/g)).map((match) => match[1]);
    for (const reference of Array.from(new Set(references))) {
      const target = lookup.get(reference);
      if (target && target.id !== block.id) {
        relations.push({ id: `tf-${target.id}-${block.id}`, source: target.id, target: block.id, label: "depends_on", kind: "dependency", evidence: block.path });
      }
    }
  }
  return { components, relations };
}

function parsePipelineDetailFiles(files: ContentFile[]) {
  const components: ExtractedComponent[] = [];
  const relations: ArchitectureRelation[] = [];
  for (const file of files) {
    const lowerPath = file.path.toLowerCase();
    if (/(^|\/)jenkinsfile$/.test(lowerPath)) {
      const stages = Array.from(file.content.matchAll(/stage\s*\(\s*["']([^"']+)["']/g)).map((match) => match[1]);
      const stageNodes = stages.slice(0, 8).map((stage) => ({ id: `jenkins-stage-${slug(stage)}`, label: `Jenkins: ${stage}`, icon: "Jenkins", domain: "pipeline" as const, evidence: file.path }));
      components.push(...stageNodes);
      stageNodes.slice(0, -1).forEach((stage, index) => relations.push({ id: `${stage.id}-${stageNodes[index + 1].id}`, source: stage.id, target: stageNodes[index + 1].id, label: "then", kind: "deployment", evidence: file.path }));
    }
    if (/(^|\/)dockerfile$/.test(lowerPath)) {
      const stages = Array.from(file.content.matchAll(/^\s*FROM\s+([^\s]+)(?:\s+AS\s+([^\s]+))?/gim));
      const stageNodes = stages.slice(0, 6).map((match, index) => {
        const label = match[2] ? `Docker: ${match[2]}` : `Docker base: ${match[1]}`;
        return { id: `docker-stage-${slug(file.path)}-${index}`, label, icon: "Docker", domain: "pipeline" as const, evidence: file.path };
      });
      components.push(...stageNodes);
      stageNodes.slice(0, -1).forEach((stage, index) => relations.push({ id: `${stage.id}-${stageNodes[index + 1].id}`, source: stage.id, target: stageNodes[index + 1].id, label: "builds", kind: "deployment", evidence: file.path }));
    }
  }
  return { components: uniqueById(components), relations: uniqueRelations(relations) };
}

function nestedValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(nestedValues);
  const record = asRecord(value);
  if (!record) return [];
  return [record, ...Object.values(record).flatMap(nestedValues)];
}

export function parseKubernetes(files: ContentFile[]) {
  const components: ExtractedComponent[] = [];
  const relations: ArchitectureRelation[] = [];
  const resources: KubernetesResource[] = [];
  const pipelineStages: ExtractedComponent[] = [];
  const pipelineRelations: ArchitectureRelation[] = [];
  const containerPattern = /docker\.io|hub\.docker\.com|registry-1\.docker\.io/i;

  for (const file of files.filter((entry) => /\.ya?ml$/i.test(entry.path))) {
    let values: unknown[] = [];
    try {
      const documents = parseAllDocuments(file.content);
      if (documents.some((document) => document.errors.length > 0)) continue;
      values = documents.flatMap((document) => nestedValues(document.toJS({ maxAliasCount: 20 })));
    } catch {
      continue;
    }

    const lowerPath = file.path.toLowerCase();
    if (lowerPath === ".gitlab-ci.yml") {
      for (const value of values) {
        const record = asRecord(value);
        if (!record) continue;
        for (const [name, candidate] of Object.entries(record)) {
          const job = asRecord(candidate);
          const stage = asString(job?.stage);
          if (stage) {
            const id = `gitlab-stage-${slug(name)}`;
            pipelineStages.push({ id, label: `${stage}: ${name}`, icon: "GitLab", domain: "pipeline", evidence: file.path });
            referencedNames(job?.needs).forEach((dependency) => pipelineRelations.push({ id: `gitlab-needs-${slug(dependency)}-${slug(name)}`, source: `gitlab-stage-${slug(dependency)}`, target: id, label: "needs", kind: "deployment", evidence: file.path }));
          }
        }
      }
    }
    if (lowerPath.startsWith(".github/workflows/")) {
      const root = values.map((value) => asRecord(value)).find((value): value is JsonRecord => Boolean(value));
      const jobs = asRecord(root?.["jobs"]);
      for (const [name, candidate] of Object.entries(jobs ?? {})) {
        const id = `github-job-${slug(name)}`;
        pipelineStages.push({ id, label: `Job: ${name}`, icon: "GitHub Actions", domain: "pipeline", evidence: file.path });
        referencedNames(asRecord(candidate)?.needs).forEach((dependency) => pipelineRelations.push({ id: `github-needs-${slug(dependency)}-${slug(name)}`, source: `github-job-${slug(dependency)}`, target: id, label: "needs", kind: "deployment", evidence: file.path }));
      }
    }
    if (/docker-compose/i.test(lowerPath)) {
      const root = values.map((value) => asRecord(value)).find((value): value is JsonRecord => Boolean(value));
      const services = asRecord(root?.["services"]);
      for (const [serviceName, serviceDefinition] of Object.entries(services ?? {}).slice(0, 6)) {
        const id = `compose-${slug(serviceName)}`;
        pipelineStages.push({ id, label: `Compose: ${serviceName}`, icon: "Docker Compose", domain: "pipeline", evidence: file.path });
        referencedNames(asRecord(serviceDefinition)?.depends_on).forEach((dependency) => pipelineRelations.push({ id: `compose-depends-${slug(dependency)}-${slug(serviceName)}`, source: `compose-${slug(dependency)}`, target: id, label: "depends_on", kind: "deployment", evidence: file.path }));
      }
    }

    for (const value of values) {
      const record = asRecord(value);
      if (!record) continue;
      const kind = asString(record?.kind);
      const metadata = asRecord(record?.metadata);
      const name = asString(metadata?.name);
      if (!kind || !name) continue;
      const normalizedKind = kind.toLowerCase();
      if (!["ingress", "service", "deployment", "statefulset", "daemonset", "pod", "configmap", "secret", "persistentvolumeclaim"].includes(normalizedKind)) continue;
      const id = `k8s-${slug(kind)}-${slug(name)}-${slug(file.path)}`;
      resources.push({ id, kind, name, source: file.path, data: record });
      components.push({ id, label: `${kind}: ${name}`, icon: kind === "StatefulSet" ? "StatefulSet" : kind === "DaemonSet" ? "DaemonSet" : kind, domain: "cluster", evidence: file.path });
    }
  }

  const byKindAndName = new Map(resources.map((resource) => [`${resource.kind.toLowerCase()}:${resource.name}`, resource]));
  const workloadKinds = new Set(["deployment", "statefulset", "daemonset", "pod"]);
  for (const resource of resources) {
    const spec = asRecord(resource.data.spec);
    if (resource.kind.toLowerCase() === "ingress") {
      relations.push({ id: `ingress-public-entry-${resource.id}`, source: "user", target: resource.id, label: "Open application", kind: "traffic", evidence: resource.source });
      const rules = Array.isArray(spec?.rules) ? spec.rules : [];
      for (const rule of rules) {
        const http = asRecord(asRecord(rule)?.http);
        const paths = Array.isArray(http?.paths) ? http.paths : [];
        for (const path of paths) {
          const backend = asRecord(asRecord(path)?.backend);
          const service = asRecord(backend?.service);
          const serviceName = asString(service?.name);
          const target = byKindAndName.get(`service:${serviceName}`);
          if (target) relations.push({ id: `${resource.id}-${target.id}`, source: resource.id, target: target.id, label: "HTTPS", kind: "traffic", evidence: resource.source });
        }
      }
    }

    if (resource.kind.toLowerCase() === "service") {
      if (asString(spec?.type) === "LoadBalancer") {
        relations.push({ id: `service-public-entry-${resource.id}`, source: "user", target: resource.id, label: "Open application", kind: "traffic", evidence: resource.source });
      }
      const selector = asRecord(spec?.selector);
      if (selector) {
        for (const workload of resources.filter((candidate) => workloadKinds.has(candidate.kind.toLowerCase()))) {
          const template = asRecord(asRecord(workload.data.spec)?.template);
          const labels = asRecord(asRecord(template?.metadata)?.labels);
          const isMatch = labels && Object.entries(selector).every(([key, value]) => labels[key] === value);
          if (isMatch) relations.push({ id: `${resource.id}-${workload.id}`, source: resource.id, target: workload.id, label: "Selects", kind: "traffic", evidence: resource.source });
        }
      }
    }

    const references = nestedValues(resource.data)
      .flatMap((value) => {
        const record = asRecord(value);
        return record ? [asString(asRecord(record.configMapRef)?.name), asString(asRecord(record.secretRef)?.name)] : [];
      })
      .filter(Boolean);
    for (const reference of Array.from(new Set(references))) {
      const target = byKindAndName.get(`configmap:${reference}`) ?? byKindAndName.get(`secret:${reference}`);
      if (target) relations.push({ id: `${target.id}-${resource.id}`, source: target.id, target: resource.id, label: "config", kind: "dependency", evidence: resource.source });
    }
  }

  const dockerHubDetected = files.some((file) => containerPattern.test(file.content));
  return { components, relations, pipelineStages, pipelineRelations, dockerHubDetected };
}

function buildBaseComponents(): ExtractedComponent[] {
  // The End User is the conceptual origin of the declared traffic route. Every
  // service/tool node is added only by one of the file-content parsers below.
  return [{ id: "user", label: "End User", icon: "Users", domain: "user" }];
}

function classifyError(provider: RepositoryProvider, error: unknown) {
  const code = String(error);
  if (code.includes("404")) return "The repository was not found or is not public.";
  if (code.includes("403") || code.includes("429")) return `The public ${provider === "github" ? "GitHub" : provider === "gitlab" ? "GitLab" : "Bitbucket"} API is currently rate-limited or unavailable. Try again shortly.`;
  return "The public repository data could not be reached.";
}

export async function analyzePublicRepository(rawUrl: string): Promise<RepositoryAnalysis> {
  const parsed = parsePublicRepositoryUrl(rawUrl);
  let descriptor: RepositoryDescriptor;
  try {
    descriptor = parsed.provider === "github" ? await getGitHubRepository(parsed) : parsed.provider === "gitlab" ? await getGitLabRepository(parsed) : await getBitbucketRepository(parsed);
  } catch (error) {
    throw new Error(classifyError(parsed.provider, error));
  }

  const repository: RepositoryIdentity = { ...parsed, branch: descriptor.branch, url: descriptor.url, fetchRef: descriptor.fetchRef };
  const { signals, detectedFiles } = deriveSignals(descriptor.paths);
  const selectedPaths = candidatePaths(descriptor.paths);
  const contents = (await Promise.all(selectedPaths.map((path) => fetchConfigFile(repository, path)))).filter((file): file is ContentFile => Boolean(file));
  const terraform = parseTerraform(contents);
  const yaml = parseKubernetes(contents);
  const pipelineDetails = parsePipelineDetailFiles(contents);
  signals.dockerHub = yaml.dockerHubDetected;
  signals.kubernetes ||= yaml.components.some((component) => component.icon !== "Docker Compose");

  const components = uniqueById([...buildBaseComponents(), ...pipelineDetails.components.slice(0, 8), ...yaml.pipelineStages.slice(0, 8), ...terraform.components.slice(0, 10), ...yaml.components.slice(0, 14)]);
  const relations = uniqueRelations([...pipelineDetails.relations, ...yaml.pipelineRelations, ...terraform.relations, ...yaml.relations]);

  return {
    repository,
    signals,
    fileCount: descriptor.paths.length,
    detectedFiles: Array.from(new Set([...detectedFiles, ...contents.map((file) => file.path)])).slice(0, 10),
    components,
    relations,
  };
}
