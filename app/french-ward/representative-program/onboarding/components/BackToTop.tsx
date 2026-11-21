"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 600);
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        })
      }
      aria-label="Return to top"
      className="
        fixed bottom-5 right-5 z-50
        flex h-10 w-10 items-center justify-center
        border border-black/25
        bg-[#181714]
        text-sm text-[#F4EFE3]
        shadow-sm
        transition hover:bg-black
        md:bottom-8 md:right-8
      "
    >
      ↑
    </button>
  );
}
