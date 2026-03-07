-- ============================================
-- nConnect26 - Vzorové registrácie pre testovanie analytiky
-- Spusti tento SQL v Supabase SQL Editore
-- ============================================

-- 1. Vloženie vzorových účastníkov
INSERT INTO attendees (id, email, name, company, created_at) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'martin.novak@gmail.com', 'Martin Novák', 'ESET', NOW() - INTERVAL '6 days 14 hours'),
  ('a0000001-0000-0000-0000-000000000002', 'jana.kovacova@gmail.com', 'Jana Kováčová', 'Slovenská sporiteľňa', NOW() - INTERVAL '6 days 10 hours'),
  ('a0000001-0000-0000-0000-000000000003', 'peter.horvath@gmail.com', 'Peter Horváth', 'Tatra banka', NOW() - INTERVAL '6 days 8 hours'),
  ('a0000001-0000-0000-0000-000000000004', 'lucia.kral@gmail.com', 'Lucia Kráľová', 'Pixel Federation', NOW() - INTERVAL '5 days 16 hours'),
  ('a0000001-0000-0000-0000-000000000005', 'tomas.varga@gmail.com', 'Tomáš Varga', 'Accenture', NOW() - INTERVAL '5 days 12 hours'),
  ('a0000001-0000-0000-0000-000000000006', 'zuzana.balaz@gmail.com', 'Zuzana Balážová', 'IBM Slovakia', NOW() - INTERVAL '5 days 6 hours'),
  ('a0000001-0000-0000-0000-000000000007', 'michal.molnar@gmail.com', 'Michal Molnár', 'Deutsche Telekom IT', NOW() - INTERVAL '4 days 20 hours'),
  ('a0000001-0000-0000-0000-000000000008', 'katarina.fekete@gmail.com', 'Katarína Feketeová', 'Sygic', NOW() - INTERVAL '4 days 15 hours'),
  ('a0000001-0000-0000-0000-000000000009', 'andrej.benes@gmail.com', 'Andrej Beneš', 'GlobalLogic', NOW() - INTERVAL '4 days 9 hours'),
  ('a0000001-0000-0000-0000-000000000010', 'eva.tomasova@gmail.com', 'Eva Tomášová', 'Swiss Re', NOW() - INTERVAL '4 days 3 hours'),
  ('a0000001-0000-0000-0000-000000000011', 'daniel.szabo@gmail.com', 'Daniel Szabó', 'Siemens', NOW() - INTERVAL '3 days 22 hours'),
  ('a0000001-0000-0000-0000-000000000012', 'monika.lukac@gmail.com', 'Monika Lukáčová', 'PosAm', NOW() - INTERVAL '3 days 18 hours'),
  ('a0000001-0000-0000-0000-000000000013', 'roman.cernak@gmail.com', 'Roman Černák', NULL, NOW() - INTERVAL '3 days 12 hours'),
  ('a0000001-0000-0000-0000-000000000014', 'barbora.polak@gmail.com', 'Barbora Poláková', 'Websupport', NOW() - INTERVAL '3 days 6 hours'),
  ('a0000001-0000-0000-0000-000000000015', 'jakub.nemec@gmail.com', 'Jakub Nemec', 'ESET', NOW() - INTERVAL '2 days 22 hours'),
  ('a0000001-0000-0000-0000-000000000016', 'nikola.hajek@gmail.com', 'Nikola Hájková', 'Softec', NOW() - INTERVAL '2 days 16 hours'),
  ('a0000001-0000-0000-0000-000000000017', 'filip.ruzicka@gmail.com', 'Filip Ružička', 'Asseco', NOW() - INTERVAL '2 days 10 hours'),
  ('a0000001-0000-0000-0000-000000000018', 'simona.dudas@gmail.com', 'Simona Dudášová', 'Innovatrics', NOW() - INTERVAL '2 days 5 hours'),
  ('a0000001-0000-0000-0000-000000000019', 'patrik.stanek@gmail.com', 'Patrik Staněk', 'Kistler', NOW() - INTERVAL '1 day 20 hours'),
  ('a0000001-0000-0000-0000-000000000020', 'veronika.urban@gmail.com', 'Veronika Urbanová', 'Ness KDC', NOW() - INTERVAL '1 day 14 hours'),
  ('a0000001-0000-0000-0000-000000000021', 'marek.olah@gmail.com', 'Marek Oláh', NULL, NOW() - INTERVAL '1 day 8 hours'),
  ('a0000001-0000-0000-0000-000000000022', 'ivana.mazur@gmail.com', 'Ivana Mazúrová', 'Erste Digital', NOW() - INTERVAL '1 day 3 hours'),
  ('a0000001-0000-0000-0000-000000000023', 'samuel.gaspar@gmail.com', 'Samuel Gašpar', 'Vacuumlabs', NOW() - INTERVAL '18 hours'),
  ('a0000001-0000-0000-0000-000000000024', 'dominika.kiss@gmail.com', 'Dominika Kissová', 'Exponea', NOW() - INTERVAL '12 hours'),
  ('a0000001-0000-0000-0000-000000000025', 'adam.vincze@gmail.com', 'Adam Vincze', 'Slido', NOW() - INTERVAL '6 hours')
ON CONFLICT (email) DO NOTHING;

-- 2. Vloženie registrácií (náhodne rozhodené za posledný týždeň)
-- Každý účastník má 2-5 registrácií, bez časových konfliktov
-- Časové sloty: 09:00, 09:45, 10:30, 11:15, 13:00, 13:45, 14:30

-- Session IDs pre referenčnú tabuľku:
-- SLOT 09:00-09:45: 0b4ded96 (Dev: Java architektúry) | 3e14d201 (AI: AI od nápadu po produkciu)
-- SLOT 09:45-10:30: ba4951d3 (Dev: Empatia ako engine)  | d59a9b74 (AI: Dátový model)
-- SLOT 10:30-11:15: e2f099e5 (Dev: Protect network)     | cc85dd6c (AI: Budúcnosť práce)
-- SLOT 11:15-12:00: 299e30ea (Dev: Cloud v regulovanom)  | ce889984 (AI: Ako CTO premýšľa)
-- SLOT 13:00-13:45: 6f75948f (Dev: Anatómia kyberobrany) | 3aac380d (AI: AI valcuje trhy)
-- SLOT 13:45-14:30: a3f7fda5 (Dev: Reactive messaging)   | f75b439e (AI: Ako na AI)
-- SLOT 14:30-15:15: d5740e8f (Dev: Tisíce útokov)       | c4e1940f (AI: tbd Brezovský)

INSERT INTO registrations (attendee_id, session_id, registered_at) VALUES
  -- Martin Novák (5 sessions) - registroval sa pred 6 dňami
  ('a0000001-0000-0000-0000-000000000001', '0b4ded96-b1e5-4f8e-b0ff-496b947bea98', NOW() - INTERVAL '6 days 13 hours'),
  ('a0000001-0000-0000-0000-000000000001', 'd59a9b74-77fe-4c7f-b4de-738e6cb9f671', NOW() - INTERVAL '6 days 13 hours 5 minutes'),
  ('a0000001-0000-0000-0000-000000000001', 'cc85dd6c-a960-4a6c-88cf-cba0708c7d80', NOW() - INTERVAL '6 days 12 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000001', '6f75948f-8dcc-492a-81e7-c62f5e97ff54', NOW() - INTERVAL '6 days 12 hours 40 minutes'),
  ('a0000001-0000-0000-0000-000000000001', 'f75b439e-3e5b-473b-b20c-1fb790a6c2f3', NOW() - INTERVAL '6 days 12 hours'),

  -- Jana Kováčová (4 sessions) - pred 6 dňami
  ('a0000001-0000-0000-0000-000000000002', '3e14d201-af20-428e-a810-ce77ee21509d', NOW() - INTERVAL '6 days 9 hours'),
  ('a0000001-0000-0000-0000-000000000002', 'ba4951d3-e9ac-4b19-b5b0-97044f91e621', NOW() - INTERVAL '6 days 9 hours 3 minutes'),
  ('a0000001-0000-0000-0000-000000000002', 'ce889984-cdcb-4af1-a94a-128f69e1da6c', NOW() - INTERVAL '6 days 8 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000002', '3aac380d-4544-4921-8077-698644e2c819', NOW() - INTERVAL '6 days 8 hours 45 minutes'),

  -- Peter Horváth (3 sessions) - pred 6 dňami
  ('a0000001-0000-0000-0000-000000000003', '0b4ded96-b1e5-4f8e-b0ff-496b947bea98', NOW() - INTERVAL '6 days 7 hours'),
  ('a0000001-0000-0000-0000-000000000003', 'e2f099e5-ed8d-4660-9c06-98bec40a6a47', NOW() - INTERVAL '6 days 7 hours 2 minutes'),
  ('a0000001-0000-0000-0000-000000000003', 'a3f7fda5-51fe-4dd5-b251-302210c27bbd', NOW() - INTERVAL '6 days 6 hours 50 minutes'),

  -- Lucia Kráľová (4 sessions) - pred 5 dňami
  ('a0000001-0000-0000-0000-000000000004', '3e14d201-af20-428e-a810-ce77ee21509d', NOW() - INTERVAL '5 days 15 hours'),
  ('a0000001-0000-0000-0000-000000000004', 'd59a9b74-77fe-4c7f-b4de-738e6cb9f671', NOW() - INTERVAL '5 days 15 hours 4 minutes'),
  ('a0000001-0000-0000-0000-000000000004', 'e2f099e5-ed8d-4660-9c06-98bec40a6a47', NOW() - INTERVAL '5 days 14 hours 55 minutes'),
  ('a0000001-0000-0000-0000-000000000004', '6f75948f-8dcc-492a-81e7-c62f5e97ff54', NOW() - INTERVAL '5 days 14 hours 45 minutes'),

  -- Tomáš Varga (5 sessions) - pred 5 dňami
  ('a0000001-0000-0000-0000-000000000005', '0b4ded96-b1e5-4f8e-b0ff-496b947bea98', NOW() - INTERVAL '5 days 11 hours'),
  ('a0000001-0000-0000-0000-000000000005', 'ba4951d3-e9ac-4b19-b5b0-97044f91e621', NOW() - INTERVAL '5 days 11 hours 3 minutes'),
  ('a0000001-0000-0000-0000-000000000005', 'cc85dd6c-a960-4a6c-88cf-cba0708c7d80', NOW() - INTERVAL '5 days 10 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000005', '299e30ea-2946-457b-ba29-87095e613308', NOW() - INTERVAL '5 days 10 hours 40 minutes'),
  ('a0000001-0000-0000-0000-000000000005', 'd5740e8f-aaee-4a36-ae95-a7c1a78feca7', NOW() - INTERVAL '5 days 10 hours 30 minutes'),

  -- Zuzana Balážová (3 sessions) - pred 5 dňami
  ('a0000001-0000-0000-0000-000000000006', '3e14d201-af20-428e-a810-ce77ee21509d', NOW() - INTERVAL '5 days 5 hours'),
  ('a0000001-0000-0000-0000-000000000006', 'cc85dd6c-a960-4a6c-88cf-cba0708c7d80', NOW() - INTERVAL '5 days 5 hours 2 minutes'),
  ('a0000001-0000-0000-0000-000000000006', 'c4e1940f-d715-4376-b378-678b8998a69c', NOW() - INTERVAL '5 days 4 hours 50 minutes'),

  -- Michal Molnár (4 sessions) - pred 4 dňami
  ('a0000001-0000-0000-0000-000000000007', '0b4ded96-b1e5-4f8e-b0ff-496b947bea98', NOW() - INTERVAL '4 days 19 hours'),
  ('a0000001-0000-0000-0000-000000000007', 'd59a9b74-77fe-4c7f-b4de-738e6cb9f671', NOW() - INTERVAL '4 days 19 hours 5 minutes'),
  ('a0000001-0000-0000-0000-000000000007', 'ce889984-cdcb-4af1-a94a-128f69e1da6c', NOW() - INTERVAL '4 days 18 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000007', '3aac380d-4544-4921-8077-698644e2c819', NOW() - INTERVAL '4 days 18 hours 40 minutes'),

  -- Katarína Feketeová (3 sessions) - pred 4 dňami
  ('a0000001-0000-0000-0000-000000000008', 'ba4951d3-e9ac-4b19-b5b0-97044f91e621', NOW() - INTERVAL '4 days 14 hours'),
  ('a0000001-0000-0000-0000-000000000008', 'e2f099e5-ed8d-4660-9c06-98bec40a6a47', NOW() - INTERVAL '4 days 14 hours 3 minutes'),
  ('a0000001-0000-0000-0000-000000000008', 'f75b439e-3e5b-473b-b20c-1fb790a6c2f3', NOW() - INTERVAL '4 days 13 hours 50 minutes'),

  -- Andrej Beneš (5 sessions) - pred 4 dňami
  ('a0000001-0000-0000-0000-000000000009', '3e14d201-af20-428e-a810-ce77ee21509d', NOW() - INTERVAL '4 days 8 hours'),
  ('a0000001-0000-0000-0000-000000000009', 'ba4951d3-e9ac-4b19-b5b0-97044f91e621', NOW() - INTERVAL '4 days 8 hours 5 minutes'),
  ('a0000001-0000-0000-0000-000000000009', 'cc85dd6c-a960-4a6c-88cf-cba0708c7d80', NOW() - INTERVAL '4 days 7 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000009', '6f75948f-8dcc-492a-81e7-c62f5e97ff54', NOW() - INTERVAL '4 days 7 hours 40 minutes'),
  ('a0000001-0000-0000-0000-000000000009', 'd5740e8f-aaee-4a36-ae95-a7c1a78feca7', NOW() - INTERVAL '4 days 7 hours 30 minutes'),

  -- Eva Tomášová (3 sessions) - pred 4 dňami
  ('a0000001-0000-0000-0000-000000000010', '0b4ded96-b1e5-4f8e-b0ff-496b947bea98', NOW() - INTERVAL '4 days 2 hours'),
  ('a0000001-0000-0000-0000-000000000010', 'ce889984-cdcb-4af1-a94a-128f69e1da6c', NOW() - INTERVAL '4 days 2 hours 3 minutes'),
  ('a0000001-0000-0000-0000-000000000010', 'a3f7fda5-51fe-4dd5-b251-302210c27bbd', NOW() - INTERVAL '4 days 1 hour 50 minutes'),

  -- Daniel Szabó (4 sessions) - pred 3 dňami
  ('a0000001-0000-0000-0000-000000000011', '3e14d201-af20-428e-a810-ce77ee21509d', NOW() - INTERVAL '3 days 21 hours'),
  ('a0000001-0000-0000-0000-000000000011', 'd59a9b74-77fe-4c7f-b4de-738e6cb9f671', NOW() - INTERVAL '3 days 21 hours 4 minutes'),
  ('a0000001-0000-0000-0000-000000000011', '299e30ea-2946-457b-ba29-87095e613308', NOW() - INTERVAL '3 days 20 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000011', 'f75b439e-3e5b-473b-b20c-1fb790a6c2f3', NOW() - INTERVAL '3 days 20 hours 40 minutes'),

  -- Monika Lukáčová (3 sessions) - pred 3 dňami
  ('a0000001-0000-0000-0000-000000000012', '0b4ded96-b1e5-4f8e-b0ff-496b947bea98', NOW() - INTERVAL '3 days 17 hours'),
  ('a0000001-0000-0000-0000-000000000012', 'e2f099e5-ed8d-4660-9c06-98bec40a6a47', NOW() - INTERVAL '3 days 17 hours 2 minutes'),
  ('a0000001-0000-0000-0000-000000000012', '3aac380d-4544-4921-8077-698644e2c819', NOW() - INTERVAL '3 days 16 hours 50 minutes'),

  -- Roman Černák (4 sessions) - pred 3 dňami
  ('a0000001-0000-0000-0000-000000000013', 'ba4951d3-e9ac-4b19-b5b0-97044f91e621', NOW() - INTERVAL '3 days 11 hours'),
  ('a0000001-0000-0000-0000-000000000013', 'cc85dd6c-a960-4a6c-88cf-cba0708c7d80', NOW() - INTERVAL '3 days 11 hours 4 minutes'),
  ('a0000001-0000-0000-0000-000000000013', 'ce889984-cdcb-4af1-a94a-128f69e1da6c', NOW() - INTERVAL '3 days 10 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000013', 'c4e1940f-d715-4376-b378-678b8998a69c', NOW() - INTERVAL '3 days 10 hours 40 minutes'),

  -- Barbora Poláková (3 sessions) - pred 3 dňami
  ('a0000001-0000-0000-0000-000000000014', '3e14d201-af20-428e-a810-ce77ee21509d', NOW() - INTERVAL '3 days 5 hours'),
  ('a0000001-0000-0000-0000-000000000014', 'e2f099e5-ed8d-4660-9c06-98bec40a6a47', NOW() - INTERVAL '3 days 5 hours 3 minutes'),
  ('a0000001-0000-0000-0000-000000000014', 'a3f7fda5-51fe-4dd5-b251-302210c27bbd', NOW() - INTERVAL '3 days 4 hours 50 minutes'),

  -- Jakub Nemec (5 sessions) - pred 2 dňami
  ('a0000001-0000-0000-0000-000000000015', '0b4ded96-b1e5-4f8e-b0ff-496b947bea98', NOW() - INTERVAL '2 days 21 hours'),
  ('a0000001-0000-0000-0000-000000000015', 'd59a9b74-77fe-4c7f-b4de-738e6cb9f671', NOW() - INTERVAL '2 days 21 hours 5 minutes'),
  ('a0000001-0000-0000-0000-000000000015', 'e2f099e5-ed8d-4660-9c06-98bec40a6a47', NOW() - INTERVAL '2 days 20 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000015', '3aac380d-4544-4921-8077-698644e2c819', NOW() - INTERVAL '2 days 20 hours 40 minutes'),
  ('a0000001-0000-0000-0000-000000000015', 'd5740e8f-aaee-4a36-ae95-a7c1a78feca7', NOW() - INTERVAL '2 days 20 hours 30 minutes'),

  -- Nikola Hájková (3 sessions) - pred 2 dňami
  ('a0000001-0000-0000-0000-000000000016', '3e14d201-af20-428e-a810-ce77ee21509d', NOW() - INTERVAL '2 days 15 hours'),
  ('a0000001-0000-0000-0000-000000000016', 'ba4951d3-e9ac-4b19-b5b0-97044f91e621', NOW() - INTERVAL '2 days 15 hours 3 minutes'),
  ('a0000001-0000-0000-0000-000000000016', '6f75948f-8dcc-492a-81e7-c62f5e97ff54', NOW() - INTERVAL '2 days 14 hours 50 minutes'),

  -- Filip Ružička (4 sessions) - pred 2 dňami
  ('a0000001-0000-0000-0000-000000000017', '0b4ded96-b1e5-4f8e-b0ff-496b947bea98', NOW() - INTERVAL '2 days 9 hours'),
  ('a0000001-0000-0000-0000-000000000017', 'cc85dd6c-a960-4a6c-88cf-cba0708c7d80', NOW() - INTERVAL '2 days 9 hours 4 minutes'),
  ('a0000001-0000-0000-0000-000000000017', '299e30ea-2946-457b-ba29-87095e613308', NOW() - INTERVAL '2 days 8 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000017', 'f75b439e-3e5b-473b-b20c-1fb790a6c2f3', NOW() - INTERVAL '2 days 8 hours 40 minutes'),

  -- Simona Dudášová (3 sessions) - pred 2 dňami
  ('a0000001-0000-0000-0000-000000000018', 'd59a9b74-77fe-4c7f-b4de-738e6cb9f671', NOW() - INTERVAL '2 days 4 hours'),
  ('a0000001-0000-0000-0000-000000000018', 'ce889984-cdcb-4af1-a94a-128f69e1da6c', NOW() - INTERVAL '2 days 4 hours 3 minutes'),
  ('a0000001-0000-0000-0000-000000000018', '3aac380d-4544-4921-8077-698644e2c819', NOW() - INTERVAL '2 days 3 hours 50 minutes'),

  -- Patrik Staněk (4 sessions) - pred 1 dňom
  ('a0000001-0000-0000-0000-000000000019', '3e14d201-af20-428e-a810-ce77ee21509d', NOW() - INTERVAL '1 day 19 hours'),
  ('a0000001-0000-0000-0000-000000000019', 'e2f099e5-ed8d-4660-9c06-98bec40a6a47', NOW() - INTERVAL '1 day 19 hours 4 minutes'),
  ('a0000001-0000-0000-0000-000000000019', '299e30ea-2946-457b-ba29-87095e613308', NOW() - INTERVAL '1 day 18 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000019', 'a3f7fda5-51fe-4dd5-b251-302210c27bbd', NOW() - INTERVAL '1 day 18 hours 40 minutes'),

  -- Veronika Urbanová (5 sessions) - pred 1 dňom
  ('a0000001-0000-0000-0000-000000000020', '0b4ded96-b1e5-4f8e-b0ff-496b947bea98', NOW() - INTERVAL '1 day 13 hours'),
  ('a0000001-0000-0000-0000-000000000020', 'ba4951d3-e9ac-4b19-b5b0-97044f91e621', NOW() - INTERVAL '1 day 13 hours 5 minutes'),
  ('a0000001-0000-0000-0000-000000000020', 'cc85dd6c-a960-4a6c-88cf-cba0708c7d80', NOW() - INTERVAL '1 day 12 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000020', '6f75948f-8dcc-492a-81e7-c62f5e97ff54', NOW() - INTERVAL '1 day 12 hours 40 minutes'),
  ('a0000001-0000-0000-0000-000000000020', 'c4e1940f-d715-4376-b378-678b8998a69c', NOW() - INTERVAL '1 day 12 hours 30 minutes'),

  -- Marek Oláh (3 sessions) - pred 1 dňom
  ('a0000001-0000-0000-0000-000000000021', '3e14d201-af20-428e-a810-ce77ee21509d', NOW() - INTERVAL '1 day 7 hours'),
  ('a0000001-0000-0000-0000-000000000021', 'd59a9b74-77fe-4c7f-b4de-738e6cb9f671', NOW() - INTERVAL '1 day 7 hours 3 minutes'),
  ('a0000001-0000-0000-0000-000000000021', 'f75b439e-3e5b-473b-b20c-1fb790a6c2f3', NOW() - INTERVAL '1 day 6 hours 50 minutes'),

  -- Ivana Mazúrová (4 sessions) - pred 1 dňom
  ('a0000001-0000-0000-0000-000000000022', '0b4ded96-b1e5-4f8e-b0ff-496b947bea98', NOW() - INTERVAL '1 day 2 hours'),
  ('a0000001-0000-0000-0000-000000000022', 'ba4951d3-e9ac-4b19-b5b0-97044f91e621', NOW() - INTERVAL '1 day 2 hours 4 minutes'),
  ('a0000001-0000-0000-0000-000000000022', 'ce889984-cdcb-4af1-a94a-128f69e1da6c', NOW() - INTERVAL '1 day 1 hour 50 minutes'),
  ('a0000001-0000-0000-0000-000000000022', '3aac380d-4544-4921-8077-698644e2c819', NOW() - INTERVAL '1 day 1 hour 40 minutes'),

  -- Samuel Gašpar (3 sessions) - pred 18 hodinami
  ('a0000001-0000-0000-0000-000000000023', 'd59a9b74-77fe-4c7f-b4de-738e6cb9f671', NOW() - INTERVAL '17 hours'),
  ('a0000001-0000-0000-0000-000000000023', 'e2f099e5-ed8d-4660-9c06-98bec40a6a47', NOW() - INTERVAL '17 hours 3 minutes'),
  ('a0000001-0000-0000-0000-000000000023', 'd5740e8f-aaee-4a36-ae95-a7c1a78feca7', NOW() - INTERVAL '16 hours 50 minutes'),

  -- Dominika Kissová (4 sessions) - pred 12 hodinami
  ('a0000001-0000-0000-0000-000000000024', '3e14d201-af20-428e-a810-ce77ee21509d', NOW() - INTERVAL '11 hours'),
  ('a0000001-0000-0000-0000-000000000024', 'cc85dd6c-a960-4a6c-88cf-cba0708c7d80', NOW() - INTERVAL '11 hours 4 minutes'),
  ('a0000001-0000-0000-0000-000000000024', '6f75948f-8dcc-492a-81e7-c62f5e97ff54', NOW() - INTERVAL '10 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000024', 'a3f7fda5-51fe-4dd5-b251-302210c27bbd', NOW() - INTERVAL '10 hours 40 minutes'),

  -- Adam Vincze (5 sessions) - pred 6 hodinami
  ('a0000001-0000-0000-0000-000000000025', '0b4ded96-b1e5-4f8e-b0ff-496b947bea98', NOW() - INTERVAL '5 hours'),
  ('a0000001-0000-0000-0000-000000000025', 'ba4951d3-e9ac-4b19-b5b0-97044f91e621', NOW() - INTERVAL '5 hours 5 minutes'),
  ('a0000001-0000-0000-0000-000000000025', '299e30ea-2946-457b-ba29-87095e613308', NOW() - INTERVAL '4 hours 50 minutes'),
  ('a0000001-0000-0000-0000-000000000025', '3aac380d-4544-4921-8077-698644e2c819', NOW() - INTERVAL '4 hours 40 minutes'),
  ('a0000001-0000-0000-0000-000000000025', 'd5740e8f-aaee-4a36-ae95-a7c1a78feca7', NOW() - INTERVAL '4 hours 30 minutes')
ON CONFLICT (attendee_id, session_id) DO NOTHING;

-- 3. Aktualizácia registered_count na sessions podľa skutočného počtu registrácií
UPDATE sessions SET registered_count = (
  SELECT COUNT(*) FROM registrations WHERE registrations.session_id = sessions.id
);

-- Hotovo! Overenie:
SELECT
  'Účastníci' as typ, COUNT(*) as pocet FROM attendees
UNION ALL
SELECT
  'Registrácie' as typ, COUNT(*) as pocet FROM registrations
UNION ALL
SELECT
  'Prednášky' as typ, COUNT(*) as pocet FROM sessions;
