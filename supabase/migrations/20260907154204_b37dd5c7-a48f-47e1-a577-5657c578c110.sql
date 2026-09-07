CREATE OR REPLACE FUNCTION public.enforce_bid_update_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  is_owner boolean;
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.project_id IS DISTINCT FROM OLD.project_id
     OR NEW.bidder_id IS DISTINCT FROM OLD.bidder_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Submission identity cannot be changed';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = OLD.project_id AND p.owner_id = auth.uid()
  ) INTO is_owner;

  IF auth.uid() = OLD.bidder_id AND NOT is_owner THEN
    -- Student editing their own pending submission: review fields are read-only.
    IF NEW.status IS DISTINCT FROM 'pending'
       OR NEW.decision IS DISTINCT FROM OLD.decision
       OR NEW.score_requirements IS DISTINCT FROM OLD.score_requirements
       OR NEW.score_quality IS DISTINCT FROM OLD.score_quality
       OR NEW.score_criteria IS DISTINCT FROM OLD.score_criteria
       OR NEW.reviewer_feedback IS DISTINCT FROM OLD.reviewer_feedback
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
      RAISE EXCEPTION 'Students cannot modify review results';
    END IF;
    RETURN NEW;
  END IF;

  IF is_owner THEN
    -- Reviewer: only review fields may change.
    IF NEW.bidder_name IS DISTINCT FROM OLD.bidder_name
       OR NEW.proposal IS DISTINCT FROM OLD.proposal
       OR NEW.submission_url IS DISTINCT FROM OLD.submission_url THEN
      RAISE EXCEPTION 'Reviewers cannot modify the student submission';
    END IF;

    IF NEW.decision IS DISTINCT FROM OLD.decision
       OR NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.decision IS NULL OR NEW.decision NOT IN ('pass', 'fail') THEN
        RAISE EXCEPTION 'A review needs a pass or fail decision';
      END IF;
      IF NEW.status IS DISTINCT FROM (CASE WHEN NEW.decision = 'pass' THEN 'accepted' ELSE 'rejected' END) THEN
        RAISE EXCEPTION 'Submission status must match the review decision';
      END IF;
      IF NEW.score_requirements IS NULL OR NEW.score_quality IS NULL OR NEW.score_criteria IS NULL THEN
        RAISE EXCEPTION 'All rubric scores are required';
      END IF;
      IF char_length(coalesce(btrim(NEW.reviewer_feedback), '')) < 10 THEN
        RAISE EXCEPTION 'Reviewer feedback must be at least 10 characters';
      END IF;
      NEW.reviewed_at := now();
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not allowed to modify this submission';
END;
$$;

DROP TRIGGER IF EXISTS enforce_bid_update_rules ON public.bids;
CREATE TRIGGER enforce_bid_update_rules
BEFORE UPDATE ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.enforce_bid_update_rules();