/**
 * Repogram page direction: a canvas-dominant charcoal technical board with functional green,
 * olive, amber, and pink signals for repository-to-runtime analysis.
 */
import DevOpsArchitectureCanvas from "@/components/architecture/DevOpsArchitectureCanvas";

export default function Home() {
  return (
    <main className="archtrace-shell">
      <header className="archtrace-header">
        <div className="brand-lockup" aria-label="Repogram">
          <img src="/manus-storage/archtrace-mark_2c81313b.png" alt="" className="brand-lockup__mark" />
          <div>
            <div className="brand-lockup__name">REPOGRAM</div>
            <div className="brand-lockup__caption">Repository to runtime map</div>
          </div>
        </div>
        <div className="header-context">PUBLIC REPOSITORY ANALYSIS <span>•</span> v1.6</div>
      </header>
      <DevOpsArchitectureCanvas />
    </main>
  );
}
