import { describe, expect, it } from "vitest";
import { auditIconIdentity, resolveIcon } from "./iconResolver";

describe("precise technology icon resolution", () => {
  it("resolves Docker to the Docker library mark rather than Docker Hub", () => {
    const docker = resolveIcon("Docker");
    const dockerHub = resolveIcon("Docker Hub");

    expect(docker.kind).toBe("image");
    expect(docker.source).toBe("simple-icons");
    expect(docker.label).toBe("Docker");
    expect(dockerHub.kind).toBe("image");
    expect(dockerHub.source).toBe("local");
    expect(dockerHub.label).toBe("Docker Hub");
    expect(docker.src).not.toBe(dockerHub.src);
  });

  it("rejects a resolved logo whose canonical identity differs from component.icon", () => {
    const docker = resolveIcon("Docker");
    expect(auditIconIdentity("Docker", docker)).toBe(true);
    expect(auditIconIdentity("Terraform", docker)).toBe(false);
    expect(auditIconIdentity("Docker Hub", docker)).toBe(false);
  });

  it("keeps Terraform as a separate technology icon", () => {
    const terraform = resolveIcon("Terraform");
    expect(terraform.kind).toBe("image");
    expect(terraform.label).toBe("Terraform");
    expect(terraform.src).toContain("terraform_");
  });
});
