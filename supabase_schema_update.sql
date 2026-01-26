-- Add column for subtask snapshot
alter table public.tasks add column "previousSubtaskStates" jsonb;
