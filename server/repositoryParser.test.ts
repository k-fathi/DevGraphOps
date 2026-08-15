/** Unit coverage for the public-provider URL normalizer used by the repository-analysis service. */
import { describe, expect, it } from "vitest";
import { buildArchitectureLayout } from "../client/src/lib/architectureLayout";
import { buildEvidenceSnippets, candidatePaths, normalizeExecutionState, parseKubernetes, parsePublicRepositoryUrl, parseTerraform } from "../client/src/lib/repositoryParser";
import { createEvidenceSelection, tokenizeEvidenceLine } from "../client/src/lib/evidencePanel";

describe("parsePublicRepositoryUrl", () => {
  it("normalizes supported public provider URLs", () => {
    expect(parsePublicRepositoryUrl("https://github.com/acme/platform.git")).toMatchObject({ provider: "github", owner: "acme", repo: "platform" });
    expect(parsePublicRepositoryUrl("gitlab.com/group/platform")).toMatchObject({ provider: "gitlab", owner: "group", repo: "platform" });
    expect(parsePublicRepositoryUrl("git@bitbucket.org:workspace/platform.git")).toMatchObject({ provider: "bitbucket", owner: "workspace", repo: "platform" });
  });

  it("rejects unsupported providers", () => {
    expect(() => parsePublicRepositoryUrl("https://example.com/acme/platform")).toThrow("Unsupported provider");
  });

  it("safely omits malformed YAML and Terraform rather than inventing resources", () => {
    const malformedYaml = parseKubernetes([{ path: "k8s/deployment.yaml", content: "kind: Deployment\nmetadata: [name: broken" }]);
    const malformedTerraform = parseTerraform([{ path: "infra/main.tf", content: 'resource "aws_instance" "broken" {\n  ami = "ami-123"' }]);

    expect(malformedYaml.components).toEqual([]);
    expect(malformedYaml.relations).toEqual([]);
    expect(malformedTerraform.components).toEqual([]);
    expect(malformedTerraform.relations).toEqual([]);
  });

  it("keeps YAML and Terraform evidence snippets while redacting Kubernetes Secret contents", () => {
    const snippets = buildEvidenceSnippets([
      { path: "k8s/config.yaml", content: "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-config\n" },
      { path: "k8s/secret.yaml", content: "apiVersion: v1\nkind: Secret\nmetadata:\n  name: app-secret\ndata:\n  token: private-value\n" },
      { path: "infra/main.tf", content: 'resource "aws_s3_bucket" "assets" {}' },
    ]);

    expect(snippets.find((snippet) => snippet.path === "k8s/config.yaml")?.content).toContain("kind: ConfigMap");
    expect(snippets.find((snippet) => snippet.path === "infra/main.tf")?.language).toBe("terraform");
    expect(snippets.find((snippet) => snippet.path === "k8s/secret.yaml")).toMatchObject({ redacted: true });
    expect(snippets.find((snippet) => snippet.path === "k8s/secret.yaml")?.content).not.toContain("private-value");
  });

  it("creates evidence selections for nodes and relationships and tokenizes YAML or Terraform source", () => {
    expect(createEvidenceSelection("k8s/deployment.yaml", "Deployment: app")).toEqual({ path: "k8s/deployment.yaml", title: "Deployment: app" });
    expect(createEvidenceSelection("infra/main.tf", "bucket → application", "depends_on")).toEqual({ path: "infra/main.tf", title: "bucket → application", relationship: "depends_on" });
    expect(createEvidenceSelection(undefined, "No evidence")).toBeNull();
    expect(tokenizeEvidenceLine("kind: Deployment # application", "yaml").map((token) => token.kind)).toEqual(expect.arrayContaining(["property", "comment"]));
    expect(tokenizeEvidenceLine('resource "aws_s3_bucket" "assets" {', "terraform").map((token) => token.kind)).toEqual(expect.arrayContaining(["property", "string"]));
  });

  it("maps provider-reported GitHub Actions job states without inventing outcomes", () => {
    expect(normalizeExecutionState("completed", "success")).toBe("success");
    expect(normalizeExecutionState("completed", "failure")).toBe("failed");
    expect(normalizeExecutionState("in_progress", null)).toBe("running");
    expect(normalizeExecutionState("queued", null)).toBe("queued");
    expect(normalizeExecutionState("completed", "skipped")).toBe("neutral");
  });

  it("derives the public user entry from an Ingress manifest with direct file evidence", () => {
    const parsed = parseKubernetes([
      { path: "ingress.yml", content: "apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: web\nspec:\n  rules:\n    - http:\n        paths:\n          - path: /\n            pathType: Prefix\n            backend:\n              service:\n                name: web\n                port:\n                  number: 80\n" },
      { path: "service.yml", content: "apiVersion: v1\nkind: Service\nmetadata:\n  name: web\nspec:\n  selector:\n    app: web\n" },
      { path: "deployment.yml", content: "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\nspec:\n  template:\n    metadata:\n      labels:\n        app: web\n" },
    ]);

    expect(parsed.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "user", label: "Open application", evidence: "ingress.yml" }),
      expect.objectContaining({ label: "HTTPS", evidence: "ingress.yml" }),
      expect.objectContaining({ label: "Selects", evidence: "service.yml" }),
    ]));
    expect(parsed.relations.every((relation) => Boolean(relation.evidence))).toBe(true);
  });

  it("prioritizes related Kubernetes entry, service, and workload files in a large repository", () => {
    const selected = candidatePaths([
      ".github/workflows/ci.yml",
      "infra/main.tf",
      "release-cluster/frontend-ingress.yaml",
      "release-cluster/frontend-service.yaml",
      "release-cluster/frontend-deployment.yaml",
      "release-cluster/cartservice-deployment.yaml",
      "release/kubernetes-manifests.yaml",
      "values.yaml",
      "src/frontend/Dockerfile",
    ]);

    expect(selected).toEqual(expect.arrayContaining([
      "release-cluster/frontend-ingress.yaml",
      "release-cluster/frontend-service.yaml",
      "release-cluster/frontend-deployment.yaml",
      "release/kubernetes-manifests.yaml",
    ]));
  });

  it("keeps a complete declared user route when selected Kubernetes files are parsed together", () => {
    const selected = candidatePaths([
      "release-cluster/frontend-ingress.yaml",
      "release-cluster/frontend-service.yaml",
      "release-cluster/frontend-deployment.yaml",
      "src/frontend/Dockerfile",
      "terraform/main.tf",
    ]);
    const manifests = [
      { path: "release-cluster/frontend-ingress.yaml", content: "apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: frontend\nspec:\n  rules:\n    - http:\n        paths:\n          - path: /\n            pathType: Prefix\n            backend:\n              service:\n                name: frontend\n                port:\n                  number: 80\n" },
      { path: "release-cluster/frontend-service.yaml", content: "apiVersion: v1\nkind: Service\nmetadata:\n  name: frontend\nspec:\n  selector:\n    app: frontend\n" },
      { path: "release-cluster/frontend-deployment.yaml", content: "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: frontend\nspec:\n  template:\n    metadata:\n      labels:\n        app: frontend\n" },
    ].filter((file) => selected.includes(file.path));
    const parsed = parseKubernetes(manifests);

    expect(parsed.relations.map((relation) => relation.label)).toEqual(expect.arrayContaining(["Open application", "HTTPS", "Selects"]));
  });

  it("keeps diverse Kubernetes configuration resource types in large repositories", () => {
    const selected = candidatePaths([
      ".github/workflows/ci.yml", ".gitlab-ci.yml", "backend/Dockerfile", "frontend/Dockerfile", "terraform/main.tf",
      "k8s/config-maps/app.yml", "k8s/secrets/app.yml", "k8s/services/app.yml", "k8s/deployments/app.yml",
      "k8s/ingress/app.yml", "k8s/statefulsets/db.yml", "k8s/hpa/app.yml", "k8s/eso/external-secret.yml",
      "k8s/namespaces/app.yml", "k8s/replicasets/app.yml",
    ]);

    expect(selected).toEqual(expect.arrayContaining([
      "k8s/config-maps/app.yml", "k8s/secrets/app.yml", "k8s/services/app.yml", "k8s/deployments/app.yml",
      "k8s/ingress/app.yml", "k8s/statefulsets/db.yml", "k8s/hpa/app.yml", "k8s/eso/external-secret.yml",
    ]));
  });

  it("does not invent ReplicaSet, Pod, or Namespace for DEPI-GP-style declared resources", () => {
    const parsed = parseKubernetes([{ path: "k8s/declared.yml", content: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
---
apiVersion: v1
kind: Service
metadata:
  name: app
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: database
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
` }]);
    const labels = parsed.components.map((component) => component.label);

    expect(labels).toEqual(expect.arrayContaining(["ConfigMap: app-config", "Secret: app-secret", "Service: app", "Deployment: app", "StatefulSet: database", "HorizontalPodAutoscaler: app-hpa"]));
    expect(labels).not.toEqual(expect.arrayContaining(["ReplicaSet: app", "Pod: app", "Namespace: app"]));
  });

  it("selects only evidenced DEPI-GP Kubernetes manifest families within the analysis budget", () => {
    const repoPaths = [
      ".github/workflows/ci-cd.yml", "backend/Dockerfile", "frontend/Dockerfile", "terraform/main.tf", "ansible/deploy.yml",
      "k8s/config-maps/back-cm.yml", "k8s/secrets/back-secrets.yml", "k8s/services/back-svc.yml", "k8s/deployments/back-deploy.yml",
      "k8s/statefulsets/stateful-set.yml", "k8s/hpa/back-hpa.yaml",
    ];
    const selected = candidatePaths(repoPaths);
    const selectedKubernetes = selected.filter((path) => path.startsWith("k8s/"));

    expect(selectedKubernetes).toEqual(expect.arrayContaining([
      "k8s/config-maps/back-cm.yml", "k8s/secrets/back-secrets.yml", "k8s/services/back-svc.yml",
      "k8s/deployments/back-deploy.yml", "k8s/statefulsets/stateful-set.yml", "k8s/hpa/back-hpa.yaml",
    ]));
    expect(selectedKubernetes.every((path) => repoPaths.includes(path))).toBe(true);
    expect(selectedKubernetes).not.toContain("k8s/replicasets/app.yml");
    expect(selectedKubernetes).not.toContain("k8s/pods/app.yml");
    expect(selectedKubernetes).not.toContain("k8s/namespaces/app.yml");
  });

  it("extracts evidenced GitLab pipeline tools and stage-order arrows", () => {
    const parsed = parseKubernetes([{ path: ".gitlab-ci.yml", content: `stages: [install, build, security_scan]
install_app:
  stage: install
  image: node:20
  script: ["npm install"]
build_image:
  stage: build
  image: docker:25
  script: ["docker build -t app .", "docker login $NEXUS_REGISTRY", "docker push $NEXUS_REGISTRY/app"]
security_scan:
  stage: security_scan
  image: python:3.11
  script: ["trivy image app", "gitleaks detect", "semgrep ci", "tfsec .", "retire"]
` }]);
    const tools = parsed.pipelineStages.flatMap((component) => component.tools ?? []);

    expect(tools).toEqual(expect.arrayContaining(["Node.js", "npm", "Docker", "Nexus", "Trivy", "Gitleaks", "Semgrep", "tfsec", "Retire.js", "Python"]));
    expect(parsed.pipelineRelations).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "stage order", evidence: ".gitlab-ci.yml" }),
    ]));
  });

  it("extracts GitHub Actions tools as icon-bearing nodes with sourced arrows", () => {
    const parsed = parseKubernetes([{ path: ".github/workflows/ci.yml", content: `name: CI
env:
  REGISTRY: ghcr.io
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install && npx eslint .
      - uses: docker/login-action@v3
      - uses: docker/build-push-action@v6
  security:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: aquasecurity/trivy-action@0.28.0
      - uses: gitleaks/gitleaks-action@v2
      - run: pip3 install njsscan && njsscan backend
      - uses: semgrep/semgrep-action@v1
      - uses: aquasecurity/tfsec-action@v1
      - run: npm install -g retire && retire
` }]);
    const tools = parsed.pipelineStages.flatMap((component) => component.tools ?? []);

    expect(tools).toEqual(expect.arrayContaining(["Git", "Node.js", "npm", "ESLint", "Docker", "GitHub Container Registry", "Trivy", "Gitleaks", "NJSScan", "Semgrep", "tfsec", "Retire.js", "Python"]));
    expect(parsed.pipelineRelations).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "github-needs-build-security", label: "needs", evidence: ".github/workflows/ci.yml" }),
    ]));
  });

  it("connects a GitHub Actions deployment job only to Kubernetes manifests named in its sourced script", () => {
    const parsed = parseKubernetes([
      { path: ".github/workflows/deploy.yml", content: `name: Deploy
jobs:
  deploy-manifests:
    runs-on: ubuntu-latest
    steps:
      - run: kubectl apply -f k8s/deployments/api.yml
` },
      { path: "k8s/deployments/api.yml", content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
` },
      { path: "k8s/deployments/unrelated.yml", content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: unrelated
` },
    ]);

    expect(parsed.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "github-job-deploy-manifests", label: "updates manifest", evidence: ".github/workflows/deploy.yml" }),
    ]));
    expect(parsed.relations.some((relation) => relation.target.includes("unrelated"))).toBe(false);
  });

  it("keeps namespace metadata as grouping information without inventing a Namespace manifest or containment arrows", () => {
    const parsed = parseKubernetes([{ path: "k8s/shop.yml", content: `apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: shop
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: shop
spec:
  template:
    metadata:
      labels:
        app: web
` }]);

    expect(parsed.components.map((component) => component.label)).toEqual(expect.arrayContaining(["Service: web", "Deployment: web"]));
    expect(parsed.components.some((component) => component.icon === "Namespace")).toBe(false);
    expect(parsed.relations.some((relation) => relation.label === "contains")).toBe(false);
  });

  it("extracts declared Kubernetes configuration and scaling resources with their relations", () => {
    const parsed = parseKubernetes([{ path: "k8s/runtime.yml", content: `apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
---
apiVersion: v1
kind: Secret
metadata:
  name: api-secret
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          envFrom:
            - configMapRef:
                name: api-config
            - secretRef:
                name: api-secret
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    name: api
` }]);
    const labels = parsed.components.map((component) => component.label);

    expect(labels).toEqual(expect.arrayContaining(["ConfigMap: api-config", "Secret: api-secret", "Service: api", "Deployment: api", "HorizontalPodAutoscaler: api-hpa"]));
    expect(parsed.relations.map((relation) => relation.label)).toEqual(expect.arrayContaining(["Selects", "config", "scales"]));
  });

  it("does not render empty evidence domains", async () => {
    const analysis = {
      repository: { provider: "github" as const, owner: "acme", repo: "ingress", branch: "main", url: "https://github.com/acme/ingress" },
      signals: { githubActions: false, gitlabCi: false, bitbucketPipelines: false, jenkins: false, sonarQube: false, nexus: false, terraform: false, ansible: false, aws: false, route53: false, kubernetes: true, argoCd: false, nginx: false, docker: false, dockerHub: false, dockerCompose: false, react: false, postgres: false, mongodb: false, prometheus: false, grafana: false },
      fileCount: 3,
      detectedFiles: ["ingress.yml"],
      components: [
        { id: "user", label: "End User", icon: "Users", domain: "user" as const },
        { id: "ingress", label: "Ingress: web", icon: "Ingress", domain: "cluster" as const, evidence: "ingress.yml" },
      ],
      relations: [{ id: "user-ingress", source: "user", target: "ingress", label: "Open application", kind: "traffic" as const, evidence: "ingress.yml" }],
    };

    const layout = await buildArchitectureLayout(analysis, "detailed", false, false, true);
    const groupIds = layout.nodes.filter((node) => node.type === "containerGroup").map((node) => node.id);
    expect(groupIds).toEqual(["user-path", "cluster"]);
    expect(groupIds).not.toContain("cicd");
    expect(groupIds).not.toContain("infrastructure");
    expect(layout.edges.map((edge) => edge.id)).toEqual(["extracted-user-ingress"]);
  });
});
