// app/src/components/shared/UserDashboard.tsx
"use client";

import React from "react";
import TierBadge from "@/components/shared/TierBadge";
import { getSessionFromToken } from "@/lib/session/getSessionFromToken";

interface User {
  name: string | null;
  id: string;
  username: string;
  email: string;
  partnerSlug: string | null;
  tier: string | null;
  createdAt: Date;
}

interface UserDashboardProps {
  user: User;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user }) => {
  return (
    <div className="p-6 max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome back{user.name ? `, ${user.name}` : ""}!</h1>

      <TierBadge tier={user.tier || "Unverified"} />

      <div className="mt-6 bg-white shadow-md rounded-lg p-4 text-left">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Partner:</strong> {user.partnerSlug || "N/A"}</p>
        <p><strong>Tier:</strong> {user.tier || "N/A"}</p>
        <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default UserDashboard;