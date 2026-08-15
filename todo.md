# مهام النسخة الأولية

- [x] إنشاء محلل لرابط مستودع GitHub عام والتحقق من صيغة الرابط.
- [x] استدعاء GitHub REST API لقراءة شجرة الملفات العامة وتحليل إشارات DevOps.
- [x] إظهار Prometheus وGrafana فقط عند اكتشاف ملفات إعداد مرتبطة بهما.
- [x] بناء IconResolver يفضّل كتالوج الأصول المحلية ثم simple-icons ثم يوضح مصدر SVG المعتمد عند الغياب.
- [x] إنشاء مخطط React Flow بعقد مركبة ومسارات متعامدة وتخطيط ELK متكيف.
- [x] اختبار الوصول إلى شجرة مستودع عام وإتاحة GitHub REST API من المتصفح، مع رسائل واضحة للرابط غير الصحيح أو المستودع غير العام.
- [x] أخذ لقطة تحقق مرئية وتنفيذ فحص TypeScript النهائي قبل نقطة الحفظ.

## مهام النسخة الموسعة

- [ ] توحيد تحليل روابط GitHub وGitLab وBitbucket العامة ضمن نموذج مزود واحد.
- [ ] تنزيل وقراءة ملفات YAML وTerraform المرتبطة بالبنية مع قيود حجم وعدد آمنة.
- [ ] استخراج روابط الخدمات والموارد من `depends_on` ومراجع الموارد وملفات Kubernetes.
- [ ] ربط العلاقات المستخرجة بمسارات إضافية وشارات دلالية في الدياجرام.
- [ ] إضافة تصدير مساحة الرسم الحالية بصيغتي PNG وSVG.
- [ ] اختبار مزودات المستودعات والتصدير وحالات ملفات الإعداد غير الصالحة.
- [ ] إنشاء نقطة حفظ وتسليم النسخة الموسعة.

## مسارات التشغيل لكل مخطط

- [ ] إنشاء نموذج مستقل لمسار المستخدم: User → DNS/CDN أو Load Balancer → Ingress/Proxy → Service → Application.
- [ ] إنشاء نموذج مستقل لمسار DevOps: Source → build/test/security → image/build artifacts → registry → provision → deploy → observability.
- [ ] تفصيل مراحل Docker وDocker Hub وDocker Compose وJenkins وملفات CI حسب الملفات المكتشفة في كل مستودع.
- [ ] ربط المسارين بصريًا عند التطبيق الحي مع إبقاء دلالات المرور والنشر منفصلة.
- [ ] اختبار عرض تفصيلي يحوي رحلتي المستخدم وDevOps مع مستودع يحتوي ملفات Docker وYAML وTerraform.

## توحيد اللغة

- [x] Convert all interface copy, state messages, controls, and route guidance to English.
- [x] Verify visually and through a source scan that no Arabic text remains in the user-facing product experience.
