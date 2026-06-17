import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, StarDisplay, EmptyState } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Textarea } from "../components/ui/Input";
import { useState } from "react";
import { History as HistoryIcon, Star, CreditCard } from "lucide-react";
import { formatCurrency, formatDuration, formatDate, generateReference } from "../lib/utils";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const sessions = useQuery(api.sessions.getByClient, user ? { clientId: user._id } : "skip");
  const createPayment = useMutation(api.payments.create);
  const markPaymentSuccess = useMutation(api.payments.markSuccess);
  const submitReview = useMutation(api.reviews.submit);

  const [reviewModal, setReviewModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Payment state
  const [payingSession, setPayingSession] = useState<string | null>(null);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user) { navigate({ to: "/login" }); return null; }

  const completedSessions = sessions?.filter((s) => s.status === "completed") || [];

  const handlePay = async (session: (typeof completedSessions)[0]) => {
    if (!user || !session.totalCharge) return;
    setPayingSession(session._id);
    try {
      const ref = generateReference();
      await createPayment({
        sessionId: session._id,
        clientId: user._id,
        agentId: session.agentId,
        amount: session.totalCharge,
        currency: "KES",
        paystackReference: ref,
      });
      // Simulate Paystack payment success for demo
      await markPaymentSuccess({ paystackReference: ref });
      alert("Payment successful! KES " + session.totalCharge.toLocaleString());
    } catch (err) {
      alert("Payment failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setPayingSession(null);
    }
  };

  const handleReview = async (sessionId: string) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await submitReview({
        sessionId: sessionId as never,
        clientId: user._id,
        rating,
        comment: comment || undefined,
      });
      setReviewModal(null);
      setRating(5);
      setComment("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Hire History</h1>
        <p className="text-surface-500 mb-6">Your completed hire sessions</p>

        {!sessions ? (
          <Spinner className="w-6 h-6" />
        ) : completedSessions.length > 0 ? (
          <div className="space-y-4 animate-fade-in">
            {completedSessions.map((s) => (
              <Card key={s._id}>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-surface-900">
                        {s.vehicle?.make} {s.vehicle?.model}
                      </p>
                      <p className="text-xs text-surface-400">
                        {formatDate(s.startedAt)} · Duration: {s.durationMs ? formatDuration(s.durationMs) : "—"}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="default" size="md">{formatCurrency(s.totalCharge || 0)}</Badge>
                        <Badge variant="success" dot>Completed</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePay(s)}
                        isLoading={payingSession === s._id}
                      >
                        <CreditCard className="w-4 h-4" /> Pay
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setReviewModal(s._id); setRating(5); setComment(""); }}
                      >
                        <Star className="w-4 h-4" /> Review
                      </Button>
                      <Link to={`/session/${s._id}`}>
                        <Button size="sm" variant="ghost">View</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<HistoryIcon className="w-8 h-8" />}
            title="No Completed Sessions"
            description="Your completed hire sessions will appear here."
          />
        )}

        {/* Review modal */}
        <Modal isOpen={!!reviewModal} onClose={() => setReviewModal(null)} title="Leave a Review">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-surface-700 mb-2">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="cursor-pointer p-0.5"
                  >
                    <svg
                      className={`w-8 h-8 transition-colors ${star <= rating ? "text-warning-500" : "text-surface-200 hover:text-warning-300"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
              <div className="mt-1">
                <StarDisplay rating={rating} size="sm" />
              </div>
            </div>
            <Textarea
              label="Comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your experience?"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setReviewModal(null)}>Cancel</Button>
              <Button onClick={() => reviewModal && handleReview(reviewModal)} isLoading={submitting}>
                Submit Review
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
