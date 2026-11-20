"use client";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./cup-reading.module.css";

export default function CupWorkingSet({ storageKey, resourceIds, labels, categories, sidebar, children }: {
  storageKey: string; resourceIds: string[]; labels: string[]; categories: string[];
  sidebar?: ReactNode; children: ReactNode;
}) {
  function directoryLabel(title: string) {
    if (/Institutional Profile/i.test(title)) return "Institutional Profile";
    if (/Representative Agreement/i.test(title)) return "Representative Agreement";
    if (/SOURCE AUTHORITY/i.test(title)) return "Bafoula Source Authority";
    if (/Declaration of Trust/i.test(title)) return "Declaration of Trust";
    if (/Reseller.*Agreement/i.test(title)) return "Reseller & Agent Agreement";
    if (/Sanctions Screening/i.test(title)) return "Sanctions Screening Report";
    if (/Operating Boundaries/i.test(title)) return "Operating Boundaries";
    return title;
  }
  const materials = Children.toArray(children);
  const [selected, setSelected] = useState<number | null>(null);
  const materialStage = useRef<HTMLDivElement>(null);
  const resourceIdentity = JSON.stringify(resourceIds);

  useEffect(() => {
    let index = -1;
    try {
      const saved = sessionStorage.getItem(storageKey);
      const ids: string[] = JSON.parse(resourceIdentity);
      index = saved === null ? -1 : ids.indexOf(saved);
    } catch {
      // Browser storage is optional.
    }
    setSelected(index >= 0 ? index : 0);
  }, [storageKey, resourceIdentity]);

  function selectMaterial(index: number) {
    if (index < 0 || index >= materials.length) return;
    try {
      const id = resourceIds[index];
      if (id) sessionStorage.setItem(storageKey, id);
    } catch {
      // Selection remains available without storage.
    }
    setSelected(index);
    requestAnimationFrame(() => {
      const target = materialStage.current;
      const crown = document.querySelector("[data-workspace-crown]");
      const threshold = (crown?.getBoundingClientRect().bottom ?? 0) + 16;
      if (target && target.getBoundingClientRect().top < threshold) {
        target.scrollIntoView({ block: "start", behavior: "auto" });
      }
    });
  }
  const current = Math.min(selected ?? 0, Math.max(0, materials.length - 1));

  // Group navigation only: resource identities, children, and permission gates stay intact.
  function groupFor(index: number) {
    const title = labels[index] || "";
    if (/transaction overview|corporate offer|profile/i.test(title)) return "Company & Commercial Papers";
    if (/source authority|declaration of trust|sanctions|assurance/i.test(title)) return "Source & Assurance";
    if (/agreement|appointment|mandate/i.test(title)) return "Agreements & Representation";
    if (/operating|boundar|guide|procedure/i.test(title)) return "Operating Guidance";
    return categories[index] || "Other Materials";
  }
  const groupOrder = ["Company & Commercial Papers", "Agreements & Representation", "Source & Assurance", "Operating Guidance"];
  const groupNames = Array.from(new Set(materials.map((_, index) => groupFor(index))));
  groupNames.sort((a, b) => {
    const rank = (name: string) => { const index = groupOrder.indexOf(name); return index < 0 ? groupOrder.length : index; };
    return rank(a) - rank(b);
  });
  const groups = groupNames.map(name => ({ name, indices: materials.flatMap((_, index) => groupFor(index) === name ? [index] : []) }));
  const orderedIndices = groups.flatMap(group => group.indices);
  const position = orderedIndices.indexOf(current);

  if (!materials.length) return null;


  return <div className={styles.readingWorkspace}>
    {sidebar}
    <div className={styles.workingSet}>
      <aside className={styles.materialIndex}>
        <label className={styles.mobileMaterials}>
          <span>Materials · {materials.length}</span>
          <select value={current} onChange={event => selectMaterial(Number(event.target.value))}>
            {groups.map(group => <optgroup key={group.name} label={group.name}>
              {group.indices.map(index => <option key={resourceIds[index] || index} value={index}>
                {directoryLabel(labels[index] || "Released material")}
              </option>)}
            </optgroup>)}
          </select>
        </label>
        <nav className={styles.materialDirectory} aria-label="Released CUP materials">
          <p className={styles.indexHeading}>Materials <span>{materials.length}</span></p>
          {groups.map(group => <section key={group.name} className={styles.materialGroup} aria-label={group.name}>
            <h3 className={styles.groupHeading}>{group.name}<span>{group.indices.length}</span></h3>
            {group.indices.map(index => <button key={resourceIds[index] || index}
              type="button" title={labels[index]}
              aria-current={current === index ? "true" : undefined}
              aria-controls="cup-focused-material" onClick={() => selectMaterial(index)}>
              <span className={styles.indexNumber}>{String(orderedIndices.indexOf(index) + 1).padStart(2, "0")}</span>
              <span>{directoryLabel(labels[index] || "Released material")}</span>
            </button>)}
          </section>)}
        </nav>
      </aside>
      <div ref={materialStage} className={styles.materialStage}>
        <div id="cup-focused-material" key={resourceIds[current] || current}
          className={styles.materialArrival} role="region"
          aria-label={labels[current] || "Selected material"}>
          {selected === null ? <p role="status" className={styles.readerStatus}>Restoring selected material…</p> : materials[current]}
        </div>
        <div className={styles.materialControls}>
          <button type="button" disabled={position <= 0} onClick={() => selectMaterial(orderedIndices[position - 1])}>← Previous</button>
          <span aria-live="polite">{position + 1} / {materials.length} · {groupFor(current)}</span>
          <button type="button" disabled={position === materials.length - 1} onClick={() => selectMaterial(orderedIndices[position + 1])}>Next →</button>
        </div>
      </div>
    </div>
  </div>;
}
