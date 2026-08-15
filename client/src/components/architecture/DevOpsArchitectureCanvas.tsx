/**
 * Visual direction: off-black diagram workspace with charcoal controls, dashed green routing,
 * and limited olive, amber, and pink functional signals in place of blue or neon accents.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, FileImage, FileType2, GitBranch, LoaderCircle, ScanSearch, Sparkles } from "lucide-react";
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
import { buildArchitectureLayout, type ArchitectureEdge, type ArchitectureNode, type ArchitectureView } from "@/lib/architectureLayout";
import { analyzePublicRepository, createPreviewAnalysis, type RepositoryAnalysis } from "@/lib/repositoryParser";

const exampleUrl = "https://github.com/argoproj/argo-cd";

export default function DevOpsArchitectureCanvas() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [analysis, setAnalysis] = useState<RepositoryAnalysis>(() => createPreviewAnalysis());
  const [view, setView] = useState<ArchitectureView>("detailed");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"png" | "svg" | null>(null);
  const [error, setError] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchitectureNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ArchitectureEdge>([]);
  const [flow, setFlow] = useState<ReactFlowInstance<ArchitectureNode, ArchitectureEdge> | null>(null);

  useEffect(() => {
    let active = true;
    buildArchitectureLayout(analysis, view).then((layout) => {
      if (!active) return;
      setNodes(layout.nodes);
      setEdges(layout.edges);
      requestAnimationFrame(() => flow?.fitView({ padding: 0.07, duration: 260, maxZoom: 1.25 }));
    });
    return () => {
      active = false;
    };
  }, [analysis, flow, setEdges, setNodes, view]);

  const detectedServices = useMemo(() => Object.values(analysis.signals).filter(Boolean).length, [analysis.signals]);
  const providerLabel = analysis.repository.provider === "github" ? "GitHub" : analysis.repository.provider === "gitlab" ? "GitLab" : "Bitbucket";

  const runAnalysis = useCallback(async (targetUrl: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await analyzePublicRepository(targetUrl);
      setAnalysis(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "An unexpected error occurred while analyzing the repository.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onAnalyze = useCallback(async () => {
    const targetUrl = repositoryUrl.trim();
    if (!targetUrl) {
      setRepositoryUrl(exampleUrl);
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
  }, [analysis.repository.owner, analysis.repository.repo]);

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

      <div className="workspace-toolbar">
        <div className="workspace-toolbar__identity">
          <span className="workspace-toolbar__repo">{analysis.repository.owner}/{analysis.repository.repo}</span>
          <span className="workspace-toolbar__provider">{providerLabel}</span>
          <span className="workspace-toolbar__branch">{analysis.repository.branch}</span>
          {analysis.isPreview && <span className="workspace-toolbar__preview"><Sparkles size={12} /> Reference map</span>}
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

      <section className="architecture-canvas" aria-label="Interactive DevOps architecture diagram">
        <div className="canvas-texture" aria-hidden="true" />
        <ReactFlow<ArchitectureNode, ArchitectureEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={architectureNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
    </div>
  );
}
