/**
 * Visual direction: off-black diagram workspace with charcoal controls, dashed green routing,
 * and limited olive, amber, and pink functional signals in place of blue or neon accents.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Clipboard, Download, FileCode2, FileImage, FileType2, GitBranch, LoaderCircle, Maximize2, Minus, Plus, ScanSearch, Save, Upload } from "lucide-react";
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
import { ObstacleAwareEdge } from "@/components/architecture/ObstacleAwareEdge";
import { buildArchitectureLayout, buildJourneyDefinitions, buildPipelinePlan, type ArchitectureEdge, type ArchitectureNode, type ArchitectureView, type JourneyDefinition, type JourneyMode } from "@/lib/architectureLayout";
import { trpc } from "@/lib/trpc";
import type { RepositoryAnalysis } from "@/lib/repositoryParser";
import { buildShareUrl, DEFAULT_ANALYSIS_PREFERENCES, loadAnalysisPreferences, preferenceSnapshot, preferencesFromSearch, saveAnalysisPreferences, type AnalysisPreferences } from "@/lib/analysisPreferences";
import { createEvidenceSelection, selectNodeEvidence, selectRelationshipEvidence, tokenizeEvidenceLine, type EvidenceSelection } from "@/lib/evidencePanel";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function PipelineStatusScope({ provider }: { provider: RepositoryAnalysis["repository"]["provider"] }) {
  return <><small>{provider === "github" ? "Colors are applied only when the public GitHub Actions API reports a recent job result." : "Live execution status is currently available for public GitHub Actions repositories only."}</small><div className="pipeline-status-legend__note">Stages without a report remain neutral rather than receiving a simulated result.</div></>;
}

export default function DevOpsArchitectureCanvas() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [view, setView] = useState<ArchitectureView>("detailed");
  const [exporting, setExporting] = useState<"png" | "svg" | null>(null);
  const [error, setError] = useState("");
  const [journeyMode, setJourneyMode] = useState<JourneyMode>("overview");
  const [pipelineExpanded, setPipelineExpanded] = useState(false);
  const [pipelineClosing, setPipelineClosing] = useState(false);
  const [clusterExpanded, setClusterExpanded] = useState(false);
  const [expandedNamespaceIds, setExpandedNamespaceIds] = useState<string[]>([]);
  const [expandedWorkloadIds, setExpandedWorkloadIds] = useState<string[]>([]);
  const [serviceDeploymentFocus, setServiceDeploymentFocus] = useState(false);
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [namespaceFilter, setNamespaceFilter] = useState("all");
  const [shareMessage, setShareMessage] = useState("");
  const pendingPreferences = useRef<Partial<AnalysisPreferences> | null>(null);
  const [journeys, setJourneys] = useState<JourneyDefinition[]>([]);
  const [evidenceSelection, setEvidenceSelection] = useState<EvidenceSelection | null>(null);
  const [hoverHint, setHoverHint] = useState("");
  const [zoomPercent, setZoomPercent] = useState(100);
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchitectureNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ArchitectureEdge>([]);
  const [flow, setFlow] = useState<ReactFlowInstance<ArchitectureNode, ArchitectureEdge> | null>(null);
  const { mutateAsync: analyzeRepository, isPending: loading } = trpc.repository.analyze.useMutation();
  const showPipelineDetails = pipelineExpanded || pipelineClosing;
  const edgeTypes = useMemo(() => ({ obstacleAware: ObstacleAwareEdge }), []);
  const applyPreferences = useCallback((raw: Partial<AnalysisPreferences>) => {
    const preferences = { ...DEFAULT_ANALYSIS_PREFERENCES, ...raw };
    setView(preferences.view);
    setJourneyMode(preferences.journeyMode);
    setPipelineExpanded(preferences.pipelineExpanded);
    setPipelineClosing(false);
    setClusterExpanded(preferences.clusterExpanded);
    setExpandedNamespaceIds(preferences.expandedNamespaceIds);
    setExpandedWorkloadIds(preferences.expandedWorkloadIds);
    setServiceDeploymentFocus(preferences.serviceDeploymentFocus);
    setEnvironmentFilter(preferences.environmentFilter);
    setNamespaceFilter(preferences.namespaceFilter);
  }, []);
  const currentPreferences = useMemo<AnalysisPreferences>(() => preferenceSnapshot({ view, journeyMode, pipelineExpanded, clusterExpanded, expandedNamespaceIds, expandedWorkloadIds, serviceDeploymentFocus, environmentFilter, namespaceFilter }), [clusterExpanded, environmentFilter, expandedNamespaceIds, expandedWorkloadIds, journeyMode, namespaceFilter, pipelineExpanded, serviceDeploymentFocus, view]);
  const diagramAnalysis = useMemo(() => {
    if (!analysis) return null;
    const visibleComponents = analysis.components.filter((component) => (environmentFilter === "all" || component.environment === environmentFilter) && (namespaceFilter === "all" || component.namespace === namespaceFilter));
    const visibleIds = new Set(visibleComponents.map((component) => component.id));
    const visibleGroups = new Set(visibleComponents.map((component) => component.domain === "pipeline" ? "cicd" : component.domain === "infrastructure" ? "infrastructure" : component.domain === "cluster" ? "cluster" : component.domain === "user" ? "user-path" : component.id));
    const endpointIsVisible = (endpoint: string) => visibleIds.has(endpoint) || visibleGroups.has(endpoint);
    const visibleRelations = analysis.relations.filter((relation) => endpointIsVisible(relation.source) && endpointIsVisible(relation.target));
    return { ...analysis, components: visibleComponents, relations: visibleRelations };
  }, [analysis, environmentFilter, namespaceFilter]);
  const availableEnvironments = useMemo(() => Array.from(new Set((analysis?.components ?? []).map((component) => component.environment).filter((value): value is string => Boolean(value)))).sort(), [analysis]);
  const availableNamespaces = useMemo(() => Array.from(new Set((analysis?.components ?? []).map((component) => component.namespace).filter((value): value is string => Boolean(value)))).sort(), [analysis]);
  const toggleCluster = useCallback(() => {
    setView("detailed");
    setClusterExpanded((expanded) => !expanded);
  }, []);
  const toggleNamespace = useCallback((namespace: string) => {
    const token = `namespace:${namespace}`;
    setExpandedNamespaceIds((current) => current.includes(token) ? current.filter((item) => item !== token) : [...current, token]);
  }, []);
  const toggleWorkload = useCallback((workloadId: string) => {
    setExpandedWorkloadIds((current) => current.includes(workloadId) ? current.filter((item) => item !== workloadId) : [...current, workloadId]);
  }, []);
  const togglePipeline = useCallback(() => {
    if (!pipelineExpanded) {
      setPipelineClosing(false);
      setView("detailed");
      setPipelineExpanded(true);
      return;
    }
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setPipelineExpanded(false);
      setPipelineClosing(false);
      return;
    }
    setPipelineClosing(true);
    window.setTimeout(() => {
      setPipelineExpanded(false);
      setPipelineClosing(false);
    }, 230);
  }, [pipelineExpanded]);

  useEffect(() => {
    if (!analysis) {
      setNodes([]);
      setEdges([]);
      return;
    }
    let active = true;
    if (!diagramAnalysis) return;
    buildArchitectureLayout(diagramAnalysis, view, showPipelineDetails, pipelineClosing, clusterExpanded, expandedNamespaceIds, expandedWorkloadIds).then((layout) => {
      if (!active) return;
      const definitions = buildJourneyDefinitions(diagramAnalysis, layout.nodes, layout.edges);
      const selectedJourney = definitions.find((journey) => journey.id === journeyMode);
      const selectedNodes = new Set(selectedJourney?.nodeIds ?? []);
      const selectedEdges = new Set(selectedJourney?.edgeIds ?? []);
      const focusRelation = diagramAnalysis.relations.find((relation) => relation.label === "Selects" && diagramAnalysis.components.some((component) => component.id === relation.source && component.icon === "Service") && diagramAnalysis.components.some((component) => component.id === relation.target && component.icon === "Deployment"));
      const focusedNodes = new Set(serviceDeploymentFocus && focusRelation ? [focusRelation.source, focusRelation.target] : []);
      const focusedEdge = focusRelation ? `extracted-${focusRelation.id}` : undefined;
      const nodeOrder = new Map((selectedJourney?.nodeIds ?? []).map((id, index) => [id, index + 1]));
      setJourneys(definitions);
      setNodes(layout.nodes.map((node) => {
        if (node.type === "containerGroup") return {
          ...node,
          className: selectedJourney && !selectedNodes.has(node.id) ? "journey-node--dimmed" : selectedJourney ? "journey-node--active" : undefined,
          data: node.id === "cicd" ? { ...node.data, onTogglePipeline: togglePipeline } : node.id === "cluster" ? { ...node.data, onToggleCluster: toggleCluster } : node.data,
        };
        return {
          ...node,
          className: serviceDeploymentFocus ? (focusedNodes.has(node.id) ? "cluster-focus-node--active" : "cluster-focus-node--dimmed") : selectedJourney && !selectedNodes.has(node.id) ? "journey-node--dimmed" : selectedJourney ? "journey-node--active" : undefined,
          data: { ...node.data, journeyNumber: nodeOrder.get(node.id), journeyActive: Boolean(selectedJourney && selectedNodes.has(node.id)), journeyDimmed: Boolean(selectedJourney && !selectedNodes.has(node.id)), kubernetesStage: node.data.kubernetesStage?.namespace ? { ...node.data.kubernetesStage, onToggleNamespace: () => { const component = analysis.components.find((item) => item.id === node.id); const namespace = component?.namespace ?? component?.label.replace(/^Namespace(?: scope)?:\s*/i, ""); if (namespace) toggleNamespace(namespace); } } : node.data.kubernetesStage?.childCount ? { ...node.data.kubernetesStage, onToggleWorkload: () => toggleWorkload(node.id) } : node.data.kubernetesStage },
        };
      }));
      setEdges(layout.edges.map((edge) => {
        const isActive = serviceDeploymentFocus ? edge.id === focusedEdge : selectedEdges.has(edge.id);
        const isHighlighted = Boolean(serviceDeploymentFocus || selectedJourney);
        return {
          ...edge,
          animated: Boolean(isHighlighted && isActive),
          className: isHighlighted ? (isActive ? "journey-edge--active" : "journey-edge--dimmed") : undefined,
          style: isHighlighted ? { ...edge.style, opacity: isActive ? 1 : 0.08, strokeWidth: isActive ? 4 : 1 } : edge.style,
          labelStyle: isHighlighted ? { ...edge.labelStyle, opacity: isActive ? 1 : 0 } : edge.labelStyle,
        };
      }));
      requestAnimationFrame(() => flow?.fitView({
        nodes: showPipelineDetails ? layout.nodes.filter((node) => node.id === "cicd" || node.parentId === "cicd") : clusterExpanded ? layout.nodes.filter((node) => node.id === "cluster" || node.parentId === "cluster") : undefined,
        padding: showPipelineDetails || clusterExpanded ? 0.1 : 0.13,
        duration: 260,
        maxZoom: showPipelineDetails || clusterExpanded ? 1.2 : 1.08,
      }));
    });
    return () => {
      active = false;
    };
  }, [analysis, clusterExpanded, diagramAnalysis, expandedNamespaceIds, expandedWorkloadIds, flow, journeyMode, pipelineClosing, serviceDeploymentFocus, setEdges, setNodes, showPipelineDetails, toggleCluster, toggleNamespace, togglePipeline, toggleWorkload, view]);

  const detectedServices = useMemo(() => analysis ? Object.values(analysis.signals).filter(Boolean).length : 0, [analysis]);
  const providerLabel = analysis?.repository.provider === "github" ? "GitHub" : analysis?.repository.provider === "gitlab" ? "GitLab" : "Bitbucket";
  const activeJourney = useMemo(() => journeys.find((journey) => journey.id === journeyMode), [journeyMode, journeys]);
  const pipelineFlow = useMemo(() => {
    if (!analysis) return [];
    const plan = buildPipelinePlan(diagramAnalysis ?? analysis);
    const byId = new Map((diagramAnalysis ?? analysis).components.map((component) => [component.id, component]));
    const normalizedJobName = (value: string) => value.replace(/^Job:\s*/i, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    const statuses = new Map((analysis.pipelineExecutionStatuses ?? []).map((status) => [normalizedJobName(status.jobName), status]));
    return Array.from({ length: plan.columns }, (_, column) => plan.stages.filter((stage) => !stage.independent && stage.column === column).sort((left, right) => left.row - right.row).map((stage) => {
      const label = byId.get(stage.id)?.label ?? stage.id;
      return { ...stage, label, status: statuses.get(normalizedJobName(label)) };
    }));
  }, [analysis, diagramAnalysis]);
  const executionStatusLabel = (state: "success" | "running" | "failed" | "queued" | "neutral") => ({ success: "Passed", running: "Running", failed: "Failed", queued: "Queued", neutral: "Not reported" })[state];
  const relationshipEvidence = useMemo(() => {
    const labels = new Map(nodes.map((node) => [node.id, node.data.label]));
    return edges.flatMap((edge) => edge.data?.evidence ? [{ id: edge.id, source: labels.get(edge.source) ?? edge.source, target: labels.get(edge.target) ?? edge.target, label: String(edge.label ?? "relates to"), evidence: edge.data.evidence }] : []);
  }, [edges, nodes]);
  const evidenceByPath = useMemo(() => new Map((analysis?.evidenceSnippets ?? []).map((snippet) => [snippet.path, snippet])), [analysis]);
  const selectedSnippet = evidenceSelection ? evidenceByPath.get(evidenceSelection.path) : undefined;

  const openEvidence = useCallback((path: string | undefined, title: string, relationship?: string) => {
    const selection = createEvidenceSelection(path, title, relationship);
    if (selection) setEvidenceSelection(selection);
  }, []);

  const selectJourney = useCallback((nextJourney: JourneyMode) => {
    setJourneyMode(nextJourney);
    if (nextJourney === "overview") return;
    setView("detailed");
    setClusterExpanded(true);
  }, []);

  const onJourneyNodeClick = useCallback((_event: React.MouseEvent, node: ArchitectureNode) => {
    if (node.id === "cicd") {
      togglePipeline();
      return;
    }
    if (node.id === "cluster") {
      toggleCluster();
      return;
    }
    if (node.type !== "containerGroup" && node.data.kubernetesStage?.namespace) {
      const component = analysis?.components.find((item) => item.id === node.id);
      const namespace = component?.namespace ?? component?.label.replace(/^Namespace(?: scope)?:\s*/i, "");
      if (namespace) toggleNamespace(namespace);
      return;
    }
    if (node.type !== "containerGroup" && node.data.kubernetesStage?.childCount) {
      toggleWorkload(node.id);
      return;
    }
    if (node.type !== "containerGroup") {
      const selection = selectNodeEvidence(node.data.evidence, node.data.label);
      if (selection) setEvidenceSelection(selection);
    }
    if (node.id === "user") selectJourney("user");
    if (node.id === "repository") selectJourney("devops");
  }, [analysis, openEvidence, selectJourney, toggleCluster, toggleNamespace, togglePipeline, toggleWorkload]);

  const runAnalysis = useCallback(async (targetUrl: string, requestedPreferences?: Partial<AnalysisPreferences>) => {
    setError("");
    setShareMessage("");
    setAnalysis(null);
    setEvidenceSelection(null);
    try {
      const result = await analyzeRepository({ url: targetUrl });
      setAnalysis(result);
      applyPreferences(requestedPreferences ?? DEFAULT_ANALYSIS_PREFERENCES);
      pendingPreferences.current = null;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "An unexpected error occurred while analyzing the repository.");
    }
  }, [analyzeRepository, applyPreferences]);

  const onAnalyze = useCallback(async () => {
    const targetUrl = repositoryUrl.trim();
    if (!targetUrl) {
      setError("Paste a public GitHub, GitLab, or Bitbucket repository URL, then select Analyze Repository.");
      return;
    }
    pendingPreferences.current = null;
    await runAnalysis(targetUrl);
  }, [repositoryUrl, runAnalysis]);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const repositoryFromUrl = search.get("repo");
    if (!repositoryFromUrl) return;
    const sharedPreferences = preferencesFromSearch(window.location.search);
    pendingPreferences.current = sharedPreferences;
    setRepositoryUrl(repositoryFromUrl);
    void runAnalysis(repositoryFromUrl, sharedPreferences);
  }, [runAnalysis]);

  useEffect(() => {
    const evidencePath = new URLSearchParams(window.location.search).get("evidence");
    if (!analysis || !evidencePath || !analysis.evidenceSnippets.some((snippet) => snippet.path === evidencePath)) return;
    const component = analysis.components.find((item) => item.evidence === evidencePath);
    setEvidenceSelection(createEvidenceSelection(evidencePath, component?.label ?? "Shared source evidence"));
  }, [analysis]);

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

  const onShare = useCallback(async () => {
    if (!analysis) return;
    const shareUrl = buildShareUrl(repositoryUrl, currentPreferences);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("Share link copied");
    } catch {
      setShareMessage("Copy was blocked; use the browser address bar to share this view.");
    }
  }, [analysis, currentPreferences, repositoryUrl]);
  const onSaveSettings = useCallback(() => {
    saveAnalysisPreferences(currentPreferences);
    setShareMessage("Analysis settings saved on this device");
  }, [currentPreferences]);
  const onLoadSettings = useCallback(() => {
    const saved = loadAnalysisPreferences();
    if (!saved) {
      setShareMessage("No saved analysis settings found on this device");
      return;
    }
    applyPreferences(saved);
    setShareMessage("Saved analysis settings loaded");
  }, [applyPreferences]);

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
        {analysis.components.some((component) => component.domain === "pipeline") && <button className="pipeline-toolbar-toggle" onClick={togglePipeline} aria-expanded={pipelineExpanded}>{pipelineExpanded ? "Pipeline: collapse stages" : "Pipeline: expand stages"}</button>}
        {analysis.components.some((component) => component.domain === "cluster") && <button className="pipeline-toolbar-toggle cluster-toolbar-toggle" onClick={toggleCluster} aria-expanded={clusterExpanded}>{clusterExpanded ? "Kubernetes: collapse topology" : "Kubernetes: expand topology"}</button>}
        {diagramAnalysis?.relations.some((relation) => relation.label === "Selects" && diagramAnalysis.components.some((component) => component.id === relation.source && component.icon === "Service") && diagramAnalysis.components.some((component) => component.id === relation.target && component.icon === "Deployment")) && <button className={`pipeline-toolbar-toggle cluster-focus-toggle ${serviceDeploymentFocus ? "is-active" : ""}`} onClick={() => { setView("detailed"); setClusterExpanded(true); setServiceDeploymentFocus((focused) => !focused); }} aria-pressed={serviceDeploymentFocus}>{serviceDeploymentFocus ? "Cluster focus: exit" : "Cluster focus: Service → Deployment"}</button>}
        <div className="workspace-toolbar__signal"><span className="signal-dot" />{detectedServices} signals · {diagramAnalysis?.relations.length ?? 0} relationships</div>
        {shareMessage && <span className="analysis-action-message" role="status">{shareMessage}</span>}
        <div className="analysis-actions" aria-label="Analysis collaboration controls">
          <button onClick={() => void onShare()} title="Copy a shareable analysis URL"><Clipboard size={13} /> Share</button>
          <button onClick={onSaveSettings} title="Save current analysis settings on this device"><Save size={13} /> Save settings</button>
          <button onClick={onLoadSettings} title="Load saved analysis settings"><Upload size={13} /> Load settings</button>
        </div>
        <div className="export-actions" aria-label="Diagram export">
          <span><Download size={13} /> Export</span>
          <button onClick={() => void onExport("png")} disabled={Boolean(exporting)}>{exporting === "png" ? <LoaderCircle className="spin" size={13} /> : <FileImage size={13} />} PNG</button>
          <button onClick={() => void onExport("svg")} disabled={Boolean(exporting)}>{exporting === "svg" ? <LoaderCircle className="spin" size={13} /> : <FileType2 size={13} />} SVG</button>
        </div>
      </div>

      <section className="diagram-filters" aria-label="Diagram filters">
        <div className="diagram-filters__heading"><strong>FILTER EVIDENCED RESOURCES</strong><span>{diagramAnalysis?.components.length ?? 0} visible of {analysis.components.length}</span></div>
        <label>Environment<select value={environmentFilter} onChange={(event) => { setEnvironmentFilter(event.target.value); setServiceDeploymentFocus(false); }}><option value="all">All environments</option>{availableEnvironments.map((environment) => <option value={environment} key={environment}>{environment}</option>)}</select></label>
        <label>Namespace<select value={namespaceFilter} onChange={(event) => { setNamespaceFilter(event.target.value); setServiceDeploymentFocus(false); }}><option value="all">All namespaces</option>{availableNamespaces.map((namespace) => <option value={namespace} key={namespace}>{namespace}</option>)}</select></label>
        {(environmentFilter !== "all" || namespaceFilter !== "all") && <button className="diagram-filters__clear" onClick={() => { setEnvironmentFilter("all"); setNamespaceFilter("all"); }}>Clear filters</button>}
      </section>

      <section className="journey-console" aria-label="Journey trace controls">
        <div className="journey-console__controls" role="group" aria-label="Highlight a repository journey">
          <button className={journeyMode === "overview" ? "is-active" : ""} onClick={() => selectJourney("overview")}>Architecture overview</button>
          <button className={journeyMode === "user" ? "is-active" : ""} onClick={() => selectJourney("user")}>Trace User Journey</button>
          <button className={journeyMode === "devops" ? "is-active" : ""} onClick={() => selectJourney("devops")}>Trace DevOps Journey</button>
        </div>
        <div className="journey-console__explanation">{activeJourney ? activeJourney.summary : "Select a journey to dim unrelated services and reveal its exact ordered route."}</div>
        {(showPipelineDetails || journeyMode === "devops") && pipelineFlow.length > 0 && <section className={`pipeline-execution-map ${pipelineClosing ? "pipeline-execution-map--closing" : ""}`} aria-label="Expanded pipeline execution map">
          <header><strong>PIPELINE EXECUTION MAP</strong><span>Read left to right. Each column is an evidenced hand-off; stacked cards run in parallel.</span></header>
          <div className="pipeline-status-legend" aria-label="Pipeline execution status legend"><span className="pipeline-execution-map__status pipeline-execution-map__status--success">Passed</span><span className="pipeline-execution-map__status pipeline-execution-map__status--running">Running</span><span className="pipeline-execution-map__status pipeline-execution-map__status--failed">Failed</span><span className="pipeline-execution-map__status pipeline-execution-map__status--queued">Queued</span><PipelineStatusScope provider={analysis.repository.provider} /></div>
          <div className="pipeline-execution-map__phases">{pipelineFlow.map((stages, index) => <React.Fragment key={`phase-${index}`}><ol className="pipeline-execution-map__phase"><li className="pipeline-execution-map__phase-label">{index === 0 ? "START" : `HAND-OFF ${index}`}{stages.length > 1 && <em>PARALLEL</em>}</li>{stages.map((stage) => <li key={stage.id}><span>{stage.label}</span><i className={`pipeline-execution-map__status pipeline-execution-map__status--${stage.status?.state ?? "neutral"}`} title={stage.status?.reportedAt ? `Reported ${new Date(stage.status.reportedAt).toLocaleString()}` : "No public execution result was reported"}>{executionStatusLabel(stage.status?.state ?? "neutral")}</i></li>)}</ol>{index < pipelineFlow.length - 1 && <span className="pipeline-execution-map__arrow" aria-hidden="true">→</span>}</React.Fragment>)}</div>
        </section>}
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
          <ul>{relationshipEvidence.map((relationship) => <li key={relationship.id}><button type="button" className="relationship-evidence__item" onClick={() => { const selection = selectRelationshipEvidence(relationship.evidence, relationship.source, relationship.target, relationship.label); if (selection) setEvidenceSelection(selection); }}><span>{relationship.source} <b>{relationship.label}</b> {relationship.target}</span><small>{relationship.evidence}</small><FileCode2 size={12} aria-hidden="true" /></button></li>)}</ul>
        </details>}
      </section>

      <section className="architecture-canvas" aria-label="Interactive DevOps architecture diagram">
        <div className="canvas-texture" aria-hidden="true" />
        <ReactFlow<ArchitectureNode, ArchitectureEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={architectureNodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onJourneyNodeClick}
          onNodeMouseEnter={(_event, node) => { const evidence = "evidence" in node.data ? node.data.evidence : undefined; setHoverHint(`${node.data.label}${evidence ? ` · Evidence: ${evidence}` : ""}`); }}
          onNodeMouseLeave={() => setHoverHint("")}
          onEdgeMouseEnter={(_event, edge) => setHoverHint(`${String(edge.label ?? "Relationship")} · ${edge.data?.evidence ?? "Evidence path not retained"}`)}
          onEdgeMouseLeave={() => setHoverHint("")}
          onEdgeClick={(_event, edge) => { const selection = selectRelationshipEvidence(edge.data?.evidence, edge.source, edge.target, String(edge.label ?? "Relationship evidence")); if (selection) setEvidenceSelection(selection); }}
          onMove={(_event, viewport) => setZoomPercent(Math.round(viewport.zoom * 100))}
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
        <div className="canvas-navigation" aria-label="Canvas navigation tools">
          <button type="button" onClick={() => { flow?.zoomOut(); setZoomPercent((value) => Math.max(20, value - 10)); }} title="Zoom out" aria-label="Zoom out"><Minus size={13} /></button>
          <span aria-live="polite">{zoomPercent}%</span>
          <button type="button" onClick={() => { flow?.zoomIn(); setZoomPercent((value) => Math.min(160, value + 10)); }} title="Zoom in" aria-label="Zoom in"><Plus size={13} /></button>
          <button type="button" onClick={() => { flow?.fitView({ padding: 0.13, duration: 220 }); setZoomPercent(100); }} title="Fit diagram to view" aria-label="Fit diagram to view"><Maximize2 size={13} /></button>
        </div>
        {hoverHint && <div className="canvas-hover-hint" role="status">{hoverHint}</div>}
        <div className="canvas-legend" aria-label="Flow legend">
          <span><i className="legend-line legend-line--traffic" /> User traffic</span>
          <span><i className="legend-line legend-line--deploy" /> DevOps delivery</span>
          <span><i className="legend-line legend-line--dependency" /> Resource dependency</span>
        </div>
        <div className="canvas-note">{analysis.detectedFiles.length ? `Analyzed files: ${analysis.detectedFiles.slice(0, 3).join(" · ")}` : "No infrastructure file signals were detected."}</div>
      </section>
      <Sheet open={Boolean(evidenceSelection)} onOpenChange={(open) => !open && setEvidenceSelection(null)}>
        <SheetContent side="right" className="evidence-panel">
          <SheetHeader className="evidence-panel__header">
            <SheetTitle>Source evidence</SheetTitle>
            <SheetDescription>{evidenceSelection?.relationship ? `${evidenceSelection.relationship} relationship` : "Selected diagram node"}</SheetDescription>
          </SheetHeader>
          <div className="evidence-panel__body">
            <div className="evidence-panel__meta">
              <span>{selectedSnippet?.language ?? "source"}</span>
              <code>{evidenceSelection?.path}</code>
            </div>
            <h3>{evidenceSelection?.title}</h3>
            {selectedSnippet ? <>
              {selectedSnippet.redacted && <p className="evidence-panel__notice">Sensitive Kubernetes Secret values are not displayed.</p>}
              <pre aria-label="Source code evidence"><code>{selectedSnippet.content.split("\n").map((line, index) => <span className="evidence-panel__line" key={`${index}-${line.slice(0, 12)}`}><i aria-hidden="true">{index + 1}</i><span>{tokenizeEvidenceLine(line, selectedSnippet.language).map((token, tokenIndex) => <span className={token.kind ? `evidence-token evidence-token--${token.kind}` : undefined} key={`${tokenIndex}-${token.text}`}>{token.text}</span>)}</span></span>)}</code></pre>
            </> : <p className="evidence-panel__missing">This evidence path was not retained for safe display. Analyze the repository again to refresh the selected source files.</p>}
          </div>
        </SheetContent>
      </Sheet>
      </> : <section className="architecture-empty" aria-live="polite">
        {loading ? <LoaderCircle className="spin" size={26} aria-hidden="true" /> : <ScanSearch size={26} aria-hidden="true" />}
        <h2>{loading ? "Inspecting repository evidence" : "Analyze a real public repository"}</h2>
        <p>{loading ? "Repogram is reading eligible configuration files and will render only the services and relationships it can evidence." : "Paste a GitHub, GitLab, or Bitbucket repository URL above. No sample architecture is shown before analysis."}</p>
      </section>}
    </div>
  );
}
