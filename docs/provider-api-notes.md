# ملاحظات واجهات مزودات المستودعات

## GitLab

يستعمل التطبيق واجهة `GET /projects/:id/repository/tree` بعد ترميز مسار المشروع في الرابط. تسمح الواجهة بقراءة شجرة مستودع عام دون توثيق، وتدعم `recursive=true` و`ref`، وتعيد حالة `404` للمسار غير الموجود. لقراءة الملفات المرشحة للتحليل، يستخدم التطبيق نقطة ملف GitLab الخام مع المشروع والمسار والفرع بعد ترميزها.

المصدر: https://docs.gitlab.com/api/repositories/#list-repository-tree

## Bitbucket Cloud

يستعمل التطبيق واجهة المصدر `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}`. تعيد هذه الواجهة قائمة صفحات لمسار مجلد أو محتوى خامًا لمسار ملف. يمكن بدء التصفح من `/src` للفرع الرئيسي ثم استعمال `links.self` أو الفرع الافتراضي لاستخراج الملفات المطلوبة.

المصدر: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-source/

## حدود التنفيذ

يقتصر التحليل التفصيلي على عدد قليل من ملفات YAML وTerraform المرشحة، مع حد لحجم الملف، حتى لا يتحول إدخال رابط عام إلى تنزيل كامل للمستودع. تتحد بيانات GitHub وGitLab وBitbucket خلف نموذج `RepositoryAnalysis` واحد قبل إرسالها لمحرك الرسم.

## تحقق الواجهة

تم اختبار الرابط `https://gitlab.com/gitlab-org/cli` مباشرة عبر واجهة التطبيق. تم التعرف على GitLab CI وDockerfile، وتحويل مراحل ملف CI المكتشفة إلى عقد داخل مسار DevOps، مع إبقاء رحلة المستخدم مستقلة: End User → DNS/Routing → Load Balancer → Live Application. تظهر علاقات المرور باللون الأخضر وعلاقات النشر المتحركة بالأزرق المتقطع، وتوفر الواجهة تصدير PNG وSVG.

تم تشغيل زر PNG على مخطط GitLab من داخل المتصفح، وتأكد تنزيل الملف باسم `gitlab-org-cli-architecture.png` في سجل التنزيلات.

تم اختبار زر SVG كذلك، وتأكد تنزيل `gitlab-org-cli-architecture.svg`. أظهر مخطط GitLab فصلًا مكانيًا واضحًا بين مسار المستخدم الأخضر ومسار DevOps المتدرج، مع تفاصيل GitLab CI وDockerfile التي اكتشفها المحلل من المستودع العام.

تم اختبار رابط Bitbucket العام `https://bitbucket.org/fargo3d/public` داخل التطبيق. تعرّف التطبيق على المزوّد والفرع `release/public` وأكمل استكشاف الشجرة دون خطأ، ثم أظهر مساري المستخدم وDevOps مع عقد إعداد بديلة عند عدم وجود ملفات DevOps قابلة للاكتشاف في ذلك المستودع.
