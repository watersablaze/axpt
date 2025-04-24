"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyTokenSignature } from "@/lib/tokenUtils";
import Lottie from "lottie-react";
import animationData from "@/public/lottie/axpt_sigil.json"; // Adjust if needed
import styles from "./Whitepaper.module.css";

export default function WhitepaperPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const signature = searchParams.get("signature") || "";
  const partner = searchParams.get("partner") || "Partner";

  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const valid = verifyTokenSignature(token, signature);
    setIsVerified(valid);
  }, [token, signature]);

  if (isVerified === null) {
    return (
      <div className={styles.loaderContainer}>
        <Lottie animationData={animationData} className={styles.lottie} />
        <p className={styles.loadingText}>Authenticating your access...</p>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className={styles.errorContainer}>
        <Lottie animationData={animationData} className={styles.lottie} />
        <h2 className={styles.errorText}>🚫 Invalid or missing access token.</h2>
        <p>Please contact your AXPT.io representative for assistance.</p>
      </div>
    );
  }

  return (
    <div className={styles.whitepaperPage}>
      <div className={styles.header}>
        <Lottie animationData={animationData} className={styles.lottieSmall} />
        <h1 className={styles.greeting}>Welcome, {partner}</h1>
        <p className={styles.subText}>Enjoy your private reading of the AXPT.io whitepaper.</p>
      </div>

      {/* ✅ Inline PDF Viewer ONLY */}
      <div className={styles.pdfContainer}>
        <iframe
          src="/pdfs/axpt_whitepaper.pdf"
          title="AXPT.io Whitepaper"
          width="100%"
          height="800px"
          className={styles.pdfViewer}
        />
      </div>
    </div>
  );
}