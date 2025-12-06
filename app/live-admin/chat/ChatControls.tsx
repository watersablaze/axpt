'use client';

export default function ChatControls() {
  return (
    <div className="chatControls">
      <h3>Moderation</h3>

      <button className="dangerBtn">Clear Chat</button>
      <button className="warningBtn">Slow Mode</button>
      <button className="neutralBtn">Pin Message</button>

      <h4>Filters</h4>
      <label>
        <input type="checkbox" /> Hide spam
      </label>
      <label>
        <input type="checkbox" /> Hide bot messages
      </label>
      <label>
        <input type="checkbox" /> Collapse long messages
      </label>
    </div>
  );
}