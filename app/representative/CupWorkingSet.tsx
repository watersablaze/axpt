"use client";

import { Children, useState, type ReactNode } from "react";
import canvas from "./workspace-canvas.module.css";

export default function CupWorkingSet({
  labels,
  categories,
  children,
}: {
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
            onClick={() => setSelected(index)}
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
            onClick={() => setSelected(current - 1)}>
            ← Previous material
          </button>
          <button type="button" disabled={current === materials.length - 1}
            onClick={() => setSelected(current + 1)}>
            Next material →
          </button>
        </div>
      </div>
    </div>
  );
}
