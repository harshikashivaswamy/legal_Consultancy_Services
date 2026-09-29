import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Star, MessageSquare, CheckCircle2, ShieldCheck, ThumbsUp, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionCard } from "@/components/dashboard/primitives";
import { LAWYERS } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/client/reviews")({
  head: () => ({
    meta: [
      { title: "Advocate Reviews & Feedback — Legal Consultancy Service" },
      { name: "description", content: "Rate and review verified advocates after legal consultations." },
    ],
  }),
  component: ClientReviewsPage,
});

interface ReviewItem {
  id: string;
  lawyerName: string;
  lawyerPhoto: string;
  specialization: string;
  date: string;
  rating: number;
  comment: string;
  verifiedBooking: boolean;
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    lawyerName: "Adv. Ananya Iyer",
    lawyerPhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    specialization: "Criminal & Bail Law",
    date: "12 July 2026",
    rating: 5,
    comment: "Advocate Iyer gave crystal-clear guidance on bail provisions and drafted the urgent representation in less than 4 hours. Exceptional dedication.",
    verifiedBooking: true,
  },
  {
    id: "rev-2",
    lawyerName: "Adv. Rohan Mehta",
    lawyerPhoto: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&auto=format&fit=crop&q=80",
    specialization: "Corporate & Contracts",
    date: "28 June 2026",
    rating: 5,
    comment: "Helped us structure our cross-border SaaS agreement and highlighted indemnity risks we hadn't noticed. 10/10 recommend.",
    verifiedBooking: true,
  },
];

function ClientReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [selectedLawyer, setSelectedLawyer] = useState(LAWYERS[0]!.id);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please provide a short feedback review.");
      return;
    }

    const lawyer = LAWYERS.find((l) => l.id === selectedLawyer);
    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      lawyerName: lawyer?.name || "Advocate",
      lawyerPhoto: lawyer?.photo || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      specialization: lawyer?.specialization || "Legal Counsel",
      date: "Today",
      rating,
      comment,
      verifiedBooking: true,
    };

    setReviews([newRev, ...reviews]);
    setComment("");
    toast.success("Thank you! Your verified review has been published.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Consultation Reviews & Ratings"
          subtitle="Share your consultation experience to help maintain high standards across the verified advocate network."
        />
        <Badge variant="outline" className="text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5 self-start">
          <ShieldCheck className="size-4 text-primary" /> Verified Client Reviews Only
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Write a Review Card */}
        <Card className="p-5 rounded-2xl border bg-card/80 shadow-soft h-fit lg:sticky lg:top-24 space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" /> Leave a Verified Review
          </h2>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Select Advocate</label>
              <select
                value={selectedLawyer}
                onChange={(e) => setSelectedLawyer(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {LAWYERS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Star Rating</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Star
                      className={`size-6 ${
                        star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold ml-2 text-foreground">{rating} / 5</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Detailed Feedback</label>
              <Textarea
                placeholder="How helpful was the legal advice? Did the counsel answer all your queries clearly?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="rounded-xl text-xs resize-none"
              />
            </div>

            <Button type="submit" className="w-full rounded-xl gap-2 text-xs font-bold shadow-soft">
              <Send className="size-3.5" /> Submit Verified Review
            </Button>
          </form>
        </Card>

        {/* Reviews Feed */}
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title={`My Submitted & Verified Reviews (${reviews.length})`}>
            <div className="space-y-4">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border bg-card/60 p-4.5 space-y-3 transition-colors hover:bg-card hover:shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={r.lawyerPhoto} alt={r.lawyerName} className="size-10 rounded-xl object-cover border" />
                      <div>
                        <p className="text-sm font-bold">{r.lawyerName}</p>
                        <p className="text-xs text-muted-foreground">{r.specialization} · {r.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3.5 ${
                            i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-foreground/90">{r.comment}</p>

                  <div className="flex items-center justify-between border-t pt-2.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="size-3.5" /> Verified Consultation Client
                    </span>
                    <span>Status: Published</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
