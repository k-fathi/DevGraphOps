import React from "react";
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from "@xyflow/react";
import type { ArchitectureEdge } from "@/lib/architectureLayout";

export type ExternalRoute = "bottom" | "top";

export function buildExternalRoutePath(sourceX: number, sourceY: number, targetX: number, targetY: number, route: ExternalRoute, clearance = 96) {
  const laneY = route === "bottom" ? Math.max(sourceY, targetY) + clearance : Math.min(sourceY, targetY) - clearance;
  return route === "bottom"
    ? `M ${sourceX} ${sourceY} L ${sourceX} ${laneY} L ${targetX} ${laneY} L ${targetX} ${targetY}`
    : `M ${sourceX} ${sourceY} L ${sourceX} ${laneY} L ${targetX} ${laneY} L ${targetX} ${targetY}`;
}

export function ObstacleAwareEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, label, labelStyle, labelBgStyle, labelBgPadding, labelBgBorderRadius, data }: EdgeProps<ArchitectureEdge>) {
  const route = data?.routing;
  if (!route) return <BaseEdge id={id} path={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`} markerEnd={markerEnd} style={style} />;
  const path = buildExternalRoutePath(sourceX, sourceY, targetX, targetY, route);
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;
  return <>
    <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
    {label ? <EdgeLabelRenderer>
      <div className="react-flow__edge-textwrapper" style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${route === "bottom" ? labelY + 96 : labelY - 96}px)`, ...labelStyle, background: labelBgStyle?.fill, padding: labelBgPadding ? `${labelBgPadding[1]}px ${labelBgPadding[0]}px` : undefined, borderRadius: labelBgBorderRadius }}>
        {String(label)}
      </div>
    </EdgeLabelRenderer> : null}
  </>;
}
