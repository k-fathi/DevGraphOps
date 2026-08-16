// @vitest-environment jsdom
import React, { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { analyzeRepositoryMock, pipelinePlanMock, layoutMock } = vi.hoisted(() => ({ analyzeRepositoryMock: vi.fn(), pipelinePlanMock: vi.fn(), layoutMock: vi.fn() }));

const analysis = {
  repository: { provider: "github" as const, owner: "acme", repo: "demo", branch: "main", url: "https://github.com/acme/demo" },
  signals: { githubActions: false, gitlabCi: false, bitbucketPipelines: false, jenkins: false, sonarQube: false, nexus: false, terraform: false, ansible: false, aws: false, route53: false, kubernetes: true, argoCd: false, nginx: false, docker: false, dockerHub: false, dockerCompose: false, react: false, postgres: false, mongodb: false, prometheus: false, grafana: false },
  fileCount: 1,
  detectedFiles: ["k8s/service.yml"],
  components: [{ id: "service", label: "Service: app", icon: "Service", domain: "cluster" as const, evidence: "k8s/service.yml" }, { id: "deployment", label: "Deployment: app", icon: "Deployment", domain: "cluster" as const, evidence: "k8s/deployment.yml" }],
  relations: [{ id: "service-deployment", source: "service", target: "deployment", label: "Selects", kind: "traffic" as const, evidence: "k8s/service.yml" }],
  evidenceSnippets: [{ path: "k8s/service.yml", language: "yaml" as const, content: "apiVersion: v1\nkind: Service\nmetadata:\n  name: app" }],
};

vi.mock("@/lib/trpc", () => ({ trpc: { repository: { analyze: { useMutation: () => ({ mutateAsync: analyzeRepositoryMock, isPending: false }) } } } }));
vi.mock("html-to-image", () => ({ toPng: vi.fn(), toSvg: vi.fn() }));
vi.mock("@/components/architecture/nodes", () => ({ architectureNodeTypes: {} }));
vi.mock("@xyflow/react", () => ({
  Background: () => null,
  BackgroundVariant: { Dots: "dots" },
  Controls: () => null,
  ReactFlow: ({ nodes, edges, onNodeClick, onEdgeClick, onNodeMouseEnter, onEdgeMouseLeave, onEdgeMouseEnter, onNodeMouseLeave }: any) => <div><button onClick={() => onNodeClick({}, nodes[0])} onMouseEnter={() => onNodeMouseEnter?.({}, nodes[0])} onMouseLeave={() => onNodeMouseLeave?.()}>{nodes[0]?.data.label}</button><button onClick={() => onEdgeClick({}, edges[0])} onMouseEnter={() => onEdgeMouseEnter?.({}, edges[0])} onMouseLeave={() => onEdgeMouseLeave?.()}>Canvas edge</button></div>,
  useNodesState: (initial: any[]) => { const [value, setValue] = useState(initial); return [value, setValue, vi.fn()]; },
  useEdgesState: (initial: any[]) => { const [value, setValue] = useState(initial); return [value, setValue, vi.fn()]; },
}));
vi.mock("@/lib/architectureLayout", () => ({
  buildPipelinePlan: pipelinePlanMock,
  buildArchitectureLayout: layoutMock,
  buildJourneyDefinitions: vi.fn().mockReturnValue([]),
}));
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ open, children }: any) => open ? <aside>{children}</aside> : null,
  SheetContent: ({ children }: any) => <section>{children}</section>,
  SheetHeader: ({ children }: any) => <header>{children}</header>,
  SheetTitle: ({ children }: any) => <h2>{children}</h2>,
  SheetDescription: ({ children }: any) => <p>{children}</p>,
}));

import DevOpsArchitectureCanvas, { PipelineStatusScope } from "./DevOpsArchitectureCanvas";

describe("DevOpsArchitectureCanvas evidence interactions", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    analyzeRepositoryMock.mockResolvedValue(analysis);
    pipelinePlanMock.mockReturnValue({ columns: 0, stages: [] });
    layoutMock.mockResolvedValue({
      nodes: [{ id: "service", type: "devopsService", data: { label: "Service: app", evidence: "k8s/service.yml", icon: "Service" }, position: { x: 0, y: 0 } }],
      edges: [{ id: "service-deployment", source: "service", target: "deployment", label: "Selects", data: { evidence: "k8s/service.yml", kind: "traffic" } }],
    });
    window.history.pushState({}, "", "/?repo=https%3A%2F%2Fgithub.com%2Facme%2Fdemo");
  });

  it("opens the source panel from an evidenced node and a relationship evidence item", async () => {
    const user = userEvent.setup();
    render(<DevOpsArchitectureCanvas />);

    await screen.findByRole("button", { name: "Service: app" });
    await user.click(screen.getByRole("button", { name: "Service: app" }));
    expect(await screen.findByText("Selected diagram node")).toBeTruthy();
    expect(screen.getAllByText("k8s/service.yml").length).toBeGreaterThan(1);

    await user.click(screen.getByText(/Relationship evidence/));
    await user.click(screen.getByRole("button", { name: /Service: app Selects deployment/i }));
    await waitFor(() => expect(screen.getByText("Selects relationship")).toBeTruthy());
    expect(screen.getByText("Service: app → deployment")).toBeTruthy();
  });

  it("keeps the expanded Pipeline state during its exit transition", async () => {
    analyzeRepositoryMock.mockResolvedValue({
      ...analysis,
      components: [...analysis.components, { id: "deploy", label: "Job: deploy", icon: "GitHub Actions", domain: "pipeline" as const, evidence: ".github/workflows/ci.yml" }],
    });
    render(<DevOpsArchitectureCanvas />);

    const expand = await screen.findByRole("button", { name: "Pipeline: expand stages" });
    vi.useFakeTimers();
    fireEvent.click(expand);
    expect(screen.getByRole("button", { name: "Pipeline: collapse stages" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Pipeline: collapse stages" }));
    expect(screen.getByRole("button", { name: "Pipeline: collapse stages" })).toBeTruthy();
    act(() => vi.advanceTimersByTime(230));
    expect(screen.getByRole("button", { name: "Pipeline: expand stages" })).toBeTruthy();
    vi.useRealTimers();
  });

  it("rebuilds the diagram in expanded Cluster mode when Kubernetes topology is opened", async () => {
    const user = userEvent.setup();
    render(<DevOpsArchitectureCanvas />);

    const clusterToggles = await screen.findAllByRole("button", { name: "Kubernetes: expand topology" });
    await user.click(clusterToggles.at(-1)!);
    await waitFor(() => expect(layoutMock).toHaveBeenCalledWith(analysis, "detailed", false, false, true, [], [], "bottom"));
    expect(screen.getAllByRole("button", { name: "Kubernetes: collapse topology" }).length).toBeGreaterThan(0);
  });

  it("opens the declared Service to Deployment Focus Mode only when that relation is evidenced", async () => {
    const user = userEvent.setup();
    render(<DevOpsArchitectureCanvas />);

    await user.click(await screen.findByRole("button", { name: "Cluster focus: Service → Deployment" }));
    await waitFor(() => expect(layoutMock).toHaveBeenCalledWith(analysis, "detailed", false, false, true, [], [], "bottom"));
    expect(screen.getByRole("button", { name: "Cluster focus: exit" })).toBeTruthy();
  });

  it("opens the Cluster when tracing a User Journey so declared runtime nodes can be highlighted", async () => {
    const user = userEvent.setup();
    render(<DevOpsArchitectureCanvas />);

    await user.click(await screen.findByRole("button", { name: "Trace User Journey" }));
    await waitFor(() => expect(layoutMock).toHaveBeenCalledWith(analysis, "detailed", false, false, true, [], [], "bottom"));
  });

  it("opens the Cluster and reveals the execution map without flooding the Canvas when tracing the DevOps Journey", async () => {
    const user = userEvent.setup();
    analyzeRepositoryMock.mockResolvedValue({
      ...analysis,
      components: [...analysis.components, { id: "deploy", label: "Job: deploy", icon: "GitHub Actions", domain: "pipeline" as const, evidence: ".github/workflows/ci.yml" }],
    });
    render(<DevOpsArchitectureCanvas />);

    await user.click(await screen.findByRole("button", { name: "Trace DevOps Journey" }));
    await waitFor(() => expect(layoutMock).toHaveBeenCalledWith(expect.anything(), "detailed", false, false, true, [], [], "bottom"));
  });

  it("explains that live execution status is currently GitHub Actions-only for other providers", async () => {
    const { container } = render(<PipelineStatusScope provider="gitlab" />);
    expect(container.textContent).toContain("Live execution status is currently available for public GitHub Actions repositories only.");
    expect(container.textContent).toContain("Stages without a report remain neutral rather than receiving a simulated result.");
  });

    it("labels GitHub stages as Not reported when no public job result is available", async () => {
    const { container } = render(<PipelineStatusScope provider="github" />);
    expect(container.textContent).toContain("Colors are applied only when the public GitHub Actions API reports a recent job result.");
    expect(container.textContent).toContain("Stages without a report remain neutral rather than receiving a simulated result.");
  });
  it("shows only evidence-backed environment and namespace filters and scopes the visible count", async () => {
    const user = userEvent.setup();
    analyzeRepositoryMock.mockResolvedValue({
      ...analysis,
      components: [
        ...analysis.components,
        { id: "prod-deployment", label: "Deployment: prod", icon: "Deployment", domain: "cluster" as const, evidence: "k8s/prod.yml", environment: "production", namespace: "prod" },
        { id: "dev-service", label: "Service: dev", icon: "Service", domain: "cluster" as const, evidence: "k8s/dev.yml", environment: "development", namespace: "dev" },
      ],
    });
    render(<DevOpsArchitectureCanvas />);
    const environment = await screen.findByLabelText("Environment");
    expect(screen.getByRole("option", { name: "production" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "development" })).toBeTruthy();
    await user.selectOptions(environment, "production");
    expect(screen.getByText("1 visible of 4")).toBeTruthy();
    const namespace = screen.getByLabelText("Namespace");
    expect(screen.getByRole("option", { name: "prod" })).toBeTruthy();
    await user.selectOptions(namespace, "prod");
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeTruthy();
  });

  it("switches between bottom and side arrow lanes", async () => {
    const user = userEvent.setup();
    render(<DevOpsArchitectureCanvas />);
    const lanes = await screen.findByLabelText("Arrow lanes");
    await user.selectOptions(lanes, "side");
    await waitFor(() => expect(layoutMock).toHaveBeenCalledWith(analysis, "detailed", false, false, false, [], [], "side"));
  });

  it("supports explicit zoom controls and displays evidence hover guidance", async () => {
    const user = userEvent.setup();
    render(<DevOpsArchitectureCanvas />);
    await screen.findByRole("button", { name: "Zoom in" });
    expect(screen.getByText("100%")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("110%")).toBeTruthy();
    await user.hover(screen.getByRole("button", { name: "Service: app" }));
    expect((await screen.findByRole("status")).textContent).toContain("Service: app · Evidence: k8s/service.yml");
    await user.hover(screen.getByRole("button", { name: "Canvas edge" }));
    expect((await screen.findByRole("status")).textContent).toContain("Selects · k8s/service.yml");
    await user.unhover(screen.getByRole("button", { name: "Canvas edge" }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("copies a share link and persists the current analysis settings", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<DevOpsArchitectureCanvas />);
    await screen.findByRole("button", { name: "Share" });
    await user.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("repo=https%3A%2F%2Fgithub.com%2Facme%2Fdemo")));
    expect(screen.getByRole("status").textContent).toContain("Share link copied");
    await user.click(screen.getByRole("button", { name: "Save settings" }));
    expect(screen.getByRole("status").textContent).toContain("saved on this device");
    await user.click(screen.getByRole("button", { name: "Load settings" }));
    expect(screen.getByRole("status").textContent).toContain("loaded");
  });
});
