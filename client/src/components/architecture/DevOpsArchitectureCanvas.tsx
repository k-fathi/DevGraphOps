/**
 * Visual direction: off-black diagram workspace with charcoal controls, dashed green routing,
 * and limited olive, amber, and pink functional signals in place of blue or neon accents.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, FileImage, FileType2, GitBranch, LoaderCircle, ScanSearch } from "lucide-react";
import { toPng, toSvg } from "html-to-image";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { architectureNodeTypes } from "@/components/architecture/nodes";
import { buildArchitectureLayout, buildJourneyDefinitions, type ArchitectureEdge, type ArchitectureNode, type ArchitectureView, type JourneyDefinition, type JourneyMode } from "@/lib/architectureLayout";
import { trpc } from "@/lib/trpc";
import type { RepositoryAnalysis } from "@/lib/repositoryParser";

export default function DevOpsArchitectureCanvas() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [view, setView] = useState<ArchitectureView>("detailed");
  const [exporting, setExporting] = useState<"png" | "svg" | null>(null);
  const [error, setError] = useState("");
  const [journeyMode, setJourneyMode] = useState<JourneyMode>("overview");
  const [journeys, setJourneys] = useState<JourneyDefinition[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchitectureNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ArchitectureEdge>([]);
  const [flow, setFlow] = useState<ReactFlowInstance<ArchitectureNode, ArchitectureEdge> | null>(null);
  const { mutateAsync: analyzeRepository, isPending: loading } = trpc.repository.analyze.useMutation();

  useEffect(() => {
    if (!analysis) {
      setNodes([]);
      setEdges([]);
      return;
    }
    let active = true;
    buildArchitectureLayout(analysis, view).then((layout) => {
      if (!active) return;
      const definitions = buildJourneyDefinitions(analysis, layout.nodes, layout.edges);
      const selectedJourney = definitions.find((journey) => journey.id === journeyMode);
      const selectedNodes = new Set(selectedJourney?.nodeIds ?? []);
      const selectedEdges = new Set(selectedJourney?.edgeIds ?? []);
      const nodeOrder = new Map((selectedJourney?.nodeIds ?? []).map((id, index) => [id, index + 1]));
      setJourneys(definitions);
      setNodes(layout.nodes.map((node) => {
        if (node.type === "containerGroup") return { ...node, className: selectedJourney && !selectedNodes.has(node.id) ? "journey-node--dimmed" : selectedJourney ? "journey-node--active" : undefined };
        return {
          ...node,
          className: selectedJourney && !selectedNodes.has(node.id) ? "journey-node--dimmed" : selectedJourney ? "journey-node--active" : undefined,
          data: { ...node.data, journeyNumber: nodeOrder.get(node.id), journeyActive: Boolean(selectedJourney && selectedNodes.has(node.id)), journeyDimmed: Boolean(selectedJourney && !selectedNodes.has(node.id)) },
        };
      }));
      setEdges(layout.edges.map((edge) => {
        const isActive = selectedEdges.has(edge.id);
        return {
          ...edge,
          animated: Boolean(selectedJourney && isActive),
          className: selectedJourney ? (isActive ? "journey-edge--active" : "journey-edge--dimmed") : undefined,
          style: selectedJourney ? { ...edge.style, opacity: isActive ? 1 : 0.12, strokeWidth: isActive ? 4 : 1 } : edge.style,
          labelStyle: selectedJourney ? { ...edge.labelStyle, opacity: isActive ? 1 : 0 } : edge.labelStyle,
        };
      }));
      requestAnimationFrame(() => flow?.fitView({ padding: 0.13, duration: 260, maxZoom: 1.08 }));
    });
    return () => {
      active = false;
    };
  }, [analysis, flow, journeyMode, setEdges, setNodes, view]);

  const detectedServices = useMemo(() => analysis ? Object.values(analysis.signals).filter(Boolean).length : 0, [analysis]);
  const providerLabel = analysis?.repository.provider === "github" ? "GitHub" : analysis?.repository.provider === "gitlab" ? "GitLab" : "Bitbucket";
  const activeJourney = useMemo(() => journeys.find((journey) => journey.id === journeyMode), [journeyMode, journeys]);
  const relationshipEvidence = useMemo(() => {
    const labels = new Map(nodes.map((node) => [node.id, node.data.label]));
    return edges.flatMap((edge) => edge.data?.evidence ? [{ id: edge.id, source: labels.get(edge.source) ?? edge.source, target: labels.get(edge.target) ?? edge.target, label: String(edge.label ?? "relates to"), evidence: edge.data.evidence }] : []);
  }, [edges, nodes]);

  const selectJourney = useCallback((nextJourney: JourneyMode) => {
    setJourneyMode(nextJourney);
    if (nextJourney !== "overview") setView("detailed");
  }, []);

  const onJourneyNodeClick = useCallback((_event: React.MouseEvent, node: ArchitectureNode) => {
    if (node.id === "user") selectJourney("user");
    if (node.id === "repository") selectJourney("devops");
  }, [selectJourney]);

  const runAnalysis = useCallback(async (targetUrl: string) => {
    setError("");
    setAnalysis(null);
    try {
      const result = await analyzeRepository({ url: targetUrl });
      setAnalysis(result);
      setJourneyMode("overview");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "An unexpected error occurred while analyzing the repository.");
    }
  }, [analyzeRepository]);

  const onAnalyze = useCallback(async () => {
    const targetUrl = repositoryUrl.trim();
    if (!targetUrl) {
      setError("Paste a public GitHub, GitLab, or Bitbucket repository URL, then select Analyze Repository.");
      return;
    }
    await runAnalysis(targetUrl);
  }, [repositoryUrl, runAnalysis]);

  useEffect(() => {
    const repositoryFromUrl = new URLSearchParams(window.location.search).get("repo");
    if (!repositoryFromUrl) return;
    setRepositoryUrl(repositoryFromUrl);
    void runAnalysis(repositoryFromUrl);
  }, [runAnalysis]);

  const onExport = useCallback(async (format: "png" | "svg") => {
    if (!analysis) {
      setError("Analyze a public repository before exporting a diagram.");
      return;
    }
    const diagram = document.querySelector<HTMLElement>(".architecture-canvas .react-flow");
    if (!diagram) {
      setError("The architecture canvas is not available for export.");
      return;
    }

    setExporting(format);
    setError("");
    try {
      const options = {
        backgroundColor: "#101010",
        cacheBust: true,
        pixelRatio: format === "png" ? 2 : 1,
        filter: (node: HTMLElement) => !node.classList?.contains("react-flow__controls") && !node.classList?.contains("canvas-legend") && !node.classList?.contains("canvas-note"),
      };
      const dataUrl = format === "png" ? await toPng(diagram, options) : await toSvg(diagram, options);
      const link = document.createElement("a");
      link.download = `${analysis.repository.owner}-${analysis.repository.repo}-architecture.${format}`;
      link.href = dataUrl;
      link.click();
    } catch {
      setError("The diagram could not be exported. Analyze the repository again, then retry the export.");
    } finally {
      setExporting(null);
    }
  }, [analysis]);

  return (
    <div className="archtrace-workspace">
      <section className="repository-console" aria-label="Public repository analyzer">
        <div className="repository-console__eyebrow"><ScanSearch size={14} /> Repository to runtime map</div>
        <div className="repository-console__input-row">
          <GitBranch size={17} aria-hidden="true" />
          <input
            value={repositoryUrl}
            onChange={(event) => setRepositoryUrl(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void onAnalyze()}
            placeholder="github.com / gitlab.com / bitbucket.org"
            aria-label="Public repository URL"
          />
          <button className="analyze-button" onClick={() => void onAnalyze()} disabled={loading}>
            {loading ? <LoaderCircle className="spin" size={16} /> : <ScanSearch size={16} />}
            {loading ? "Reading repository" : "Analyze repository"}
          </button>
        </div>
        <p className="repository-console__hint">Supports GitHub, GitLab, and Bitbucket. File trees, selected YAML, and Terraform files are inspected for deployment stages and resource relationships.</p>
        {error && <div className="repository-console__error"><AlertCircle size={15} /> {error}</div>}
      </section>

      {analysis ? <>
      <div className="workspace-toolbar">
        <div className="workspace-toolbar__identity">
          <span className="workspace-toolbar__repo">{analysis.repository.owner}/{analysis.repository.repo}</span>
          <span className="workspace-toolbar__provider">{providerLabel}</span>
          <span className="workspace-toolbar__branch">{analysis.repository.branch}</span>
        </div>
        <div className="view-toggle" role="group" aria-label="Architecture detail level">
          <button className={view === "high" ? "is-active" : ""} onClick={() => setView("high")} aria-pressed={view === "high"}>High-level view</button>
          <button className={view === "detailed" ? "is-active" : ""} onClick={() => setView("detailed")} aria-pressed={view === "detailed"}>Detailed view</button>
        </div>
        <div className="workspace-toolbar__signal"><span className="signal-dot" />{detectedServices} signals · {analysis.relations.length} relationships</div>
        <div className="export-actions" aria-label="Diagram export">
          <span><Download size={13} /> Export</span>
          <button onClick={() => void onExport("png")} disabled={Boolean(exporting)}>{exporting === "png" ? <LoaderCircle className="spin" size={13} /> : <FileImage size={13} />} PNG</button>
          <button onClick={() => void onExport("svg")} disabled={Boolean(exporting)}>{exporting === "svg" ? <LoaderCircle className="spin" size={13} /> : <FileType2 size={13} />} SVG</button>
        </div>
      </div>

      <section className="journey-console" aria-label="Journey trace controls">
        <div className="journey-console__controls" role="group" aria-label="Highlight a repository journey">
          <button className={journeyMode === "overview" ? "is-active" : ""} onClick={() => selectJourney("overview")}>Architecture overview</button>
          <button className={journeyMode === "user" ? "is-active" : ""} onClick={() => selectJourney("user")}>Trace User Journey</button>
          <button className={journeyMode === "devops" ? "is-active" : ""} onClick={() => selectJourney("devops")}>Trace DevOps Journey</button>
        </div>
        <div className="journey-console__explanation">{activeJourney ? activeJourney.summary : "Select a journey to dim unrelated services and reveal its exact ordered route."}</div>
        {activeJourney && <ol className="journey-steps" aria-label={`${activeJourney.title} stages`}>
          {activeJourney.steps.map((step, index) => <li className={step.parallel ? "is-parallel" : ""} key={`${step.id}-${index}`} title={step.evidence ? `Evidence: ${step.evidence}` : step.label}>
            <span className="journey-steps__number">{index + 1}</span>
            <span>{step.label}</span>
            {step.parallel && <em>Parallel</em>}
            {step.evidence && <small>{step.evidence}</small>}
          </li>)}
        </ol>}
        {relationshipEvidence.length > 0 && <details className="relationship-evidence">
          <summary>Relationship evidence ({relationshipEvidence.length})</summary>
          <ul>{relationshipEvidence.map((relationship) => <li key={relationship.id}><span>{relationship.source} <b>{relationship.label}</b> {relationship.target}</span><small>{relationship.evidence}</small></li>)}</ul>
        </details>}
      </section>

      <section className="architecture-canvas" aria-label="Interactive DevOps architecture diagram">
        <div className="canvas-texture" aria-hidden="true" />
        <ReactFlow<ArchitectureNode, ArchitectureEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={architectureNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onJourneyNodeClick}
          onInit={setFlow}
          fitView
          minZoom={0.2}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.1} color="#2d2d2d" />
          <Controls position="bottom-right" showInteractive={false} />
        </ReactFlow>
        <div className="canvas-legend" aria-label="Flow legend">
          <span><i className="legend-line legend-line--traffic" /> User traffic</span>
          <span><i className="legend-line legend-line--deploy" /> DevOps delivery</span>
          <span><i className="legend-line legend-line--dependency" /> Resource dependency</span>
        </div>
        <div className="canvas-note">{analysis.detectedFiles.length ? `Analyzed files: ${analysis.detectedFiles.slice(0, 3).join(" · ")}` : "No infrastructure file signals were detected."}</div>
      </section>
      </> : <section className="architecture-empty" aria-live="polite">
        {loading ? <LoaderCircle className="spin" size={26} aria-hidden="true" /> : <ScanSearch size={26} aria-hidden="true" />}
        <h2>{loading ? "Inspecting repository evidence" : "Analyze a real public repository"}</h2>
        <p>{loading ? "Repogram is reading eligible configuration files and will render only the services and relationships it can evidence." : "Paste a GitHub, GitLab, or Bitbucket repository URL above. No sample architecture is shown before analysis."}</p>
      </section>}
    </div>
  );
}
