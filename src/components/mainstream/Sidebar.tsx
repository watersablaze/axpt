"use client";

import Link from "next/link";
import { useState } from "react";
import {
  mainstreamChannels,
  transmissions,
} from "@/lib/mainstream/transmissions";

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
                {transmissions.map((transmission) => (
                  <li key={transmission.id}>
                    <Link href={`/mainstream/transmissions/${transmission.id}`}>
                      {transmission.registry}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ms-sidebar-section">
              <p className="ms-sidebar-label">CHANNELS</p>
              <ul>
                {mainstreamChannels.map((channel) => (
                  <li key={channel.slug}>{channel.name.toUpperCase()}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
