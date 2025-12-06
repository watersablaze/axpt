// Global overlay controller
window.Overlay = {
  show(id) {
    document.getElementById(id)?.classList.remove("hidden");
    document.getElementById(id)?.classList.add("visible");
  },

  hide(id) {
    document.getElementById(id)?.classList.remove("visible");
    document.getElementById(id)?.classList.add("hidden");
  },

  setText(id, text) {
    document.getElementById(id).innerHTML = text;
  },

  pulse(id) {
    const el = document.getElementById(id);
    el.classList.add("pulse");
    setTimeout(() => el.classList.remove("pulse"), 1000);
  }
};

// WebSocket listener for Nommo Console
const socket = new WebSocket("wss://live.axpt.io/overlay-bridge");

socket.onmessage = (msg) => {
  const event = JSON.parse(msg.data);
  const { action, id, value } = event;

  if (action === "show") Overlay.show(id);
  if (action === "hide") Overlay.hide(id);
  if (action === "text") Overlay.setText(id, value);
  if (action === "pulse") Overlay.pulse(id);
};