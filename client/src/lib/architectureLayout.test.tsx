// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReactFlowProvider } from "@xyflow/react";
import { ContainerGroupNode, DevopsServiceNode } from "@/components/architecture/nodes";
import { buildPipelinePlan } from "./architectureLayout";

describe("expandable pipeline planning", () => {
  const components = [
    { id: "install", domain: "pipeline" },
    { id: "test", domain: "pipeline" },
    { id: "lint", domain: "pipeline" },
    { id: "build", domain: "pipeline" },
    { id: "deploy", domain: "pipeline" },
  ] as any;
  const relations = [
    { source: "install", target: "test", kind: "deployment" },
    { source: "install", target: "lint", kind: "deployment" },
    { source: "test", target: "build", kind: "deployment" },
    { source: "lint", target: "build", kind: "deployment" },
    { source: "build", target: "deploy", kind: "deployment" },
  ] as any;

  it("makes the entry, parallel checks, and terminal stage explicit", () => {
    const plan = buildPipelinePlan({ components, relations });
    const byId = new Map(plan.stages.map((stage) => [stage.id, stage]));

    expect(plan.columns).toBe(4);
    expect(byId.get("install")).toMatchObject({ column: 0, isStart: true });
    expect(byId.get("test")).toMatchObject({ column: 1, parallel: true });
    expect(byId.get("lint")).toMatchObject({ column: 1, parallel: true });
    expect(byId.get("build")).toMatchObject({ column: 2, parallel: false });
    expect(byId.get("deploy")).toMatchObject({ column: 3, isEnd: true });
  });

  it("exposes a dedicated pipeline expand control", async () => {
    const onTogglePipeline = vi.fn();
    const user = userEvent.setup();
    render(React.createElement(ReactFlowProvider, null, React.createElement(ContainerGroupNode, {
        id: "cicd",
        type: "containerGroup",
        data: {
          label: "B · PIPELINE · GITHUB ACTIONS",
          color: "#7d9d36",
          collapsed: true,
          childCount: 5,
          isPipeline: true,
          providerIcon: "GitHub Actions",
          pipelineExpanded: false,
          entryLabels: ["Job: install"],
          terminalLabels: ["Job: deploy"],
          onTogglePipeline,
        },
      } as any)));

    await user.click(screen.getByRole("button", { name: "Expand stages" }));
    expect(onTogglePipeline).toHaveBeenCalledTimes(1);
  });

  it("renders a provider-reported execution state on an expanded stage", () => {
    render(React.createElement(ReactFlowProvider, null, React.createElement(DevopsServiceNode, {
      id: "deploy",
      type: "pipelineStep",
      data: {
        label: "Job: deploy",
        icon: "GitHub Actions",
        pipelineStage: { phase: "END", parallel: false },
        executionStatus: { state: "success", reportedAt: "2026-08-15T12:00:00.000Z" },
      },
    } as any)));

    expect(screen.getByText("Passed")).toBeTruthy();
  });

  it("renders the visible Not reported badge when an expanded stage has no execution result", () => {
    render(React.createElement(ReactFlowProvider, null, React.createElement(DevopsServiceNode, {
      id: "deploy-unreported",
      type: "pipelineStep",
      data: {
        label: "Job: deploy",
        icon: "GitHub Actions",
        pipelineStage: { phase: "END", parallel: false },
      },
    } as any)));

    expect(screen.getByText("Not reported")).toBeTruthy();
  });
});
