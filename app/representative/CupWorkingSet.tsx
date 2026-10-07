"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import canvas from "./workspace-canvas.module.css";

export default function CupWorkingSet({
  storageKey,
  resourceIds,
  labels,
  categories,
  children,
}: {
  storageKey: string;
  resourceIds: string[];
  labels: string[];
  categories: string[];
  children: ReactNode;
}) {
  function directoryLabel(title: string, category: string) {
    if (category === "Representation" && /Institutional Profile/i.test(title)) {
      return "Institutional Profile";
    }
    if (category === "Documents" && /Representative Agreement/i.test(title)) {
      return "Representative Agreement";
    }
    if (category === "Operating Boundaries") {
      return "Operating Boundaries";
    }
    return title;
  }

  const materials = Children.toArray(children);
  const [selected, setSelected] = useState(0);
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
  }
  const current = Math.min(selected, Math.max(0, materials.length - 1));

  if (!materials.length) return null;

  return (
    <div className={canvas.workingSet}>
      <nav className={canvas.materialDirectory} aria-label="Released CUP materials">
        <p className={canvas.kicker}>Released Materials</p>
        {materials.map((material, index) => (
          <button
            key={typeof material === "object" && material !== null && "key" in material
              ? String(material.key) : index}
            type="button"
            aria-current={current === index ? "true" : undefined}
            aria-controls="cup-focused-material"
            onClick={() => selectMaterial(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {directoryLabel(labels[index] || "Released resource", categories[index] || "")}
          </button>
        ))}
      </nav>

      <div className={canvas.materialStage}>
        <p className={canvas.materialPosition} aria-live="polite">
          {String(current + 1).padStart(2, "0")} / {String(materials.length).padStart(2, "0")}
          {" · "}{categories[current] || "Released material"}
        </p>

        <div
          id="cup-focused-material"
          key={current}
          className={canvas.materialArrival}
        >
          {materials[current]}
        </div>

        <div className={canvas.materialControls}>
          <button type="button" disabled={current === 0}
            onClick={() => selectMaterial(current - 1)}>
            ← Previous material
          </button>
          <button type="button" disabled={current === materials.length - 1}
            onClick={() => selectMaterial(current + 1)}>
            Next material →
          </button>
        </div>
      </div>
    </div>
  );
}
