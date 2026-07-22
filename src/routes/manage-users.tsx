import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { useState } from "react";
import { Search } from "lucide-react";
import { formatDate } from "../lib/utils";
import type { User } from "../lib/types";

export const Route = createFileRoute("/manage-users")({
  component: ManageUsersPage,
});

export function ManageUsersPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const allUsers = useQuery(api.users.getAllUsers);
  const [search, setSearch] = useState("");

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "admin") { navigate({ to: "/login" }); return null; }

  const filtered = allUsers?.filter((u: User) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Users</h1>
            <p className="text-surface-500 mt-1">{allUsers?.length || 0} registered users</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        {!allUsers ? (
          <Spinner className="w-6 h-6" />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 bg-surface-50">
                      <th className="py-3 px-4 text-left font-medium text-surface-500">Name</th>
                      <th className="py-3 px-4 text-left font-medium text-surface-500">Email</th>
                      <th className="py-3 px-4 text-left font-medium text-surface-500">Role</th>
                      <th className="py-3 px-4 text-left font-medium text-surface-500">Status</th>
                      <th className="py-3 px-4 text-left font-medium text-surface-500">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filtered || []).map((u: User) => (
                      <tr key={u._id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-semibold">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-medium text-surface-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-surface-500">{u.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant={u.role === "admin" ? "danger" : u.role === "agent" ? "info" : "default"}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {u.role === "agent" ? (
                            <Badge variant={u.agentStatus === "approved" ? "success" : u.agentStatus === "rejected" ? "danger" : "warning"} dot>
                              {u.agentStatus || "—"}
                            </Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-surface-400">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
