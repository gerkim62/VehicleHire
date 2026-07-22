import { Card, CardContent, CardHeader } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ShieldAlert, Mail, RefreshCw, FileText, AlertTriangle } from "lucide-react";
import type { User } from "../../lib/types";

interface RejectedAgentDashboardProps {
  user: User;
}

export function RejectedAgentDashboard({ user }: RejectedAgentDashboardProps) {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Status Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-danger-500/10 via-danger-500/15 to-red-600/5 border border-danger-500/30 p-6 sm:p-8 shadow-sm">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="danger" size="md" dot>
                Status: Application Rejected
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-danger-600 shrink-0" />
              Registration Not Approved
            </h2>
            <p className="text-surface-600 text-sm sm:text-base leading-relaxed">
              We're sorry, <span className="font-semibold text-surface-900">{user.name}</span>. Your agent registration application was reviewed and could not be approved at this time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[200px]">
            <a href="mailto:support@vehiclehire.com" className="w-full">
              <Button size="sm" className="w-full bg-danger-600 hover:bg-danger-700 text-white">
                <Mail className="w-4 h-4 mr-2" /> Contact Admin Support
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="bg-white/80">
              <RefreshCw className="w-4 h-4 mr-2" /> Check Status Again
            </Button>
          </div>
        </div>
      </div>

      {/* Information & Next Steps Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-danger-200/60 bg-danger-50/20">
          <CardHeader>
            <h3 className="font-semibold text-surface-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
              Why was my application not approved?
            </h3>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-surface-600">
            <p>Applications may be rejected due to several reasons, including:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-surface-700">
              <li>Incomplete or unverified business documentation</li>
              <li>Incorrect contact phone number or email details</li>
              <li>Unverified identity or business license credentials</li>
              <li>Duplicate account registration</li>
            </ul>
            <div className="pt-3 border-t border-danger-200/50">
              <p className="text-xs text-surface-500">
                If you believe this decision was made in error or would like to submit additional documents, please reach out to our admin support team.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submitted Profile Details */}
        <Card className="border-surface-200 shadow-xs">
          <CardHeader>
            <h3 className="font-semibold text-surface-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Submitted Application Details
            </h3>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100 flex items-center justify-between">
              <span className="text-xs text-surface-400">Name</span>
              <span className="font-semibold text-surface-900">{user.name}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100 flex items-center justify-between">
              <span className="text-xs text-surface-400">Email</span>
              <span className="font-semibold text-surface-900">{user.email}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100 flex items-center justify-between">
              <span className="text-xs text-surface-400">Business Name</span>
              <span className="font-semibold text-surface-900">{user.businessName || "Individual Agent"}</span>
            </div>
            {user.phone && (
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-100 flex items-center justify-between">
                <span className="text-xs text-surface-400">Phone</span>
                <span className="font-semibold text-surface-900">{user.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
