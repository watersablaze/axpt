"use client";

import { useState } from "react";
import styles from "./CopySettlementAddress.module.css";

export function CopySettlementAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" className={styles.button} onClick={copyAddress}>
      {copied ? "Address copied" : "Copy authorized address"}
    </button>
  );
}
