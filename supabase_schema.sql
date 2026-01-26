-- Create notes table
create table public.notes (
  id uuid primary key,
  title text not null,
  content text,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null,
  "reminderDate" timestamp with time zone,
  attachments jsonb,
  hyperlinks jsonb,
  "linkedTaskId" uuid,
  user_id uuid references auth.users not null default auth.uid()
);

-- Create tasks table
create table public.tasks (
  id uuid primary key,
  title text not null,
  completed boolean default false,
  "dueDate" timestamp with time zone,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null,
  "parentTaskId" uuid,
  "linkedNoteId" uuid,
  user_id uuid references auth.users not null default auth.uid()
);

-- Enable Row Level Security (RLS)
alter table public.notes enable row level security;
alter table public.tasks enable row level security;

-- Create policies for Notes
create policy "Users can view their own notes" on public.notes
  for select using (auth.uid() = user_id);

create policy "Users can insert their own notes" on public.notes
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own notes" on public.notes
  for update using (auth.uid() = user_id);

create policy "Users can delete their own notes" on public.notes
  for delete using (auth.uid() = user_id);

-- Create policies for Tasks
create policy "Users can view their own tasks" on public.tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own tasks" on public.tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete their own tasks" on public.tasks
  for delete using (auth.uid() = user_id);
