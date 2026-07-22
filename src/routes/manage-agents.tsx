import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, EmptyState } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useState } from "react";
import { Shield, Check, X as XIcon, RotateCcw, Building, Phone, FileText } from "lucide-react";
import { formatDate, getErrorMessage } from "../lib/utils";
import type { User } from "../lib/types";
import { useToast } from "../hooks/useToast";

export const Route = createFileRoute("/manage-agents")({
  component: ManageAgentsPage,
});

export function ManageAgentsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const allAgents = useQuery(api.users.getAllAgents);
  const updateStatus = useMutation(api.users.updateAgentStatus);
  const { error: toastError, success: toastSuccess } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "admin") { navigate({ to: "/login" }); return null; }

  const pendingCount = allAgents?.filter((a: User) => a.agentStatus === "pending").length || 0;
  const approvedCount = allAgents?.filter((a: User) => a.agentStatus === "approved").length || 0;
  const rejectedCount = allAgents?.filter((a: User) => a.agentStatus === "rejected").length || 0;
  const totalCount = allAgents?.length || 0;

  const filteredAgents = allAgents?.filter((a: User) => {
    if (activeTab === "pending") return a.agentStatus === "pending";
    if (activeTab === "approved") return a.agentStatus === "approved";
    if (activeTab === "rejected") return a.agentStatus === "rejected";
    return true;
  });

  const handleAction = async (userId: string, status: "approved" | "rejected" | "pending") => {
    setActionLoading(userId);
    try {
      await updateStatus({ userId: userId as never, status });
      toastSuccess(`Agent status updated to ${status}`);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-200">
                Admin HQ
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
              Agent Approvals & Management
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              Review agent applications, verify credentials, and manage platform permissions
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-surface-400">Total Applicants</p>
            <p className="text-2xl font-bold text-surface-900 mt-0.5">{totalCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-amber-600">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Approved Partners</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{approvedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-rose-600">Rejected</p>
            <p className="text-2xl font-bold text-rose-600 mt-0.5">{rejectedCount}</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-surface-200/70 shadow-xs mb-6 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "all" ? "bg-primary-600 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "pending" ? "bg-amber-500 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Pending
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "approved" ? "bg-emerald-600 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "rejected" ? "bg-rose-600 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Agents List */}
        {!allAgents ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-surface-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredAgents && filteredAgents.length > 0 ? (
          <div className="space-y-4 animate-fade-in">
            {filteredAgents.map((agent: User) => {
              const status = agent.agentStatus || "pending";
              return (
                <Card key={agent._id} className="border border-surface-200/70 rounded-3xl overflow-hidden shadow-2xs">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-2xs">
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-base text-surface-900 leading-tight">{agent.name}</p>
                              <Badge
                                variant={status === "approved" ? "success" : status === "rejected" ? "danger" : "warning"}
                                dot
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-xs text-surface-500">{agent.email}</p>
                          </div>
                        </div>

                        {agent.businessName && (
                          <div className="bg-surface-50/80 p-3.5 rounded-2xl border border-surface-200/60 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-primary-600" />
                              <span className="font-bold text-sm text-surface-900">{agent.businessName}</span>
                            </div>
                            {agent.businessDescription && (
                              <p className="text-xs text-surface-600 leading-relaxed">{agent.businessDescription}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-xs text-surface-500 pt-1 border-t border-surface-200/40">
                              {agent.businessLicense && (
                                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-surface-400" /> License: <span className="font-semibold text-surface-700">{agent.businessLicense}</span></span>
                              )}
                              {agent.phone && (
                                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-surface-400" /> Phone: <span className="font-semibold text-surface-700">{agent.phone}</span></span>
                              )}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-surface-400">Registered: {formatDate(agent.createdAt)}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-end shrink-0 pt-2 sm:pt-0">
                        {status === "pending" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="rounded-xl text-xs shadow-xs"
                              onClick={() => handleAction(agent._id, "approved")}
                              isLoading={actionLoading === agent._id}
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="rounded-xl text-xs"
                              onClick={() => handleAction(agent._id, "rejected")}
                              isLoading={actionLoading === agent._id}
                            >
                              <XIcon className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </div>
                        )}

                        {status === "approved" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs"
                              onClick={() => handleAction(agent._id, "pending")}
                              isLoading={actionLoading === agent._id}
                              title="Set status back to pending approval"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Re-open (Pending)
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="rounded-xl text-xs"
                              onClick={() => handleAction(agent._id, "rejected")}
                              isLoading={actionLoading === agent._id}
                              title="Revoke agent approval"
                            >
                              <XIcon className="w-3.5 h-3.5" /> Revoke
                            </Button>
                          </div>
                        )}

                        {status === "rejected" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="rounded-xl text-xs"
                              onClick={() => handleAction(agent._id, "approved")}
                              isLoading={actionLoading === agent._id}
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Agent
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs"
                              onClick={() => handleAction(agent._id, "pending")}
                              isLoading={actionLoading === agent._id}
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Set Pending
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Shield className="w-10 h-10 text-surface-400" />}
            title="No Agents Found"
            description={
              activeTab === "pending"
                ? "There are currently no pending agent approval requests."
                : activeTab === "approved"
                  ? "There are no approved partner agent accounts yet."
                  : activeTab === "rejected"
                    ? "There are no rejected agent records."
                    : "No agent accounts exist in the database."
            }
          />
        )}
      </main>
    </div>
  );
}

