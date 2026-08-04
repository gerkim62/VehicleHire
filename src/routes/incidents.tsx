import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, EmptyState } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Car,
  User as UserIcon,
  X,
  FileText,
  MessageSquare,
  Image as ImageIcon,
} from "lucide-react";
import { formatDate, getErrorMessage } from "../lib/utils";
import { useToast } from "../hooks/useToast";
import type { IncidentStatus, IncidentSeverity } from "../lib/types";

export const Route = createFileRoute("/incidents")({
  component: IncidentsPage,
});

export function IncidentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | IncidentStatus>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | IncidentSeverity>("all");

  // Selected incident for agent status update modal or detailed photo view modal
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [newStatus, setNewStatus] = useState<IncidentStatus>("reviewing");
  const [updating, setUpdating] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Queries according to user role
  const clientIncidents = useQuery(
    api.incidents.getByClient,
    user?.role === "client" ? { clientId: user._id } : "skip"
  );

  const agentIncidents = useQuery(
    api.incidents.getByAgent,
    user?.role === "agent" ? { agentId: user._id } : "skip"
  );

  const adminIncidents = useQuery(
    api.incidents.getAll,
    user?.role === "admin" ? {} : "skip"
  );

  const updateStatusMutation = useMutation(api.incidents.updateStatus);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  const incidents = useMemo(() => {
    if (user?.role === "client") return clientIncidents;
    if (user?.role === "agent") return agentIncidents;
    if (user?.role === "admin") return adminIncidents;
    return undefined;
  }, [user, clientIncidents, agentIncidents, adminIncidents]);

  const filteredIncidents = useMemo(() => {
    if (!incidents) return [];
    return incidents.filter((inc: any) => {
      const q = search.toLowerCase();
      const vehicleName = inc.vehicle ? `${inc.vehicle.make} ${inc.vehicle.model}`.toLowerCase() : "";
      const clientName = inc.client ? inc.client.name.toLowerCase() : "";
      const matchesSearch =
        inc.title.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        vehicleName.includes(q) ||
        clientName.includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== "all" && inc.status !== statusFilter) return false;
      if (severityFilter !== "all" && inc.severity !== severityFilter) return false;
      return true;
    });
  }, [incidents, search, statusFilter, severityFilter]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) return null;

  const handleOpenUpdateModal = (inc: any) => {
    setSelectedIncident(inc);
    setNewStatus(inc.status === "reported" ? "reviewing" : inc.status);
    setResolutionNotes(inc.resolutionNotes || "");
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setUpdating(true);
    try {
      await updateStatusMutation({
        incidentId: selectedIncident._id,
        agentId: user._id,
        status: newStatus,
        resolutionNotes: resolutionNotes.trim() ? resolutionNotes.trim() : undefined,
      });
      toastSuccess(`Incident status updated to ${newStatus}.`);
      setSelectedIncident(null);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const reportedCount = incidents?.filter((i: any) => i.status === "reported").length || 0;
  const reviewingCount = incidents?.filter((i: any) => i.status === "reviewing").length || 0;
  const resolvedCount = incidents?.filter((i: any) => i.status === "resolved").length || 0;

  const getSeverityBadgeVariant = (sev: IncidentSeverity) => {
    switch (sev) {
      case "major":
        return "danger";
      case "moderate":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusBadgeVariant = (st: IncidentStatus) => {
    switch (st) {
      case "resolved":
        return "success";
      case "reviewing":
        return "warning";
      default:
        return "danger";
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-200">
                Incident Hub
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
              {user.role === "agent"
                ? "Fleet Incident Tracking"
                : user.role === "admin"
                ? "System Incidents Overview"
                : "My Reported Incidents"}
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              {user.role === "agent"
                ? "Track and resolve vehicle issues reported by clients during active hires"
                : user.role === "admin"
                ? "Monitor and manage reported safety and condition reports across the platform"
                : "Track status updates and resolution notes for your reported vehicle issues"}
            </p>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border border-surface-200/70 rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/50">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-surface-500 font-medium">New Reported</p>
                <p className="text-2xl font-bold text-surface-900">{reportedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-surface-200/70 rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/50">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-surface-500 font-medium">Under Review</p>
                <p className="text-2xl font-bold text-surface-900">{reviewingCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-surface-200/70 rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/50">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-surface-500 font-medium">Resolved</p>
                <p className="text-2xl font-bold text-surface-900">{resolvedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="border border-surface-200/70 rounded-2xl mb-6">
          <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <Input
                placeholder="Search by title, description or vehicle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
              <span className="text-xs font-medium text-surface-400 shrink-0">Status:</span>
              {(["all", "reported", "reviewing", "resolved"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize shrink-0 transition-colors ${
                    statusFilter === st
                      ? "bg-primary-600 text-white"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                  }`}
                >
                  {st}
                </button>
              ))}

              <div className="w-px h-5 bg-surface-200 mx-1 shrink-0" />

              <span className="text-xs font-medium text-surface-400 shrink-0">Severity:</span>
              {(["all", "minor", "moderate", "major"] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize shrink-0 transition-colors ${
                    severityFilter === sev
                      ? "bg-primary-600 text-white"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incident List */}
        {!incidents ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <Spinner className="w-8 h-8" />
          </div>
        ) : filteredIncidents.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert className="w-10 h-10 text-surface-400" />}
            title="No incidents found"
            description={
              search || statusFilter !== "all" || severityFilter !== "all"
                ? "Try adjusting your filters to see more results."
                : "No incident reports have been logged yet."
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident: any) => (
              <Card key={incident._id} className="border border-surface-200/70 rounded-2xl hover:border-surface-300 transition-all">
                <CardContent className="p-5 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      {/* Title & Badges */}
                      <div className="flex items-start gap-2.5 flex-wrap">
                        <h3 className="text-base font-bold text-surface-900 leading-snug">
                          {incident.title}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={getSeverityBadgeVariant(incident.severity)} size="sm">
                            {incident.severity}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(incident.status)} size="sm">
                            {incident.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-surface-600 whitespace-pre-line leading-relaxed">
                        {incident.description}
                      </p>

                      {/* Meta Context Info */}
                      <div className="flex items-center gap-4 text-xs text-surface-400 flex-wrap pt-1">
                        {incident.vehicle && (
                          <div className="flex items-center gap-1.5 text-surface-700 font-medium">
                            <Car className="w-3.5 h-3.5 text-primary-600" />
                            <span>
                              {incident.vehicle.make} {incident.vehicle.model} ({incident.vehicle.year})
                            </span>
                          </div>
                        )}
                        {incident.client && (
                          <div className="flex items-center gap-1.5 text-surface-600">
                            <UserIcon className="w-3.5 h-3.5 text-surface-400" />
                            <span>Client: {incident.client.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-surface-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Reported {formatDate(incident.createdAt)}</span>
                        </div>
                      </div>

                      {/* Resolution Notes section if present */}
                      {incident.resolutionNotes && (
                        <div className="mt-3 p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                          <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold mb-1">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Agent Resolution Notes</span>
                            {incident.resolvedAt && (
                              <span className="text-[10px] font-normal text-emerald-600">
                                ({formatDate(incident.resolvedAt)})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-emerald-900">{incident.resolutionNotes}</p>
                        </div>
                      )}

                      {/* Photos List */}
                      {incident.photos && incident.photos.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs font-bold text-surface-500 mb-2 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" /> Attached Evidence ({incident.photos.length})
                          </p>
                          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                            {incident.photos.map((photo: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => setActivePhoto(photo)}
                                className="relative group w-16 h-16 rounded-xl overflow-hidden border border-surface-200 shrink-0 cursor-pointer"
                              >
                                <img
                                  src={photo}
                                  alt={`Evidence ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions for Agent */}
                    {user.role === "agent" && (
                      <div className="shrink-0 flex items-center lg:flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenUpdateModal(incident)}
                          className="rounded-xl text-xs"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          Update Status
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Update Status Modal for Agents */}
        {selectedIncident && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  Update Incident Status
                </h3>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-1 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-surface-700 mb-1">
                    Incident Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs font-medium text-surface-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="reported">Reported (Pending)</option>
                    <option value="reviewing">Under Review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-700 mb-1">
                    Resolution Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details on action taken or instructions for client..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs text-surface-900 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedIncident(null)}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updating} className="rounded-xl text-xs">
                    {updating ? <Spinner className="w-4 h-4" /> : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Photo View Modal */}
        {activePhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setActivePhoto(null)}
          >
            <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden">
              <img src={activePhoto} alt="Evidence" className="w-full h-full object-contain max-h-[85vh]" />
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
