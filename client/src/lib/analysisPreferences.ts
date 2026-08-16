import type { ArchitectureView, JourneyMode } from "@/lib/architectureLayout";

export type AnalysisPreferences = {
  view: ArchitectureView;
  journeyMode: JourneyMode;
  pipelineExpanded: boolean;
  clusterExpanded: boolean;
  expandedNamespaceIds: string[];
  expandedWorkloadIds: string[];
  serviceDeploymentFocus: boolean;
  environmentFilter: string;
  namespaceFilter: string;
};

export const DEFAULT_ANALYSIS_PREFERENCES: AnalysisPreferences = {
  view: "detailed",
  journeyMode: "overview",
  pipelineExpanded: false,
  clusterExpanded: false,
  expandedNamespaceIds: [],
  expandedWorkloadIds: [],
  serviceDeploymentFocus: false,
  environmentFilter: "all",
  namespaceFilter: "all",
};

const STORAGE_KEY = "repogram.analysis-settings.v1";
const arrayParam = (values: string[]) => values.map((value) => value.replaceAll(",", "")).filter(Boolean).join(",");
const parseArray = (value: string | null) => value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];

export function preferencesFromSearch(search: string): Partial<AnalysisPreferences> {
  const params = new URLSearchParams(search);
  const view = params.get("view");
  const journeyMode = params.get("journey");
  return {
    ...(view === "high" || view === "detailed" ? { view } : {}),
    ...(journeyMode === "overview" || journeyMode === "user" || journeyMode === "devops" ? { journeyMode } : {}),
    ...(params.has("pipeline") ? { pipelineExpanded: params.get("pipeline") === "1" } : {}),
    ...(params.has("cluster") ? { clusterExpanded: params.get("cluster") === "1" } : {}),
    ...(params.has("focus") ? { serviceDeploymentFocus: params.get("focus") === "1" } : {}),
    ...(params.has("namespaces") ? { expandedNamespaceIds: parseArray(params.get("namespaces")) } : {}),
    ...(params.has("workloads") ? { expandedWorkloadIds: parseArray(params.get("workloads")) } : {}),
    ...(params.has("environment") ? { environmentFilter: params.get("environment") || "all" } : {}),
    ...(params.has("namespace") ? { namespaceFilter: params.get("namespace") || "all" } : {}),
  };
}

export function preferencesToSearch(preferences: AnalysisPreferences): string {
  const params = new URLSearchParams();
  params.set("view", preferences.view);
  params.set("journey", preferences.journeyMode);
  if (preferences.pipelineExpanded) params.set("pipeline", "1");
  if (preferences.clusterExpanded) params.set("cluster", "1");
  if (preferences.serviceDeploymentFocus) params.set("focus", "1");
  if (preferences.expandedNamespaceIds.length) params.set("namespaces", arrayParam(preferences.expandedNamespaceIds));
  if (preferences.expandedWorkloadIds.length) params.set("workloads", arrayParam(preferences.expandedWorkloadIds));
  if (preferences.environmentFilter !== "all") params.set("environment", preferences.environmentFilter);
  if (preferences.namespaceFilter !== "all") params.set("namespace", preferences.namespaceFilter);
  return params.toString();
}

export function buildShareUrl(repositoryUrl: string, preferences: AnalysisPreferences, origin = window.location.origin): string {
  const url = new URL(origin);
  url.searchParams.set("repo", repositoryUrl);
  const preferenceSearch = preferencesToSearch(preferences);
  new URLSearchParams(preferenceSearch).forEach((value, key) => url.searchParams.set(key, value));
  return url.toString();
}

export function saveAnalysisPreferences(preferences: AnalysisPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function loadAnalysisPreferences(): AnalysisPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AnalysisPreferences>;
    return { ...DEFAULT_ANALYSIS_PREFERENCES, ...parsed, expandedNamespaceIds: parsed.expandedNamespaceIds ?? [], expandedWorkloadIds: parsed.expandedWorkloadIds ?? [] };
  } catch {
    return null;
  }
}

export function preferenceSnapshot(state: AnalysisPreferences): AnalysisPreferences {
  return {
    ...state,
    expandedNamespaceIds: [...state.expandedNamespaceIds],
    expandedWorkloadIds: [...state.expandedWorkloadIds],
  };
}
