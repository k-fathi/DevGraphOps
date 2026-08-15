// @vitest-environment jsdom
import React, { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { analyzeRepositoryMock } = vi.hoisted(() => ({ analyzeRepositoryMock: vi.fn() }));

const analysis = {
  repository: { provider: "github" as const, owner: "acme", repo: "demo", branch: "main", url: "https://github.com/acme/demo" },
  signals: { githubActions: false, gitlabCi: false, bitbucketPipelines: false, jenkins: false, sonarQube: false, nexus: false, terraform: false, ansible: false, aws: false, route53: false, kubernetes: true, argoCd: false, nginx: false, docker: false, dockerHub: false, dockerCompose: false, react: false, postgres: false, mongodb: false, prometheus: false, grafana: false },
  fileCount: 1,
  detectedFiles: ["k8s/service.yml"],
  components: [{ id: "service", label: "Service: app", icon: "Service", domain: "cluster" as const, evidence: "k8s/service.yml" }],
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
  ReactFlow: ({ nodes, edges, onNodeClick, onEdgeClick }: any) => <div><button onClick={() => onNodeClick({}, nodes[0])}>{nodes[0]?.data.label}</button><button onClick={() => onEdgeClick({}, edges[0])}>Canvas edge</button></div>,
  useNodesState: (initial: any[]) => { const [value, setValue] = useState(initial); return [value, setValue, vi.fn()]; },
  useEdgesState: (initial: any[]) => { const [value, setValue] = useState(initial); return [value, setValue, vi.fn()]; },
}));
vi.mock("@/lib/architectureLayout", () => ({
  buildArchitectureLayout: vi.fn().mockResolvedValue({
    nodes: [{ id: "service", type: "devopsService", data: { label: "Service: app", evidence: "k8s/service.yml", icon: "Service" }, position: { x: 0, y: 0 } }],
    edges: [{ id: "service-deployment", source: "service", target: "deployment", label: "Selects", data: { evidence: "k8s/service.yml", kind: "traffic" } }],
  }),
  buildJourneyDefinitions: vi.fn().mockReturnValue([]),
}));
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ open, children }: any) => open ? <aside>{children}</aside> : null,
  SheetContent: ({ children }: any) => <section>{children}</section>,
  SheetHeader: ({ children }: any) => <header>{children}</header>,
  SheetTitle: ({ children }: any) => <h2>{children}</h2>,
  SheetDescription: ({ children }: any) => <p>{children}</p>,
}));

import DevOpsArchitectureCanvas from "./DevOpsArchitectureCanvas";

describe("DevOpsArchitectureCanvas evidence interactions", () => {
  beforeEach(() => {
    analyzeRepositoryMock.mockResolvedValue(analysis);
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
});
