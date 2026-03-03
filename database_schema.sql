-- Create the schema for MentiMeter (Menti Eter)

-- 1. Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    presenter_id UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);

-- 2. Activities Table (Polls, Quizzes, Word Clouds, Q&A)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'poll', 'quiz', 'wordcloud', 'qa'
    question TEXT NOT NULL,
    options JSONB, -- Array of strings for choices
    correct_answer INTEGER, -- Index in options array
    is_open BOOLEAN DEFAULT false,
    "index" INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Participants Table
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Responses Table
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
    payload JSONB NOT NULL, -- { optionIndex: 0 } or { word: "hello" } or { question: "..." }
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Realtime Setup
-- Enable Realtime for these tables (Optional but recommended for data syncing)
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
ALTER TABLE public.activities REPLICA IDENTITY FULL;
ALTER TABLE public.participants REPLICA IDENTITY FULL;
ALTER TABLE public.responses REPLICA IDENTITY FULL;

-- Define Realtime Channels
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES 
    ('session:%', 'Real-time updates for specific sessions', true)
ON CONFLICT (pattern) DO NOTHING;

-- RLS (Row Level Security) - Simplified for high-speed dev, can be tightened later
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for active sessions" ON public.sessions FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read for activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Allow public read/insert for participants" ON public.participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/insert for responses" ON public.responses FOR ALL USING (true) WITH CHECK (true);
