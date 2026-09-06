import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  reviewSubmission,
  RUBRIC_CRITERIA,
  type Bid,
  type ReviewInput,
} from "@/lib/marketplace";

const SCORES = [1, 2, 3, 4, 5];

export function SubmissionReviewForm({ bidId }: { bidId: string }) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<"pass" | "fail" | "">("");
  const [scores, setScores] = useState<Record<string, number | null>>({
    score_requirements: null,
    score_quality: null,
    score_criteria: null,
  });
  const [feedback, setFeedback] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (decision !== "pass" && decision !== "fail") {
        throw new Error("Choose pass or fail for this deliverable.");
      }
      const input: ReviewInput = {
        decision,
        score_requirements: scores["score_requirements"] ?? 0,
        score_quality: scores["score_quality"] ?? 0,
        score_criteria: scores["score_criteria"] ?? 0,
        reviewer_feedback: feedback,
      };
      await reviewSubmission(bidId, input);
    },
    onSuccess: () => {
      toast.success(decision === "pass" ? "Deliverable passed." : "Deliverable marked as failed.");
      queryClient.invalidateQueries({ queryKey: ["org-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["my-bids"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save this review"),
  });

  return (
    <form
      className="mt-4 space-y-5 rounded-lg border border-border bg-secondary/40 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit.mutate();
      }}
    >
      <div className="space-y-2">
        <Label>Decision</Label>
        <ToggleGroup
          type="single"
          value={decision}
          onValueChange={(value) => setDecision((value as "pass" | "fail" | "") ?? "")}
          className="justify-start gap-2"
        >
          <ToggleGroupItem value="pass" className="px-4">
            Pass
          </ToggleGroupItem>
          <ToggleGroupItem value="fail" className="px-4">
            Fail
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-4">
        <Label>Rubric scores (1 = poor, 5 = excellent)</Label>
        {RUBRIC_CRITERIA.map((criterion) => (
          <div key={criterion.key} className="space-y-1">
            <p className="text-sm font-medium">{criterion.label}</p>
            <p className="text-xs text-muted-foreground">{criterion.hint}</p>
            <div className="flex gap-2 pt-1">
              {SCORES.map((score) => {
                const active = scores[criterion.key] === score;
                return (
                  <button
                    key={score}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${criterion.label}: ${score}`}
                    onClick={() =>
                      setScores((prev) => ({ ...prev, [criterion.key]: score }))
                    }
                    className={`size-9 rounded-md border text-sm font-semibold transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`feedback-${bidId}`}>Feedback for the student</Label>
        <Textarea
          id={`feedback-${bidId}`}
          rows={4}
          required
          maxLength={2000}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="What met the brief, what was missing, and what to improve next time."
        />
        <p className="text-xs text-muted-foreground">{feedback.trim().length}/2000 characters</p>
      </div>

      <Button type="submit" disabled={submit.isPending}>
        {submit.isPending ? "Saving review…" : "Submit review"}
      </Button>
    </form>
  );
}

export function SubmissionReviewSummary({ bid }: { bid: Bid }) {
  if (!bid.decision && !bid.reviewer_feedback) return null;
  return (
    <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Review</span>
        {bid.decision ? (
          <Badge variant={bid.decision === "pass" ? "default" : "destructive"}>
            {bid.decision === "pass" ? "Pass" : "Fail"}
          </Badge>
        ) : null}
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-3">
        {RUBRIC_CRITERIA.map((criterion) => (
          <div key={criterion.key}>
            <dt className="text-xs text-muted-foreground">{criterion.label}</dt>
            <dd className="text-sm font-medium">
              {bid[criterion.key] != null ? `${bid[criterion.key]}/5` : "—"}
            </dd>
          </div>
        ))}
      </dl>
      {bid.reviewer_feedback ? (
        <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
          {bid.reviewer_feedback}
        </p>
      ) : null}
    </div>
  );
}
