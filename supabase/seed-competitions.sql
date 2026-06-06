-- Optional LockInTalks launch competition seed data.
-- Run this only if you want starter competitions to exist in Supabase.
-- Public pages read from public.competitions where status = 'live'.

insert into public.competitions (
  slug,
  name,
  category,
  age_group,
  event_date,
  event_time,
  timezone,
  registration_deadline,
  max_participants,
  fee_label,
  fee_amount,
  summary,
  description,
  status,
  rules,
  schedule,
  prizes,
  criteria,
  judges
)
values
(
  'story-talks',
  'Story Talks',
  'Storytelling',
  'Ages 5-12',
  '14 June 2026',
  '11:00 AM',
  'IST',
  '6 June 2026, 10:00 AM IST',
  777,
  'INR 199.99',
  19999,
  'A beginner-friendly storytelling competition where young speakers build expression, structure, and confidence.',
  'Story Talks is an online storytelling competition where kids bring stories to life with imagination, expression, voice, and confidence. Participants may tell an original story or perform an existing story with proper credit.',
  'live',
  array[
    'Camera must stay on throughout the performance.',
    'The story must be live and cannot be pre-recorded.',
    'Each participant must speak for 3 to 5 minutes.',
    'Stories must be age-appropriate and respectful.',
    'Participants may use simple props or visuals.',
    'The judges'' decision will be final.'
  ],
  array[
    'Registration closes on 6 June 2026 at 10:00 AM IST.',
    'The competition begins on 14 June 2026 at 11:00 AM IST.',
    'Each participant will speak for 3 to 5 minutes.',
    'Results will be announced after judging is complete.'
  ],
  array[
    'The prize pool increases by INR 500 for every 5 verified contestants.',
    'Prizes may be given as cash or Amazon gift cards.',
    '1st Place: 45% of the total prize pool.',
    '2nd Place: 30% of the total prize pool.',
    '3rd Place: 25% of the total prize pool.',
    'All participants get precise and valuable feedback and participation certificates.',
    'That is why more people means more fun, more prizes, and more stakes.'
  ],
  array['Confidence', 'Clarity', 'Creativity', 'Story Structure', 'Expression', 'Time Management'],
  array['Arti Sharma']
),
(
  'idol-talk',
  'Idol Talk',
  'Inspirational Speaking',
  'Ages 9-16',
  '14 June 2026',
  '1:00 PM',
  'IST',
  '6 June 2026, 12:00 PM IST',
  777,
  'INR 199.99',
  19999,
  'An inspirational speaking event where participants talk about someone who motivates their mindset and growth.',
  'Idol Talk is an online speaking competition where participants explain how a sportsperson, creator, fictional character, public figure, or real-life role model inspires their discipline, confidence, and goals.',
  'live',
  array[
    'Camera must stay on throughout the performance.',
    'The speech must be live and cannot be pre-recorded.',
    'Each participant must speak for 3 to 5 minutes.',
    'The speech must be respectful and age-appropriate.',
    'Participants may use simple props or visuals.',
    'The judges'' decision will be final.'
  ],
  array[
    'Registration closes on 6 June 2026 at 12:00 PM IST.',
    'The competition begins on 14 June 2026 at 1:00 PM IST.',
    'Each participant will speak for 3 to 5 minutes.',
    'Results will be announced after judging is complete.'
  ],
  array[
    'The prize pool increases by INR 500 for every 5 verified contestants.',
    'Prizes may be given as cash or Amazon gift cards.',
    '1st Place: 45% of the total prize pool.',
    '2nd Place: 30% of the total prize pool.',
    '3rd Place: 25% of the total prize pool.',
    'All participants get precise and valuable feedback and participation certificates.',
    'That is why more people means more fun, more prizes, and more stakes.'
  ],
  array['Confidence', 'Clarity', 'Personal Connection', 'Speech Structure', 'Voice Modulation', 'Time Management'],
  array['Arti Sharma']
),
(
  'power-talk',
  'Power Talk',
  'Motivational Speaking',
  'Ages 10-16',
  '14 June 2026',
  '4:00 PM',
  'IST',
  '6 June 2026, 3:00 PM IST',
  777,
  'INR 199.99',
  19999,
  'A motivational speaking competition for students who want to share strong ideas with confidence and purpose.',
  'Power Talk is an online motivational speaking competition where participants speak about dreams, discipline, confidence, pressure, leadership, student life, sports mindset, or never giving up.',
  'live',
  array[
    'Camera must stay on throughout the performance.',
    'The speech must be live and cannot be pre-recorded.',
    'Each participant must speak for 3 to 5 minutes.',
    'The speech must be motivational and age-appropriate.',
    'Reading fully from a script is discouraged.',
    'The judges'' decision will be final.'
  ],
  array[
    'Registration closes on 6 June 2026 at 3:00 PM IST.',
    'The competition begins on 14 June 2026 at 4:00 PM IST.',
    'Each participant will speak for 3 to 5 minutes.',
    'Results will be announced after judging is complete.'
  ],
  array[
    'The prize pool increases by INR 500 for every 5 verified contestants.',
    'Prizes may be given as cash or Amazon gift cards.',
    '1st Place: 45% of the total prize pool.',
    '2nd Place: 30% of the total prize pool.',
    '3rd Place: 25% of the total prize pool.',
    'All participants get precise and valuable feedback and participation certificates.',
    'That is why more people means more fun, more prizes, and more stakes.'
  ],
  array['Confidence', 'Motivational Impact', 'Clarity', 'Speech Structure', 'Audience Connection', 'Time Management'],
  array['Arti Sharma']
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  age_group = excluded.age_group,
  event_date = excluded.event_date,
  event_time = excluded.event_time,
  timezone = excluded.timezone,
  registration_deadline = excluded.registration_deadline,
  max_participants = excluded.max_participants,
  fee_label = excluded.fee_label,
  fee_amount = excluded.fee_amount,
  summary = excluded.summary,
  description = excluded.description,
  status = excluded.status,
  rules = excluded.rules,
  schedule = excluded.schedule,
  prizes = excluded.prizes,
  criteria = excluded.criteria,
  judges = excluded.judges,
  updated_at = now();
