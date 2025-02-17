"use client";

import { useEffect, useState } from "react";
import styles from "../AdminPanel.module.css"; // ✅ Correct path
import { Loader, Trash2, Edit } from "lucide-react";


interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        setUsers(data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/admin/deleteUser?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter((user) => user.id !== id));
      } else {
        console.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  if (loading) return <p className={styles.loading}><Loader className={styles.loader} /> Loading users...</p>;

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>User Management</h3>
      <ul className={styles.userList}>
        {users.length > 0 ? (
          users.map((user) => (
            <li key={user.id} className={styles.userItem}>
              <p><strong>{user.name}</strong> ({user.email})</p>
              <p>Role: {user.isAdmin ? "Admin" : "User"}</p>
              <div className={styles.actions}>
                <button className={styles.editButton}><Edit size={18} /></button>
                <button className={styles.deleteButton} onClick={() => handleDelete(user.id)}><Trash2 size={18} /></button>
              </div>
            </li>
          ))
        ) : (
          <p>No users found.</p>
        )}
      </ul>
    </div>
  );
}