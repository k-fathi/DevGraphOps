/**
 * Repogram layout system: a charcoal technical-board composition with quiet, dashed functional routes.
 * ELK lays out the DevOps delivery path while a parallel user lane converges only at the production app.
 */
import ELK from "elkjs/lib/elk.bundled.js";
import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { ArchitectureDomain, ExtractedComponent, RelationKind, RepositoryAnalysis } from "@/lib/repositoryParser";
import type { ContainerNodeData, ServiceNodeData } from "@/components/architecture/nodes";

export type ArchitectureView = "high" | "detailed";
export type ArchitectureNode = Node<ContainerNodeData, "containerGroup"> | Node<ServiceNodeData, "devopsService"> | Node<ServiceNodeData, "pipelineStep">;
export type ArchitectureEdge = Edge<{ kind: RelationKind; evidence?: string }>;
export type JourneyMode = "overview" | "user" | "devops";
export type JourneyStep = { id: string; label: string; evidence?: string; parallel?: boolean };
export type JourneyDefinition = { id: Exclude<JourneyMode, "overview">; title: string; summary: string; nodeIds: string[]; edgeIds: string[]; steps: JourneyStep[] };

const elk = new ELK();
const LEAF_WIDTH = 148;
const LEAF_HEIGHT = 154;
const CHILD_GAP = 48;

type GroupId = "user-path" | "cicd" | "infrastructure" | "cluster" | "configuration";
type GroupDefinition = { id: GroupId; label: string; color: string; children: ExtractedComponent[]; icon?: string };
type Size = { width: number; height: number };
export type PipelineStagePlacement = { id: string; column: number; row: number; parallel: boolean; isStart: boolean; isEnd: boolean; independent: boolean };
export type PipelinePlan = { stages: PipelineStagePlacement[]; columns: number; rows: number; entryLabels: string[]; terminalLabels: string[]; independentCount: number };

export function buildPipelinePlan(analysis: Pick<RepositoryAnalysis, "components" | "relations">): PipelinePlan {
  const pipeline = analysis.components.filter((component) => component.domain === "pipeline");
  const ids = new Set(pipeline.map((component) => component.id));
  const relations = analysis.relations.filter((relation) => relation.kind === "deployment" && ids.has(relation.source) && ids.has(relation.target));
  const indexById = new Map(pipeline.map((component, index) => [component.id, index]));
  const incoming = new Map(pipeline.map((component) => [component.id, 0]));
  const outgoing = new Map(pipeline.map((component) => [component.id, [] as string[]]));
  const levels = new Map<string, number>();
  for (const relation of relations) {
    incoming.set(relation.target, (incoming.get(relation.target) ?? 0) + 1);
    outgoing.get(relation.source)?.push(relation.target);
  }
  const queue = pipeline.filter((component) => (incoming.get(component.id) ?? 0) === 0).map((component) => component.id);
  const visited = new Set<string>();
  while (queue.length) {
    queue.sort((left, right) => (indexById.get(left) ?? 0) - (indexById.get(right) ?? 0));
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const currentLevel = levels.get(current) ?? 0;
    for (const target of outgoing.get(current) ?? []) {
      levels.set(target, Math.max(levels.get(target) ?? 0, currentLevel + 1));
      incoming.set(target, (incoming.get(target) ?? 1) - 1);
      if ((incoming.get(target) ?? 0) === 0) queue.push(target);
    }
  }
  for (const component of pipeline) if (!visited.has(component.id)) levels.set(component.id, levels.get(component.id) ?? 0);
  const standalone = pipeline.filter((component) => !relations.some((relation) => relation.source === component.id || relation.target === component.id));
  const standaloneIds = new Set(standalone.map((component) => component.id));
  const connected = pipeline.filter((component) => !standaloneIds.has(component.id));
  const columnMembers = new Map<number, ExtractedComponent[]>();
  for (const component of connected) {
    const column = levels.get(component.id) ?? 0;
    const members = columnMembers.get(column) ?? [];
    members.push(component);
    columnMembers.set(column, members);
  }
  const starts = connected.filter((component) => !relations.some((relation) => relation.target === component.id));
  const ends = connected.filter((component) => !relations.some((relation) => relation.source === component.id));
  const connectedRows = Math.max(1, ...Array.from(columnMembers.values()).map((members) => members.length));
  const stages = connected.map((component) => {
    const column = levels.get(component.id) ?? 0;
    const siblings = columnMembers.get(column) ?? [component];
    return { id: component.id, column, row: siblings.findIndex((item) => item.id === component.id), parallel: siblings.length > 1, isStart: starts.some((item) => item.id === component.id), isEnd: ends.some((item) => item.id === component.id), independent: false };
  }).concat(standalone.map((component, index) => ({
    id: component.id,
    column: index % Math.max(1, Math.min(4, standalone.length)),
    row: connectedRows + 1 + Math.floor(index / Math.max(1, Math.min(4, standalone.length))),
    parallel: true,
    isStart: false,
    isEnd: false,
    independent: true,
  })));
  return {
    stages,
    columns: Math.max(1, ...stages.map((stage) => stage.column + 1)),
    rows: Math.max(1, ...stages.map((stage) => stage.row + 1)),
    entryLabels: starts.slice(0, 2).map((component) => component.label),
    terminalLabels: ends.slice(0, 2).map((component) => component.label),
    independentCount: standalone.length,
  };
}

function groupSize(group: GroupDefinition, view: ArchitectureView, pipelineExpanded: boolean, pipelinePlan: PipelinePlan) {
  const children = group.children;
  if (view === "high") return { width: 172, height: 110 };
  if (group.id === "cicd" && !pipelineExpanded) return { width: 350, height: 194 };
  if (group.id === "cicd") return { width: Math.max(680, 64 + pipelinePlan.columns * (LEAF_WIDTH + 104)), height: 128 + pipelinePlan.rows * (LEAF_HEIGHT + 38) };
  const maxColumns = children.every((child) => child.domain === "pipeline") ? 4 : 3;
  const columns = Math.max(1, Math.min(children.length || 1, maxColumns));
  const rows = Math.max(1, Math.ceil(Math.max(children.length, 1) / maxColumns));
  return { width: Math.max(216, 60 + columns * (LEAF_WIDTH + CHILD_GAP)), height: 70 + rows * (LEAF_HEIGHT + CHILD_GAP) + 28 };
}

function iconForProvider(provider: RepositoryAnalysis["repository"]["provider"]) {
  return provider === "github" ? "GitHub" : provider === "gitlab" ? "GitLab" : "Bitbucket";
}

function serviceNode(id: string, label: string, icon: string, position: { x: number; y: number }, type: "pipelineStep" | "devopsService" = "devopsService", evidence?: string, tools?: string[], pipelineStage?: ServiceNodeData["pipelineStage"]): ArchitectureNode {
  return { id, type, position, draggable: false, selectable: false, data: { label, icon, evidence, tools, pipelineStage }, style: { width: LEAF_WIDTH, height: LEAF_HEIGHT } };
}

function groupNode(definition: GroupDefinition, position: { x: number; y: number }, size: Size, view: ArchitectureView, pipelineExpanded: boolean, pipelinePlan: PipelinePlan): ArchitectureNode {
  const isPipeline = definition.id === "cicd";
  return {
    id: definition.id,
    type: "containerGroup",
    position,
    draggable: false,
    selectable: false,
    zIndex: 0,
    data: {
      label: definition.label,
      color: definition.color,
      collapsed: view === "high" || (isPipeline && !pipelineExpanded),
      childCount: definition.children.length,
      isPipeline,
      providerIcon: definition.icon,
      pipelineExpanded: isPipeline && pipelineExpanded && view === "detailed",
      entryLabels: pipelinePlan.entryLabels,
      terminalLabels: pipelinePlan.terminalLabels,
      parallelColumnCount: pipelinePlan.stages.filter((stage) => stage.parallel).length,
      independentCount: pipelinePlan.independentCount,
    },
    style: { width: size.width, height: size.height },
  };
}

function makeEdge(id: string, source: string, target: string, label: string, kind: RelationKind, evidence?: string): ArchitectureEdge {
  const styleByKind: Record<RelationKind, { stroke: string; strokeWidth: number; strokeDasharray?: string; animated: boolean }> = {
    traffic: { stroke: "#4f9938", strokeWidth: 2.1, strokeDasharray: "8 6", animated: false },
    deployment: { stroke: "#9abb45", strokeWidth: 2.35, strokeDasharray: "7 5", animated: false },
    observability: { stroke: "#f08b2b", strokeWidth: 1.65, strokeDasharray: "3 5", animated: false },
    dependency: { stroke: "#707070", strokeWidth: 1.35, strokeDasharray: "2 4", animated: false },
  };
  const style = styleByKind[kind];
  return {
    id, source, target, type: "step", animated: style.animated, label, data: { kind, evidence }, selectable: false, zIndex: 2,
    markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke, width: 18, height: 18 },
    style: { stroke: style.stroke, strokeWidth: style.strokeWidth, strokeDasharray: style.strokeDasharray },
    labelStyle: { fill: "#d8d8d8", fontSize: 10, fontWeight: 600 }, labelBgStyle: { fill: "#171717", fillOpacity: 0.96 }, labelBgPadding: [5, 3], labelBgBorderRadius: 2,
  };
}

function createGroups(analysis: RepositoryAnalysis): GroupDefinition[] {
  const byDomain = (domain: ArchitectureDomain) => analysis.components.filter((component) => component.domain === domain);
  const runtimeFlowRank = (component: ExtractedComponent) => {
    if (component.icon === "Ingress" || component.icon === "Load Balancer") return 0;
    if (component.icon === "Service") return 1;
    if (["Deployment", "StatefulSet", "DaemonSet", "Pod"].includes(component.icon)) return 2;
    return 3;
  };
  const user = analysis.relations.some((relation) => relation.source === "user" && relation.kind === "traffic" && Boolean(relation.evidence)) ? byDomain("user") : [];
  const pipeline = byDomain("pipeline");
  const infrastructure = byDomain("infrastructure");
  const allCluster = byDomain("cluster").sort((left, right) => runtimeFlowRank(left) - runtimeFlowRank(right) || left.label.localeCompare(right.label));
  const configurationIcons = new Set(["ConfigMap", "Secret", "Namespace", "HorizontalPodAutoscaler", "PersistentVolumeClaim"]);
  const cluster = allCluster.filter((component) => !configurationIcons.has(component.icon));
  const configuration = allCluster.filter((component) => configurationIcons.has(component.icon));
  const hasObservedMonitoring = cluster.some((component) => /prometheus|grafana|monitoring|observability/i.test(`${component.label} ${component.icon}`));
  const pipelineLabel = pipeline.some((component) => component.icon === "GitHub Actions") ? "B · PIPELINE · GITHUB ACTIONS" : pipeline.some((component) => component.icon === "GitLab") ? "B · PIPELINE · GITLAB CI" : "B · DEVOPS · PIPELINE";
  const pipelineIcon = pipeline.some((component) => component.icon === "GitHub Actions") ? "GitHub Actions" : pipeline.some((component) => component.icon === "GitLab") ? "GitLab" : pipeline.some((component) => component.icon === "Jenkins") ? "Jenkins" : "GitHub";
  const candidateGroups: GroupDefinition[] = [
    { id: "user-path", label: "A · USER JOURNEY · LIVE PATH", color: "#4f9938", children: user },
    { id: "cicd", label: pipelineLabel, color: "#7d9d36", children: pipeline, icon: pipelineIcon },
    { id: "infrastructure", label: "C · INFRASTRUCTURE · TERRAFORM & AUTOMATION", color: "#f08b2b", children: infrastructure },
    { id: "cluster", label: hasObservedMonitoring ? "D · KUBERNETES · RUNTIME & OBSERVABILITY" : "D · KUBERNETES · RUNTIME & WORKLOADS", color: "#df77b7", children: cluster },
    { id: "configuration", label: "E · KUBERNETES · CONFIGURATION & SECRETS", color: "#8e78c6", children: configuration },
  ];
  return candidateGroups.filter((group) => group.children.length > 0);
}

async function calculateDevOpsLayout(items: Array<{ id: string; width: number; height: number }>) {
  const layout = await elk.layout({
    id: "devops-root",
    layoutOptions: {
      "elk.algorithm": "layered", "elk.direction": "RIGHT", "elk.edgeRouting": "ORTHOGONAL", "elk.spacing.nodeNode": "108", "elk.layered.spacing.nodeNodeBetweenLayers": "156", "elk.padding": "[top=64,left=72,bottom=64,right=72]",
    },
    children: items,
    edges: items.slice(0, -1).map((item, index) => ({ id: `elk-${item.id}-${items[index + 1].id}`, sources: [item.id], targets: [items[index + 1].id] })),
  });
  return Object.fromEntries((layout.children ?? []).map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]));
}

function addGroupChildren(nodes: ArchitectureNode[], group: GroupDefinition, pipelinePlan: PipelinePlan, pipelineExpanded: boolean) {
  if (group.id === "cicd") {
    if (!pipelineExpanded) return;
    const placements = new Map(pipelinePlan.stages.map((stage) => [stage.id, stage]));
    for (const child of group.children) {
      const placement = placements.get(child.id);
      if (!placement) continue;
      const phase = placement.independent ? "INDEPENDENT" : placement.isStart && placement.isEnd ? "START / END" : placement.isStart ? "START" : placement.isEnd ? "END" : `STAGE ${placement.column + 1}`;
      nodes.push({
        ...serviceNode(child.id, child.label, child.icon, { x: 38 + placement.column * (LEAF_WIDTH + 104), y: 98 + placement.row * (LEAF_HEIGHT + 38) }, "pipelineStep", child.evidence, child.tools, { phase, parallel: placement.parallel, independent: placement.independent }),
        parentId: group.id,
        extent: "parent",
        zIndex: 3,
      });
    }
    return;
  }
  const columns = 3;
  group.children.forEach((child, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    nodes.push({
      ...serviceNode(child.id, child.label, child.icon, { x: 30 + column * (LEAF_WIDTH + CHILD_GAP), y: 58 + row * (LEAF_HEIGHT + CHILD_GAP) }, child.domain === "pipeline" ? "pipelineStep" : "devopsService", child.evidence, child.tools),
      parentId: group.id, extent: "parent", zIndex: 3,
    });
  });
}

function orderedPipelineSteps(analysis: RepositoryAnalysis) {
  const allPipeline = analysis.components.filter((component) => component.domain === "pipeline");
  const evidencedPipeline = allPipeline.filter((component) => Boolean(component.evidence));
  const pipeline = evidencedPipeline.length ? evidencedPipeline : allPipeline;
  const ids = new Set(pipeline.map((component) => component.id));
  const edges = analysis.relations.filter((relation) => relation.kind === "deployment" && ids.has(relation.source) && ids.has(relation.target));
  const incoming = new Map(pipeline.map((component) => [component.id, 0]));
  const outgoing = new Map(pipeline.map((component) => [component.id, [] as string[]]));
  for (const edge of edges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge.target);
  }
  const byId = new Map(pipeline.map((component) => [component.id, component]));
  const pending = pipeline.filter((component) => (incoming.get(component.id) ?? 0) === 0).map((component) => component.id);
  const ordered: JourneyStep[] = [];
  const seen = new Set<string>();
  while (pending.length) {
    const batch = pending.splice(0);
    for (const id of batch) {
      if (seen.has(id)) continue;
      seen.add(id);
      const component = byId.get(id);
      if (component) ordered.push({ id, label: component.label, evidence: component.evidence, parallel: batch.length > 1 });
      for (const target of outgoing.get(id) ?? []) {
        incoming.set(target, (incoming.get(target) ?? 1) - 1);
        if ((incoming.get(target) ?? 0) === 0) pending.push(target);
      }
    }
  }
  for (const component of pipeline) if (!seen.has(component.id)) ordered.push({ id: component.id, label: component.label, evidence: component.evidence, parallel: true });
  return ordered;
}

export function buildJourneyDefinitions(analysis: RepositoryAnalysis, nodes: ArchitectureNode[], edges: ArchitectureEdge[]): JourneyDefinition[] {
  const known = new Set(nodes.map((node) => node.id));
  const labels = new Map<string, JourneyStep>([
    ["repository", { id: "repository", label: `${analysis.repository.owner}/${analysis.repository.repo}` }],
    ...analysis.components.map((component) => [component.id, { id: component.id, label: component.label, evidence: component.evidence }] as const),
  ]);
  const presentEdges = new Set(edges.map((edge) => edge.id));
  const trafficEdges = edges.filter((edge) => edge.data?.kind === "traffic");
  const queue: Array<{ id: string; nodes: string[]; edgeIds: string[] }> = [{ id: "user", nodes: ["user"], edgeIds: [] }];
  const workloadIds = new Set(analysis.components.filter((component) => ["Deployment", "StatefulSet", "DaemonSet", "Pod"].includes(component.icon)).map((component) => component.id));
  const visited = new Set(["user"]);
  let userPath: { nodes: string[]; edgeIds: string[] } = { nodes: [], edgeIds: [] };
  while (queue.length) {
    const current = queue.shift()!;
    if (workloadIds.has(current.id)) { userPath = { nodes: current.nodes, edgeIds: current.edgeIds }; break; }
    for (const edge of trafficEdges.filter((candidate) => candidate.source === current.id)) {
      if (visited.has(edge.target)) continue;
      visited.add(edge.target);
      queue.push({ id: edge.target, nodes: [...current.nodes, edge.target], edgeIds: [...current.edgeIds, edge.id] });
    }
  }
  const userEdgeIds = userPath.edgeIds.filter((id) => presentEdges.has(id));
  const userNodeIds = userPath.nodes.filter((id) => known.has(id));
  const userSteps = userNodeIds.map((id) => labels.get(id) ?? { id, label: id });
  const userPathIsDeclared = userNodeIds.length > 2;
  const runtimeAvailable = userNodeIds.some((id) => workloadIds.has(id));

  const pipelineSteps = orderedPipelineSteps(analysis).filter((step) => known.has(step.id));
  const observedDomainSteps = (domain: ArchitectureDomain) => {
    const items = analysis.components.filter((component) => component.domain === domain && known.has(component.id));
    const evidenced = items.filter((component) => Boolean(component.evidence));
    return (evidenced.length ? evidenced : items).map((component) => ({ id: component.id, label: component.label, evidence: component.evidence }));
  };
  const infrastructure = observedDomainSteps("infrastructure");
  const runtime = observedDomainSteps("cluster");
  const runtimeDeclared = runtime.length > 0;
  const devOpsEdgeIds = edges.filter((edge) => edge.data?.kind === "deployment" && known.has(edge.source) && known.has(edge.target)).map((edge) => edge.id);
  const devOpsNodeIds = Array.from(new Set(["repository", "cicd", ...pipelineSteps.map((step) => step.id), "infrastructure", ...infrastructure.map((step) => step.id), "cluster", ...runtime.map((step) => step.id)].filter((id) => known.has(id))));
  const devOpsSteps = [labels.get("repository")!, ...pipelineSteps, ...infrastructure, ...runtime];

  return [
    { id: "user", title: "User Journey", summary: !runtimeAvailable ? "No application runtime or public-access path is declared in the analyzed files, so a user journey cannot be inferred." : userPathIsDeclared ? "Trace the declared request path from user access to the application runtime." : "No DNS, gateway, load balancer, or ingress path is declared in the analyzed files. The external path is shown as unresolved rather than inferred.", nodeIds: userNodeIds, edgeIds: userEdgeIds, steps: userSteps },
    { id: "devops", title: "DevOps Journey", summary: runtimeDeclared ? "Trace observed delivery evidence from repository to the declared application runtime. Live availability is not inferred." : "Trace observed delivery evidence from repository to the last discovered deployment stage.", nodeIds: devOpsNodeIds, edgeIds: devOpsEdgeIds, steps: devOpsSteps },
  ];
}

export async function buildArchitectureLayout(analysis: RepositoryAnalysis, view: ArchitectureView, pipelineExpanded = false): Promise<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] }> {
  const groups = createGroups(analysis);
  const pipelinePlan = buildPipelinePlan(analysis);
  const sizes = Object.fromEntries(groups.map((group) => [group.id, groupSize(group, view, pipelineExpanded, pipelinePlan)])) as Partial<Record<GroupId, Size>>;
  const devOpsGroups = groups.filter((group) => group.id !== "user-path");
  const devOpsItems = [{ id: "repository", width: LEAF_WIDTH + 20, height: LEAF_HEIGHT }, ...devOpsGroups.map((group) => ({ id: group.id, ...sizes[group.id]! }))];
  const positions = await calculateDevOpsLayout(devOpsItems);
  const devOpsBaseY = 370;
  const userWidth = sizes["user-path"]?.width ?? 172;
  const lastItem = devOpsItems.at(-1)!;
  const terminalX = positions[lastItem.id].x + lastItem.width + 110;
  const userPosition = { x: Math.max(42, Math.floor((terminalX - userWidth) / 2)), y: 34 };
  const userGroup = groups.find((group) => group.id === "user-path");
  const groupChildren = (id: GroupId) => groups.find((group) => group.id === id)?.children ?? [];
  const user = groupChildren("user-path");
  const pipeline = groupChildren("cicd");
  const infrastructure = groupChildren("infrastructure");
  const cluster = groupChildren("cluster");
  const nodes: ArchitectureNode[] = [
    ...(userGroup ? [groupNode(userGroup, userPosition, sizes["user-path"]!, view, pipelineExpanded, pipelinePlan)] : []),
    serviceNode("repository", `${analysis.repository.owner}/${analysis.repository.repo}`, iconForProvider(analysis.repository.provider), { x: positions.repository.x, y: positions.repository.y + devOpsBaseY }, "devopsService"),
    ...(pipeline.length ? [serviceNode("devops-engineer", "DevOps Engineer", "Users", { x: positions.cicd.x, y: Math.max(42, positions.cicd.y + devOpsBaseY - LEAF_HEIGHT - 76) }, "devopsService", pipeline[0]?.evidence)] : []),
    ...devOpsGroups.map((group) => groupNode(group, { x: positions[group.id].x, y: positions[group.id].y + devOpsBaseY }, sizes[group.id]!, view, pipelineExpanded, pipelinePlan)),
  ];

  if (view === "detailed") groups.forEach((group) => addGroupChildren(nodes, group, pipelinePlan, pipelineExpanded));

  const knownNodeIds = new Set(nodes.map((node) => node.id));

  if (view === "high") {
    return { nodes, edges: [] };
  }

  const edges: ArchitectureEdge[] = [];

  for (const relation of analysis.relations) {
    if (knownNodeIds.has(relation.source) && knownNodeIds.has(relation.target) && relation.evidence) edges.push(makeEdge(`extracted-${relation.id}`, relation.source, relation.target, relation.label, relation.kind, relation.evidence));
  }

  if (pipeline.length && knownNodeIds.has("devops-engineer")) {
    edges.push(makeEdge("devops-engineer-pipeline", "devops-engineer", pipeline[0].id, "operates", "deployment", pipeline[0].evidence));
  }

  return { nodes, edges: Array.from(new Map(edges.map((edge) => [edge.id, edge])).values()) };
}
