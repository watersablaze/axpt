"use client";

import { useState } from "react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`ms-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="ms-sidebar-inner">

        {!collapsed && (
          <div className="ms-seal">
            <span className="ms-seal-title">MAINstream</span>
          </div>
        )}

        <button
          className="ms-sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle Sidebar"
        >
          {collapsed ? "→" : "←"}
        </button>

        {!collapsed && (
          <>
            <div className="ms-sidebar-section">
              <p className="ms-sidebar-label">LEDGER</p>
              <ul>
                <li>MS-0000</li>
                <li>MS-0001</li>
              </ul>
            </div>

            <div className="ms-sidebar-section">
              <p className="ms-sidebar-label">CHANNELS</p>
              <ul>
                <li>NOMMO MEDIA</li>
                <li>FIELD RECORD</li>
                <li>SYMPOSIUM</li>
                <li>ARCHIVE</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}