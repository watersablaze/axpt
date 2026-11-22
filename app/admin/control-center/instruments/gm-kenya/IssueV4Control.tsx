"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import styles from "./page.module.css";

export function IssueV4Control(
  {
    versionId,
  }: {
    versionId: string;
  },
) {
  const router =
    useRouter();

  const [
    confirmation,
    setConfirmation,
  ] = useState("");

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function issue() {
    if (
      confirmation !==
        "ISSUE GM V4" ||
      busy
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/admin/instruments/gm-kenya/issue-v4",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                versionId,
                confirmation,
              }),
          },
        );

      const result =
        await response.json() as {
          ok?: boolean;
          error?: string;
        };

      if (
        !response.ok ||
        !result.ok
      ) {
        throw new Error(
          result.error ??
          "Issuance failed",
        );
      }

      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Issuance failed",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.issueControl}>
      <label htmlFor="gm-v4-issue-confirm">
        To issue this frozen V4, type{" "}
        <strong>
          ISSUE GM V4
        </strong>
      </label>

      <div>
        <input
          id="gm-v4-issue-confirm"
          value={confirmation}
          autoComplete="off"
          onChange={
            event =>
              setConfirmation(
                event.target.value,
              )
          }
        />

        <button
          type="button"
          disabled={
            busy ||
            confirmation !==
              "ISSUE GM V4"
          }
          onClick={issue}
        >
          {busy
            ? "Issuing…"
            : "Issue V4"}
        </button>
      </div>

      {error ? (
        <p role="alert">
          {error}. Refresh and verify
          the draft standing before
          retrying.
        </p>
      ) : null}
    </div>
  );
}
