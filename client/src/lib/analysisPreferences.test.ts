import { describe, expect, it } from "vitest";
import { buildShareUrl, preferencesFromSearch, preferencesToSearch, DEFAULT_ANALYSIS_PREFERENCES, type AnalysisPreferences } from "./analysisPreferences";

const preferences: AnalysisPreferences = {
  ...DEFAULT_ANALYSIS_PREFERENCES,
  view: "detailed",
  journeyMode: "devops",
  pipelineExpanded: true,
  clusterExpanded: true,
  expandedNamespaceIds: ["namespace:prod"],
  expandedWorkloadIds: ["deployment-prod"],
  serviceDeploymentFocus: true,
  environmentFilter: "production",
  namespaceFilter: "prod",
};

describe("analysis preferences", () => {
  it("round-trips share state without embedding repository analysis data", () => {
    const search = preferencesToSearch(preferences);
    const restored = { ...DEFAULT_ANALYSIS_PREFERENCES, ...preferencesFromSearch(`?${search}`) };

    expect(restored).toEqual(preferences);
    expect(search).not.toContain("components");
    expect(search).not.toContain("relations");
  });

  it("builds a repository-specific collaboration URL with view state", () => {
    const url = new URL(buildShareUrl("https://github.com/acme/demo", preferences, "https://repogram.example"));

    expect(url.origin).toBe("https://repogram.example");
    expect(url.searchParams.get("repo")).toBe("https://github.com/acme/demo");
    expect(url.searchParams.get("environment")).toBe("production");
    expect(url.searchParams.get("namespace")).toBe("prod");
    expect(url.searchParams.get("focus")).toBe("1");
  });
});
