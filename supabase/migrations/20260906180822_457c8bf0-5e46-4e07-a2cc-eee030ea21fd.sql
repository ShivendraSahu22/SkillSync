ALTER TABLE public.bids
  ADD COLUMN IF NOT EXISTS decision text,
  ADD COLUMN IF NOT EXISTS score_requirements smallint,
  ADD COLUMN IF NOT EXISTS score_quality smallint,
  ADD COLUMN IF NOT EXISTS score_criteria smallint,
  ADD COLUMN IF NOT EXISTS reviewer_feedback text;

ALTER TABLE public.bids
  ADD CONSTRAINT bids_decision_check CHECK (decision IS NULL OR decision IN ('pass','fail')),
  ADD CONSTRAINT bids_score_requirements_check CHECK (score_requirements IS NULL OR score_requirements BETWEEN 1 AND 5),
  ADD CONSTRAINT bids_score_quality_check CHECK (score_quality IS NULL OR score_quality BETWEEN 1 AND 5),
  ADD CONSTRAINT bids_score_criteria_check CHECK (score_criteria IS NULL OR score_criteria BETWEEN 1 AND 5),
  ADD CONSTRAINT bids_reviewer_feedback_len CHECK (reviewer_feedback IS NULL OR char_length(reviewer_feedback) <= 2000);