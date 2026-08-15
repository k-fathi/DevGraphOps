/**
 * ArchTrace repository intelligence: public GitHub, GitLab, and Bitbucket repositories are
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

const MAX_TREE_ENTRIES = 700;
const MAX_CONFIG_FILES = 22;
const MAX_FILE_BYTES = 160_000;

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

function candidatePaths(paths: string[]) {
  return paths
    .filter(isConfigCandidate)
    .sort((a, b) => {
      const aPriority = /docker-compose|dockerfile|jenkinsfile|\.gitlab-ci|bitbucket-pipelines|\.tf$/i.test(a) ? 0 : 1;
      const bPriority = /docker-compose|dockerfile|jenkinsfile|\.gitlab-ci|bitbucket-pipelines|\.tf$/i.test(b) ? 0 : 1;
      return aPriority - bPriority || a.localeCompare(b);
    })
    .slice(0, MAX_CONFIG_FILES);
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()) as T;
}

async function getGitHubRepository(identity: Omit<RepositoryIdentity, "branch">): Promise<RepositoryDescriptor> {
  const headers = { Accept: "application/vnd.github+json" };
  const repository = await fetchJson<{ default_branch: string; html_url: string }>(`https://api.github.com/repos/${identity.owner}/${identity.repo}`, headers);
  const tree = await fetchJson<{ tree?: Array<{ path: string; type: string }> }>(`https://api.github.com/repos/${identity.owner}/${identity.repo}/git/trees/${encodeURIComponent(repository.default_branch)}?recursive=1`, headers);
  return { branch: repository.default_branch, url: repository.html_url || identity.url, paths: (tree.tree ?? []).filter((entry) => entry.type === "blob").map((entry) => entry.path).slice(0, MAX_TREE_ENTRIES) };
}

async function getGitLabRepository(identity: Omit<RepositoryIdentity, "branch">): Promise<RepositoryDescriptor> {
  const project = await fetchJson<{ id: number; default_branch: string; web_url: string }>(`https://gitlab.com/api/v4/projects/${encodeURIComponent(`${identity.owner}/${identity.repo}`)}`);
  const paths: string[] = [];
  let page = 1;
  while (page && paths.length < MAX_TREE_ENTRIES) {
    const response = await fetch(`https://gitlab.com/api/v4/projects/${project.id}/repository/tree?recursive=true&per_page=100&page=${page}&ref=${encodeURIComponent(project.default_branch)}`);
    if (!response.ok) break;
    const entries = (await response.json()) as Array<{ path: string; type: string }>;
    paths.push(...entries.filter((entry) => entry.type === "blob").map((entry) => entry.path));
    const nextPage = response.headers.get("x-next-page");
    page = nextPage ? Number(nextPage) : 0;
  }
  return { branch: project.default_branch, url: project.web_url || identity.url, paths: paths.slice(0, MAX_TREE_ENTRIES) };
}

async function getBitbucketRepository(identity: Omit<RepositoryIdentity, "branch">): Promise<RepositoryDescriptor> {
  const repository = await fetchJson<{ mainbranch?: { name?: string }; links?: { html?: { href?: string } } }>(`https://api.bitbucket.org/2.0/repositories/${identity.owner}/${identity.repo}`);
  const branch = repository.mainbranch?.name || "main";
  const rootResponse = await fetch(`https://api.bitbucket.org/2.0/repositories/${identity.owner}/${identity.repo}/src/?pagelen=100`);
  if (!rootResponse.ok) throw new Error(String(rootResponse.status));
  const fetchRef = rootResponse.url.match(/\/src\/([^/]+)/)?.[1] || encodeURIComponent(branch);
  const paths: string[] = [];
  const pending = [""];
  const seenDirectories = new Set<string>();

  while (pending.length && paths.length < MAX_TREE_ENTRIES) {
    const directory = pending.shift()!;
    if (seenDirectories.has(directory)) continue;
    seenDirectories.add(directory);
    let next = `https://api.bitbucket.org/2.0/repositories/${identity.owner}/${identity.repo}/src/${fetchRef}/${directory ? `${encodedPath(directory)}/` : ""}?pagelen=100`;

    while (next && paths.length < MAX_TREE_ENTRIES) {
      const response = await fetch(next);
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
  return { branch, url: repository.links?.html?.href || identity.url, paths: paths.slice(0, MAX_TREE_ENTRIES), fetchRef };
}

async function fetchConfigFile(identity: RepositoryIdentity, path: string): Promise<ContentFile | undefined> {
  try {
    if (identity.provider === "github") {
      const response = await fetch(`https://api.github.com/repos/${identity.owner}/${identity.repo}/contents/${encodedPath(path)}?ref=${encodeURIComponent(identity.branch)}`, { headers: { Accept: "application/vnd.github+json" } });
      if (!response.ok) return undefined;
      const file = (await response.json()) as { content?: string; size?: number };
      if (!file.content || (file.size ?? 0) > MAX_FILE_BYTES) return undefined;
      return { path, content: decodeContent(file.content).slice(0, MAX_FILE_BYTES) };
    }

    const base = identity.provider === "gitlab"
      ? `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${identity.owner}/${identity.repo}`)}/repository/files/${encodeURIComponent(path)}/raw?ref=${encodeURIComponent(identity.branch)}`
      : `https://api.bitbucket.org/2.0/repositories/${identity.owner}/${identity.repo}/src/${identity.fetchRef ?? encodeURIComponent(identity.branch)}/${encodedPath(path)}`;
    const response = await fetch(base);
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

function parseTerraform(files: ContentFile[]) {
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
  for (const file of files) {
    const lowerPath = file.path.toLowerCase();
    if (/(^|\/)jenkinsfile$/.test(lowerPath)) {
      const stages = Array.from(file.content.matchAll(/stage\s*\(\s*["']([^"']+)["']/g)).map((match) => match[1]);
      stages.slice(0, 8).forEach((stage) => components.push({ id: `jenkins-stage-${slug(stage)}`, label: `Jenkins: ${stage}`, icon: "Jenkins", domain: "pipeline", evidence: file.path }));
    }
    if (/(^|\/)dockerfile$/.test(lowerPath)) {
      const stages = Array.from(file.content.matchAll(/^\s*FROM\s+([^\s]+)(?:\s+AS\s+([^\s]+))?/gim));
      stages.slice(0, 6).forEach((match, index) => {
        const label = match[2] ? `Docker: ${match[2]}` : `Docker base: ${match[1]}`;
        components.push({ id: `docker-stage-${slug(file.path)}-${index}`, label, icon: "Docker", domain: "pipeline", evidence: file.path });
      });
    }
  }
  return uniqueById(components);
}

function nestedValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(nestedValues);
  const record = asRecord(value);
  if (!record) return [];
  return [record, ...Object.values(record).flatMap(nestedValues)];
}

function parseKubernetes(files: ContentFile[]) {
  const components: ExtractedComponent[] = [];
  const relations: ArchitectureRelation[] = [];
  const resources: KubernetesResource[] = [];
  const pipelineStages: ExtractedComponent[] = [];
  const containerPattern = /docker\.io|hub\.docker\.com|registry-1\.docker\.io/i;

  for (const file of files.filter((entry) => /\.ya?ml$/i.test(entry.path))) {
    let values: unknown[] = [];
    try {
      values = parseAllDocuments(file.content).flatMap((document) => nestedValues(document.toJS({ maxAliasCount: 20 })));
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
          if (stage) pipelineStages.push({ id: `gitlab-stage-${slug(name)}`, label: `${stage}: ${name}`, icon: "GitLab", domain: "pipeline", evidence: file.path });
        }
      }
    }
    if (lowerPath.startsWith(".github/workflows/")) {
      const root = values.map((value) => asRecord(value)).find((value): value is JsonRecord => Boolean(value));
      const jobs = asRecord(root?.["jobs"]);
      for (const [name] of Object.entries(jobs ?? {})) pipelineStages.push({ id: `github-job-${slug(name)}`, label: `Job: ${name}`, icon: "GitHub Actions", domain: "pipeline", evidence: file.path });
    }
    if (/docker-compose/i.test(lowerPath)) {
      const root = values.map((value) => asRecord(value)).find((value): value is JsonRecord => Boolean(value));
      const services = asRecord(root?.["services"]);
      for (const serviceName of Object.keys(services ?? {}).slice(0, 6)) pipelineStages.push({ id: `compose-${slug(serviceName)}`, label: `Compose: ${serviceName}`, icon: "Docker Compose", domain: "pipeline", evidence: file.path });
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
  return { components, relations, pipelineStages, dockerHubDetected };
}

function buildBaseComponents(repository: RepositoryIdentity, signals: RepositorySignals): ExtractedComponent[] {
  const providerCi = repository.provider === "github" ? signals.githubActions : repository.provider === "gitlab" ? signals.gitlabCi : signals.bitbucketPipelines;
  const providerIcon = repository.provider === "github" ? "GitHub Actions" : repository.provider === "gitlab" ? "GitLab" : "Bitbucket";
  const components: ExtractedComponent[] = [
    { id: "user", label: "End User", icon: "Users", domain: "user" },
    { id: "dns", label: signals.route53 ? "Route 53" : "DNS / Routing", icon: signals.route53 ? "Route 53" : "DNS", domain: "user" },
    { id: "load-balancer", label: "Load Balancer", icon: "Load Balancer", domain: "user" },
    ...(providerCi ? [{ id: `${repository.provider}-ci`, label: repository.provider === "github" ? "GitHub Actions" : repository.provider === "gitlab" ? "GitLab CI" : "Bitbucket Pipelines", icon: providerIcon, domain: "pipeline" as const }] : []),
    ...(signals.jenkins ? [{ id: "jenkins", label: "Jenkins", icon: "Jenkins", domain: "pipeline" as const }] : []),
    ...(signals.sonarQube ? [{ id: "sonarqube", label: "SonarQube", icon: "SonarQube", domain: "pipeline" as const }] : []),
    ...(signals.docker ? [{ id: "docker", label: "Docker Build", icon: "Docker", domain: "pipeline" as const }] : []),
    ...(signals.dockerHub ? [{ id: "docker-hub", label: "Docker Hub", icon: "Docker Hub", domain: "pipeline" as const }] : []),
    ...(signals.dockerCompose ? [{ id: "docker-compose", label: "Docker Compose", icon: "Docker Compose", domain: "pipeline" as const }] : []),
    ...(signals.nexus ? [{ id: "nexus", label: "Nexus", icon: "Nexus", domain: "pipeline" as const }] : []),
    ...(signals.terraform ? [{ id: "terraform", label: "Terraform", icon: "Terraform", domain: "infrastructure" as const }] : []),
    ...(signals.ansible ? [{ id: "ansible", label: "Ansible", icon: "Ansible", domain: "infrastructure" as const }] : []),
    ...(signals.aws ? [{ id: "aws", label: "AWS", icon: "AWS", domain: "infrastructure" as const }] : []),
    ...(signals.argoCd ? [{ id: "argo-cd", label: "Argo CD", icon: "Argo CD", domain: "infrastructure" as const }] : []),
    ...(signals.kubernetes ? [{ id: "ingress", label: "Ingress", icon: "Ingress", domain: "cluster" as const }, { id: "service", label: "Service", icon: "Service", domain: "cluster" as const }, { id: "deployment", label: "Deployment", icon: "Deployment", domain: "cluster" as const }, { id: "pod", label: "Pod", icon: "Pod", domain: "cluster" as const }] : []),
    ...(signals.prometheus ? [{ id: "prometheus", label: "Prometheus", icon: "Prometheus", domain: "cluster" as const }] : []),
    ...(signals.grafana ? [{ id: "grafana", label: "Grafana", icon: "Grafana", domain: "cluster" as const }] : []),
  ];
  return uniqueById(components);
}

function buildBaseRelations(components: ExtractedComponent[]): ArchitectureRelation[] {
  const ids = new Set(components.map((component) => component.id));
  const relations: ArchitectureRelation[] = [];
  const add = (id: string, source: string, target: string, label: string, kind: RelationKind) => {
    if (ids.has(source) && (ids.has(target) || target === "live-app")) relations.push({ id, source, target, label, kind });
  };
  add("user-dns", "user", "dns", "Resolve", "traffic");
  add("dns-lb", "dns", "load-balancer", "HTTPS", "traffic");
  add("lb-ingress", "load-balancer", "ingress", "Route", "traffic");
  add("lb-live", "load-balancer", "live-app", "HTTPS", "traffic");
  add("ingress-service", "ingress", "service", "HTTPS", "traffic");
  add("service-deployment", "service", "deployment", "Route", "traffic");
  add("deployment-pod", "deployment", "pod", "Schedule", "deployment");
  add("pod-live", "pod", "live-app", "Serve", "traffic");
  add("prometheus-grafana", "prometheus", "grafana", "Metrics", "observability");
  return relations;
}

function classifyError(provider: RepositoryProvider, error: unknown) {
  const code = String(error);
  if (code.includes("404")) return "The repository was not found or is not public.";
  if (code.includes("403") || code.includes("429")) return `The public ${provider === "github" ? "GitHub" : provider === "gitlab" ? "GitLab" : "Bitbucket"} API rate limit has been reached. Try again shortly.`;
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

  const components = uniqueById([...buildBaseComponents(repository, signals), ...pipelineDetails.slice(0, 8), ...yaml.pipelineStages.slice(0, 8), ...terraform.components.slice(0, 10), ...yaml.components.slice(0, 14)]);
  const relations = uniqueRelations([...buildBaseRelations(components), ...terraform.relations, ...yaml.relations]);

  return {
    repository,
    signals,
    fileCount: descriptor.paths.length,
    detectedFiles: Array.from(new Set([...detectedFiles, ...contents.map((file) => file.path)])).slice(0, 10),
    components,
    relations,
  };
}

export function createPreviewAnalysis(): RepositoryAnalysis {
  const repository: RepositoryIdentity = { provider: "github", owner: "example", repo: "platform-service", branch: "main", url: "https://github.com/example/platform-service" };
  const signals: RepositorySignals = {
    githubActions: true, gitlabCi: false, bitbucketPipelines: false, jenkins: true, sonarQube: true, nexus: true, terraform: true, ansible: false, aws: true, route53: true, kubernetes: true, argoCd: true, nginx: true, docker: true, dockerHub: true, dockerCompose: true, react: true, postgres: true, mongodb: false, prometheus: true, grafana: true,
  };
  const previewComponents: ExtractedComponent[] = [
    ...buildBaseComponents(repository, signals),
    { id: "github-job-build", label: "build: container", icon: "GitHub Actions", domain: "pipeline", evidence: ".github/workflows/build.yml" },
    { id: "github-job-test", label: "test: unit", icon: "GitHub Actions", domain: "pipeline", evidence: ".github/workflows/build.yml" },
    { id: "tf-network", label: "aws vpc: production", icon: "AWS", domain: "infrastructure", evidence: "infra/network.tf" },
    { id: "tf-lb", label: "aws lb: public", icon: "Load Balancer", domain: "infrastructure", evidence: "infra/network.tf" },
    { id: "k8s-api", label: "Deployment: api", icon: "Deployment", domain: "cluster", evidence: "deploy/api.yaml" },
    { id: "k8s-api-service", label: "Service: api", icon: "Service", domain: "cluster", evidence: "deploy/api.yaml" },
  ];
  const components = uniqueById(previewComponents);
  return {
    repository,
    signals,
    fileCount: 47,
    detectedFiles: [".github/workflows/build.yml", "Dockerfile", "docker-compose.yml", "infra/network.tf", "deploy/api.yaml"],
    components,
    relations: uniqueRelations([
      ...buildBaseRelations(components),
      { id: "preview-network-lb", source: "tf-network", target: "tf-lb", label: "depends_on", kind: "dependency", evidence: "infra/network.tf" },
      { id: "preview-lb-api", source: "tf-lb", target: "k8s-api", label: "Deploy", kind: "deployment", evidence: "infra/network.tf" },
      { id: "preview-api-service", source: "k8s-api-service", target: "k8s-api", label: "Route", kind: "traffic", evidence: "deploy/api.yaml" },
    ]),
    isPreview: true,
  };
}
