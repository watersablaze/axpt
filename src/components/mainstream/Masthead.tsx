// src/components/mainstream/Masthead.tsx

import Link from "next/link";

export default function Masthead() {
  return (
    <header className="ms-masthead">
      <div className="ms-container">
        <Link href="/mainstream" className="ms-masthead-link">
          MAINstream
        </Link>
      </div>
    </header>
  );
}