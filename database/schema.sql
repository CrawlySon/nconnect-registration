-- =====================================================
-- nConnect26 Registration System - Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension (should be enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STAGES TABLE
-- Represents the different stages/rooms at the conference
-- =====================================================
CREATE TABLE IF NOT EXISTS stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#00D4FF', -- Hex color
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default stages for nConnect26
INSERT INTO stages (name, description, color) VALUES
    ('AI & Data Stage', 'Prednášky zamerané na AI, machine learning, dátovú analytiku a MLOps', '#00D4FF'),
    ('Soft Dev Stage', 'Prednášky o softvérovom vývoji, architektúre a best practices', '#A855F7');

-- =====================================================
-- SESSIONS TABLE
-- Represents individual talks/presentations
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    speaker_name VARCHAR(150) NOT NULL,
    speaker_company VARCHAR(150),
    description TEXT,
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT '2026-03-26',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 50,
    registered_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_sessions_stage ON sessions(stage_id);
CREATE INDEX idx_sessions_date_time ON sessions(date, start_time);

-- =====================================================
-- ATTENDEES TABLE
-- Registered conference participants
-- =====================================================
CREATE TABLE IF NOT EXISTS attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    company VARCHAR(150),
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookup
CREATE INDEX idx_attendees_email ON attendees(email);

-- =====================================================
-- REGISTRATIONS TABLE
-- Links attendees to sessions they're registered for
-- =====================================================
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure an attendee can only register once per session
    UNIQUE(attendee_id, session_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_registrations_attendee ON registrations(attendee_id);
CREATE INDEX idx_registrations_session ON registrations(session_id);

-- =====================================================
-- SAMPLE DATA - nConnect26 Program
-- Based on nConnect25 format
-- =====================================================

-- Get stage IDs
DO $$
DECLARE
    ai_stage_id UUID;
    dev_stage_id UUID;
BEGIN
    SELECT id INTO ai_stage_id FROM stages WHERE name = 'AI & Data Stage';
    SELECT id INTO dev_stage_id FROM stages WHERE name = 'Soft Dev Stage';

    -- AI & Data Stage sessions
    INSERT INTO sessions (title, speaker_name, speaker_company, stage_id, date, start_time, end_time, capacity, description) VALUES
    ('MLOps - cesta AI do produkcie', 'Jakub Novotný', 'Slovak Telekom', ai_stage_id, '2026-03-26', '09:00', '09:45', 60, 'Cesta AI modelov od experimentov až po škálovateľné nasadenie do produkcie.'),
    ('Pokročilé používanie LLM nástrojov pri vývoji softvéru', 'Jakub Žitný', 'Deepnote', ai_stage_id, '2026-03-26', '09:45', '10:30', 60, 'Nové nástroje založené na LLM, ktoré menia spôsob programovania a dátovej analytiky.'),
    ('Agentic AI', 'Ján Ružarovský', 'SAP Labs Slovakia', ai_stage_id, '2026-03-26', '10:30', '11:15', 60, 'Koncept Agentic AI a multiagentové systémy pomocou CrewAI.'),
    ('AI-Powered Onboarding', 'Tomáš Kramár', 'Luigi''s Box', ai_stage_id, '2026-03-26', '11:15', '12:00', 60, 'Ako umelá inteligencia automatizuje onboarding zákazníkov.'),
    ('Kľúč k efektívnemu využitiu NoSQL databáz', 'Juraj Marek', 'Muehlbauer', ai_stage_id, '2026-03-26', '13:00', '13:45', 60, 'Výhody a výzvy používania NoSQL databáz v priemyselných aplikáciách.'),
    ('Digitalizácia v Muzikeri', 'Ondrej Proksa', 'Muziker', ai_stage_id, '2026-03-26', '13:45', '14:30', 60, 'Low-code platformy, AI a automatizácia interných procesov.'),
    ('Ako môžu byť študenti pripravení na analýzu údajov', 'Jozef Chyžnaj', 'Orange', ai_stage_id, '2026-03-26', '14:30', '15:15', 60, 'Rozdiel medzi BI a data science, praktické príklady dátovej analýzy.');

    -- Soft Dev Stage sessions
    INSERT INTO sessions (title, speaker_name, speaker_company, stage_id, date, start_time, end_time, capacity, description) VALUES
    ('Nadzvuková a subatomická Java', 'Patrik Malý', 'UNIQA GSCS', dev_stage_id, '2026-03-26', '09:00', '09:45', 60, 'Moderné Java frameworky ako Quarkus pre enterprise aplikácie.'),
    ('Vývoj a centrálna správa softvéru v heterogénnom prostredí', 'Jozef Fiebig', 'NRSYS', dev_stage_id, '2026-03-26', '09:45', '10:30', 60, 'Tvorba a centrálne riadenie softvéru pre veľké podnikové systémy.'),
    ('WebAssembly: Revolúcia vo výkone webových aplikácií', 'Peter Pšenák', 'PowerPlay Studio', dev_stage_id, '2026-03-26', '10:30', '11:15', 60, 'WebAssembly ako revolučná technológia pre rýchlejšie webové aplikácie.'),
    ('Správa schém v distribuovaných systémoch', 'Miroslav Kvasnica', 'Seznam.cz', dev_stage_id, '2026-03-26', '11:15', '12:00', 60, 'Dôležitosť správy schém v distribuovaných systémoch.'),
    ('Budovateľská mentalita v tech firmách', 'Peter Urban', 'Dedoles', dev_stage_id, '2026-03-26', '13:00', '13:45', 60, 'Kľúčové rozhodnutia, ktoré formujú technologický rast firmy.'),
    ('CTO Career Guide', 'Róbert Čižmár', 'GymBeam', dev_stage_id, '2026-03-26', '13:45', '14:30', 60, '5 kľúčových pilierov úspešného CTO.'),
    ('Ako zvládnuť tisícky hráčov naraz', 'Juraj Šurman', 'Pixel Federation', dev_stage_id, '2026-03-26', '14:30', '15:15', 60, 'Backend architektúra a optimalizácia pre veľké online hry.');

END $$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- Enable RLS for security
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Stages: Everyone can read
CREATE POLICY "Stages are viewable by everyone" ON stages
    FOR SELECT USING (true);

-- Sessions: Everyone can read active sessions
CREATE POLICY "Active sessions are viewable by everyone" ON sessions
    FOR SELECT USING (is_active = true);

-- Sessions: Service role can do everything
CREATE POLICY "Service role can manage sessions" ON sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Attendees: Service role can manage
CREATE POLICY "Service role can manage attendees" ON attendees
    FOR ALL USING (auth.role() = 'service_role');

-- Registrations: Service role can manage
CREATE POLICY "Service role can manage registrations" ON registrations
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- SESSION FEEDBACK TABLE
-- Star ratings (1-5) and comments for sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS session_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- One feedback per attendee per session
    UNIQUE(attendee_id, session_id)
);

CREATE INDEX idx_feedback_session ON session_feedback(session_id);
CREATE INDEX idx_feedback_attendee ON session_feedback(attendee_id);

-- Enable RLS
ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;

-- Service role can manage feedback
CREATE POLICY "Service role can manage feedback" ON session_feedback
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- HELPFUL VIEWS
-- =====================================================

-- View for session statistics
CREATE OR REPLACE VIEW session_stats AS
SELECT 
    s.id,
    s.title,
    s.speaker_name,
    st.name as stage_name,
    s.start_time,
    s.end_time,
    s.capacity,
    s.registered_count,
    ROUND((s.registered_count::numeric / s.capacity::numeric) * 100, 1) as fill_percentage,
    s.capacity - s.registered_count as available_spots
FROM sessions s
JOIN stages st ON s.stage_id = st.id
WHERE s.is_active = true
ORDER BY s.start_time;

-- =====================================================
-- DONE!
-- =====================================================
-- Your database is now set up with:
-- - 2 stages (AI & Data, Soft Dev)
-- - 14 sample sessions based on nConnect25 program
-- - Tables for attendees and registrations
-- - Row Level Security enabled
-- =====================================================
