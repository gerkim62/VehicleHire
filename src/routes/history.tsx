import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, StarDisplay, EmptyState } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Textarea } from "../components/ui/Input";
import { usePaystack } from "../hooks/usePaystack";
import { useToast } from "../hooks/useToast";
import { useState, useMemo } from "react";
import { History as HistoryIcon, Star, CreditCard, CheckCircle, Clock, Car, ChevronRight } from "lucide-react";
import { formatCurrency, formatDuration, formatDate, generateReference, getErrorMessage } from "../lib/utils";
import type { Id } from "../../convex/_generated/dataModel";
import type { Session, Vehicle, User as DBUser } from "../lib/types";

type EnrichedSession = Session & { vehicle?: Vehicle | null; agent?: DBUser | null };

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

export function HistoryPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { pay } = usePaystack();

  const sessions = useQuery(api.sessions.getByClient, user ? { clientId: user._id } : "skip");
  const createPayment = useMutation(api.payments.create);
  const markPaymentSuccess = useMutation(api.payments.markSuccess);
  const markPaymentFailed = useMutation(api.payments.markFailed);
  const sendPaymentReceipt = useAction(api.emails.sendPaymentReceipt);
  const submitReview = useMutation(api.reviews.submit);

  const [reviewModal, setReviewModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payingSession, setPayingSession] = useState<string | null>(null);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user) { navigate({ to: "/login" }); return null; }

  const completedSessions = useMemo(() => {
    return sessions?.filter((s: EnrichedSession) => s.status === "completed") || [];
  }, [sessions]);

  const totalSpent = useMemo(() => {
    return completedSessions.reduce((sum: number, s: EnrichedSession) => sum + (s.totalCharge || 0), 0);
  }, [completedSessions]);

  const handlePay = async (session: EnrichedSession) => {
    if (!user || !session.totalCharge) return;
    setPayingSession(session._id);

    try {
      const ref = generateReference();

      // Create the payment record first (pending)
      await createPayment({
        sessionId: session._id as Id<"sessions">,
        clientId: user._id,
        agentId: session.agentId,
        amount: session.totalCharge,
        currency: "KES",
        paystackReference: ref,
      });

      // Open Paystack popup
      pay({
        email: user.email,
        amount: session.totalCharge * 100,
        currency: "KES",
        reference: ref,
        onSuccess: async (response) => {
          try {
            await markPaymentSuccess({
              paystackReference: response.reference,
              paystackTransactionId: response.trans,
            });
            toast(`Payment of ${formatCurrency(session.totalCharge!)} confirmed! ✓`, "success");

            try {
              await sendPaymentReceipt({
                clientEmail: user.email,
                clientName: user.name,
                vehicleName: session.vehicle
                  ? `${session.vehicle.make} ${session.vehicle.model}`
                  : "Hire Vehicle",
                amount: session.totalCharge!,
                currency: session.currency || "KES",
                reference: response.reference,
                paidAt: new Date().toLocaleString("en-KE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              });
            } catch (e) {
              console.info("Receipt email skipped (SMTP not configured):", e);
            }
          } catch {
            toast("Payment was received but confirmation failed. Contact support.", "error");
          } finally {
            setPayingSession(null);
          }
        },
        onClose: async () => {
          try {
            await markPaymentFailed({ paystackReference: ref });
          } catch {
            // Ignore cleanup errors
          }
          toast("Payment was cancelled.", "warning");
          setPayingSession(null);
        },
      });
    } catch (err) {
      toast("Payment failed: " + getErrorMessage(err), "error");
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
      toast("Review submitted successfully!", "success");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        
        {/* Header & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary-100 text-primary-800 border border-primary-200">
                Completed Trips
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
              Hire History
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              Review completed sessions, complete payments, and leave feedback for agents
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-surface-400">Completed Rentals</p>
            <p className="text-2xl font-bold text-surface-900 mt-0.5">{completedSessions.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-surface-400">Total Spent</p>
            <p className="text-2xl font-bold text-primary-600 mt-0.5">{formatCurrency(totalSpent)}</p>
          </div>
        </div>

        {/* List */}
        {!sessions ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-surface-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : completedSessions.length > 0 ? (
          <div className="space-y-4 animate-fade-in">
            {completedSessions.map((s: EnrichedSession) => (
              <SessionCard
                key={s._id}
                session={s}
                userId={user._id}
                onPay={handlePay}
                onReview={(id) => { setReviewModal(id); setRating(5); setComment(""); }}
                payingSession={payingSession}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<HistoryIcon className="w-10 h-10 text-surface-400" />}
            title="No Completed Sessions"
            description="Your completed hire sessions will appear here after finishing a rental."
            action={<Link to="/vehicles" className="text-xs font-bold text-primary-600 hover:underline">Browse Vehicles →</Link>}
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
                      className={`w-8 h-8 transition-colors ${star <= rating ? "text-amber-400 fill-amber-400" : "text-surface-200 hover:text-amber-200"}`}
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
              placeholder="How was your hire experience?"
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

// ─── SessionCard ──────────────────────────────────────────────────────────────

function SessionCard({
  session,
  userId,
  onPay,
  onReview,
  payingSession,
}: {
  session: EnrichedSession;
  userId: Id<"users">;
  onPay: (s: EnrichedSession) => void;
  onReview: (id: string) => void;
  payingSession: string | null;
}) {
  const payment = useQuery(api.payments.getBySession, { sessionId: session._id });
  const canReview = useQuery(api.reviews.canReview, {
    sessionId: session._id,
    clientId: userId,
  });

  const isPaid = payment?.status === "success";
  const paymentPending = payment?.status === "pending";

  return (
    <Card className="border border-surface-200/70 rounded-3xl overflow-hidden shadow-2xs group">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-600 font-bold shrink-0 border border-primary-200/50">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-surface-900 group-hover:text-primary-600 transition-colors leading-tight">
                  {session.vehicle?.make} {session.vehicle?.model}
                </h3>
                <p className="text-xs text-surface-400">
                  {formatDate(session.startedAt)} · Duration: {session.durationMs ? formatDuration(session.durationMs) : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Badge variant="default" size="md" className="font-bold">{formatCurrency(session.totalCharge || 0)}</Badge>
              <Badge variant="success" dot>Completed</Badge>
              {isPaid && (
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3" /> Paid
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
            {!isPaid && !paymentPending && session.totalCharge && (
              <Button
                size="sm"
                className="rounded-xl shadow-xs text-xs"
                onClick={() => onPay(session)}
                isLoading={payingSession === session._id}
              >
                <CreditCard className="w-3.5 h-3.5" /> Pay Now
              </Button>
            )}
            {paymentPending && payingSession !== session._id && (
              <Badge variant="warning" dot>Payment pending</Badge>
            )}

            {isPaid && canReview && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl text-xs"
                onClick={() => onReview(session._id)}
              >
                <Star className="w-3.5 h-3.5" /> Review
              </Button>
            )}
            {isPaid && canReview === false && (
              <Badge variant="info" size="sm">
                <Star className="w-3 h-3" /> Reviewed
              </Badge>
            )}

            <Link to="/session/$sessionId" params={{ sessionId: session._id }}>
              <Button size="sm" variant="outline" className="rounded-xl text-xs">View Details</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

