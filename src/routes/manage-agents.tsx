import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, EmptyState } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useState } from "react";
import { Shield, Check, X as XIcon } from "lucide-react";
import { formatDate, getErrorMessage } from "../lib/utils";
import type { User } from "../lib/types";
import { useToast } from "../hooks/useToast";

export const Route = createFileRoute("/manage-agents")({
  component: ManageAgentsPage,
});

export function ManageAgentsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const pendingAgents = useQuery(api.users.getPendingAgents);
  const updateStatus = useMutation(api.users.updateAgentStatus);
  const { error: toastError } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "admin") { navigate({ to: "/login" }); return null; }

  const handleAction = async (userId: string, status: "approved" | "rejected") => {
    setActionLoading(userId);
    try {
      await updateStatus({ userId: userId as never, status });
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-4xl pb-20 md:pb-8">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Agent Approvals</h1>
        <p className="text-surface-500 mb-6">Review and approve agent registrations</p>

        {!pendingAgents ? (
          <Spinner className="w-6 h-6" />
        ) : pendingAgents.length > 0 ? (
          <div className="space-y-4 animate-fade-in">
            {pendingAgents.map((agent: User) => (
              <Card key={agent._id}>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-sm font-semibold">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-surface-900">{agent.name}</p>
                          <p className="text-xs text-surface-400">{agent.email}</p>
                        </div>
                      </div>
                      {agent.businessName && (
                        <div className="ml-12 space-y-1">
                          <p className="text-sm"><span className="text-surface-400">Business:</span> <span className="font-medium">{agent.businessName}</span></p>
                          {agent.businessDescription && <p className="text-sm text-surface-500">{agent.businessDescription}</p>}
                          {agent.businessLicense && <p className="text-xs text-surface-400">License: {agent.businessLicense}</p>}
                          {agent.phone && <p className="text-xs text-surface-400">Phone: {agent.phone}</p>}
                        </div>
                      )}
                      <p className="text-xs text-surface-400 ml-12">Registered: {formatDate(agent.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col">
                      <Badge variant="warning" dot>Pending</Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction(agent._id, "approved")}
                          isLoading={actionLoading === agent._id}
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleAction(agent._id, "rejected")}
                          isLoading={actionLoading === agent._id}
                        >
                          <XIcon className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Shield className="w-8 h-8" />}
            title="No Pending Agents"
            description="All agent registrations have been reviewed."
          />
        )}
      </main>
    </div>
  );
}
