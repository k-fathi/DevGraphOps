// @vitest-environment jsdom
import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { selectNodeEvidence, selectRelationshipEvidence, type EvidenceSelection } from "./evidencePanel";

function EvidenceInteractionHarness() {
  const [selection, setSelection] = useState<EvidenceSelection | null>(null);
  return <>
    <button onClick={() => setSelection(selectNodeEvidence("k8s/deployments/app.yml", "Deployment: app"))}>Open node evidence</button>
    <button onClick={() => setSelection(selectRelationshipEvidence("k8s/services/app.yml", "Service: app", "Deployment: app", "Selects"))}>Open relationship evidence</button>
    <output>{selection ? `${selection.title}|${selection.relationship ?? "node"}|${selection.path}` : "none"}</output>
  </>;
}

describe("evidence selection interactions", () => {
  it("opens evidence selection from node and relationship interactions", async () => {
    const user = userEvent.setup();
    render(<EvidenceInteractionHarness />);

    await user.click(screen.getByRole("button", { name: "Open node evidence" }));
    expect(screen.getByRole("status").textContent).toBe("Deployment: app|node|k8s/deployments/app.yml");

    await user.click(screen.getByRole("button", { name: "Open relationship evidence" }));
    expect(screen.getByRole("status").textContent).toBe("Service: app → Deployment: app|Selects|k8s/services/app.yml");
  });
});
