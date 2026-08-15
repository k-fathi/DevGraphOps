/**
 * ArchTrace layout system: ELK owns top-level spacing and orthogonal flow;
 * child nodes occupy compact, deliberate lanes inside transparent group boundaries.
 */
import ELK from "elkjs/lib/elk.bundled.js";
import type { Edge, Node } from "@xyflow/react";
import type { RepositoryAnalysis } from "@/lib/repositoryParser";
import type { ContainerNodeData, ServiceNodeData } from "@/components/architecture/nodes";

export type ArchitectureView = "high" | "detailed";
export type ArchitectureNode = Node<ContainerNodeData, "containerGroup"> | Node<ServiceNodeData, "devopsService"> | Node<ServiceNodeData, "pipelineStep">;
export type ArchitectureEdge = Edge<{ kind: "traffic" | "deployment" }>;

const elk = new ELK();
const LEAF_WIDTH = 104;
const LEAF_HEIGHT = 108;

type GroupDefinition = {
  id: string;
  label: string;
  color: string;
  children: Array<{ id: string; label: string; icon: string; type?: "pipelineStep" | "devopsService" }>;
};

type Size = { width: number; height: number };

function groupSize(children: GroupDefinition["children"], view: ArchitectureView): Size {
  if (view === "high") return { width: 164, height: 112 };
  const columns = Math.max(1, Math.min(children.length || 1, 4));
  const rows = Math.max(1, Math.ceil(Math.max(children.length, 1) / 4));
  return {
    width: Math.max(190, 32 + columns * (LEAF_WIDTH + 16)),
    height: 44 + rows * (LEAF_HEIGHT + 16) + 18,
  };
}

function serviceNode(id: string, label: string, icon: string, position: { x: number; y: number }, type: "pipelineStep" | "devopsService" = "devopsService"): ArchitectureNode {
  return {
    id,
    type,
    position,
    draggable: false,
    selectable: false,
    data: { label, icon },
    style: { width: LEAF_WIDTH, height: LEAF_HEIGHT },
  };
}

function groupNode(definition: GroupDefinition, position: { x: number; y: number }, size: Size, view: ArchitectureView): ArchitectureNode {
  return {
    id: definition.id,
    type: "containerGroup",
    position,
    draggable: false,
    selectable: false,
    zIndex: 0,
    data: { label: definition.label, color: definition.color, collapsed: view === "high", childCount: definition.children.length },
    style: { width: size.width, height: size.height },
  };
}

function makeEdge(id: string, source: string, target: string, label: string, kind: "traffic" | "deployment"): ArchitectureEdge {
  const traffic = kind === "traffic";
  return {
    id,
    source,
    target,
    type: "step",
    animated: !traffic,
    label,
    data: { kind },
    selectable: false,
    style: {
      stroke: traffic ? "#22c55e" : "#60a5fa",
      strokeWidth: traffic ? 2.2 : 1.8,
      strokeDasharray: traffic ? undefined : "7 5",
    },
    labelStyle: { fill: "#cbd5e1", fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: "#111827", fillOpacity: 0.96 },
    labelBgPadding: [5, 3],
    labelBgBorderRadius: 2,
  };
}

function buildGroups(analysis: RepositoryAnalysis): GroupDefinition[] {
  const { signals } = analysis;
  const pipelineChildren = [
    ...(signals.githubActions ? [{ id: "github-actions", label: "GitHub Actions", icon: "GitHub Actions", type: "pipelineStep" as const }] : []),
    ...(signals.sonarQube ? [{ id: "sonarqube", label: "SonarQube", icon: "SonarQube", type: "pipelineStep" as const }] : []),
    ...(signals.nexus ? [{ id: "nexus", label: "Nexus", icon: "Nexus", type: "pipelineStep" as const }] : []),
    ...(signals.docker ? [{ id: "docker", label: "Docker Image", icon: "Docker", type: "pipelineStep" as const }] : []),
  ];
  const infrastructureChildren = [
    ...(signals.terraform ? [{ id: "terraform", label: "Terraform", icon: "Terraform" }] : []),
    ...(signals.aws ? [{ id: "aws", label: "AWS", icon: "AWS" }] : []),
    ...(signals.argoCd ? [{ id: "argo-cd", label: "Argo CD", icon: "Argo CD" }] : []),
  ];
  const clusterChildren = [
    ...(signals.kubernetes ? [{ id: "ingress", label: "Ingress", icon: "Ingress" }, { id: "service", label: "Service", icon: "Service" }, { id: "deployment", label: "Deployment", icon: "Deployment" }, { id: "pod", label: "Pod", icon: "Pod" }] : []),
    ...(signals.prometheus ? [{ id: "prometheus", label: "Prometheus", icon: "Prometheus" }] : []),
    ...(signals.grafana ? [{ id: "grafana", label: "Grafana", icon: "Grafana" }] : []),
  ];

  return [
    { id: "cicd", label: "01 · CI / CD PIPELINE", color: "#8b5cf6", children: pipelineChildren.length ? pipelineChildren : [{ id: "ci-missing", label: "CI configuration", icon: "CI Pipeline", type: "pipelineStep" }] },
    { id: "infrastructure", label: "02 · INFRASTRUCTURE", color: "#f59e0b", children: infrastructureChildren.length ? infrastructureChildren : [{ id: "infra-missing", label: "Infrastructure", icon: "Custom Cloud Service" }] },
    { id: "cluster", label: "03 · KUBERNETES CLUSTER", color: "#38bdf8", children: clusterChildren.length ? clusterChildren : [{ id: "cluster-missing", label: "Cluster config", icon: "ConfigMap" }] },
  ];
}

async function calculateTopLevelLayout(items: Array<{ id: string; width: number; height: number }>) {
  const layout = await elk.layout({
    id: "architecture-root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": "70",
      "elk.layered.spacing.nodeNodeBetweenLayers": "86",
      "elk.padding": "[top=36,left=40,bottom=36,right=40]",
    },
    children: items,
    edges: items.slice(0, -1).map((item, index) => ({ id: `elk-${item.id}-${items[index + 1].id}`, sources: [item.id], targets: [items[index + 1].id] })),
  });

  return Object.fromEntries((layout.children ?? []).map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]));
}

export async function buildArchitectureLayout(analysis: RepositoryAnalysis, view: ArchitectureView): Promise<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] }> {
  const groups = buildGroups(analysis);
  const sizes = Object.fromEntries(groups.map((group) => [group.id, groupSize(group.children, view)])) as Record<string, Size>;
  const topLevel = [
    { id: "repository", width: 126, height: LEAF_HEIGHT },
    ...groups.map((group) => ({ id: group.id, ...sizes[group.id] })),
    { id: "live-app", width: 126, height: LEAF_HEIGHT },
  ];
  const positions = await calculateTopLevelLayout(topLevel);
  const nodes: ArchitectureNode[] = [
    serviceNode("repository", `${analysis.repository.owner}/${analysis.repository.repo}`, "GitHub", positions.repository, "devopsService"),
    ...groups.map((group) => groupNode(group, positions[group.id], sizes[group.id], view)),
    serviceNode("live-app", "Live Application", analysis.signals.react ? "React" : analysis.signals.nginx ? "Nginx" : "Custom Application", positions["live-app"], "devopsService"),
  ];

  if (view === "high") {
    return {
      nodes,
      edges: [
        makeEdge("repository-cicd", "repository", "cicd", "Push", "deployment"),
        makeEdge("cicd-infra", "cicd", "infrastructure", "Provision", "deployment"),
        makeEdge("infra-cluster", "infrastructure", "cluster", "Deploy", "deployment"),
        makeEdge("cluster-live", "cluster", "live-app", "HTTPS", "traffic"),
      ],
    };
  }

  for (const group of groups) {
    group.children.forEach((child, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      nodes.push({
        ...serviceNode(child.id, child.label, child.icon, { x: 18 + column * (LEAF_WIDTH + 16), y: 44 + row * (LEAF_HEIGHT + 16) }, child.type ?? "devopsService"),
        parentId: group.id,
        extent: "parent",
        zIndex: 3,
      });
    });
  }

  const pipeline = groups[0].children;
  const infrastructure = groups[1].children;
  const cluster = groups[2].children;
  const pipelineStart = pipeline[0]?.id ?? "cicd";
  const pipelineEnd = pipeline[pipeline.length - 1]?.id ?? "cicd";
  const infrastructureStart = infrastructure[0]?.id ?? "infrastructure";
  const infrastructureEnd = infrastructure[infrastructure.length - 1]?.id ?? "infrastructure";
  const clusterStart = cluster[0]?.id ?? "cluster";
  const clusterEnd = cluster[cluster.length - 1]?.id ?? "cluster";
  const edges: ArchitectureEdge[] = [makeEdge("repo-to-pipeline", "repository", pipelineStart, "Push", "deployment")];

  pipeline.slice(0, -1).forEach((child, index) => edges.push(makeEdge(`pipeline-${child.id}`, child.id, pipeline[index + 1].id, index === pipeline.length - 2 ? "Publish" : "Check", "deployment")));
  edges.push(makeEdge("pipeline-to-infra", pipelineEnd, infrastructureStart, "Provision", "deployment"));
  infrastructure.slice(0, -1).forEach((child, index) => edges.push(makeEdge(`infra-${child.id}`, child.id, infrastructure[index + 1].id, "Sync", "deployment")));
  edges.push(makeEdge("infra-to-cluster", infrastructureEnd, clusterStart, "Deploy", "deployment"));
  cluster.slice(0, -1).forEach((child, index) => {
    const target = cluster[index + 1];
    edges.push(makeEdge(`cluster-${child.id}`, child.id, target.id, child.id === "ingress" ? "HTTPS" : "Route", child.id === "ingress" ? "traffic" : "deployment"));
  });
  edges.push(makeEdge("cluster-to-live", clusterEnd, "live-app", "HTTPS", "traffic"));

  return { nodes, edges };
}
