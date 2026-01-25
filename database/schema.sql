-- nConnect26 Registration System - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS attendee_sessions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS attendees CASCADE;
DROP TABLE IF EXISTS stages CASCADE;

-- STAGES TABLE
CREATE TABLE stages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL
);

INSERT INTO stages (id, name, color) VALUES
    ('ai-data', 'AI&Data Stage', '#FF6B35'),
    ('softdev-cyber', 'SoftDev&CyberSecurity Stage', '#EF4444');

-- SESSIONS TABLE (14 fixed sessions)
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

-- AI&Data Stage (sessions 1-7)
INSERT INTO sessions (id, slot_index, stage_id, title, speaker_name, speaker_company, description, capacity) VALUES
(1, 0, 'ai-data', 'Uvod do AI a Machine Learning', 'Martin Kovac', 'Google Slovakia', 'Zakladne principy AI a ML pre zaciatocnikov. Dozviete sa o neuronových sieťach a deep learning.', 80),
(2, 1, 'ai-data', 'ChatGPT v praxi: Ako ho efektivne pouzivat', 'Jana Horváthova', 'OpenAI Partner', 'Prakticke tipy a triky pre pracu s ChatGPT a dalsimi LLM modelmi.', 60),
(3, 2, 'ai-data', 'Data Science pre zaciatocnikov', 'Peter Novak', 'DataCamp', 'Od dat k insightom - kompletny uvod do data science.', 50),
(4, 3, 'ai-data', 'Computer Vision a rozpoznavanie obrazu', 'Lucia Mazurova', 'ESET', 'Ako pocitace "vidia" a rozpoznavaju objekty na obrazkoch a vo videach.', 60),
(5, 4, 'ai-data', 'NLP: Spracovanie prirodzeneho jazyka', 'Tomas Kral', 'Microsoft', 'Ako AI rozumie ludskej reci a textu.', 60),
(6, 5, 'ai-data', 'AI v automobilovom priemysle', 'Milan Stefanik', 'Volkswagen SK', 'Autonomne vozidla a AI asistenti v modernych automobiloch.', 70),
(7, 6, 'ai-data', 'Buducnost AI: Co nas caka?', 'Eva Polakova', 'AI Slovakia', 'Trendy a predpovede vo svete umelej inteligencie.', 60);

-- SoftDev&CyberSecurity Stage (sessions 8-14)
INSERT INTO sessions (id, slot_index, stage_id, title, speaker_name, speaker_company, description, capacity) VALUES
(8, 0, 'softdev-cyber', 'Modern React: Hooks a Server Components', 'Adam Zilinec', 'Vercel', 'Najnovsie funkcie Reactu a best practices pre 2026.', 60),
(9, 1, 'softdev-cyber', 'Kyberneticka bezpecnost 101', 'Robert Mako', 'ESET', 'Zaklady kybernetickej bezpecnosti pre kazdeho vyvojara.', 70),
(10, 2, 'softdev-cyber', 'DevOps a CI/CD pipelines', 'Marek Hudak', 'GitLab', 'Automatizacia deploymentu a kontinualna integracia.', 50),
(11, 3, 'softdev-cyber', 'Ethical Hacking Workshop', 'Daniela Kovacova', 'HackTrophy', 'Prakticke cvicenia z penetracneho testovania.', 40),
(12, 4, 'softdev-cyber', 'TypeScript advanced patterns', 'Jakub Bendzala', 'Stripe', 'Pokrocile techniky v TypeScripte pre enterprise aplikacie.', 60),
(13, 5, 'softdev-cyber', 'Cloud Security na AWS', 'Petra Havrankova', 'Amazon AWS', 'Bezpecnostne best practices pre cloud infrastrukturu.', 60),
(14, 6, 'softdev-cyber', 'Kariera v IT: Q&A panel', 'Panel hostov', 'Rozne spolocnosti', 'Otazky a odpovede s uspesnymi IT profesionalmi.', 100);

-- ATTENDEES TABLE
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    attendee_type VARCHAR(50) NOT NULL,
    school_or_company VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendees_email ON attendees(email);
CREATE INDEX idx_attendees_created_at ON attendees(created_at);

-- ATTENDEE_SESSIONS TABLE
CREATE TABLE attendee_sessions (
    attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    is_registered BOOLEAN NOT NULL DEFAULT false,
    registered_at TIMESTAMPTZ,
    PRIMARY KEY (attendee_id, session_id)
);

CREATE INDEX idx_attendee_sessions_session ON attendee_sessions(session_id, is_registered);

-- ROW LEVEL SECURITY
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendee_sessions ENABLE ROW LEVEL SECURITY;

-- Policies - everyone can read stages and sessions
CREATE POLICY "Stages readable by all" ON stages FOR SELECT USING (true);
CREATE POLICY "Sessions readable by all" ON sessions FOR SELECT USING (true);

-- Service role can do everything
CREATE POLICY "Service role full access stages" ON stages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access sessions" ON sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access attendees" ON attendees FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access attendee_sessions" ON attendee_sessions FOR ALL USING (auth.role() = 'service_role');

-- DONE
