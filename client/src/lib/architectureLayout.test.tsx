// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReactFlowProvider } from "@xyflow/react";
import { ContainerGroupNode, DevopsServiceNode } from "@/components/architecture/nodes";
import { buildKubernetesPlan, buildPipelinePlan } from "./architectureLayout";

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

describe("expandable Kubernetes topology", () => {
  const components = [
    { id: "namespace-shop", label: "Namespace: shop", icon: "Namespace", domain: "cluster", namespace: "shop" },
    { id: "ingress-shop", label: "Ingress: web", icon: "Ingress", domain: "cluster", namespace: "shop" },
    { id: "service-shop", label: "Service: web", icon: "Service", domain: "cluster", namespace: "shop" },
    { id: "deployment-shop", label: "Deployment: web", icon: "Deployment", domain: "cluster", namespace: "shop" },
    { id: "config-shop", label: "ConfigMap: web-config", icon: "ConfigMap", domain: "cluster", namespace: "shop" },
    { id: "secret-shop", label: "Secret: web-secret", icon: "Secret", domain: "cluster", namespace: "shop" },
  ] as any;

  it("hides namespace contents until the declared namespace is expanded and then layers the resources", () => {
    expect(buildKubernetesPlan({ components, relations: [] }, false).placements).toEqual([]);
    const closedNamespace = buildKubernetesPlan({ components, relations: [] }, true);
    expect(closedNamespace.placements.map((placement) => placement.id)).toEqual(["namespace-shop"]);

    const expandedNamespace = buildKubernetesPlan({ components, relations: [] }, true, ["namespace:shop"]);
    const byId = new Map(expandedNamespace.placements.map((placement) => [placement.id, placement]));
    expect(byId.get("namespace-shop")).toMatchObject({ layer: "NAMESPACE", row: 0 });
    expect(byId.get("ingress-shop")).toMatchObject({ layer: "INGRESS" });
    expect(byId.get("service-shop")).toMatchObject({ layer: "SERVICE" });
    expect(byId.get("deployment-shop")).toMatchObject({ layer: "WORKLOAD" });
    expect(byId.get("config-shop")).toMatchObject({ layer: "CONFIG & SECRETS" });
    expect(byId.get("secret-shop")).toMatchObject({ layer: "CONFIG & SECRETS" });
  });

  it("keeps a resource visible when its namespace is not declared, even if other Namespace manifests exist", () => {
    const mixedNamespaceComponents = [
      { id: "namespace-team", label: "Namespace: team", icon: "Namespace", domain: "cluster", namespace: "team" },
      { id: "deployment-default", label: "Deployment: nginx", icon: "Deployment", domain: "cluster", namespace: "default" },
    ] as any;
    const plan = buildKubernetesPlan({ components: mixedNamespaceComponents, relations: [] }, true);

    expect(plan.placements.map((placement) => placement.id)).toEqual(expect.arrayContaining(["namespace-team", "deployment-default"]));
  });

  it("keeps evidenced workload children hidden until each owning workload is expanded", () => {
    const hierarchyComponents = [
      ...components,
      { id: "replicaset-shop", label: "ReplicaSet: web-6d9", icon: "ReplicaSet", domain: "cluster", namespace: "shop" },
      { id: "pod-shop", label: "Pod: web-6d9-x2p", icon: "Pod", domain: "cluster", namespace: "shop" },
    ] as any;
    const relations = [
      { id: "owns-deployment-replicaset", source: "deployment-shop", target: "replicaset-shop", label: "owns", kind: "dependency" },
      { id: "owns-replicaset-pod", source: "replicaset-shop", target: "pod-shop", label: "owns", kind: "dependency" },
    ] as any;

    const closed = buildKubernetesPlan({ components: hierarchyComponents, relations }, true, ["namespace:shop"]);
    expect(closed.placements.map((placement) => placement.id)).not.toContain("replicaset-shop");
    expect(closed.placements.map((placement) => placement.id)).not.toContain("pod-shop");
    expect(closed.placements.find((placement) => placement.id === "deployment-shop")).toMatchObject({ childIds: ["replicaset-shop"] });

    const deploymentExpanded = buildKubernetesPlan({ components: hierarchyComponents, relations }, true, ["namespace:shop"], ["deployment-shop"]);
    expect(deploymentExpanded.placements.map((placement) => placement.id)).toContain("replicaset-shop");
    expect(deploymentExpanded.placements.map((placement) => placement.id)).not.toContain("pod-shop");

    const fullHierarchy = buildKubernetesPlan({ components: hierarchyComponents, relations }, true, ["namespace:shop"], ["deployment-shop", "replicaset-shop"]);
    expect(fullHierarchy.placements.find((placement) => placement.id === "pod-shop")).toMatchObject({ parentWorkloadId: "replicaset-shop", layer: "WORKLOAD CHILD" });
  });

  it("exposes a dedicated Cluster expand control", async () => {
    const onToggleCluster = vi.fn();
    const user = userEvent.setup();
    render(React.createElement(ReactFlowProvider, null, React.createElement(ContainerGroupNode, {
      id: "cluster",
      type: "containerGroup",
      data: { label: "D · KUBERNETES CLUSTER · TOPOLOGY", color: "#df77b7", collapsed: true, childCount: 6, isCluster: true, providerIcon: "Kubernetes", clusterExpanded: false, namespaceCount: 1, onToggleCluster },
    } as any)));

    await user.click(screen.getByRole("button", { name: "Expand topology" }));
    expect(onToggleCluster).toHaveBeenCalledTimes(1);
  });

  it("renders the Cluster legend including the Service to Deployment focus explanation", () => {
    render(React.createElement(ReactFlowProvider, null, React.createElement(ContainerGroupNode, {
      id: "cluster",
      type: "containerGroup",
      data: { label: "D · KUBERNETES CLUSTER · TOPOLOGY", color: "#df77b7", collapsed: false, childCount: 6, isCluster: true, providerIcon: "Kubernetes", clusterExpanded: true, namespaceCount: 0 },
    } as any)));

    expect(screen.getByLabelText("Cluster color and arrow legend").textContent).toContain("Focus: Service → Deployment");
  });

  it("exposes a dedicated Workload child expansion control", async () => {
    const onToggleWorkload = vi.fn();
    const user = userEvent.setup();
    render(React.createElement(ReactFlowProvider, null, React.createElement(DevopsServiceNode, {
      id: "deployment-shop",
      type: "devopsService",
      data: { label: "Deployment: web", icon: "Deployment", kubernetesStage: { layer: "WORKLOAD", childCount: 1, onToggleWorkload } },
    } as any)));

    await user.click(screen.getByRole("button", { name: "Expand 1 children" }));
    expect(onToggleWorkload).toHaveBeenCalledTimes(1);
  });
});
