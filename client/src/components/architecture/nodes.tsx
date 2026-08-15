/**
 * Visual direction: charcoal service cards on a technical board, surrounded by restrained dashed groups.
 * The palette relies on functional green, olive, amber, and pink accents rather than blue or neon effects.
 */
import { CircleAlert, ExternalLink } from "lucide-react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { resolveIcon } from "@/lib/iconResolver";

export type ContainerNodeData = { label: string; color: string; collapsed: boolean; childCount: number };
export type ServiceNodeData = { label: string; icon: string };
type ContainerNode = Node<ContainerNodeData, "containerGroup">;
type ServiceNode = Node<ServiceNodeData, "devopsService" | "pipelineStep">;

function NodeIcon({ icon, label }: { icon: string; label: string }) {
  const resolution = resolveIcon(icon);
  if (resolution.kind === "image") {
    return <img className="architecture-node__icon" src={resolution.src} alt="" aria-hidden="true" />;
  }

  return (
    <div className="architecture-node__missing" title={`${resolution.instructions} Sources: ${resolution.sources.join(" · ")}`} aria-label={resolution.instructions}>
      <CircleAlert size={24} strokeWidth={1.7} />
      <ExternalLink className="architecture-node__missing-mark" size={11} />
    </div>
  );
}

export function ContainerGroupNode({ data }: NodeProps<ContainerNode>) {
  return (
    <div className={`architecture-group ${data.collapsed ? "architecture-group--collapsed" : ""}`} style={{ "--group-color": data.color } as React.CSSProperties}>
      <Handle type="target" position={Position.Left} className="architecture-handle architecture-handle--group" />
      <div className="architecture-group__label">{data.label}</div>
      {data.collapsed && <div className="architecture-group__collapsed-count">{data.childCount || "–"}</div>}
      <Handle type="source" position={Position.Right} className="architecture-handle architecture-handle--group" />
    </div>
  );
}

export function DevopsServiceNode({ data }: NodeProps<ServiceNode>) {
  return (
    <div className="architecture-node" title={data.label}>
      <Handle type="target" position={Position.Left} className="architecture-handle" />
      <NodeIcon icon={data.icon} label={data.label} />
      <div className="architecture-node__label">{data.label}</div>
      <Handle type="source" position={Position.Right} className="architecture-handle" />
    </div>
  );
}

export const architectureNodeTypes = {
  containerGroup: ContainerGroupNode,
  devopsService: DevopsServiceNode,
  pipelineStep: DevopsServiceNode,
};
