import type { ReactNode } from "react";

export default function SectionWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <section className="ms-section">{children}</section>;
}
