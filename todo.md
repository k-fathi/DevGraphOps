# مهام النسخة الأولية

- [x] إنشاء محلل لرابط مستودع GitHub عام والتحقق من صيغة الرابط.
- [x] استدعاء GitHub REST API لقراءة شجرة الملفات العامة وتحليل إشارات DevOps.
- [x] إظهار Prometheus وGrafana فقط عند اكتشاف ملفات إعداد مرتبطة بهما.
- [x] بناء IconResolver يفضّل كتالوج الأصول المحلية ثم simple-icons ثم يوضح مصدر SVG المعتمد عند الغياب.
- [x] إنشاء مخطط React Flow بعقد مركبة ومسارات متعامدة وتخطيط ELK متكيف.
- [x] اختبار الوصول إلى شجرة مستودع عام وإتاحة GitHub REST API من المتصفح، مع رسائل واضحة للرابط غير الصحيح أو المستودع غير العام.
- [x] أخذ لقطة تحقق مرئية وتنفيذ فحص TypeScript النهائي قبل نقطة الحفظ.

## مهام النسخة الموسعة

- [x] توحيد تحليل روابط GitHub وGitLab وBitbucket العامة ضمن نموذج مزود واحد.
- [x] تنزيل وقراءة ملفات YAML وTerraform المرتبطة بالبنية مع قيود حجم وعدد آمنة.
- [x] استخراج روابط الخدمات والموارد من `depends_on` ومراجع الموارد وملفات Kubernetes.
- [x] ربط العلاقات المستخرجة بمسارات إضافية وشارات دلالية في الدياجرام.
- [x] إضافة تصدير مساحة الرسم الحالية بصيغتي PNG وSVG.
- [x] اختبار مزودات المستودعات والتصدير وحالات ملفات الإعداد غير الصالحة.
- [x] إنشاء نقطة حفظ وتسليم النسخة الموسعة.

## مسارات التشغيل لكل مخطط

- [x] إنشاء نموذج مستقل لمسار المستخدم: User → DNS/CDN أو Load Balancer → Ingress/Proxy → Service → Application.
- [x] إنشاء نموذج مستقل لمسار DevOps: Source → build/test/security → image/build artifacts → registry → provision → deploy → observability.
- [x] تفصيل مراحل Docker وDocker Hub وDocker Compose وJenkins وملفات CI حسب الملفات المكتشفة في كل مستودع.
- [x] ربط المسارين بصريًا عند التطبيق الحي مع إبقاء دلالات المرور والنشر منفصلة.
- [x] اختبار عرض تفصيلي يحوي رحلتي المستخدم وDevOps مع مستودع يحتوي ملفات Docker وYAML وTerraform.

## توحيد اللغة

- [x] Convert all interface copy, state messages, controls, and route guidance to English.
- [x] Verify visually and through a source scan that no Arabic text remains in the user-facing product experience.

## Reference Color System

- [x] Replace bright blue and neon accents with the charcoal, green-route, pink, amber, and olive visual language from the provided references.
- [x] Restyle group boundaries, nodes, edges, controls, and legends to use restrained contrast and dashed green operational paths.
- [x] Verify visual contrast and diagram readability against the supplied reference aesthetic.

## Completion Audit

- [x] Audit each legacy unchecked item against the implemented Repogram code and test evidence.
- [x] Implement or correct any item that is not fully supported in the public-repository analysis flow.
- [x] Verify GitHub, GitLab, Bitbucket, detailed paths, and PNG/SVG export before closing the remaining tasks.
- [x] Save a final completion checkpoint after the audit is finished.

## Provider Access Reliability

- [x] Add a same-origin service path for GitLab and Bitbucket public APIs so the browser can complete provider analysis reliably.
- [x] Validate the service path against a public GitLab repository and a public Bitbucket repository before marking provider support complete.
- [x] Route Bitbucket API requests through the verified `bitbucket.org/api/2.0` origin and repeat the public-repository validation.

## Fullstack Upgrade Recovery

- [x] Reconcile the fullstack upgrade with the existing Repogram app shell and dependencies before adding the repository-analysis service.

## Product Identity

- [x] Replace the remaining ArchTrace product identity with Repogram in visible interface copy and page metadata.

## Traceable Real-Repository Journeys

- [x] Remove preview and mock analysis data from the user-facing workspace; require a real public repository before drawing a diagram.
- [x] Derive only evidenced nodes and relations from repository files, with the source file available for inspection.
- [x] Add an explicit User Journey control that traces a bold sequential path from user access to the live application.
- [x] Add an explicit DevOps Journey control that traces source, pipeline stages, infrastructure, deployment, and production readiness in order.
- [x] Surface sequential and parallel pipeline stages with clear stage numbering, lane grouping, and next-step relationships.
- [x] Verify that a real GitHub repository produces a readable end-to-end diagram without invented components or mock data.
- [x] Review screenshots for journey comprehension and correct any ambiguous route ordering before final delivery.

## Evidence Integrity Verification

- [x] Remove or explicitly mark signal-only nodes that have no source-file evidence.
- [x] Validate a real repository with an evidenced DNS or load balancer, ingress, service, and workload route.
- [x] Add and run a parser test for malformed YAML/Terraform input that verifies safe omission without invented output.
- [x] Attach source-file evidence to every rendered relationship or omit the unsupported relationship.
- [x] Expose relationship evidence in the diagram interface for inspection.

## User-requested Evidence and Spacing Refinement

- [x] Do not render an empty domain, monitoring lane, service, stage, or icon when no parsed repository-file evidence exists.
- [x] Increase spacing between domains and nodes, and use clearer orthogonal routing so arrows remain traceable without overlap.

- [x] Keep Docker stage chains in clear sequential rows to avoid wrapped-arrow ambiguity in dense pipeline groups.

- [x] Validate one real GitHub repository that shows its declared user entry and dense DevOps evidence in the same final diagram.

- [x] Prioritize related Kubernetes Ingress, Service, and workload manifests when selecting files from large repositories.

## DEPI-GP Repository Analysis Fix

- [x] Inspect `github.com/k-fathi/DEPI-GP` for actual Docker, registry, OWASP, CI, and deployment evidence that should be visualized.
- [x] Render relation arrows and tool icons for every evidenced DEPI-GP pipeline stage without reintroducing inferred tools.
- [x] Verify the DEPI-GP diagram and add regression coverage for its discovered file patterns.

## Per-Stage Tool Icon and Arrow Refinement

- [x] Extract each evidenced CI/CD tool or technology used inside a DEPI-GP pipeline stage and render it as an icon-bearing node.
- [x] Render a direct in-card stage-to-tool arrow treatment for sourced tool icons without recreating the old cluttered graph links.
- [x] Verify the DEPI-GP pipeline visually for Docker, Docker Hub, security scanners, registry, and deployment tool icons where files provide evidence.

## Pipeline Stage Card Layout

- [x] Keep each evidenced CI job as one stage card with its evidenced tool icons displayed inside the card.
- [x] Limit arrows in the primary diagram to declared job dependencies and stage order, while retaining tool evidence inside the source stage card.
- [x] Verify the compact DEPI-GP pipeline layout is readable with visible directional arrows.

- [x] Verify in the live DEPI-GP diagram that build jobs display GitHub Container Registry for `ghcr.io` and omit Docker Hub unless separately evidenced.

## DEPI-GP Diagram Structure Redesign

- [x] Inspect DEPI-GP files for evidenced Docker, Ansible, Terraform, Kubernetes workload, ReplicaSet, Secret, ConfigMap, Pod, Namespace, and service resources.
- [x] Separate the visual canvas into a named Pipeline section, Infrastructure section, Kubernetes Runtime section, and User path without mixing GitHub Actions and GitLab CI cards.
- [x] Render a DevOps engineer identity and a clear DevOps-to-Pipeline entry route when a sourced pipeline is present.
- [x] Increase section and stage spacing so arrows and evidence labels remain readable in the DEPI-GP diagram.
- [x] Verify DEPI-GP only shows the requested technology and Kubernetes resource icons when the repository files prove they exist.

## DEPI-GP Resource Audit Follow-up

- [x] Record which of ReplicaSet, ConfigMap, Pod, and Namespace are declared versus absent in DEPI-GP.
- [x] Add a regression check proving DEPI-GP-style resource selection includes only evidenced Kubernetes manifests.

## Evidence Snippet Side Panel

- [x] Preserve source snippets for selected YAML and Terraform configuration files during repository analysis.
- [x] Open an accessible side panel when a diagram node or relationship evidence is selected.
- [x] Render highlighted YAML or Terraform evidence, source path, and empty/error states without inventing content.
- [x] Add automated coverage and visually verify the side-panel selection flow.

## Evidence Panel Verification Follow-up

- [x] Add focused YAML and Terraform syntax highlighting inside the evidence snippet panel.
- [x] Add interaction coverage for opening evidence from a selected node and a relationship evidence item.
- [x] Verify the click-based node and relationship evidence flows in the live interface.

## Canvas Evidence Interaction Verification

- [x] Add a DevOpsArchitectureCanvas interaction test for clicking an evidenced node and opening its source panel.
- [x] Add a DevOpsArchitectureCanvas interaction test for clicking a relationship evidence item and opening its source panel.
- [x] Repeat a clean live node-then-relationship click sequence and record both open states.

## Expandable Pipeline Experience

- [x] Render a single explicit Pipeline entry node with provider icon, stage count, and expand/collapse control.
- [x] Reveal evidenced CI/CD stages in an ordered execution view with a visible Start and End state.
- [x] Label sourced hand-offs between stages and isolate parallel paths without crossing arrows.
- [x] Preserve tool icons and source-file evidence within each expanded stage.
- [x] Add interaction tests and verify the expandable Pipeline flow against DEPI-GP.

## Pipeline Motion and Execution Status

- [x] Add reduced-motion-safe expand and collapse animation to the Pipeline execution map and stage layout.
- [x] Fetch recent public CI execution data when the repository provider exposes it, without inventing run outcomes.
- [x] Map evidenced pipeline jobs to provider-reported execution states; otherwise show a clearly neutral not-reported state.
- [x] Render accessible colored status indicators with an explanatory legend and timestamp where reported.
- [x] Add automated coverage and verify animation and real-status behaviour against a public repository.

## Pipeline Motion and Provider Scope Follow-up

- [x] Add a reduced-motion-safe exit animation before the expanded Pipeline execution map and stages are removed.
- [x] Make the status feature scope explicit as GitHub Actions-only until GitLab CI and Bitbucket Pipelines public status endpoints are implemented.
- [x] Add coverage for the collapse transition and provider-specific neutral state messaging.

## Pipeline Status Scope Test Follow-up

- [x] Add a UI test for the explicit GitHub Actions-only status message on a non-GitHub pipeline.
- [x] Add a UI test for the neutral Not reported status messaging when GitHub returns no recent job result.

## Pipeline Neutral Badge Test Follow-up

- [x] Add a UI test that renders a GitHub Pipeline stage without reported execution data and asserts its visible Not reported badge.
