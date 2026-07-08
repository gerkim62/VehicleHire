import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Spinner, StarDisplay, EmptyState } from "../components/ui/Badge";
import { Star } from "lucide-react";
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

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Reviews</h1>
            <p className="text-surface-500 mt-1">Feedback from your clients</p>
          </div>
          {reviews && reviews.length > 0 && (
            <div className="text-right">
              <p className="text-3xl font-bold text-surface-900">{avgRating}</p>
              <p className="text-xs text-surface-400">{reviews.length} review{reviews.length > 1 ? "s" : ""}</p>
            </div>
          )}
        </div>

        {!reviews ? (
          <Spinner className="w-6 h-6" />
        ) : reviews.length > 0 ? (
          <div className="space-y-3 animate-fade-in">
            {reviews.map((r) => (
              <Card key={r._id}>
                <CardContent>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold">
                        {r.clientName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-900">{r.clientName}</p>
                        <p className="text-xs text-surface-400">{r.vehicleName} · {formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <StarDisplay rating={r.rating} />
                  </div>
                  {r.comment && <p className="text-sm text-surface-600 ml-12">{r.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Star className="w-8 h-8" />}
            title="No Reviews Yet"
            description="Reviews from clients will appear here after completed sessions."
          />
        )}
      </main>
    </div>
  );
}
