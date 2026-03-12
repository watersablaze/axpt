export default function DeploymentBanner() {
  const stage = process.env.NEXT_PUBLIC_AXPT_STAGE;

  if (!stage || stage === "production") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        background: "#111",
        color: "#ff9900",
        padding: "6px 10px",
        fontSize: "11px",
        border: "1px solid #ff9900",
        borderRadius: "4px",
        fontFamily: "monospace",
        zIndex: 9999,
      }}
    >
      AXPT • {stage.toUpperCase()}
    </div>
  );
}