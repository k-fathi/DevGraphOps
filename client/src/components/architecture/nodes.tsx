/**
 * Visual direction: charcoal service cards on a technical board, surrounded by restrained dashed groups.
 * The palette relies on functional green, olive, amber, and pink accents rather than blue or neon effects.
 */
import React from "react";
import { ChevronDown, ChevronRight, CircleAlert, ExternalLink } from "lucide-react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { resolveIcon } from "@/lib/iconResolver";
import type { PipelineExecutionState } from "@/lib/repositoryParser";

export type ContainerNodeData = { label: string; color: string; collapsed: boolean; childCount: number; isPipeline?: boolean; providerIcon?: string; pipelineExpanded?: boolean; entryLabels?: string[]; terminalLabels?: string[]; parallelColumnCount?: number; independentCount?: number; onTogglePipeline?: () => void; isCluster?: boolean; clusterExpanded?: boolean; namespaceCount?: number; unscopedCount?: number; onToggleCluster?: () => void };
export type ServiceNodeData = { label: string; icon: string; evidence?: string; tools?: string[]; journeyNumber?: number; journeyActive?: boolean; journeyDimmed?: boolean; pipelineStage?: { phase: string; parallel: boolean; independent?: boolean; closing?: boolean }; executionStatus?: { state: PipelineExecutionState; reportedAt?: string; runUrl?: string }; kubernetesStage?: { layer: string; namespace?: boolean; expanded?: boolean; onToggleNamespace?: () => void; childCount?: number; onToggleWorkload?: () => void } };
type ContainerNode = Node<ContainerNodeData, "containerGroup">;
type ServiceNode = Node<ServiceNodeData, "devopsService" | "pipelineStep">;

function NodeIcon({ icon }: { icon: string }) {
  const resolution = resolveIcon(icon);
  if (resolution.kind === "image") return <img className="architecture-node__icon" src={resolution.src} alt="" aria-hidden="true" />;
  return <div className="architecture-node__missing" title={`${resolution.instructions} Sources: ${resolution.sources.join(" · ")}`} aria-label={resolution.instructions}><CircleAlert size={24} strokeWidth={1.7} /><ExternalLink className="architecture-node__missing-mark" size={11} /></div>;
}

function ToolIcon({ tool }: { tool: string }) {
  const resolution = resolveIcon(tool);
  if (resolution.kind === "image") return <img className="architecture-node__tool-icon" src={resolution.src} alt={tool} title={tool} />;
  return <span className="architecture-node__tool-missing" title={`${tool}: ${resolution.instructions}`}>{tool.slice(0, 2)}</span>;
}

export function ContainerGroupNode({ data }: NodeProps<ContainerNode>) {
  const resolution = data.providerIcon ? resolveIcon(data.providerIcon) : null;
  return <div className={`architecture-group ${data.collapsed ? "architecture-group--collapsed" : ""} ${data.isPipeline ? "architecture-group--pipeline" : ""} ${data.pipelineExpanded ? "architecture-group--pipeline-expanded" : ""} ${data.isCluster ? "architecture-group--cluster" : ""} ${data.clusterExpanded ? "architecture-group--cluster-expanded" : ""}`} style={{ "--group-color": data.color } as React.CSSProperties}>
    <Handle type="target" position={Position.Left} className="architecture-handle architecture-handle--group" />
    <div className="architecture-group__label">{data.label}</div>
    {data.isPipeline && <div className="pipeline-summary">
      <div className="pipeline-summary__identity">{resolution?.kind === "image" && <img src={resolution.src} alt="" aria-hidden="true" />}<span>PIPELINE</span><strong>{data.childCount} sourced stages</strong></div>
      {data.pipelineExpanded ? <><div className="pipeline-summary__guide"><span>START</span><b>{data.entryLabels?.join(" + ") || "Declared entry stage"}</b><i>→</i><span>END</span><b>{data.terminalLabels?.join(" + ") || "Declared terminal stage"}</b></div>{Boolean(data.independentCount) && <small className="pipeline-summary__independent">{data.independentCount} independent checks are separated below the declared path.</small>}</> : <p>Start at the marked entry stage, then expand to trace every declared hand-off.</p>}
      <button type="button" className="pipeline-summary__toggle" aria-expanded={Boolean(data.pipelineExpanded)} onClick={(event) => { event.stopPropagation(); data.onTogglePipeline?.(); }}>
        {data.pipelineExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{data.pipelineExpanded ? "Collapse stages" : "Expand stages"}
      </button>
    </div>}
    {data.isCluster && <div className="cluster-summary">
      <div className="cluster-summary__identity">{resolution?.kind === "image" && <img src={resolution.src} alt="" aria-hidden="true" />}<span>CLUSTER</span><strong>{data.childCount} evidenced resources</strong></div>
      {data.clusterExpanded ? <><div className="cluster-summary__guide"><span>CLUSTER</span><i>→</i><b>{data.namespaceCount ? `${data.namespaceCount} declared namespace${data.namespaceCount === 1 ? "" : "s"}` : "directly declared resources"}</b><i>→</i><b>Ingress · Service · Workloads · Config & Secrets</b></div><div className="cluster-summary__legend" aria-label="Cluster color and arrow legend"><span className="cluster-summary__legend-traffic">Traffic →</span><span className="cluster-summary__legend-deploy">Delivery →</span><span className="cluster-summary__legend-dependency">Dependency →</span><span className="cluster-summary__legend-hierarchy">Owns ↓</span><span className="cluster-summary__legend-focus">Focus: Service → Deployment</span></div></> : <p>Expand to inspect declared namespaces and their sourced runtime, configuration, and secret resources.</p>}
      <button type="button" className="pipeline-summary__toggle" aria-expanded={Boolean(data.clusterExpanded)} onClick={(event) => { event.stopPropagation(); data.onToggleCluster?.(); }}>
        {data.clusterExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{data.clusterExpanded ? "Collapse topology" : "Expand topology"}
      </button>
    </div>}
    {data.collapsed && !data.isPipeline && <div className="architecture-group__collapsed-count">{data.childCount || "–"}</div>}
    <Handle type="source" position={Position.Right} className="architecture-handle architecture-handle--group" />
  </div>;
}

export function DevopsServiceNode({ data }: NodeProps<ServiceNode>) {
  const statusLabel: Record<PipelineExecutionState, string> = { success: "Passed", running: "Running", failed: "Failed", queued: "Queued", neutral: "Not reported" };
  return <div className={`architecture-node ${data.journeyActive ? "architecture-node--journey-active" : ""} ${data.journeyDimmed ? "architecture-node--journey-dimmed" : ""} ${data.pipelineStage ? "architecture-node--pipeline-stage" : ""} ${data.pipelineStage?.closing ? "architecture-node--pipeline-exiting" : ""}`} title={data.evidence ? `${data.label} — evidence: ${data.evidence}` : data.label}>
    <Handle type="target" position={Position.Left} className="architecture-handle" />
    {data.journeyNumber && <span className="architecture-node__sequence" aria-label={`Journey step ${data.journeyNumber}`}>{data.journeyNumber}</span>}
    {data.pipelineStage && <div className="pipeline-stage-badge"><span>{data.pipelineStage.phase}</span>{data.pipelineStage.parallel && <em>PARALLEL</em>}</div>}
    {data.kubernetesStage && <div className="kubernetes-stage-badge"><span>{data.kubernetesStage.layer}</span>{data.kubernetesStage.namespace && <em>{data.kubernetesStage.expanded ? "OPEN" : "EXPAND"}</em>}</div>}
    {data.kubernetesStage?.childCount ? <button type="button" className="workload-expand-toggle" aria-expanded={Boolean(data.kubernetesStage.expanded)} onClick={(event) => { event.stopPropagation(); data.kubernetesStage?.onToggleWorkload?.(); }}>{data.kubernetesStage.expanded ? "Collapse children" : `Expand ${data.kubernetesStage.childCount} children`}</button> : null}
    {data.pipelineStage && <span className={`pipeline-status pipeline-status--${data.executionStatus?.state ?? "neutral"}`} title={data.executionStatus?.reportedAt ? `Reported ${new Date(data.executionStatus.reportedAt).toLocaleString()}` : "No public execution result was reported for this stage"}>{statusLabel[data.executionStatus?.state ?? "neutral"]}</span>}
    <NodeIcon icon={data.icon} />
    <div className="architecture-node__label">{data.label}</div>
    {data.tools?.length ? <div className="architecture-node__tools" aria-label={`Tools used by ${data.label}`}>{data.tools.map((tool) => <span className="architecture-node__tool-link" key={tool}><ToolIcon tool={tool} /></span>)}</div> : null}
    {data.evidence && <div className="architecture-node__evidence">{data.evidence.split("/").at(-1)}</div>}
    <Handle type="source" position={Position.Right} className="architecture-handle" />
  </div>;
}

export const architectureNodeTypes = { containerGroup: ContainerGroupNode, devopsService: DevopsServiceNode, pipelineStep: DevopsServiceNode };
