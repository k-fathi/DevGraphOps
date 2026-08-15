/**
 * Repogram visual system: resolve precise DevOps marks from the uploaded local catalog first,
 * then simple-icons; never substitute a generic vendor icon before both paths are exhausted.
 */
import * as simpleIcons from "simple-icons";

export type IconResolution =
  | { kind: "image"; src: string; source: "local" | "simple-icons"; label: string }
  | {
      kind: "external-missing";
      source: "external-missing";
      label: string;
      instructions: string;
      sources: string[];
    };

const localIconAssets: Record<string, string> = {
  github: "/manus-storage/github_c291de21.svg",
  "github actions": "/manus-storage/githubactions-svgrepo-com_84d2850e.svg",
  sonarqube: "/manus-storage/sonarqube_5f6826c6.svg",
  nexus: "/manus-storage/nexus_94a24465.svg",
  terraform: "/manus-storage/terraform_58823b42.svg",
  aws: "/manus-storage/aws_cc361e74.svg",
  kubernetes: "/manus-storage/k8s_724031f1.svg",
  ingress: "/manus-storage/k8s-ingress_52d7ea7e.svg",
  service: "/manus-storage/k8s-service_b6101da8.svg",
  deployment: "/manus-storage/k8s-deployment_ed5981e2.svg",
  pod: "/manus-storage/k8s-pod_1ea7f68d.svg",
  "argo cd": "/manus-storage/argo-cd_0cf4c69e.svg",
  nginx: "/manus-storage/nginx_e4f7f051.svg",
  react: "/manus-storage/reactjs_650669fc.svg",
  postgres: "/manus-storage/postgres_35d04f66.svg",
  prometheus: "/manus-storage/prometheus_cb110430.svg",
  grafana: "/manus-storage/grafana_6c3cef4f.svg",
  docker: "/manus-storage/dockerhub_9e8a951b.svg",
  "docker hub": "/manus-storage/dockerhub_9e8a951b.svg",
  "docker compose": "/manus-storage/docker-compose_ff2f0f37.png",
  users: "/manus-storage/users_f9a8ef34.svg",
  "route 53": "/manus-storage/Route53_67168c7c.svg",
  "load balancer": "/manus-storage/Load-Balancing_8a98ec80.svg",
  ansible: "/manus-storage/ansible_b3e1f84d.svg",
  statefulset: "/manus-storage/k8s-statefulset_77ccfde0.svg",
  daemonset: "/manus-storage/k8s-daemonset_7fee6a65.svg",
  configmap: "/manus-storage/k8s-configmap_dfbdecb1.svg",
  secret: "/manus-storage/k8s-secret_81e4e27e.svg",
  persistentvolumeclaim: "/manus-storage/k8s-persistentvolumeclaim_e16fab8c.svg",
};

const simpleIconNames: Record<string, string> = {
  gitlab: "siGitlab",
  jenkins: "siJenkins",
  ansible: "siAnsible",
  mongodb: "siMongodb",
  digitalocean: "siDigitalocean",
  bitbucket: "siBitbucket",
};

function makeSvgDataUri(path: string, hex: string, title: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="${title}"><path fill="#${hex}" d="${path}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Priority is deliberately fixed: uploaded local workspace assets → simple-icons → sourcing instructions.
 * External sources are not fetched from the browser at runtime, so a missing icon can never break rendering.
 */
export function resolveIcon(label: string): IconResolution {
  const key = label.trim().toLowerCase();
  const local = localIconAssets[key];

  if (local) {
    return { kind: "image", src: local, source: "local", label };
  }

  const libraryKey = simpleIconNames[key];
  const libraryIcon = libraryKey
    ? (simpleIcons as unknown as Record<string, { path?: string; hex?: string }>)[libraryKey]
    : undefined;

  if (libraryIcon?.path && libraryIcon.hex) {
    return {
      kind: "image",
      src: makeSvgDataUri(libraryIcon.path, libraryIcon.hex, label),
      source: "simple-icons",
      label,
    };
  }

  return {
    kind: "external-missing",
    source: "external-missing",
    label,
    instructions: `No precise ${label} SVG is bundled. Add an approved SVG to the local icon catalog before publishing.`,
    sources: ["https://thesvg.org/collection/", "https://dashboardicons.com"],
  };
}

export const iconResolutionOrder = [
  "Local workspace asset catalog",
  "simple-icons library",
  "Approved SVG sources: thesvg.org or dashboardicons.com",
] as const;
