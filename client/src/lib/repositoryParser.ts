/**
 * ArchTrace data system: inspect a public GitHub repository directly in the browser,
 * deriving only file-name signals so the canvas remains quick, private, and deterministic.
 */
export type RepositoryIdentity = { owner: string; repo: string; branch: string; url: string };

export type RepositorySignals = {
  githubActions: boolean;
  sonarQube: boolean;
  nexus: boolean;
  terraform: boolean;
  aws: boolean;
  kubernetes: boolean;
  argoCd: boolean;
  nginx: boolean;
  docker: boolean;
  react: boolean;
  postgres: boolean;
  mongodb: boolean;
  prometheus: boolean;
  grafana: boolean;
};

export type RepositoryAnalysis = {
  repository: RepositoryIdentity;
  signals: RepositorySignals;
  fileCount: number;
  detectedFiles: string[];
  isPreview?: boolean;
};

type GitHubRepository = { default_branch: string; html_url: string };
type GitHubTreeResponse = { tree?: Array<{ path: string; type: string }>; truncated?: boolean; message?: string };

const emptySignals = (): RepositorySignals => ({
  githubActions: false,
  sonarQube: false,
  nexus: false,
  terraform: false,
  aws: false,
  kubernetes: false,
  argoCd: false,
  nginx: false,
  docker: false,
  react: false,
  postgres: false,
  mongodb: false,
  prometheus: false,
  grafana: false,
});

export function parseGitHubRepositoryUrl(rawUrl: string): { owner: string; repo: string; url: string } {
  const normalized = rawUrl.trim().replace(/^git\+/, "").replace(/\.git\/?$/, "");
  const fromSsh = normalized.match(/^git@github\.com:([^/]+)\/([^/]+)$/i);
  const safeUrl = fromSsh ? `https://github.com/${fromSsh[1]}/${fromSsh[2]}` : normalized;

  let url: URL;
  try {
    url = new URL(safeUrl.startsWith("http") ? safeUrl : `https://${safeUrl}`);
  } catch {
    throw new Error("أدخل رابط GitHub عام بصيغة https://github.com/owner/repository.");
  }

  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    throw new Error("الرابط يجب أن يشير إلى github.com ومستودع عام.");
  }

  const [owner, repo] = url.pathname.split("/").filter(Boolean);
  if (!owner || !repo) {
    throw new Error("لم أتمكن من تحديد owner وrepository من الرابط.");
  }

  return { owner, repo, url: `https://github.com/${owner}/${repo}` };
}

function collectMatches(paths: string[], matcher: RegExp) {
  return paths.filter((path) => matcher.test(path)).slice(0, 4);
}

function deriveSignals(paths: string[]): { signals: RepositorySignals; detectedFiles: string[] } {
  const lower = paths.map((path) => path.toLowerCase());
  const signals = emptySignals();

  signals.githubActions = lower.some((path) => path.startsWith(".github/workflows/"));
  signals.sonarQube = lower.some((path) => /sonar(project|\.|-)/.test(path));
  signals.nexus = lower.some((path) => /(nexus|nexus3|sonatype)/.test(path));
  signals.terraform = lower.some((path) => path.endsWith(".tf") || path.includes("terraform/"));
  signals.aws = lower.some((path) => /(aws|cloudformation|route53|lambda|cdk)/.test(path));
  signals.kubernetes = lower.some((path) => /(k8s|kubernetes|helm|chart\.yaml|values\.ya?ml|deployment\.ya?ml|service\.ya?ml|ingress\.ya?ml)/.test(path));
  signals.argoCd = lower.some((path) => /(argocd|argo-cd|application\.ya?ml)/.test(path));
  signals.nginx = lower.some((path) => /(nginx|ingress-nginx)/.test(path));
  signals.docker = lower.some((path) => /(^|\/)(dockerfile|docker-compose[^/]*\.ya?ml)$/.test(path));
  signals.react = lower.some((path) => /(src\/app\.(tsx|jsx)|vite\.config|next\.config|react)/.test(path));
  signals.postgres = lower.some((path) => /(postgres|postgresql|pgdata)/.test(path));
  signals.mongodb = lower.some((path) => /(mongodb|mongo)/.test(path));
  signals.prometheus = lower.some((path) => /(prometheus|prometheus\.ya?ml|prometheus-operator)/.test(path));
  signals.grafana = lower.some((path) => /(grafana|dashboards?\/.*\.json)/.test(path));

  const matchers = [
    /\.github\/workflows\//i,
    /sonar/i,
    /\.tf$/i,
    /(k8s|kubernetes|helm|chart\.yaml|values\.ya?ml|deployment\.ya?ml|service\.ya?ml|ingress\.ya?ml)/i,
    /(argo|argocd)/i,
    /(prometheus|grafana)/i,
    /(dockerfile|docker-compose)/i,
  ];
  const detectedFiles = Array.from(new Set(matchers.flatMap((matcher) => collectMatches(paths, matcher)))).slice(0, 8);

  return { signals, detectedFiles };
}

export async function analyzePublicRepository(rawUrl: string): Promise<RepositoryAnalysis> {
  const identity = parseGitHubRepositoryUrl(rawUrl);
  const headers = { Accept: "application/vnd.github+json" };
  const repoResponse = await fetch(`https://api.github.com/repos/${identity.owner}/${identity.repo}`, { headers });

  if (!repoResponse.ok) {
    if (repoResponse.status === 404) throw new Error("المستودع غير موجود أو ليس عامًا.");
    if (repoResponse.status === 403) throw new Error("حد GitHub العام المؤقت وصل. حاول مرة أخرى بعد قليل.");
    throw new Error("تعذر الوصول إلى بيانات المستودع من GitHub.");
  }

  const repository = (await repoResponse.json()) as GitHubRepository;
  const branch = repository.default_branch;
  const treeResponse = await fetch(
    `https://api.github.com/repos/${identity.owner}/${identity.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { headers },
  );

  if (!treeResponse.ok) throw new Error("تعذر قراءة شجرة الملفات لهذا المستودع.");
  const tree = (await treeResponse.json()) as GitHubTreeResponse;
  const paths = (tree.tree ?? []).filter((entry) => entry.type === "blob").map((entry) => entry.path);
  const { signals, detectedFiles } = deriveSignals(paths);

  return {
    repository: { owner: identity.owner, repo: identity.repo, branch, url: repository.html_url || identity.url },
    signals,
    fileCount: paths.length,
    detectedFiles,
  };
}

export function createPreviewAnalysis(): RepositoryAnalysis {
  return {
    repository: { owner: "example", repo: "platform-service", branch: "main", url: "https://github.com/example/platform-service" },
    signals: {
      githubActions: true,
      sonarQube: true,
      nexus: true,
      terraform: true,
      aws: true,
      kubernetes: true,
      argoCd: true,
      nginx: true,
      docker: true,
      react: true,
      postgres: true,
      mongodb: false,
      prometheus: true,
      grafana: true,
    },
    fileCount: 47,
    detectedFiles: [".github/workflows/build.yml", "infra/main.tf", "deploy/helm/Chart.yaml", "observability/prometheus.yml"],
    isPreview: true,
  };
}
