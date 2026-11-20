"use client";

import { useState } from "react";
import styles from "./CopySettlementAddress.module.css";

export function CopySettlementAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function writeAddress() {
    try {
      await navigator.clipboard.writeText(address);
      return;
    } catch {
      const field = document.createElement("textarea");
      field.value = address;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();

      const succeeded = document.execCommand("copy");
      field.remove();

      if (!succeeded) {
        throw new Error("[SETTLEMENT_ADDRESS_COPY_FAILED]");
      }
    }
  }

  async function copyAddress() {
    await writeAddress();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" className={styles.button} onClick={copyAddress}>
      {copied ? "Address copied" : "Copy authorized address"}
    </button>
  );
}
