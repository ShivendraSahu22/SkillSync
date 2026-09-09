import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { submitDeliverable } from "@/lib/marketplace";

export function DeliverableSubmitForm({
  projectId,
  submissionFormat,
  onDone,
}: {
  projectId: string;
  submissionFormat?: string;
  onDone?: () => void;
}) {
  const { user, displayName } = useAuth();
  const queryClient = useQueryClient();
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [proposal, setProposal] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to submit your deliverable.");
      await submitDeliverable({
        projectId,
        userId: user.id,
        displayName,
        submissionUrl,
        proposal,
      });
    },
    onSuccess: () => {
      toast.success("Work submitted for review.");
      setSubmissionUrl("");
      setProposal("");
      queryClient.invalidateQueries({ queryKey: ["my-bids"] });
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["bid-counts"] });
      onDone?.();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not submit your work"),
  });

  return (
    <form
      className="mt-4 space-y-4 rounded-lg border border-border bg-secondary/40 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit.mutate();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor={`url-${projectId}`}>Link to your deliverable</Label>
        <Input
          id={`url-${projectId}`}
          value={submissionUrl}
          onChange={(event) => setSubmissionUrl(event.target.value)}
          placeholder="https://github.com/... or https://figma.com/..."
          required
        />
        {submissionFormat ? (
          <p className="text-xs text-muted-foreground">Expected format: {submissionFormat}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`notes-${projectId}`}>Submission notes</Label>
        <Textarea
          id={`notes-${projectId}`}
          rows={4}
          required
          maxLength={2000}
          value={proposal}
          onChange={(event) => setProposal(event.target.value)}
          placeholder="What you built, how it meets each requirement, and anything the reviewer should open first."
        />
      </div>
      <Button type="submit" disabled={submit.isPending}>
        {submit.isPending ? "Submitting…" : "Submit deliverable"}
      </Button>
    </form>
  );
}
