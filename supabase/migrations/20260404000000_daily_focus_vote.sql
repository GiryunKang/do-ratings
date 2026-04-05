-- Daily focus vote topics
create table if not exists daily_votes (
  id uuid default gen_random_uuid() primary key,
  question jsonb not null, -- { ko: "...", en: "..." }
  options jsonb not null, -- [{ id: "a", label: { ko: "...", en: "..." }, subject_id?: uuid }]
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '24 hours'),
  is_active boolean not null default true,
  total_votes integer not null default 0,
  created_at timestamptz not null default now()
);

-- Individual votes
create table if not exists daily_vote_responses (
  id uuid default gen_random_uuid() primary key,
  vote_id uuid not null references daily_votes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_id text not null,
  created_at timestamptz not null default now(),
  unique(vote_id, user_id) -- one vote per user per topic
);

-- Vote counts per option (materialized for performance)
create table if not exists daily_vote_counts (
  vote_id uuid not null references daily_votes(id) on delete cascade,
  option_id text not null,
  count integer not null default 0,
  primary key (vote_id, option_id)
);

-- RLS
alter table daily_votes enable row level security;
alter table daily_vote_responses enable row level security;
alter table daily_vote_counts enable row level security;

create policy "Anyone can read active votes" on daily_votes for select using (true);
create policy "Anyone can read vote counts" on daily_vote_counts for select using (true);
create policy "Authenticated users can vote" on daily_vote_responses for insert with check (auth.uid() = user_id);
create policy "Users can read own votes" on daily_vote_responses for select using (auth.uid() = user_id);

-- Function to cast a vote (atomic: insert response + increment count)
create or replace function cast_daily_vote(p_vote_id uuid, p_option_id text)
returns void as $$
begin
  -- Insert response (will fail on duplicate due to unique constraint)
  insert into daily_vote_responses (vote_id, user_id, option_id)
  values (p_vote_id, auth.uid(), p_option_id);

  -- Upsert count
  insert into daily_vote_counts (vote_id, option_id, count)
  values (p_vote_id, p_option_id, 1)
  on conflict (vote_id, option_id)
  do update set count = daily_vote_counts.count + 1;

  -- Increment total
  update daily_votes set total_votes = total_votes + 1 where id = p_vote_id;
end;
$$ language plpgsql security definer;

-- Seed: first focus vote
insert into daily_votes (question, options, starts_at, ends_at) values (
  '{"ko": "최고의 한국 항공사는?", "en": "Best Korean airline?"}',
  '[
    {"id": "a", "label": {"ko": "대한항공", "en": "Korean Air"}},
    {"id": "b", "label": {"ko": "아시아나항공", "en": "Asiana Airlines"}},
    {"id": "c", "label": {"ko": "진에어", "en": "Jin Air"}},
    {"id": "d", "label": {"ko": "티웨이항공", "en": "t''way Air"}}
  ]',
  now(),
  now() + interval '24 hours'
);
