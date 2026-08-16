# اتجاه تصميم ArchTrace

## ثلاثة مسارات بصرية

| Theme Name | Very Brief Intro | Probability |
| --- | --- | --- |
| هندسة التشغيل الهادئ | سطح رسم داكن مريح مستوحى من أدوات الهندسة وخرائط الشبكات، يحافظ على الرموز والعلاقات بوصفها العنصر البصري الأساسي. | 0.07 |
| دفتر البنية السحابية | لغة ورقية فاتحة تشبه مخططات البنية المطبوعة، مع طبقات ملونة رقيقة ومظهر تحريري. | 0.04 |
| غرفة التحكم الطيفية | واجهة ليلية عالية التباين ذات لوحات مراقبة كثيفة وإشارات حالة متحركة بحذر. | 0.09 |

## الاختيار: هندسة التشغيل الهادئ

### Design Movement

**مخططات هندسية تحريرية معاصرة** تجمع بين وضوح أدوات الرسم التقني واتزان واجهات البنية التحتية المهنية. الهدف هو مخطط يمكن قراءته كخريطة نظام، لا كلوحة تحكم أو عرض تسويقي.

### Core Principles

1. تكون **العقدة والعلاقة** أهم من الإطار المحيط؛ لذلك تبقى الواجهة العليا قصيرة وغير متطفلة.
2. يستخدم المخطط طبقات مكانية واضحة: حدود نطاقات رقيقة، عقد رمزية صغيرة، ومسارات متعامدة قابلة للتتبع.
3. تكون دلالة اللون وظيفية فقط: أخضر للحركة المرورية، أزرق للنشر، سماوي لكوبرنيتس، وبرتقالي للبنية السحابية.
4. يحافظ كل عنصر على كثافة منخفضة وقراءة سريعة، مع تجنب الوهج والزخرفة المتكررة.

### Color Philosophy

قاعدة لونية من **فحم حبر الحبار #0B0F17** وسليت داكن تقدم سطح رسم هادئًا لا ينافس الأيقونات. تظل الألوان التشغيليّة مشبعة بدرجة منضبطة حتى تظهر بوصفها إشارات وظيفة، لا مؤثرات تجميلية: أخضر المرور (#22C55E)، أزرق النشر (#60A5FA)، وسماوي كوبرنيتس (#38BDF8).

### Layout Paradigm

واجهة بتركيب **شريط أدوات قصير فوق مساحة عمل مهيمنة**. تشغل مساحة الرسم معظم النافذة، وتتوزع النطاقات من اليسار إلى اليمين وفق تدفق النظام: مستودع المصدر ثم خط النشر ثم البنية والكتلة ثم التطبيق الحي. لا توجد بطاقات لوحة تحكم مركزية؛ بل مخطط حر يتحرك ويتسع حسب المستوى المطلوب.

### Signature Elements

1. حدود نطاقات متقطعة دقيقة بعناوين مثبّتة عند الزاوية العلوية اليسرى.
2. مسارات ذات انعطافات 90 درجة مع شارات إجراءات صغيرة، مثل **Deploy** و **HTTPS**.
3. نقاط تقاطع ومربعات صغيرة صامتة ضمن نسيج الخلفية لتأكيد لغة الرسم الهندسي.

### Interaction Philosophy

تتصرّف الواجهة كأداة عمل: النقر على تفاصيل العرض يبدل مستوى التجريد، وسحب مساحة الرسم أو تكبيرها يحافظ على تركيز المستخدم. لا توجد حركات استعراضية؛ بل انتقالات قصيرة تشرح تغيير البنية وإعادة تموضعها.

### Animation

عند الانتقال بين العرضين، تتلاشى العقد الفرعية وتتحرك على منحنى تسارع سريع خلال 220–280ms، ثم تعاد رسم المسارات. يمكن أن تتحرك شرطات مسار النشر بحذر أثناء العرض التفصيلي فقط. تحترم الواجهة تفضيل تقليل الحركة.

### Typography System

يستخدم **IBM Plex Sans** للنصوص والتسميات (10–14px)، ويستخدم **IBM Plex Mono** لشارة المرجع ومعلومات المستودع ومسميات التدفق. العناوين قصيرة بوزن 600؛ لا توجد عناوين عملاقة. النص الأبيض المكسور للنص الرئيسي، وسليت هادئ للمعلومات الثانوية.

### Brand Essence

**ArchTrace هو سطح عمل بصري لفرق DevOps يحوّل بنية المستودع إلى خريطة تشغيل واضحة قابلة للاستكشاف، لا إلى قائمة أدوات مبعثرة.**

الشخصية: **دقيق، هادئ، تشغيلي**.

### Brand Voice

الصوت مباشر ومهني ويصف الأثر التقني بدل الوعود العامة. العناوين تسمي النظام أو حالته، وأزرار الإجراء تصف ما ستفعله بدقة.

أمثلة:

> "اقرأ تدفق النشر قبل أن تقرأ الملفات."

> "عرض التفاصيل يكشف الموارد التي تغيّر مسار الإنتاج."

### Wordmark & Logo

العلامة عبارة عن **ثلاث عقد مربعة متصلة بمسار متعامد** مع نقطة إشارة صغيرة؛ يظهر الاسم بجانبها بحروف Plex Mono متباعدة قليلًا. لا تستخدم العلامة شكل سحابة نمطيًا أو أحرفًا داخل الأيقونة.

### Signature Brand Color

**إشارة المسار — #38BDF8**: سماوي هندسي يستعمل فقط لإبراز نقاط الاتصال والعناصر التفاعلية الحيوية.

## Style Decisions

- يلتزم التنفيذ بالمخطط المرجعي كفكرة تفاعل: مساحة عمل قابلة للاستكشاف بدل لوحة بيانات مليئة بالألواح.
- سيستخدم التطبيق علامة مخصصة بلا نص ونسيج تقني منخفض التباين، مع عدم وضع أي نص فوق الخلفية من دون ضمان تباين كافٍ.
- تستعمل الرموز الخاصة بخدمات DevOps من كتالوج محلي مرفوع داخل بيئة المشروع قبل أي حل بديل من مكتبة رموز.
- يكون مخطط التشغيل الناتج هو نقطة الارتكاز البصري الأولى؛ لا يسمح للفراغ أن يجعل العقد أو المسارات تبدو ثانوية أو مصغّرة.
- تصف النسخة النصية حالة تشغيل قابلة للملاحظة، مثل «من المستودع إلى بيئة التشغيل»، بدل تسميات منتجات SaaS عامة.
- تبقى أسماء البروتوكولات والخدمات التقنية بالإنجليزية، فيما تكون التعليمات والإجراءات والرسائل التوضيحية بالعربية بصورة متسقة.
- يجب أن يشغل المخطط التشغيلي أغلب مساحة العرض الأول، وأن تكون مسارات المرور والنشر أوضح من خطوط الاعتماد الثانوية.
- تكون لغة المنتج عربية افتراضيًا، فيما تبقى أسماء المستودعات والمنصات والخدمات والبروتوكولات ومسارات الملفات باللغة التقنية الأصلية.
- يظهر اسم ArchTrace بهوية Mono تقنية متباعدة متصلة بالعلامة ذات العقد الثلاث، لا كنص عنوان تقليدي.

## Traceability Audit — August 2026

### Findings from the Current Real-Repository Screenshot

1. The current preview remains visible while a repository is loading, which violates the no-mock-data requirement and makes the visual output appear unrelated to the submitted repository.
2. The diagram has an understandable left-to-right macro layout, but dense grids in the pipeline and runtime groups make sibling ordering ambiguous. Repeated `Next` edge labels do not tell a first-time viewer whether stages are sequential or parallel.
3. The User Journey and DevOps delivery paths cross the same canvas without an interaction that isolates one route. A viewer must inspect every edge manually to understand a journey.

### Chosen Direction: Traceable Journeys

- Start with an empty evidence state; draw only after a real public repository has been analyzed successfully.
- Present **User Journey** and **DevOps Journey** as explicit, selectable controls. Selecting either path dims unrelated nodes and renders its ordered edges with a bold, animated route.
- Put numbered stage markers on the selected journey. The DevOps sequence is source → CI stage(s) → artifact/image → infrastructure → deployment → live application.
- Represent parallel pipeline work in a clearly bounded lane with a `Parallel` label, while keeping the sequence of the enclosing stages unambiguous.
- Attach every rendered node and relation to discovered evidence. The inspector must show the source file path; unsupported or absent tools must never be invented.

### Real-Repository Verification Source

Tested URL: `https://github.com/argoproj/argo-cd`. The resulting view identifies GitHub Actions workflow jobs, Dockerfile build stages, Kubernetes runtime resources, and the associated evidence file names. The trace controls are visible after analysis; the next verification step is confirming their selected-state route emphasis and stage ordering.

The later verification confirmed that the workspace displays an empty evidence state during loading instead of a sample map. It now labels missing infrastructure as `NO EVIDENCE` and describes an unobserved public-access path as `External path not declared`; this prevents the map from presenting inferred services as discovered facts.

Export verification: the real repository diagram generated `argoproj-argo-cd-architecture.png` successfully from the current workspace.

The corresponding SVG export action was triggered from the same real-repository workspace and is being verified in browser download history.

Download history confirmed `argoproj-argo-cd-architecture.svg`, completing verification of both requested export formats.

Provider verification note: direct same-origin GitLab analysis succeeds when the public API is available, while repeated uncached provider requests can return the documented rate-limit/unavailability state. The interface intentionally clears the canvas and shows the explicit provider error rather than retaining a stale or sample diagram.

The standard GitLab URL rendered its real CI-stage evidence in the UI. The Bitbucket validation URL also rendered successfully; because it contained no detected deployment configuration, Repogram showed `NO EVIDENCE` groups and zero signals rather than inventing a pipeline or infrastructure.

After the no-inference refinement, the same Bitbucket repository no longer renders a declared application runtime or an external access edge. It presents only the repository, end-user context, and explicitly empty evidence groups.

Real-configuration validation source: `https://github.com/HoussemDellai/ProductsStoreOnKubernetes` contains GitHub Actions, Dockerfile stages, Docker Compose, Terraform, Kubernetes, and Ansible paths. Repogram displayed the discovered Docker/Compose stages, Ansible evidence, and extracted dependency labels. Where the bounded file selection did not include a runtime manifest, it explicitly marked the runtime lane as `NO EVIDENCE`.

The priority-aware tree scan then surfaced concrete Terraform resources, Prometheus, and Grafana for the same repository. Visual review confirmed that the detailed journey controls, evidence labels, dashed group boundaries, and file-derived nodes remain readable. The product must stay English-only and retain the user-requested charcoal/green/pink/amber/olive reference palette; contrary advisory suggestions for Arabic or cyan are intentionally not applied.

Full user-journey validation target: the small public `inlets/ingress-example` repository declares `deployment.yaml`, `service.yaml`, and `ingress.yml`. Its documented flow routes Internet traffic through an Ingress to a Service and then to Pods created by the Deployment, making it appropriate for proving the complete declared request path without fabricated infrastructure.

The Repogram verification of `inlets/ingress-example` produced the declared, numbered User Journey: End User → Ingress → Service → Deployment → Live application, with each discovered service carrying its corresponding YAML filename. The runtime grid is ordered by observed traffic role (Ingress, Service, then workload) so the canvas now follows the same left-to-right reading order as the numbered trace.

Final strict-evidence check: the DevOps validation repository displays only parsed Docker stages, Docker Compose services, GitHub Actions jobs, and Terraform resources, each with a file label; it no longer shows generic signal-only nodes. In the ingress repository, the terminal `Declared Application Runtime` is also labeled with `deployment.yaml`, while the only label without a file remains the conceptual End User entry point.

Evidence-and-spacing refinement: empty pipeline, infrastructure, and runtime groups are now removed instead of being rendered as `NO EVIDENCE` boxes. The displayed relationship list gives every visible route a source path. Node cards, grid gaps, group padding, ELK layer gaps, and canvas height have all been increased to preserve separation between observed stages and make a selected journey easier to read.

Final relation-integrity refinement: layout no longer draws repository-to-stage, stage-to-infrastructure, infrastructure-to-runtime, or other cross-domain bridge arrows merely to imply an order. The canvas renders only connections extracted from a configuration file, and the dense Docker/Terraform validation shows these source-backed paths with substantially more space between cards and group boundaries.

The Kubernetes validation now derives the public entry from the Ingress manifest itself: `End User → Ingress` carries `ingress.yml`, while `Ingress → Service` carries the same file and `Service → Deployment` carries `service.yaml`. The conceptual live-application endpoint is absent, so no unproved terminal node remains on the diagram.

Dense-layout visual QA: the `ProductsStoreOnKubernetes` workspace now renders its file-backed Docker, Compose, CI, and Terraform nodes after an empty-user-group regression fix. Pipeline cards occupy a three-column grid with wide gaps; Terraform resources occupy a separate, widely spaced group; and all remaining arrows connect only their parsed source and target nodes without cross-domain bridge arrows.

Clean-screenshot inspection confirms that the dense pipeline grid has distinct card boundaries and horizontal/vertical lanes between rows, while the Terraform group is separated by substantial canvas space. The remaining `builds` and `depends_on` paths stay inside their respective file-backed groups and do not cross the empty inter-domain area; labels remain adjacent to their own arrows.

After the final layout adjustment, each four-stage Dockerfile chain occupies one left-to-right row (`base → build → publish → final`) with its own horizontal arrow lane. This removes the previous row-wrap ambiguity in the dense pipeline group; Compose and CI nodes occupy the final row, leaving their evidence-backed dependencies visually distinct.

Candidate unified-validation repository: `https://github.com/FirelyTeam/kubernetes-cluster-deployment` contains Terraform for AKS infrastructure and Helm configuration that deploys an NGINX Ingress Controller and cert-manager. Its documentation describes Terraform provisioning, Helm deployment, and the ingress controller's external IP, so it is a relevant public source for testing a combined infrastructure and public-entry map.

Preferred unified-validation candidate: `https://github.com/GoogleCloudPlatform/microservices-demo` exposes GitHub Actions, Dockerfiles, Terraform, Kubernetes manifests, and a frontend external Service. It is better suited to exercising a single evidence-only map because its public documentation lists all of those repository directories and the external frontend service.

Unified validation completed with `GoogleCloudPlatform/microservices-demo`: the final evidence-only output includes a GitHub repository node, Docker build-stage relations, GitHub Actions jobs, Terraform infrastructure dependencies, and `End User → Ingress: frontend-ingress` sourced directly from `release-cluster/frontend-ingress.yaml`. No empty monitoring lane or synthetic runtime endpoint is shown.

Clean visual inspection of the unified map confirms that the User Journey occupies an isolated upper lane, build/delivery uses a compact four-column grid at lower left, infrastructure uses a separate grid at lower center, and the evidenced ingress is isolated at lower right. The user-entry route has a dedicated vertical and horizontal lane, avoiding overlap with the build and Terraform dependency paths.

The immediate repeat analysis of the unified GitHub candidate was temporarily blocked by the public GitHub API rate limit. The revised Kubernetes selection strategy is covered by a unit test that asserts Ingress, Service, and Deployment files are all prioritized; the existing parser test independently proves the direct `user → ingress → service → deployment` evidence chain.

An integrated selection test now confirms that the prioritized Kubernetes file set preserves the complete declared `Open application → HTTPS → Selects` route when Ingress, Service, and Deployment manifests are selected together. TypeScript validation and all eight unit tests pass after the change.

The `lablabs/terraform-aws-eks-alb-ingress` source was reviewed as a Load Balancer candidate. It is a Terraform module for installing an ALB Ingress Controller and includes GitHub Actions and Terraform, but it does not declare an application Service and workload in the same repository, so it is not used to claim a complete user route.

The actual `release/kubernetes-manifests.yaml` file in `GoogleCloudPlatform/microservices-demo` declares the frontend Deployment and the `frontend-external` Service with `type: LoadBalancer` and selector `app: frontend`. This file supplies direct repository evidence for `End User → LoadBalancer Service → frontend Deployment`; the revised manifest-priority selector is intended to retain it alongside ingress files when public API access is available.

The finalized priority test explicitly keeps `release/kubernetes-manifests.yaml` alongside Ingress, Service, and Deployment files. This complements the direct raw-source check of the real repository's `frontend-external` LoadBalancer and `frontend` Deployment, and all eight unit tests continue to pass.

In-app validation now succeeds after prioritizing the unified manifest: `GoogleCloudPlatform/microservices-demo` renders `End User → Service: frontend-external → Deployment: frontend` from `release/kubernetes-manifests.yaml`, alongside Docker stage relations, GitHub Actions jobs, and Terraform dependencies. The relationship evidence panel lists the exact source file for the LoadBalancer-to-workload route.

The completed in-app view confirms 23 source-backed relationships, including the full user path and dense DevOps nodes. It keeps the user-entry lane above the separate build/delivery, infrastructure, and runtime domains, with no synthetic bridge arrows or empty monitoring group.

With the DevOps trace enabled, the workspace assigns ordered labels to repository, Docker stages, CI jobs, Terraform resources, and declared runtime objects while preserving source paths in the trace panel. This confirms that sequential and parallel evidence is inspectable without adding a fabricated production endpoint.

The normal architecture overview after tracing retains separate wide domain boxes for build/delivery, infrastructure, and runtime. The only long user-traffic edge runs in its own upper lane to the externally declared frontend Service, so it does not intersect the dense runtime dependency grid.

Final clean-screenshot QA of `GoogleCloudPlatform/microservices-demo` confirms the rendered full path visually: the End User group is isolated above the workspace, its declared traffic line travels through empty canvas to the frontend-external Service, and the short service-to-workload edges remain contained inside the runtime box. Build/delivery, infrastructure, and runtime domains use separate wide boxes, with no empty monitoring lane or cross-domain fabricated arrow.

Objective final-layout QA queried the rendered React Flow canvas directly: all 32 service and workflow node bounding boxes were measured, and the overlap set was empty (`nodeCount: 32`, `overlaps: []`). This supplements the clean screenshot review with a deterministic verification that cards do not sit on top of each other.

DEPI-GP pipeline evidence from `.gitlab-ci.yml` includes Node.js install/test/lint, Terraform validation, Docker build with Docker-in-Docker, Nexus Registry login/push, Trivy, Gitleaks, NJSScan, Semgrep, tfsec, Retire.js, npm audit, and Kubernetes-manifest updates. The file does not contain an OWASP Dependency-Check invocation, so an OWASP icon must not be invented; npm audit may be shown as its evidenced dependency-scan tool instead.

The first DEPI-GP rendering confirms sourced arrows and GitLab tool nodes are now extracted, but its dominant `.github/workflows/ci-cd.yml` job nodes still need per-job tool extraction. The next fix must read GitHub Action steps as well, then place tools beside their source job rather than allowing the pipeline group to become one undifferentiated long grid.

The DEPI-GP GitHub Actions workflow directly declares `actions/checkout`, `actions/setup-node`, `npm install`, `gitleaks/gitleaks-action`, `pip3 install njsscan`, `njsscan`, and `aquasecurity/tfsec-action`. These tool references are authoritative sources for per-job tool nodes and directed `uses` arrows in the GitHub Actions branch of the parser.

DEPI-GP now renders each CI job as a stage card with its sourced tool icons inside the card. A direct DOM check confirmed all 46 visible relationship paths carry closed arrow markers (`edgeCount: 46`, `arrowMarkedEdges: 46`), using the brighter deployment route color above the group surfaces.

The final DEPI-GP DOM check measured 46 non-container stage/service cards with no overlaps, 77 embedded resolved tool icons, zero unresolved tool badges, and 46/46 edge paths carrying closed arrowheads. This validates the compact stage-card approach instead of the previous separate, overflowing tool-node grid.

The DEPI-GP workflow declares `REGISTRY: ghcr.io`, so the corrected representation is GitHub Container Registry rather than Docker Hub. A fresh in-app analysis attempt after this parser change encountered the public GitHub API rate limit; automated extraction coverage passed locally and the earlier live DEPI-GP rendering remains the visual evidence for the stage-card and arrow presentation.

Live re-analysis later completed successfully. The rendered DEPI-GP DOM confirms three `GitHub Container Registry` tool icons in Docker build stages, zero `Docker Hub` tool icons, 80 in-card tool arrows, and 46 graph edge arrowheads. The diagram therefore reflects the repository's declared `ghcr.io` registry rather than inventing Docker Hub.

## DEPI-GP Resource Audit — August 2026

Direct inspection of the `main` branch file tree found declared ConfigMap templates and manifests (`helm/templates/configmap-*.yml`, `k8s/config-maps/*.yml`), Secret templates and manifests, Services, Deployments, a StatefulSet, and HorizontalPodAutoscaler manifests. The tree inspection found no standalone ReplicaSet, Pod, or Namespace manifest path. Repogram must therefore render the evidenced configuration and workload kinds, while omitting ReplicaSet, Pod, and Namespace for this repository rather than filling the diagram with anticipated Kubernetes objects.

The bounded configuration-file selector now reserves places for distinct Kubernetes resource families and the parser test suite verifies sourced `ConfigMap → Deployment` configuration edges, `Secret → Deployment` configuration edges, and `HorizontalPodAutoscaler → Deployment` scaling edges. This is intentionally evidence-only: resource support is broad, but each repository diagram remains limited to resources declared in its selected files.

## Evidence Panel Verification — August 2026

The side panel retains only bounded source snippets from the files selected during analysis. It labels each excerpt with the real repository path and source type, presents numbered YAML, Terraform, or Docker lines with focused syntax colouring, and deliberately replaces Kubernetes `Secret` contents with a redaction notice rather than exposing values.

Live browser verification against `k-fathi/DEPI-GP` confirmed the click flows with real repository evidence: clicking the rendered `Service: proshop-backend` node opened `k8s/services/back-svc.yml` with the panel caption `Selected diagram node`; after closing it, clicking the visible `Service: proshop-backend Selects Deployment: back-deploy` relationship item opened the same sourced YAML with the relationship caption. The interaction test suite also mounts `DevOpsArchitectureCanvas`, clicks an evidenced node and a rendered relationship evidence item, and asserts the corresponding panel title, relationship context, file path, and snippet.

The final browser sequence was captured from a clean DEPI-GP workspace: the Service node opened the panel, the panel was closed, and a DOM click on the visible `Service: proshop-backend Selects Deployment: back-deploy` relationship item opened it again. The follow-up browser snapshot showed the `Close` control and the relationship caption beside `k8s/services/back-svc.yml`, confirming the second open state after the node flow.

## Expandable Pipeline Verification — August 2026

The collapsed `B · PIPELINE · GITHUB ACTIONS` area now acts as a distinct entry card: it identifies the provider, counts sourced stages, and exposes a single `Expand stages` action instead of showing a dense, unexplained grid. In its expanded state, the workspace displays a `PIPELINE EXECUTION MAP` above the canvas. The map explicitly reads left to right from `START`, through numbered hand-off columns, to the terminal hand-off; it lists every connected stage in a column and labels multi-stage columns `PARALLEL`.

Live DEPI-GP verification showed the declared main path as Docker build and install jobs, then test/lint/security-audit hand-off, then parallel builds, and finally the Trivy/deploy-manifests hand-off. Stages with no declared dependencies are now labelled `INDEPENDENT` and rendered in a separate lower lane, avoiding a false claim that they belong to the main delivery path. The expanded canvas automatically focuses the Pipeline group and its stages, while the original full architecture remains available after collapsing.

## Pipeline Motion and Execution Status Verification — August 2026

Pipeline expansion now animates the execution map from its header and staggers visible stage-card entrance with transform-and-opacity-only motion. The implementation respects `prefers-reduced-motion`, in which the nonessential motion is removed. The visual status key defines Passed, Running, Failed, and Queued colors, but stage badges receive those colors only from the recent public GitHub Actions job result associated with the analyzed repository.

DEPI-GP currently exposes no recent public Actions run on its default branch. The live diagram therefore displays the gray `Not reported` badge on its stage cards and execution map, together with an explanation that the product has not simulated a result. This verifies the safeguard against presenting invented success, running, or failure claims as repository facts.

The GitHub implementation follows the official public REST endpoints for [listing workflow runs](https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28) and [listing jobs in a workflow run](https://docs.github.com/en/rest/actions/workflow-jobs?apiVersion=2022-11-28). These endpoints expose job `status`, `conclusion`, timestamps, and a public HTML URL for repositories the viewer can read. Repogram maps only those reported values to Passed, Running, Failed, or Queued; all other cases remain Not reported. Live public status fetching is explicitly scoped to GitHub Actions while GitLab and Bitbucket retain neutral status messaging.

During the post-fix DEPI-GP verification, the browser still showed the explicit DevOps Engineer → Pipeline `operates` arrow and the collapsed Kubernetes Cluster control, but public GitHub REST availability had only 13 core requests remaining. A fresh analysis therefore selected a reduced file set. The automated regression suite is the definitive verification for Namespace evidence integrity in this pass: a resource with `metadata.namespace` but no Namespace manifest must not create a Namespace card or `contains` arrow.

After switching public GitHub configuration-file reads to `raw.githubusercontent.com`, DEPI-GP was reanalyzed with the complete expected resource selection. Expanding the Cluster showed six declared resources—Service, Deployment, StatefulSet, ConfigMap, HorizontalPodAutoscaler, and Secret—with no synthetic Namespace card or `contains` edge. The live relationship evidence showed Service → Deployment (`Selects`), Secret → Deployment (`config`), HPA → Deployment (`scales`), and DevOps Engineer → Pipeline (`operates`), each with the source file path.

## Workload Hierarchy and Focus Verification — August 2026

The implementation now derives a `Deployment → ReplicaSet → Pod` hierarchy exclusively from declared `ownerReferences`. ReplicaSet and Pod cards remain hidden until their immediate owning workload is expanded, so inferred runtime children are never introduced. The Cluster summary exposes an in-context legend for Traffic, Delivery, Dependency, and Owns routes, and a Focus Mode control is shown only for an evidenced `Service → Deployment` `Selects` relation.

The automated suite passed 35 tests after adding parser coverage for `ownerReferences`, layout coverage for nested workload expansion, and Canvas coverage for the Service-to-Deployment Focus Mode. A production build also completed successfully. A new live DEPI-GP request returned the product's explicit public-repository unavailability state rather than retaining stale data. A direct GitHub repository probe concurrently returned HTTP 504 while the rate-limit endpoint still reported remaining allowance, so this is recorded as an upstream availability constraint rather than a diagram inference or rendering failure.

A later retry of the same live DEPI-GP request completed successfully. Its live toolbar showed `Kubernetes: expand topology` and the gated `Cluster focus: Service → Deployment` control, alongside the separate Pipeline control and the DevOps Engineer `operates` route. The collapsed Cluster reported six evidenced resources, consistent with the earlier evidence-only resource audit. DEPI-GP does not declare standalone ReplicaSet or Pod manifests, so it correctly has no Workload-child expand button in this real-repository rendering; the nested child behavior is covered by explicit parser, layout, and interaction tests rather than invented runtime descendants.

Live Cluster verification then expanded the six sourced cards: Service `proshop-backend`, Deployment `back-deploy`, StatefulSet `mongo`, ConfigMap `mongo-init-script`, HorizontalPodAutoscaler `back-hpa`, and Secret `proshop-secret`. It displayed exactly the evidence list for `Selects`, `config`, `scales`, and `operates`, plus the Cluster legend for Traffic, Delivery, Dependency, Owns, and the new `Focus: Service → Deployment` explanation. Activating Focus Mode changed its control to `Cluster focus: exit`, kept only the Service and Deployment visually prominent, and dimmed all other Cluster resources and their unrelated arrows. This confirms the requested evidence-gated focus interaction in the live DEPI-GP workspace.

For the live hierarchy check, `philippemerle/KubeDiagrams` was selected because its public `nginx-deployed-all.yaml` documents Pods owned by a ReplicaSet and a ReplicaSet owned by a Deployment. Repogram analyzed the repository successfully and surfaced an expandable Cluster with 24 evidenced resources, providing a suitable non-synthetic source for the next interaction check.

An alternative public manifest dump, `GopeshSharma7/Url-App`, was not suitable for live hierarchy verification: its large tree exceeded the safe tree/sample budget before the `default/` Deployment, ReplicaSet, and Pod manifests were reached, and the UI correctly rendered no Kubernetes topology rather than guessing. This confirms that hierarchy validation needs a manifest-selection improvement, not an inferred child fallback.

The first KubeDiagrams retry still showed the bounded 24-resource Cluster without an exposed child control, demonstrating that selection alone was insufficient when the global rendering cap was applied after parsing. The final adjustment now promotes both endpoints of evidenced `owns` relationships before applying that cap; its unit test deliberately places a Deployment, ReplicaSet, and Pod behind 24 unrelated resources and confirms all three are retained first.

Direct inspection of the live analysis payload then confirmed the public `nginx-deployed-all.yaml` does supply three Pods, their ReplicaSet, the owning Deployment, and four `owns` relationships. The chart had hidden these `default`-namespace resources because four unrelated explicit Namespace manifests were present while no `Namespace: default` manifest was declared. The visibility rule was corrected: resources in a namespace without an explicit Namespace manifest remain visible as directly declared resources, while resources inside an explicitly declared namespace still require that namespace to be expanded. The new regression test passed with the full 40-test suite.

The live KubeDiagrams Cluster now shows `Deployment: nginx-deployment` with `Expand 1 children`. Selecting it renders its evidence-backed `ReplicaSet: nginx-deployment-85996f8dbd`, adds the purple `owns` relation to the evidence list, and changes the parent control to `Collapse children`. The ReplicaSet exposes `Expand 3 children`, confirming the hierarchy is staged by immediate declared ownership rather than displaying Pods prematurely.

The final live interaction expanded that ReplicaSet and revealed exactly three declared Pods, each labeled `WORKLOAD CHILD` and linked from the ReplicaSet by an `owns` relationship whose evidence is `examples/miscellaneous/nginx-deployed-all.yaml`. The parent and ReplicaSet controls both switched to `Collapse children`; no descendant was introduced before its direct owner was expanded. This completes the required public-repository verification of the hierarchy, Focus Mode, and Cluster legend.
Collaboration enhancement verification: the implementation passed TypeScript and the focused interaction suite, and the production build completed. A live preview was opened with the public KubeDiagrams repository; the preview correctly remained empty and displayed the existing GitHub rate-limit/unavailable message after two attempts, so no mock data was introduced. The share/settings/filter controls remain covered by tests and will be rechecked on a repository analysis when the public API is available.

DEPI-GP regression pass started: the exact repository URL was opened after restarting the development server. The interface entered its real `Inspecting repository evidence` state and remained loading through the next observation, so no visual conclusions are being drawn yet. A local authenticated clone confirmed the workflow contains a Terraform validation job and an evidenced deployment job that updates `k8s/deployments/back-deploy.yml` and `k8s/deployments/front-deploy.yml`; the Terraform repository declares an EKS module/resource. These are the evidence-only basis for the new Pipeline → Infrastructure → Kubernetes bridges.

First successful DEPI-GP rendering after retry: the compact detailed view now shows `Repository → Pipeline → Infrastructure → Cluster` in left-to-right order, but it still exposes two delivery relations only: `updates manifest` from Pipeline to Cluster and `operates` from DevOps Engineer to Pipeline. The Terraform job-to-Infrastructure and EKS-to-Cluster bridges did not arrive in the analyzed payload, so they require parser-level diagnosis. The screenshot also confirms that a collapsed Pipeline is readable, yet its very wide empty canvas and sparse Infrastructure card make the end-to-end sequence less obvious than intended. These observations are being used as the next design baseline.

Follow-up diagnosis: the live tRPC payload does contain the evidence-backed `terraform-validate → infrastructure` (`validates infrastructure`) and `infrastructure → cluster` (`provisions Kubernetes`) relations. The browser still displays the earlier 19-relation result and only two edges after a UI retry, so the next check will force a fresh page load and inspect the current client result before judging the routing change. This avoids treating a stale browser analysis object as a layout defect.

Forced navigation still rendered only `updates manifest` and `operates`. Direct DOM inspection confirms the current canvas has exactly those two edges, while the direct service payload contains the two additional delivery bridges. This points to a client-side graph layout/known-node filtering issue rather than missing parser evidence; the next iteration will make collapsed delivery bridges explicit at the group level and add a regression test that catches their omission.

The next successful DEPI-GP pass showed all five intended group-level routes: `Open application`, one deduplicated `updates manifest`, `validates infrastructure`, `provisions Kubernetes`, and `operates`. The direct Pipeline-to-Cluster update remains intentionally distinct from the Terraform provisioning route because both are evidenced in different files. To prevent their visual overlap, the next styling pass assigns the user route and manifest shortcut to separate hidden handles on the Cluster. The subsequent fresh analysis is still loading at the latest observation, so its screenshot will be evaluated only when real data returns.

Trace User Journey live verification now succeeds on DEPI-GP. Selecting the control automatically opens the Cluster and reveals an explicit four-step, numbered path: `End User → Ingress: ingress → Service: proshop-svc → Deployment: proshop-deploy`, sourced respectively from the Ingress, Service, and Deployment manifests. The highlighted traffic edges are visually separated while unrelated delivery/dependency edges are dimmed. The screenshot confirms that the user path no longer reports itself as unresolved when the Cluster begins collapsed.

Edge-routing pass: the DEPI-GP live preview was rate-limited by the public GitHub API during the final re-open attempts, so no new repository payload was invented. The latest previously captured DEPI-GP rendering identified the noisy paths as collapsed-section bridges sharing generic handles and multiple resource relations converging on the same node sides. The implementation now assigns dedicated route handles: delivery-out/delivery-in for Pipeline manifest updates, infrastructure-out/infrastructure-in for Pipeline validation, cluster-out/provision-in for Terraform provisioning, journey-in for user traffic, traffic-in/out for runtime traffic, and relation-in/out for dependency/ownership edges. The DEPI-GP continuity regression now asserts those handle assignments; full tests and production build pass.

Final DEPI-GP visual regression after GitHub API recovery succeeded. In the collapsed overview, the User Journey is a single green top route from End User to Cluster; the DevOps bridges are visibly separated: Pipeline → Infrastructure (`validates infrastructure`), Infrastructure → Cluster (`provisions Kubernetes`), and Pipeline → Cluster (`updates manifest`) with distinct orthogonal lanes. The DevOps Engineer operates the Pipeline without an unconnected actor. The refreshed view also exposes the new Zoom out, Zoom in, and Fit diagram to view controls.

The Pipeline expansion keeps the execution map in a separate upper panel with readable left-to-right hand-off columns and parallel cards. The expanded stage details do not overlap the cross-section bridge routes; the dense relationship evidence remains in its own collapsible section, while the canvas topology stays spatially separated below. No remaining cross-section arrow interference was observed in the fresh DEPI-GP screenshots. GitHub API core quota was restored before this regression (`remaining: 14999`).
