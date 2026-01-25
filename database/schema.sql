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
(1, 0, 'ai-data', 'TBA', 'TBA', NULL, NULL, 60),
(2, 1, 'ai-data', 'TBA', 'TBA', NULL, NULL, 60),
(3, 2, 'ai-data', 'TBA', 'TBA', NULL, NULL, 60),
(4, 3, 'ai-data', 'TBA', 'TBA', NULL, NULL, 60),
(5, 4, 'ai-data', 'TBA', 'TBA', NULL, NULL, 60),
(6, 5, 'ai-data', 'TBA', 'TBA', NULL, NULL, 60),
(7, 6, 'ai-data', 'TBA', 'TBA', NULL, NULL, 60);

-- SoftDev&CyberSecurity Stage (sessions 8-14)
INSERT INTO sessions (id, slot_index, stage_id, title, speaker_name, speaker_company, description, capacity) VALUES
(8, 0, 'softdev-cyber', 'TBA', 'TBA', NULL, NULL, 60),
(9, 1, 'softdev-cyber', 'TBA', 'TBA', NULL, NULL, 60),
(10, 2, 'softdev-cyber', 'TBA', 'TBA', NULL, NULL, 60),
(11, 3, 'softdev-cyber', 'TBA', 'TBA', NULL, NULL, 60),
(12, 4, 'softdev-cyber', 'TBA', 'TBA', NULL, NULL, 60),
(13, 5, 'softdev-cyber', 'TBA', 'TBA', NULL, NULL, 60),
(14, 6, 'softdev-cyber', 'TBA', 'TBA', NULL, NULL, 60);

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
