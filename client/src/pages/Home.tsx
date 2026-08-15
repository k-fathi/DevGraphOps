/**
 * ArchTrace page direction: quiet operational tooling with a canvas-dominant composition,
 * charcoal drafting surface, IBM Plex typography, and restrained cyan route signals.
 */
import DevOpsArchitectureCanvas from "@/components/architecture/DevOpsArchitectureCanvas";

export default function Home() {
  return (
    <main className="archtrace-shell">
      <header className="archtrace-header">
        <div className="brand-lockup" aria-label="ArchTrace">
          <img src="/manus-storage/archtrace-mark_2c81313b.png" alt="" className="brand-lockup__mark" />
          <div>
            <div className="brand-lockup__name">ArchTrace</div>
            <div className="brand-lockup__caption">من المستودع إلى خريطة التشغيل</div>
          </div>
        </div>
        <div className="header-context">تحليل مستودع عام <span>•</span> v1.6</div>
      </header>
      <DevOpsArchitectureCanvas />
    </main>
  );
}
