/** Unit coverage for the public-provider URL normalizer used by the repository-analysis service. */
import { describe, expect, it } from "vitest";
import { buildArchitectureLayout } from "../client/src/lib/architectureLayout";
import { candidatePaths, parseKubernetes, parsePublicRepositoryUrl, parseTerraform } from "../client/src/lib/repositoryParser";

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

    const layout = await buildArchitectureLayout(analysis, "detailed");
    const groupIds = layout.nodes.filter((node) => node.type === "containerGroup").map((node) => node.id);
    expect(groupIds).toEqual(["user-path", "cluster"]);
    expect(groupIds).not.toContain("cicd");
    expect(groupIds).not.toContain("infrastructure");
    expect(layout.edges.map((edge) => edge.id)).toEqual(["extracted-user-ingress"]);
  });
});
