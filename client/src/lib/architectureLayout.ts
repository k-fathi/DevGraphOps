/**
 * ArchTrace layout system: ELK lays out the DevOps delivery path while a parallel, upper user lane
 * remains visually separate. Both lanes converge only at the production application and never overlap.
 */
import ELK from "elkjs/lib/elk.bundled.js";
import type { Edge, Node } from "@xyflow/react";
import type { ArchitectureDomain, ExtractedComponent, RelationKind, RepositoryAnalysis } from "@/lib/repositoryParser";
import type { ContainerNodeData, ServiceNodeData } from "@/components/architecture/nodes";

export type ArchitectureView = "high" | "detailed";
export type ArchitectureNode = Node<ContainerNodeData, "containerGroup"> | Node<ServiceNodeData, "devopsService"> | Node<ServiceNodeData, "pipelineStep">;
export type ArchitectureEdge = Edge<{ kind: RelationKind }>;

const elk = new ELK();
const LEAF_WIDTH = 110;
const LEAF_HEIGHT = 112;
const CHILD_GAP = 16;

type GroupId = "user-path" | "cicd" | "infrastructure" | "cluster";
type GroupDefinition = { id: GroupId; label: string; color: string; children: ExtractedComponent[] };
type Size = { width: number; height: number };

function groupSize(children: ExtractedComponent[], view: ArchitectureView) {
  if (view === "high") return { width: 172, height: 110 };
  const columns = Math.max(1, Math.min(children.length || 1, 4));
  const rows = Math.max(1, Math.ceil(Math.max(children.length, 1) / 4));
  return { width: Math.max(184, 32 + columns * (LEAF_WIDTH + CHILD_GAP)), height: 46 + rows * (LEAF_HEIGHT + CHILD_GAP) + 18 };
}

function iconForProvider(provider: RepositoryAnalysis["repository"]["provider"]) {
  return provider === "github" ? "GitHub" : provider === "gitlab" ? "GitLab" : "Bitbucket";
}

function serviceNode(id: string, label: string, icon: string, position: { x: number; y: number }, type: "pipelineStep" | "devopsService" = "devopsService"): ArchitectureNode {
  return { id, type, position, draggable: false, selectable: false, data: { label, icon }, style: { width: LEAF_WIDTH, height: LEAF_HEIGHT } };
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

function makeEdge(id: string, source: string, target: string, label: string, kind: RelationKind): ArchitectureEdge {
  const styleByKind: Record<RelationKind, { stroke: string; strokeWidth: number; strokeDasharray?: string; animated: boolean }> = {
    traffic: { stroke: "#22c55e", strokeWidth: 2.3, animated: false },
    deployment: { stroke: "#60a5fa", strokeWidth: 1.9, strokeDasharray: "7 5", animated: true },
    observability: { stroke: "#f59e0b", strokeWidth: 1.7, strokeDasharray: "3 5", animated: false },
    dependency: { stroke: "#94a3b8", strokeWidth: 1.45, strokeDasharray: "2 4", animated: false },
  };
  const style = styleByKind[kind];
  return {
    id, source, target, type: "step", animated: style.animated, label, data: { kind }, selectable: false,
    style: { stroke: style.stroke, strokeWidth: style.strokeWidth, strokeDasharray: style.strokeDasharray },
    labelStyle: { fill: "#cbd5e1", fontSize: 10, fontWeight: 600 }, labelBgStyle: { fill: "#111827", fillOpacity: 0.96 }, labelBgPadding: [5, 3], labelBgBorderRadius: 2,
  };
}

function createGroups(analysis: RepositoryAnalysis): GroupDefinition[] {
  const byDomain = (domain: ArchitectureDomain) => analysis.components.filter((component) => component.domain === domain);
  const fallback = (domain: ArchitectureDomain, id: string, label: string, icon: string): ExtractedComponent[] => [{ id, label, icon, domain }];
  return [
    { id: "user-path", label: "A · USER JOURNEY · LIVE PATH", color: "#22c55e", children: byDomain("user").length ? byDomain("user") : fallback("user", "user-missing", "User access", "Users") },
    { id: "cicd", label: "B · DEVOPS · BUILD & DELIVERY", color: "#8b5cf6", children: byDomain("pipeline").length ? byDomain("pipeline") : fallback("pipeline", "pipeline-missing", "Pipeline config", "CI Pipeline") },
    { id: "infrastructure", label: "C · DEVOPS · INFRASTRUCTURE", color: "#f59e0b", children: byDomain("infrastructure").length ? byDomain("infrastructure") : fallback("infrastructure", "infra-missing", "Infrastructure config", "Custom Cloud Service") },
    { id: "cluster", label: "D · DEVOPS · RUNTIME & OBSERVABILITY", color: "#38bdf8", children: byDomain("cluster").length ? byDomain("cluster") : fallback("cluster", "cluster-missing", "Runtime config", "ConfigMap") },
  ];
}

async function calculateDevOpsLayout(items: Array<{ id: string; width: number; height: number }>) {
  const layout = await elk.layout({
    id: "devops-root",
    layoutOptions: {
      "elk.algorithm": "layered", "elk.direction": "RIGHT", "elk.edgeRouting": "ORTHOGONAL", "elk.spacing.nodeNode": "58", "elk.layered.spacing.nodeNodeBetweenLayers": "82", "elk.padding": "[top=36,left=40,bottom=36,right=40]",
    },
    children: items,
    edges: items.slice(0, -1).map((item, index) => ({ id: `elk-${item.id}-${items[index + 1].id}`, sources: [item.id], targets: [items[index + 1].id] })),
  });
  return Object.fromEntries((layout.children ?? []).map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]));
}

function addGroupChildren(nodes: ArchitectureNode[], group: GroupDefinition) {
  group.children.forEach((child, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    nodes.push({
      ...serviceNode(child.id, child.label, child.icon, { x: 18 + column * (LEAF_WIDTH + CHILD_GAP), y: 44 + row * (LEAF_HEIGHT + CHILD_GAP) }, child.domain === "pipeline" ? "pipelineStep" : "devopsService"),
      parentId: group.id, extent: "parent", zIndex: 3,
    });
  });
}

function findFlowEndpoint(children: ExtractedComponent[], position: "first" | "last", fallback: string) {
  return position === "first" ? children[0]?.id ?? fallback : children.at(-1)?.id ?? fallback;
}

function orderEdges(children: ExtractedComponent[], prefix: string, kind: RelationKind, finalLabel: string) {
  return children.slice(0, -1).map((child, index) => makeEdge(`${prefix}-${child.id}`, child.id, children[index + 1].id, index === children.length - 2 ? finalLabel : "Next", kind));
}

export async function buildArchitectureLayout(analysis: RepositoryAnalysis, view: ArchitectureView): Promise<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] }> {
  const groups = createGroups(analysis);
  const sizes = Object.fromEntries(groups.map((group) => [group.id, groupSize(group.children, view)])) as Record<GroupId, Size>;
  const devOpsGroups = groups.filter((group) => group.id !== "user-path");
  const devOpsItems = [{ id: "repository", width: LEAF_WIDTH + 20, height: LEAF_HEIGHT }, ...devOpsGroups.map((group) => ({ id: group.id, ...sizes[group.id] })), { id: "live-app", width: 132, height: LEAF_HEIGHT }];
  const positions = await calculateDevOpsLayout(devOpsItems);
  const devOpsBaseY = 300;
  const userWidth = sizes["user-path"].width;
  const userPosition = { x: Math.max(42, Math.floor((positions["live-app"].x - userWidth) / 2)), y: 34 };
  const nodes: ArchitectureNode[] = [
    groupNode(groups[0], userPosition, sizes["user-path"], view),
    serviceNode("repository", `${analysis.repository.owner}/${analysis.repository.repo}`, iconForProvider(analysis.repository.provider), { x: positions.repository.x, y: positions.repository.y + devOpsBaseY }, "devopsService"),
    ...devOpsGroups.map((group) => groupNode(group, { x: positions[group.id].x, y: positions[group.id].y + devOpsBaseY }, sizes[group.id], view)),
    serviceNode("live-app", "Live Application", analysis.signals.react ? "React" : analysis.signals.nginx ? "Nginx" : "Custom Application", { x: positions["live-app"].x, y: positions["live-app"].y + devOpsBaseY }, "devopsService"),
  ];

  if (view === "detailed") groups.forEach((group) => addGroupChildren(nodes, group));

  const user = groups[0].children;
  const pipeline = groups[1].children;
  const infrastructure = groups[2].children;
  const cluster = groups[3].children;
  const knownNodeIds = new Set(nodes.map((node) => node.id));
  const userStart = findFlowEndpoint(user, "first", "user-path");
  const userEnd = findFlowEndpoint(user, "last", "user-path");
  const pipelineStart = findFlowEndpoint(pipeline, "first", "cicd");
  const pipelineEnd = findFlowEndpoint(pipeline, "last", "cicd");
  const infraStart = findFlowEndpoint(infrastructure, "first", "infrastructure");
  const infraEnd = findFlowEndpoint(infrastructure, "last", "infrastructure");
  const clusterStart = findFlowEndpoint(cluster, "first", "cluster");
  const clusterEnd = findFlowEndpoint(cluster, "last", "cluster");

  if (view === "high") {
    return {
      nodes,
      edges: [
        makeEdge("user-high-cluster", "user-path", "cluster", "HTTPS", "traffic"),
        makeEdge("cluster-high-live", "cluster", "live-app", "Serve", "traffic"),
        makeEdge("repo-high-cicd", "repository", "cicd", "Push", "deployment"),
        makeEdge("cicd-high-infra", "cicd", "infrastructure", "Provision", "deployment"),
        makeEdge("infra-high-cluster", "infrastructure", "cluster", "Deploy", "deployment"),
      ],
    };
  }

  const edges: ArchitectureEdge[] = [
    ...orderEdges(user, "user-flow", "traffic", "HTTPS"),
    ...orderEdges(pipeline, "pipeline-flow", "deployment", "Publish"),
    ...orderEdges(infrastructure, "infra-flow", "deployment", "Provision"),
    ...orderEdges(cluster, "cluster-flow", "deployment", "Runtime"),
    makeEdge("repo-to-pipeline", "repository", pipelineStart, "Push", "deployment"),
    makeEdge("pipeline-to-infra", pipelineEnd, infraStart, "Provision", "deployment"),
    makeEdge("infra-to-cluster", infraEnd, clusterStart, "Deploy", "deployment"),
    makeEdge("cluster-to-live", clusterEnd, "live-app", "Serve", "traffic"),
    makeEdge("user-to-live", userEnd, "live-app", "Open application", "traffic"),
  ];

  for (const relation of analysis.relations) {
    if (knownNodeIds.has(relation.source) && knownNodeIds.has(relation.target)) edges.push(makeEdge(`extracted-${relation.id}`, relation.source, relation.target, relation.label, relation.kind));
  }

  return { nodes, edges: Array.from(new Map(edges.map((edge) => [edge.id, edge])).values()) };
}
