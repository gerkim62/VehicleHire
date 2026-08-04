import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Badge";
import { useState, useEffect } from "react";
import { FileText, Download, Calendar, DollarSign, Car, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../hooks/useToast";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

export function ReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<"sessions" | "payments" | "incidents" | "summary">("summary");

  // Fetch data based on user role
  const sessions = useQuery(
    api.sessions.getByClient,
    user?.role === "client" ? { clientId: user._id } : "skip"
  );
  
  const agentSessions = useQuery(
    api.sessions.getByAgent,
    user?.role === "agent" ? { agentId: user._id } : "skip"
  );

  const adminSessions = useQuery(
    api.sessions.getAll,
    user?.role === "admin" ? {} : "skip"
  );

  const clientStats = useQuery(
    api.reports.getClientStats,
    user?.role === "client" ? { clientId: user._id } : "skip"
  );

  const agentStats = useQuery(
    api.reports.getAgentStats,
    user?.role === "agent" ? { agentId: user._id } : "skip"
  );

  const platformStats = useQuery(
    api.reports.getPlatformStats,
    user?.role === "admin" ? {} : "skip"
  );

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

  const clientPayments = useQuery(
    api.payments.getByClient,
    user?.role === "client" ? { clientId: user._id } : "skip"
  );

  const agentPayments = useQuery(
    api.payments.getAgentRevenue,
    user?.role === "agent" ? { agentId: user._id } : "skip"
  );

  const adminPayments = useQuery(
    api.payments.getAll,
    user?.role === "admin" ? {} : "skip"
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) return null;

  const generatePDF = () => {
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Vehicle Hire Report", pageWidth / 2, yPos, { align: "center" });
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" });
      doc.text(`Report Type: ${reportType.toUpperCase()}`, pageWidth / 2, yPos + 5, { align: "center" });
      
      yPos += 15;

      // User Info
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("User Information", 14, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${user.name || "N/A"}`, 14, yPos);
      doc.text(`Email: ${user.email || "N/A"}`, 14, yPos + 5);
      doc.text(`Role: ${(user.role || "").toUpperCase()}`, 14, yPos + 10);
      yPos += 20;

      // Generate report based on type
      if (reportType === "summary") {
        // Summary stats
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Summary Statistics", 14, yPos);
        yPos += 7;

        if (user.role === "client" && clientStats) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Total Bookings: ${clientStats.totalBookings ?? 0}`, 14, yPos);
          doc.text(`Total Sessions: ${clientStats.totalSessions ?? 0}`, 14, yPos + 5);
          doc.text(`Total Spent: ${formatCurrency(clientStats.totalSpent ?? 0)}`, 14, yPos + 10);
          yPos += 20;
        } else if (user.role === "agent" && agentStats) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Total Vehicles: ${agentStats.totalVehicles ?? 0}`, 14, yPos);
          doc.text(`Active Vehicles: ${agentStats.activeVehicles ?? 0}`, 14, yPos + 5);
          doc.text(`Completed Sessions: ${agentStats.completedSessions ?? 0}`, 14, yPos + 10);
          doc.text(`Total Revenue: ${formatCurrency(agentStats.totalRevenue ?? 0)}`, 14, yPos + 15);
          yPos += 25;
        } else if (user.role === "admin" && platformStats) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Total Clients: ${platformStats.totalClients ?? 0}`, 14, yPos);
          doc.text(`Total Agents: ${platformStats.totalAgents ?? 0}`, 14, yPos + 5);
          doc.text(`Total Vehicles: ${platformStats.totalVehicles ?? 0}`, 14, yPos + 10);
          doc.text(`Total Revenue: ${formatCurrency(platformStats.totalRevenue ?? 0)}`, 14, yPos + 15);
          yPos += 25;
        }
      }

      if (reportType === "sessions" || reportType === "summary") {
        const sessionData = user.role === "client" ? sessions : user.role === "agent" ? agentSessions : adminSessions;
        
        if (sessionData && sessionData.length > 0) {
          if (yPos > 240) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Session History", 14, yPos);
          yPos += 5;

          const tableData = sessionData.slice(0, 20).map((s: any) => [
            s.startedAt ? new Date(s.startedAt).toLocaleDateString() : "N/A",
            s.vehicle ? `${s.vehicle.make || ""} ${s.vehicle.model || ""}`.trim() || "N/A" : "N/A",
            s.status === "completed" ? "Completed" : "In Progress",
            s.totalCharge ? formatCurrency(s.totalCharge) : "—",
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [["Date", "Vehicle", "Status", "Charge"]],
            body: tableData,
            theme: "grid",
            styles: { fontSize: 9 },
            headStyles: { fillColor: [79, 70, 229] },
          });

          const finalY = (doc as any).lastAutoTable?.finalY;
          yPos = finalY ? finalY + 10 : yPos + 40;
        } else if (reportType === "sessions") {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Session History", 14, yPos);
          yPos += 7;
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text("No session records found.", 14, yPos);
          yPos += 15;
        }
      }

      if (reportType === "payments" || reportType === "summary") {
        const paymentList = user.role === "client" ? clientPayments : user.role === "agent" ? agentPayments?.payments : adminPayments;
        
        if (paymentList && paymentList.length > 0) {
          if (yPos > 240) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Payment Records", 14, yPos);
          yPos += 5;

          const tableData = paymentList.slice(0, 20).map((p: any) => [
            p.createdAt || p.paidAt ? new Date(p.paidAt || p.createdAt).toLocaleDateString() : "N/A",
            p.paystackReference || "N/A",
            p.vehicle ? `${p.vehicle.make || ""} ${p.vehicle.model || ""}`.trim() || "N/A" : "N/A",
            p.status ? p.status.toUpperCase() : "PENDING",
            formatCurrency(p.amount || 0),
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [["Date", "Reference", "Vehicle", "Status", "Amount"]],
            body: tableData,
            theme: "grid",
            styles: { fontSize: 9 },
            headStyles: { fillColor: [16, 185, 129] },
          });

          const finalY = (doc as any).lastAutoTable?.finalY;
          yPos = finalY ? finalY + 10 : yPos + 40;
        } else if (reportType === "payments") {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Payment Records", 14, yPos);
          yPos += 7;
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text("No payment records found.", 14, yPos);
          yPos += 15;
        }
      }

      if (reportType === "incidents" || reportType === "summary") {
        const incidentData = user.role === "client" ? clientIncidents : user.role === "agent" ? agentIncidents : adminIncidents;
        
        if (incidentData && incidentData.length > 0) {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Incident Reports", 14, yPos);
          yPos += 5;

          const tableData = incidentData.slice(0, 20).map((i: any) => [
            i.createdAt ? new Date(i.createdAt).toLocaleDateString() : "N/A",
            i.title || "Untitled",
            i.severity ? i.severity.toUpperCase() : "NORMAL",
            i.status || "reported",
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [["Date", "Title", "Severity", "Status"]],
            body: tableData,
            theme: "grid",
            styles: { fontSize: 9 },
            headStyles: { fillColor: [245, 158, 11] },
          });

          const finalY = (doc as any).lastAutoTable?.finalY;
          yPos = finalY ? finalY + 10 : yPos + 40;
        } else if (reportType === "incidents") {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Incident Reports", 14, yPos);
          yPos += 7;
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text("No incident reports found.", 14, yPos);
          yPos += 15;
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `vehicle-hire-${reportType}-${Date.now()}.pdf`;
      doc.save(fileName);
      toastSuccess("PDF report generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toastError("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const incidentCount = (clientIncidents?.length || 0) + (agentIncidents?.length || 0) + (adminIncidents?.length || 0);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-5xl pb-20 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary-100 text-primary-800 border border-primary-200">
              Reports
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
            Generate Reports
          </h1>
          <p className="text-surface-500 text-sm mt-0.5">
            Download PDF reports of platform and rental activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {user.role === "client" && clientStats && (
            <>
              <Card className="border border-surface-200/70 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-surface-400 font-semibold">Total Sessions</p>
                      <p className="text-2xl font-bold text-surface-900">{clientStats.totalSessions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-surface-200/70 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-surface-400 font-semibold">Total Spent</p>
                      <p className="text-xl font-bold text-surface-900">{formatCurrency(clientStats.totalSpent)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {user.role === "agent" && agentStats && (
            <>
              <Card className="border border-surface-200/70 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Car className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-surface-400 font-semibold">Total Vehicles</p>
                      <p className="text-2xl font-bold text-surface-900">{agentStats.totalVehicles}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-surface-200/70 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-surface-400 font-semibold">Revenue</p>
                      <p className="text-xl font-bold text-surface-900">{formatCurrency(agentStats.totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {user.role === "admin" && platformStats && (
            <>
              <Card className="border border-surface-200/70 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-surface-400 font-semibold">Total Clients</p>
                      <p className="text-2xl font-bold text-surface-900">{platformStats.totalClients}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-surface-200/70 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-surface-400 font-semibold">Platform Revenue</p>
                      <p className="text-xl font-bold text-surface-900">{formatCurrency(platformStats.totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {incidentCount > 0 && (
            <Card className="border border-amber-200/70 rounded-2xl bg-amber-50/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 font-semibold">Incidents</p>
                    <p className="text-2xl font-bold text-surface-900">{incidentCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Report Type Selection */}
        <Card className="border border-surface-200/70 rounded-3xl relative overflow-hidden">
          <CardContent className="p-6">
            {generating && (
              <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-2xl flex items-center justify-center gap-2 text-primary-700 text-sm font-semibold animate-pulse">
                <Spinner className="w-4 h-4 text-primary-600" />
                <span>Generating PDF report, please wait...</span>
              </div>
            )}

            <h3 className="text-sm font-bold text-surface-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Select Report Type
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { value: "summary", label: "Summary", icon: TrendingUp },
                { value: "sessions", label: "Sessions", icon: Calendar },
                { value: "payments", label: "Payments", icon: DollarSign },
                { value: "incidents", label: "Incidents", icon: AlertTriangle },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  disabled={generating}
                  onClick={() => setReportType(value as typeof reportType)}
                  className={`p-4 rounded-2xl border-2 transition-all text-center ${
                    reportType === value
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-surface-200 text-surface-600 hover:border-surface-300"
                  } ${generating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-semibold">{label}</p>
                </button>
              ))}
            </div>

            <Button
              onClick={generatePDF}
              disabled={generating}
              className={`w-full rounded-2xl transition-all ${
                generating ? "opacity-75 cursor-not-allowed bg-primary-400" : ""
              }`}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="w-4 h-4 text-white" />
                  <span>Generating PDF Report...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Download PDF Report
                </span>
              )}
            </Button>

            <p className="text-xs text-surface-400 text-center mt-3">
              Report will be downloaded as a PDF file to your device
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
