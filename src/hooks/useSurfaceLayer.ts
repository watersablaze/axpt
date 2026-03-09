import { useEffect } from "react"

export default function useSurfaceLayer() {

  useEffect(() => {

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("section[data-layer]")
    )

    if (!sections.length) return

    function updateDepth() {

      const viewportMid = window.innerHeight * 0.55
      const falloff = window.innerHeight * 0.75

      sections.forEach((section) => {

        const layer = section.dataset.layer

        if (layer === "ORIGIN") {
          section.style.setProperty("--axis-depth", "0")
          return
        }

        const rect = section.getBoundingClientRect()
        const center = rect.top + rect.height / 2

        const distance = Math.abs(center - viewportMid)

        let depth = distance / falloff

        if (depth < 0.15) depth = 0

        depth = Math.min(depth, 1)

        section.style.setProperty("--axis-depth", depth.toString())

      })

    }

    function onScroll() {
      requestAnimationFrame(updateDepth)
    }

    updateDepth()

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", updateDepth)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", updateDepth)
    }

  }, [])

}