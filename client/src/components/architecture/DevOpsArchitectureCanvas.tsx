/**
 * ArchTrace workspace: a restrained draw.io-inspired canvas where repository analysis,
 * view switching, and ELK relayout are the primary interactions.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, GitBranch, LoaderCircle, ScanSearch, Sparkles } from "lucide-react";
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
      requestAnimationFrame(() => flow?.fitView({ padding: 0.17, duration: 260, maxZoom: 1.1 }));
    });
    return () => {
      active = false;
    };
  }, [analysis, flow, setEdges, setNodes, view]);

  const detectedServices = useMemo(() => Object.values(analysis.signals).filter(Boolean).length, [analysis.signals]);

  const onAnalyze = useCallback(async () => {
    const targetUrl = repositoryUrl.trim();
    if (!targetUrl) {
      setRepositoryUrl(exampleUrl);
      setError("ألصق رابط GitHub عام ثم اضغط تحليل المستودع.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await analyzePublicRepository(targetUrl);
      setAnalysis(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "حدث خطأ غير متوقع أثناء تحليل المستودع.");
    } finally {
      setLoading(false);
    }
  }, [repositoryUrl]);

  return (
    <div className="archtrace-workspace">
      <section className="repository-console" aria-label="GitHub public repository analyzer">
        <div className="repository-console__eyebrow"><ScanSearch size={14} /> من المستودع إلى خريطة التشغيل</div>
        <div className="repository-console__input-row">
          <GitBranch size={17} aria-hidden="true" />
          <input
            value={repositoryUrl}
            onChange={(event) => setRepositoryUrl(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void onAnalyze()}
            placeholder="https://github.com/owner/public-repository"
            aria-label="Public GitHub repository URL"
          />
          <button className="analyze-button" onClick={() => void onAnalyze()} disabled={loading}>
            {loading ? <LoaderCircle className="spin" size={16} /> : <ScanSearch size={16} />}
            {loading ? "جاري القراءة" : "تحليل المستودع"}
          </button>
        </div>
        <p className="repository-console__hint">ضع رابط مستودع عام؛ ستُقرأ شجرة ملفاته بحثًا عن إشارات CI/CD والبنية وKubernetes والمراقبة.</p>
        {error && <div className="repository-console__error"><AlertCircle size={15} /> {error}</div>}
      </section>

      <div className="workspace-toolbar">
        <div className="workspace-toolbar__identity">
          <span className="workspace-toolbar__repo">{analysis.repository.owner}/{analysis.repository.repo}</span>
          <span className="workspace-toolbar__branch">{analysis.repository.branch}</span>
          {analysis.isPreview && <span className="workspace-toolbar__preview"><Sparkles size={12} /> مخطط مرجعي</span>}
        </div>
        <div className="view-toggle" role="group" aria-label="Architecture detail level">
          <button className={view === "high" ? "is-active" : ""} onClick={() => setView("high")} aria-pressed={view === "high"}>High-Level View</button>
          <button className={view === "detailed" ? "is-active" : ""} onClick={() => setView("detailed")} aria-pressed={view === "detailed"}>Full Detailed View</button>
        </div>
        <div className="workspace-toolbar__signal"><span className="signal-dot" />{detectedServices} إشارات تشغيلية</div>
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
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.1} color="#1e293b" />
          <Controls position="bottom-right" showInteractive={false} />
        </ReactFlow>
        <div className="canvas-legend" aria-label="Flow legend">
          <span><i className="legend-line legend-line--traffic" /> Traffic flow</span>
          <span><i className="legend-line legend-line--deploy" /> Deployment flow</span>
        </div>
        <div className="canvas-note">{analysis.detectedFiles.length ? `إشارات: ${analysis.detectedFiles.slice(0, 3).join(" · ")}` : "لم تُكتشف إشارات ملفات بنية بعد."}</div>
      </section>
    </div>
  );
}
