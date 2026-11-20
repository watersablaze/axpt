import { NextRequest, NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Local admin-only candidate PDF: never recipient issuance or frozen custody. */
export async function GET(req: NextRequest, context: { params: Promise<{ variant: string }> }) {
  const principal = await getPrincipal();
  if (!principal?.permissions?.includes("INSTITUTIONAL_ACCESS_MANAGE")) return new NextResponse("Not found", { status: 404 });
  const { variant } = await context.params;
  if (variant !== "100-mt" && variant !== "1000-mt") return new NextResponse("Not found", { status: 404 });
  if (process.env.NODE_ENV !== "development") return new NextResponse("Unavailable", { status: 503 });
  const url = new URL(req.url);
  if (!["localhost", "127.0.0.1"].includes(url.hostname)) return new NextResponse("Unavailable", { status: 503 });

  let chromium;
  try { ({ chromium } = await import("playwright-core")); }
  catch { return new NextResponse("Missing playwright-core dependency", { status: 503 }); }

  const { existsSync } = await import("node:fs");
  const chromePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];
  const executablePath =
    chromePaths.find(existsSync) ??
    chromium.executablePath();

  if (!existsSync(executablePath)) {
    return new NextResponse("Chromium executable unavailable", { status: 503 });
  }

  const pageUrl = new URL(`/admin/instruments/gsam-sco/editorial-review/${variant}`, url.origin);
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath });
    const browserContext = await browser.newContext({ extraHTTPHeaders: { cookie: req.headers.get("cookie") ?? "" } });
    const page = await browserContext.newPage();
    const response = await page.goto(pageUrl.href, { waitUntil: "networkidle", timeout: 30000 });
    if (!response || response.status() !== 200 || await page.locator("article").count() !== 1) {
      throw new Error("Authenticated editorial document unavailable");
    }
    await page.evaluate(async () => {
      await document.fonts.ready;

      const article = document.querySelector("article");
      if (!article) {
        throw new Error("SCO document article missing");
      }

      // Print only the instrument. Preserve its existing CSS,
      // embedded signature and document reference.
      const style = document.createElement("style");
      style.textContent = `
        @media print {
          body * {
            visibility: hidden !important;
          }

          article, article * {
            visibility: visible !important;
          }

          article {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
          }
        }
      `;
      document.head.appendChild(style);
    });

    if (variant === "1000-mt") {
      await page.addStyleTag({
        content: `
          @media print {
            article [class*="railReference"] {
              font-size: 5px !important;
              letter-spacing: 0 !important;
              white-space: nowrap !important;
              overflow: visible !important;
            }
          }
        `,
      });
    }

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    });
    await browserContext.close();
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="GSAM-SCO-${variant === "100-mt" ? "100MT" : "1000MT"}-ED2-CANDIDATE.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("[GSAM Editorial PDF]", error instanceof Error ? error.message : "Rendition failed");
    return new NextResponse("Document rendition failed", { status: 503 });
  } finally {
    if (browser) await browser.close();
  }
}
