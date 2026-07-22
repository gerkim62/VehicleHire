import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Spinner, StarDisplay, EmptyState } from "../components/ui/Badge";
import { Star, MessageSquareQuote, Car } from "lucide-react";
import { formatDate } from "../lib/utils";

export const Route = createFileRoute("/agent-reviews")({
  component: AgentReviewsPage,
});

export function AgentReviewsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const reviews = useQuery(api.reviews.getByAgent, user ? { agentId: user._id } : "skip");

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "agent") { navigate({ to: "/login" }); return null; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgRating = reviews && reviews.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  const totalReviews = reviews?.length || 0;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        
        {/* Header & Rating Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-200">
                Client Ratings & Reviews
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
              Customer Feedback
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              Review feedback and star ratings submitted by clients after completed rentals
            </p>
          </div>

          {reviews && reviews.length > 0 && (
            <div className="bg-white px-5 py-3 rounded-3xl border border-surface-200/70 shadow-2xs flex items-center gap-4 self-start sm:self-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl border border-amber-200/60">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-surface-900 leading-none">{avgRating}</span>
                  <span className="text-xs text-surface-400 font-semibold">/ 5.0</span>
                </div>
                <p className="text-xs text-surface-500 mt-1 font-medium">{totalReviews} total review{totalReviews > 1 ? "s" : ""}</p>
              </div>
            </div>
          )}
        </div>

        {/* Reviews List */}
        {!reviews ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-surface-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-3.5 animate-fade-in">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {reviews.map((r: any) => (
              <Card key={r._id} className="border border-surface-200/70 rounded-3xl overflow-hidden shadow-2xs">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-600 flex items-center justify-center text-white text-sm font-bold shadow-2xs shrink-0">
                        {r.clientName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-surface-900 leading-tight">{r.clientName}</h3>
                        <div className="flex items-center gap-2 text-xs text-surface-400 mt-0.5">
                          <span className="flex items-center gap-1 font-semibold text-surface-700 bg-surface-100 px-2 py-0.5 rounded-md">
                            <Car className="w-3 h-3 text-surface-400" /> {r.vehicleName}
                          </span>
                          <span>• {formatDate(r.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60 flex items-center gap-1">
                      <StarDisplay rating={r.rating} />
                    </div>
                  </div>
                  {r.comment && (
                    <div className="ml-13 bg-surface-50/80 p-3.5 rounded-2xl border border-surface-200/50 text-xs text-surface-700 leading-relaxed italic flex items-start gap-2">
                      <MessageSquareQuote className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
                      <span>"{r.comment}"</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Star className="w-10 h-10 text-surface-400" />}
            title="No Reviews Yet"
            description="Ratings and written feedback from clients will appear here after completed sessions."
          />
        )}
      </main>
    </div>
  );
}

