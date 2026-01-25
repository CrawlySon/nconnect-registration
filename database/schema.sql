-- =====================================================
-- nConnect26 Registration System - Database Schema v2
-- FIXED SLOTS VERSION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP OLD TABLES (if migrating)
-- =====================================================
DROP VIEW IF EXISTS session_stats;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS attendee_sessions;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS attendees;
DROP TABLE IF EXISTS stages;

-- =====================================================
-- STAGES TABLE
-- Fixed 2 stages for the conference
-- =====================================================
CREATE TABLE stages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#00D4FF'
);

-- Insert fixed stages
INSERT INTO stages (id, name, color) VALUES
    ('ai-data-stage', 'AI & Data Stage', '#00D4FF'),
    ('soft-dev-stage', 'Soft Dev Stage', '#A855F7');

-- =====================================================
-- SESSIONS TABLE
-- Fixed 14 sessions (7 time slots × 2 stages)
-- IDs 1-7: AI & Data Stage
-- IDs 8-14: Soft Dev Stage
-- =====================================================
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY,
    slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 6),
    stage_id VARCHAR(50) NOT NULL REFERENCES stages(id),
    title VARCHAR(255) NOT NULL DEFAULT 'TBA',
    speaker_name VARCHAR(150) NOT NULL DEFAULT 'TBA',
    speaker_company VARCHAR(150),
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 60,
    UNIQUE(slot_index, stage_id)
);

-- Insert 14 fixed sessions
-- AI & Data Stage (sessions 1-7)
INSERT INTO sessions (id, slot_index, stage_id, title, speaker_name, speaker_company, description, capacity) VALUES
(1, 0, 'ai-data-stage', 'MLOps - cesta AI do produkcie', 'Jakub Novotný', 'Slovak Telekom', 'Cesta AI modelov od experimentov až po škálovateľné nasadenie do produkcie.', 60),
(2, 1, 'ai-data-stage', 'Pokročilé používanie LLM nástrojov pri vývoji softvéru', 'Jakub Žitný', 'Deepnote', 'Nové nástroje založené na LLM, ktoré menia spôsob programovania a dátovej analytiky.', 60),
(3, 2, 'ai-data-stage', 'Agentic AI', 'Ján Ružarovský', 'SAP Labs Slovakia', 'Koncept Agentic AI a multiagentové systémy pomocou CrewAI.', 60),
(4, 3, 'ai-data-stage', 'AI-Powered Onboarding', 'Tomáš Kramár', 'Luigi''s Box', 'Ako umelá inteligencia automatizuje onboarding zákazníkov.', 60),
(5, 4, 'ai-data-stage', 'Kľúč k efektívnemu využitiu NoSQL databáz', 'Juraj Marek', 'Muehlbauer', 'Výhody a výzvy používania NoSQL databáz v priemyselných aplikáciách.', 60),
(6, 5, 'ai-data-stage', 'Digitalizácia v Muzikeri', 'Ondrej Proksa', 'Muziker', 'Low-code platformy, AI a automatizácia interných procesov.', 60),
(7, 6, 'ai-data-stage', 'Ako môžu byť študenti pripravení na analýzu údajov', 'Jozef Chyžnaj', 'Orange', 'Rozdiel medzi BI a data science, praktické príklady dátovej analýzy.', 60);

-- Soft Dev Stage (sessions 8-14)
INSERT INTO sessions (id, slot_index, stage_id, title, speaker_name, speaker_company, description, capacity) VALUES
(8, 0, 'soft-dev-stage', 'Vývoj a centrálna správa softvéru v heterogénnom prostredí', 'Jozef Fiebig', 'NRSYS', 'Tvorba a centrálne riadenie softvéru pre veľké podnikové systémy.', 60),
(9, 1, 'soft-dev-stage', 'WebAssembly: Revolúcia vo výkone webových aplikácií', 'Peter Pšenák', 'PowerPlay Studio', 'WebAssembly ako revolučná technológia pre rýchlejšie webové aplikácie.', 60),
(10, 2, 'soft-dev-stage', 'Správa schém v distribuovaných systémoch', 'Miroslav Kvasnica', 'Seznam.cz', 'Dôležitosť správy schém v distribuovaných systémoch.', 60),
(11, 3, 'soft-dev-stage', 'Budovateľská mentalita v tech firmách', 'Peter Urban', 'Dedoles', 'Kľúčové rozhodnutia, ktoré formujú technologický rast firmy.', 60),
(12, 4, 'soft-dev-stage', 'CTO Career Guide', 'Róbert Čižmár', 'GymBeam', '5 kľúčových pilierov úspešného CTO.', 60),
(13, 5, 'soft-dev-stage', 'Ako zvládnuť tisícky hráčov naraz', 'Juraj Šurman', 'Pixel Federation', 'Backend architektúra a optimalizácia pre veľké online hry.', 60),
(14, 6, 'soft-dev-stage', 'TBA', 'TBA', NULL, NULL, 60);

-- =====================================================
-- ATTENDEES TABLE
-- Conference participants
-- =====================================================
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    company VARCHAR(150),
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendees_email ON attendees(email);

-- =====================================================
-- ATTENDEE_SESSIONS TABLE
-- Tracks registration status for each attendee × session
-- Created when attendee registers (14 rows per attendee)
-- =====================================================
CREATE TABLE attendee_sessions (
    attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    is_registered BOOLEAN NOT NULL DEFAULT false,
    registered_at TIMESTAMPTZ,
    PRIMARY KEY (attendee_id, session_id)
);

CREATE INDEX idx_attendee_sessions_attendee ON attendee_sessions(attendee_id);
CREATE INDEX idx_attendee_sessions_session ON attendee_sessions(session_id);
CREATE INDEX idx_attendee_sessions_registered ON attendee_sessions(session_id, is_registered) WHERE is_registered = true;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendee_sessions ENABLE ROW LEVEL SECURITY;

-- Stages: Everyone can read
CREATE POLICY "Stages are viewable by everyone" ON stages
    FOR SELECT USING (true);

-- Sessions: Everyone can read
CREATE POLICY "Sessions are viewable by everyone" ON sessions
    FOR SELECT USING (true);

-- Sessions: Service role can update (for admin)
CREATE POLICY "Service role can manage sessions" ON sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Attendees: Service role can manage
CREATE POLICY "Service role can manage attendees" ON attendees
    FOR ALL USING (auth.role() = 'service_role');

-- Attendee Sessions: Service role can manage
CREATE POLICY "Service role can manage attendee_sessions" ON attendee_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- HELPER VIEW: Session with registration counts
-- =====================================================
CREATE OR REPLACE VIEW session_stats AS
SELECT
    s.id,
    s.slot_index,
    s.title,
    s.speaker_name,
    s.speaker_company,
    s.description,
    s.capacity,
    st.id as stage_id,
    st.name as stage_name,
    st.color as stage_color,
    COALESCE(reg.registered_count, 0) as registered_count,
    s.capacity - COALESCE(reg.registered_count, 0) as available_spots
FROM sessions s
JOIN stages st ON s.stage_id = st.id
LEFT JOIN (
    SELECT session_id, COUNT(*) as registered_count
    FROM attendee_sessions
    WHERE is_registered = true
    GROUP BY session_id
) reg ON s.id = reg.session_id
ORDER BY s.slot_index, s.stage_id;

-- =====================================================
-- FUNCTION: Initialize attendee sessions
-- Call after creating a new attendee
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_attendee_sessions(p_attendee_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO attendee_sessions (attendee_id, session_id, is_registered)
    SELECT p_attendee_id, id, false
    FROM sessions
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONE!
-- =====================================================
-- Fixed slots system with:
-- - 2 stages
-- - 14 fixed sessions (7 per stage)
-- - attendee_sessions for tracking registrations
-- - No more dynamic session creation
-- =====================================================
