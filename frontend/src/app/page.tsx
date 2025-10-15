'use client';

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);

  async function checkUsers() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
        setMessage(`Fetched ${data.length} users.`);
      } else if (data.users) {
        setUsers(data.users);
        setMessage(`Fetched ${data.users.length} users.`);
      } else {
        setMessage("Unexpected response format for users.");
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to fetch users'}`);
    }
  }

  async function checkConnections() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connections`);
      const data = await res.json();

      if (data.connections && typeof data.connections === "object") {
        // Convert object → array with id included
        const formatted = Object.entries(data.connections).map(([id, conn]: [string, any]) => ({
          id,
          name: conn.name,
          protocol: conn.protocol,
          hostname: conn.attributes?.["guacd-hostname"] || "N/A",
          active: conn.activeConnections,
        }));
        setConnections(formatted);
        setMessage(`Fetched ${formatted.length} connections.`);
      } else {
        setMessage("Unexpected response format for connections.");
      }
    } catch (error) {
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Failed to fetch connections"}`
      );
    }
  }


  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Guacamole Dashboard</h1>

      <div className="space-y-4">
        <button
          onClick={checkUsers}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Check if there are users in Guacamole
        </button>

        <button
          onClick={checkConnections}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Check if there are connections in Guacamole
        </button>
      </div>

      <p className="mt-4 font-semibold">{message}</p>

      {/* Users List */}
      {users.length > 0 && (
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Users:</h2>
          <ul className="bg-gray-100 rounded-lg p-4">
            {users.map((user, i) => (
              <li key={i} className="border-b border-gray-300 py-1 text-gray-600">
                {typeof user === 'string' ? user : JSON.stringify(user)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {connections.length > 0 && (
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Connections:</h2>
          <ul className="bg-gray-100 rounded-lg p-4 space-y-2">
            {connections.map((conn) => (
              <li key={conn.id} className="border-b border-gray-300 py-2">
                <div className="font-medium">{conn.name}</div>
                <div className="text-sm text-gray-600">
                  Name: {conn.name} | Protocol: {conn.protocol} | Host: {conn.hostname} | Active: {conn.active}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
