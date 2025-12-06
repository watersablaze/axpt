// app/nommo-console/NommoConsole.tsx

import { useConsoleBridge } from "./useConsoleBridge";

export default function NommoConsole() {
  const send = useConsoleBridge();

  return (
    <div className="console-wrapper">
      <h2>Nommo Control Panel</h2>

      <button onClick={() => send("show", "invocation")}>
        Show Invocation
      </button>

      <button onClick={() => send("hide", "invocation")}>
        Hide Invocation
      </button>

      <button onClick={() => send("text", "invocation", "Asé — The Axis Opens")}>
        Set Invocation Text
      </button>

      <button onClick={() => send("pulse", "sigil-core")}>
        Pulse Sigil
      </button>

      <button onClick={() => send("show", "ceremony-bar")}>
        Start Ceremony Phase
      </button>
    </div>
  );
}