'use client';

export default function AccessControl() {
  return (
    <div className="settingsPanel">
      <h2>Access Control</h2>

      <label>
        Admin Email
        <input type="email" />
      </label>

      <label>
        Moderator Emails
        <textarea placeholder="one per line"></textarea>
      </label>
    </div>
  );
}