import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, EmptyState } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { useState, useMemo } from "react";
import { Search, Users, Shield, UserCheck, UserX } from "lucide-react";
import { formatDate, getErrorMessage } from "../lib/utils";
import type { User as DBUser } from "../lib/types";
import { useToast } from "../hooks/useToast";

export const Route = createFileRoute("/manage-users")({
  component: ManageUsersPage,
});

export function ManageUsersPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const allUsers = useQuery(api.users.getAllUsers);
  const updateStatus = useMutation(api.users.updateAgentStatus);
  const { error: toastError, success: toastSuccess } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "client" | "agent" | "admin">("all");

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "admin") { navigate({ to: "/login" }); return null; }

  const totalCount = allUsers?.length || 0;
  const clientCount = allUsers?.filter((u) => u.role === "client").length || 0;
  const agentCount = allUsers?.filter((u) => u.role === "agent").length || 0;
  const adminCount = allUsers?.filter((u) => u.role === "admin").length || 0;

  const filtered = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter((u: DBUser) => {
      const q = search.toLowerCase();
      const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      return true;
    });
  }, [allUsers, search, roleFilter]);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        
        {/* Header & Stats Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-200">
                User Management
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
              User Directory
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              Overview of all registered clients, agents, and system administrators
            </p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-surface-400">Total Registered</p>
            <p className="text-2xl font-bold text-surface-900 mt-0.5">{totalCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Clients</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{clientCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-primary-600">Agents</p>
            <p className="text-2xl font-bold text-primary-600 mt-0.5">{agentCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-amber-600">Admins</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{adminCount}</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-3xl border border-surface-200/70 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <Input
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-2xl border-surface-200 text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-surface-100/80 p-1 rounded-2xl border border-surface-200/50 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === "all" ? "bg-white text-surface-900 shadow-xs" : "text-surface-600 hover:text-surface-900"
              }`}
            >
              All Roles ({totalCount})
            </button>
            <button
              onClick={() => setRoleFilter("client")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === "client" ? "bg-white text-surface-900 shadow-xs" : "text-surface-600 hover:text-surface-900"
              }`}
            >
              Clients ({clientCount})
            </button>
            <button
              onClick={() => setRoleFilter("agent")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === "agent" ? "bg-white text-surface-900 shadow-xs" : "text-surface-600 hover:text-surface-900"
              }`}
            >
              Agents ({agentCount})
            </button>
            <button
              onClick={() => setRoleFilter("admin")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === "admin" ? "bg-white text-surface-900 shadow-xs" : "text-surface-600 hover:text-surface-900"
              }`}
            >
              Admins ({adminCount})
            </button>
          </div>
        </div>

        {/* Users Table */}
        {!allUsers ? (
          <div className="h-64 bg-surface-100 rounded-3xl animate-pulse" />
        ) : filtered.length > 0 ? (
          <Card className="border border-surface-200/70 rounded-3xl overflow-hidden shadow-2xs bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200/60 bg-surface-50/80">
                      <th className="py-3.5 px-4 text-left font-bold text-surface-500 text-xs uppercase tracking-wider">User</th>
                      <th className="py-3.5 px-4 text-left font-bold text-surface-500 text-xs uppercase tracking-wider">Email</th>
                      <th className="py-3.5 px-4 text-left font-bold text-surface-500 text-xs uppercase tracking-wider">Role</th>
                      <th className="py-3.5 px-4 text-left font-bold text-surface-500 text-xs uppercase tracking-wider">Agent Status</th>
                      <th className="py-3.5 px-4 text-left font-bold text-surface-500 text-xs uppercase tracking-wider">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {filtered.map((u: DBUser) => (
                      <tr key={u._id} className="hover:bg-surface-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-bold text-surface-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-surface-600 font-medium">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant={u.role === "admin" ? "danger" : u.role === "agent" ? "info" : "default"}>
                            {u.role.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.role === "agent" ? (
                            <select
                              value={u.agentStatus || "pending"}
                              onChange={async (e) => {
                                try {
                                  await updateStatus({
                                    userId: u._id,
                                    status: e.target.value as "approved" | "rejected" | "pending",
                                  });
                                  toastSuccess(`Updated ${u.name}'s status to ${e.target.value}`);
                                } catch (err) {
                                  toastError(getErrorMessage(err));
                                }
                              }}
                              className={`text-xs font-bold px-3 py-1 rounded-xl border transition-colors cursor-pointer focus:outline-none ${
                                u.agentStatus === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : u.agentStatus === "rejected"
                                    ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                              }`}
                            >
                              <option value="pending">Pending Review</option>
                              <option value="approved">Approved Agent</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          ) : (
                            <Badge variant="success">Active User</Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-surface-400 text-xs font-medium">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={<Users className="w-10 h-10 text-surface-400" />}
            title="No Users Found"
            description={search ? `No user records matched "${search}".` : "No registered users in the database."}
          />
        )}
      </main>
    </div>
  );
}

