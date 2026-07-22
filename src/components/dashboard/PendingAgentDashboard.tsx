import { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  Clock,
  CheckCircle2,
  Lock,
  FileText,
  Car,
  CalendarCheck,
  Timer,
  TrendingUp,
  Mail,
  Phone,
  Building,
  HelpCircle,
  Sparkles,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { formatRelativeTime } from "../../lib/utils";
import type { User } from "../../lib/types";

interface PendingAgentDashboardProps {
  user: User;
}

export function PendingAgentDashboard({ user }: PendingAgentDashboardProps) {
  const [checklist, setChecklist] = useState({
    photos: false,
    docs: false,
    rates: false,
    locations: false,
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalChecklist = Object.keys(checklist).length;
  const progressPercent = Math.round((completedCount / totalChecklist) * 100);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Status Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-warning-500/10 to-amber-600/5 border border-warning-500/20 p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-warning-400/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="warning" size="md" dot>
                Status: Pending Approval
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-warning-100/80 text-warning-800 border border-warning-200/50">
                <Clock className="w-3.5 h-3.5 text-warning-600 animate-spin-slow" />
                Est. Turnaround: 24–48 Hrs
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">
              Application Under Review ⏳
            </h2>
            <p className="text-surface-600 text-sm sm:text-base leading-relaxed">
              Welcome, <span className="font-semibold text-surface-900">{user.name}</span>! Your agent registration has been received. Our review team is currently verifying your details to ensure platform safety and compliance.
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs text-surface-500">
              <span>Submitted: <strong className="text-surface-700">{user.createdAt ? formatRelativeTime(user.createdAt) : "Recently"}</strong></span>
              <span>•</span>
              <span>Role: <strong className="text-surface-700">Hire Agent</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[200px]">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-xs">
              <RefreshCw className="w-4 h-4 mr-2 text-warning-600" /> Refresh Status
            </Button>
            <a href="mailto:support@vehiclehire.com" className="w-full">
              <Button variant="ghost" size="sm" className="w-full text-surface-700 hover:text-surface-900">
                <Mail className="w-4 h-4 mr-2" /> Contact Admin
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* 3-Step Verification Progress Timeline */}
      <Card className="border-surface-200/80 shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 flex items-center gap-2 text-base">
              <UserCheck className="w-5 h-5 text-primary-600" />
              Verification Timeline
            </h3>
            <span className="text-xs font-medium text-warning-600 bg-warning-50 px-2.5 py-1 rounded-full border border-warning-200/50">
              Step 2 of 3 Active
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-success-50/60 border border-success-200/60 transition-all">
              <div className="w-9 h-9 rounded-full bg-success-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-success-700">Step 1 • Complete</p>
                <p className="text-sm font-bold text-surface-900">Application Submitted</p>
                <p className="text-xs text-surface-600">Basic details & agent profile registered successfully.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-warning-500 animate-pulse" />
              <div className="w-9 h-9 rounded-full bg-warning-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-warning-700 flex items-center gap-1">
                  Step 2 • In Progress
                </p>
                <p className="text-sm font-bold text-surface-900">Admin Review</p>
                <p className="text-xs text-surface-600">Verification of business credentials and contact details.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-50 border border-surface-200/60 opacity-75">
              <div className="w-9 h-9 rounded-full bg-surface-200 text-surface-500 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Step 3 • Upcoming</p>
                <p className="text-sm font-bold text-surface-700">Account Approval</p>
                <p className="text-xs text-surface-500">Unlocks fleet listing, bookings management & payouts.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Submitted Profile & Onboarding Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submitted Details Card */}
        <Card className="border-surface-200/80 shadow-xs">
          <CardHeader>
            <h3 className="font-semibold text-surface-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Submitted Agent Profile
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-100 space-y-1">
                <span className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Full Name
                </span>
                <p className="font-semibold text-surface-900 truncate">{user.name}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-100 space-y-1">
                <span className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </span>
                <p className="font-semibold text-surface-900 truncate">{user.email}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-100 space-y-1">
                <span className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone Number
                </span>
                <p className="font-semibold text-surface-900 truncate">{user.phone || "Not specified"}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-100 space-y-1">
                <span className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Business Name
                </span>
                <p className="font-semibold text-surface-900 truncate">{user.businessName || "Individual Agent"}</p>
              </div>
            </div>

            {user.businessLicense && (
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-100 space-y-1 text-sm">
                <span className="text-xs font-medium text-surface-400">Business License / ID</span>
                <p className="font-medium text-surface-800">{user.businessLicense}</p>
              </div>
            )}

            {user.businessDescription && (
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-100 space-y-1 text-sm">
                <span className="text-xs font-medium text-surface-400">Business Summary</span>
                <p className="text-surface-700 leading-relaxed text-xs sm:text-sm">{user.businessDescription}</p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-primary-50/60 border border-primary-100 text-xs text-primary-800 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
              <span>If any of these details need updating, please contact support before application review is finalized.</span>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Checklist Card */}
        <Card className="border-surface-200/80 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-surface-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-warning-500" />
                  Fleet Onboarding Checklist
                </h3>
                <p className="text-xs text-surface-500 mt-0.5">Prepare your listings while waiting for approval</p>
              </div>
              <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">
                {progressPercent}% Ready
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full bg-surface-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-2.5">
              {/* Task 1 */}
              <button
                type="button"
                onClick={() => toggleCheck("photos")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  checklist.photos
                    ? "bg-success-50/40 border-success-200 text-surface-900"
                    : "bg-surface-50 border-surface-100 hover:border-surface-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    checklist.photos
                      ? "bg-success-600 border-success-600 text-white"
                      : "border-surface-300 bg-white"
                  }`}
                >
                  {checklist.photos && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${checklist.photos ? "line-through text-surface-500" : "text-surface-900"}`}>
                    📸 Take High-Resolution Vehicle Photos
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Prepare 3–5 clean exterior & interior shots for each vehicle you plan to list.
                  </p>
                </div>
              </button>

              {/* Task 2 */}
              <button
                type="button"
                onClick={() => toggleCheck("docs")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  checklist.docs
                    ? "bg-success-50/40 border-success-200 text-surface-900"
                    : "bg-surface-50 border-surface-100 hover:border-surface-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    checklist.docs
                      ? "bg-success-600 border-success-600 text-white"
                      : "border-surface-300 bg-white"
                  }`}
                >
                  {checklist.docs && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${checklist.docs ? "line-through text-surface-500" : "text-surface-900"}`}>
                    📄 Gather Vehicle Logbooks & Insurance
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Ensure active commercial insurance certificates and ownership logbooks are ready.
                  </p>
                </div>
              </button>

              {/* Task 3 */}
              <button
                type="button"
                onClick={() => toggleCheck("rates")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  checklist.rates
                    ? "bg-success-50/40 border-success-200 text-surface-900"
                    : "bg-surface-50 border-surface-100 hover:border-surface-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    checklist.rates
                      ? "bg-success-600 border-success-600 text-white"
                      : "border-surface-300 bg-white"
                  }`}
                >
                  {checklist.rates && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${checklist.rates ? "line-through text-surface-500" : "text-surface-900"}`}>
                    💰 Decide Hourly & Daily Hire Rates
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Research competitive local rates (e.g. KES 500/hr or KES 4,500/day) for your car models.
                  </p>
                </div>
              </button>

              {/* Task 4 */}
              <button
                type="button"
                onClick={() => toggleCheck("locations")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  checklist.locations
                    ? "bg-success-50/40 border-success-200 text-surface-900"
                    : "bg-surface-50 border-surface-100 hover:border-surface-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    checklist.locations
                      ? "bg-success-600 border-success-600 text-white"
                      : "border-surface-300 bg-white"
                  }`}
                >
                  {checklist.locations && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${checklist.locations ? "line-through text-surface-500" : "text-surface-900"}`}>
                    📍 Plan Pick-up & Drop-off Points
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Define primary pickup locations or airport transfer routes for your clients.
                  </p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Capabilities Locked Preview Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-surface-900">Agent Capabilities Unlocked Upon Approval</h3>
          <p className="text-xs text-surface-500">Here is what you will have access to as soon as your account is approved</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <Card className="relative overflow-hidden bg-surface-50/60 border-surface-200/70 group hover:border-warning-300 transition-all">
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-200/70 text-surface-600">
                <Lock className="w-3 h-3" /> Locked
              </span>
            </div>
            <CardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-surface-900 text-sm">Fleet Listing & Management</h4>
                <p className="text-xs text-surface-500 mt-1 leading-normal">
                  Add unlimited vehicles, set custom hourly/daily hire rates, and manage availability.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="relative overflow-hidden bg-surface-50/60 border-surface-200/70 group hover:border-warning-300 transition-all">
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-200/70 text-surface-600">
                <Lock className="w-3 h-3" /> Locked
              </span>
            </div>
            <CardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-success-100 text-success-600 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-surface-900 text-sm">Client Booking Requests</h4>
                <p className="text-xs text-surface-500 mt-1 leading-normal">
                  Receive instant client hire requests, accept bookings, and communicate with clients.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="relative overflow-hidden bg-surface-50/60 border-surface-200/70 group hover:border-warning-300 transition-all">
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-200/70 text-surface-600">
                <Lock className="w-3 h-3" /> Locked
              </span>
            </div>
            <CardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-warning-100 text-warning-600 flex items-center justify-center">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-surface-900 text-sm">Active Session GPS Tracker</h4>
                <p className="text-xs text-surface-500 mt-1 leading-normal">
                  Track real-time location updates during active hire sessions for maximum security.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="relative overflow-hidden bg-surface-50/60 border-surface-200/70 group hover:border-warning-300 transition-all">
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-200/70 text-surface-600">
                <Lock className="w-3 h-3" /> Locked
              </span>
            </div>
            <CardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-surface-900 text-sm">Revenue & Paystack Payouts</h4>
                <p className="text-xs text-surface-500 mt-1 leading-normal">
                  Monitor earnings breakdown, generate financial reports, and receive direct payouts.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Support & FAQ Section */}
      <Card className="border-surface-200/80 bg-surface-50/40">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-200/60 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 text-base">Frequently Asked Questions</h3>
                <p className="text-xs text-surface-500">Need help or have questions about agent approval?</p>
              </div>
            </div>
            <a href="mailto:support@vehiclehire.com">
              <Button size="sm" variant="outline">
                <Mail className="w-4 h-4 mr-2" /> Email Support Team
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <h4 className="font-semibold text-surface-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning-500 shrink-0" />
                How long does the approval process take?
              </h4>
              <p className="text-xs text-surface-600 leading-relaxed pl-6">
                Most applications are processed within 24 to 48 hours. You will receive an automated notification as soon as your account status is updated by an administrator.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-surface-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                Can I list my vehicles before approval?
              </h4>
              <p className="text-xs text-surface-600 leading-relaxed pl-6">
                Vehicle listing is locked until your agent credentials are verified. However, you can prepare vehicle photos and rates now so you are ready to publish immediately upon approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
