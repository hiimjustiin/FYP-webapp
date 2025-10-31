-- Seed data for ILA application
-- This file contains sample data for development and testing

-- Insert default admin user
INSERT INTO users (email, password_hash, display_name, role, is_active, email_verified) 
VALUES (
  'admin@ila.com', 
  '$2a$12$94gjX8GQalEpi6iXsdEr0eeIdWFguPNgVufSOM9gthyAL4inaQP.G',
  'ILA Administrator', 
  'admin', 
  true,
  now()
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample instructor
INSERT INTO users (email, password_hash, display_name, role, is_active, email_verified) 
VALUES (
  'instructor@ila.com', 
  '$2a$12$6lbdBnWkIJyzktwDnbhxgukhIU/Uf8ZxMAjblDOIehJy2ZkfSYO8W',
  'Dr. Jane Smith', 
  'instructor', 
  true,
  now()
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample students (with correct bcrypt hash for 'password123')
INSERT INTO users (id, email, password_hash, display_name, role, is_active, email_verified) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'calvin.klein@example.com', '$2a$12$94gjX8GQalEpi6iXsdEr0eeIdWFguPNgVufSOM9gthyAL4inaQP.G', 'Calvin Klein', 'student', true, now()),
  ('550e8400-e29b-41d4-a716-446655440002', 'mark.jacobs@example.com', '$2a$12$94gjX8GQalEpi6iXsdEr0eeIdWFguPNgVufSOM9gthyAL4inaQP.G', 'Mark Jacobs', 'student', true, now()),
  ('550e8400-e29b-41d4-a716-446655440003', 'kate.spade@example.com', '$2a$12$94gjX8GQalEpi6iXsdEr0eeIdWFguPNgVufSOM9gthyAL4inaQP.G', 'Kate Spade', 'student', true, now()),
  ('550e8400-e29b-41d4-a716-446655440004', 'giorgio.armani@example.com', '$2a$12$94gjX8GQalEpi6iXsdEr0eeIdWFguPNgVufSOM9gthyAL4inaQP.G', 'Giorgio Armani', 'student', true, now()),
  ('550e8400-e29b-41d4-a716-446655440005', 'tommy.hilfiger@example.com', '$2a$12$94gjX8GQalEpi6iXsdEr0eeIdWFguPNgVufSOM9gthyAL4inaQP.G', 'Tommy Hilfiger', 'student', true, now()),
  ('550e8400-e29b-41d4-a716-446655440006', 'yves.saintlaurent@example.com', '$2a$12$94gjX8GQalEpi6iXsdEr0eeIdWFguPNgVufSOM9gthyAL4inaQP.G', 'Yves Saint Laurent', 'student', true, now()),
  ('550e8400-e29b-41d4-a716-446655440007', 'jane.smith@example.com', '$2a$12$94gjX8GQalEpi6iXsdEr0eeIdWFguPNgVufSOM9gthyAL4inaQP.G', 'Jane Smith', 'student', true, now()),
  ('550e8400-e29b-41d4-a716-446655440008', 'david.chen@example.com', '$2a$12$94gjX8GQalEpi6iXsdEr0eeIdWFguPNgVufSOM9gthyAL4inaQP.G', 'David Chen', 'student', true, now())
ON CONFLICT (email) DO NOTHING;

-- Insert sample projects (matching the mock data from ProjectLanding)
-- Note: course_code, submission_date, and interq_score are added by migration 1760671987000_enhance-projects-for-ui.js
INSERT INTO projects (id, title, description, owner_id, status, created_at, updated_at) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'Urban Heat Islands Study',
    'A comprehensive study on urban heat islands and their environmental impact.',
    '550e8400-e29b-41d4-a716-446655440001', -- Calvin Klein
    'active',
    now() - interval '2 months',
    now() - interval '1 month'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'Renewable Microgrids Pilot',
    'Pilot project for implementing renewable energy microgrids in urban areas.',
    '550e8400-e29b-41d4-a716-446655440005', -- Tommy Hilfiger
    'active',
    now() - interval '6 months',
    now() - interval '5 months'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'AI Ethics in Clinics',
    'Exploring ethical considerations of AI implementation in clinical settings.',
    '550e8400-e29b-41d4-a716-446655440007', -- Jane Smith
    'active',
    now() - interval '4 months',
    now() - interval '3 months'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440004',
    'Coastal Erosion Mitigation',
    'Research project on innovative methods to mitigate coastal erosion.',
    '550e8400-e29b-41d4-a716-446655440008', -- David Chen
    'active',
    now() - interval '1 month',
    now() - interval '1 week'
  )
ON CONFLICT (id) DO NOTHING;

-- Update projects with UI-specific data (after migration adds columns)
-- This UPDATE will work after migration 1760671987000 runs
UPDATE projects SET 
  course_code = 'MSL 902',
  submission_date = '2025-09-12 10:00:00+00',
  interq_score = '—',
  status = 'Submitted'
WHERE id = '660e8400-e29b-41d4-a716-446655440001';

UPDATE projects SET 
  course_code = 'EEE 311',
  submission_date = '2025-03-18 10:00:00+00',
  interq_score = '—',
  status = 'Completed'
WHERE id = '660e8400-e29b-41d4-a716-446655440002';

UPDATE projects SET 
  course_code = 'HSS 210',
  submission_date = '2025-06-01 10:00:00+00',
  interq_score = '—',
  status = 'Submitted'
WHERE id = '660e8400-e29b-41d4-a716-446655440003';

UPDATE projects SET 
  course_code = 'CEE 450',
  submission_date = '2025-08-10 10:00:00+00',
  interq_score = '—',
  status = 'Draft'
WHERE id = '660e8400-e29b-41d4-a716-446655440004';

-- Insert project members (team collaborations)
INSERT INTO project_members (project_id, user_id, role) VALUES
  -- Urban Heat Islands Study team
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'owner'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'member'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'member'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'member'),
  
  -- Renewable Microgrids Pilot team
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'owner'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'member'),
  
  -- AI Ethics in Clinics (solo project)
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', 'owner'),
  
  -- Coastal Erosion Mitigation team
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008', 'owner'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'member')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Insert sample courses
INSERT INTO courses (id, code, title, description, instructor_id, term, created_at, updated_at) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440001',
    'PP 101',
    'Peak Performance',
    'Strategies and techniques for achieving optimal performance in academic and professional settings.',
    (SELECT id FROM users WHERE email = 'instructor@ila.com' LIMIT 1),
    'Fall 2025',
    now(),
    now()
  ),
  (
    '770e8400-e29b-41d4-a716-446655440002',
    'DB 201',
    'Digital Business: Technologies and Transformation',
    'Exploring digital transformation strategies, emerging technologies, and their impact on modern business practices.',
    (SELECT id FROM users WHERE email = 'instructor@ila.com' LIMIT 1),
    'Fall 2025',
    now(),
    now()
  ),
  (
    '770e8400-e29b-41d4-a716-446655440003',
    'AIH 301',
    'AI and Humanity',
    'Examining the intersection of artificial intelligence and human society, including ethical considerations and future implications.',
    (SELECT id FROM users WHERE email = 'instructor@ila.com' LIMIT 1),
    'Fall 2025',
    now(),
    now()
  ),
  (
    '770e8400-e29b-41d4-a716-446655440004',
    'SSE 401',
    'Sustainability: Society, Economy and Environment',
    'Comprehensive study of sustainability principles across social, economic, and environmental dimensions.',
    (SELECT id FROM users WHERE email = 'instructor@ila.com' LIMIT 1),
    'Fall 2025',
    now(),
    now()
  ),
  (
    '770e8400-e29b-41d4-a716-446655440005',
    'MSL 902',
    'Multidisciplinary Systems Leadership',
    'Advanced course on leading complex multidisciplinary systems and projects.',
    (SELECT id FROM users WHERE email = 'instructor@ila.com' LIMIT 1),
    'Fall 2025',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample project submissions (based on Home.tsx mock data)
-- Urban Heat Islands Study - Draft 1
INSERT INTO project_submissions (id, project_id, course_id, user_id, name, submitted_at) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', (SELECT id FROM courses WHERE code = 'MSL 902' LIMIT 1), '550e8400-e29b-41d4-a716-446655440001', 'Draft 1', '2025-08-20 10:00:00+00'),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', (SELECT id FROM courses WHERE code = 'MSL 902' LIMIT 1), '550e8400-e29b-41d4-a716-446655440001', 'Draft 2', '2025-09-01 14:00:00+00'),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', (SELECT id FROM courses WHERE code = 'MSL 902' LIMIT 1), '550e8400-e29b-41d4-a716-446655440001', 'Final Submission', '2025-09-12 10:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- Insert dimension scores for Urban Heat Islands Study - Draft 1
INSERT INTO submission_dimension_scores (submission_id, dimension_id, personal_score) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 1, 5),
  ('770e8400-e29b-41d4-a716-446655440001', 2, 4),
  ('770e8400-e29b-41d4-a716-446655440001', 3, 3),
  ('770e8400-e29b-41d4-a716-446655440001', 4, 5),
  ('770e8400-e29b-41d4-a716-446655440001', 5, 4),
  ('770e8400-e29b-41d4-a716-446655440001', 6, 5),
  ('770e8400-e29b-41d4-a716-446655440001', 7, 4),
  ('770e8400-e29b-41d4-a716-446655440001', 8, 3),
  ('770e8400-e29b-41d4-a716-446655440001', 9, 4)
ON CONFLICT (submission_id, dimension_id) DO NOTHING;

-- Insert dimension scores for Urban Heat Islands Study - Draft 2
INSERT INTO submission_dimension_scores (submission_id, dimension_id, personal_score) VALUES
  ('770e8400-e29b-41d4-a716-446655440002', 1, 7),
  ('770e8400-e29b-41d4-a716-446655440002', 2, 6),
  ('770e8400-e29b-41d4-a716-446655440002', 3, 5),
  ('770e8400-e29b-41d4-a716-446655440002', 4, 7),
  ('770e8400-e29b-41d4-a716-446655440002', 5, 6),
  ('770e8400-e29b-41d4-a716-446655440002', 6, 6),
  ('770e8400-e29b-41d4-a716-446655440002', 7, 6),
  ('770e8400-e29b-41d4-a716-446655440002', 8, 5),
  ('770e8400-e29b-41d4-a716-446655440002', 9, 5)
ON CONFLICT (submission_id, dimension_id) DO NOTHING;

-- Insert dimension scores for Urban Heat Islands Study - Final Submission
INSERT INTO submission_dimension_scores (submission_id, dimension_id, personal_score) VALUES
  ('770e8400-e29b-41d4-a716-446655440003', 1, 9),
  ('770e8400-e29b-41d4-a716-446655440003', 2, 8),
  ('770e8400-e29b-41d4-a716-446655440003', 3, 7),
  ('770e8400-e29b-41d4-a716-446655440003', 4, 8),
  ('770e8400-e29b-41d4-a716-446655440003', 5, 8),
  ('770e8400-e29b-41d4-a716-446655440003', 6, 8),
  ('770e8400-e29b-41d4-a716-446655440003', 7, 7),
  ('770e8400-e29b-41d4-a716-446655440003', 8, 7),
  ('770e8400-e29b-41d4-a716-446655440003', 9, 6)
ON CONFLICT (submission_id, dimension_id) DO NOTHING;

-- Add more student submissions for class average calculation
-- Mark Jacobs submission for the same course
INSERT INTO project_submissions (id, project_id, course_id, user_id, name, submitted_at) VALUES
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Final Submission', '2025-09-12 11:00:00+00'),
  ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'Final Submission', '2025-09-12 12:00:00+00'),
  ('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'Final Submission', '2025-09-12 13:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- Scores for Mark Jacobs (slightly different to create averages)
INSERT INTO submission_dimension_scores (submission_id, dimension_id, personal_score) VALUES
  ('770e8400-e29b-41d4-a716-446655440004', 1, 6),
  ('770e8400-e29b-41d4-a716-446655440004', 2, 7),
  ('770e8400-e29b-41d4-a716-446655440004', 3, 5),
  ('770e8400-e29b-41d4-a716-446655440004', 4, 6),
  ('770e8400-e29b-41d4-a716-446655440004', 5, 6),
  ('770e8400-e29b-41d4-a716-446655440004', 6, 7),
  ('770e8400-e29b-41d4-a716-446655440004', 7, 6),
  ('770e8400-e29b-41d4-a716-446655440004', 8, 5),
  ('770e8400-e29b-41d4-a716-446655440004', 9, 5)
ON CONFLICT (submission_id, dimension_id) DO NOTHING;

-- Scores for Kate Spade
INSERT INTO submission_dimension_scores (submission_id, dimension_id, personal_score) VALUES
  ('770e8400-e29b-41d4-a716-446655440005', 1, 7),
  ('770e8400-e29b-41d4-a716-446655440005', 2, 8),
  ('770e8400-e29b-41d4-a716-446655440005', 3, 6),
  ('770e8400-e29b-41d4-a716-446655440005', 4, 7),
  ('770e8400-e29b-41d4-a716-446655440005', 5, 7),
  ('770e8400-e29b-41d4-a716-446655440005', 6, 6),
  ('770e8400-e29b-41d4-a716-446655440005', 7, 7),
  ('770e8400-e29b-41d4-a716-446655440005', 8, 6),
  ('770e8400-e29b-41d4-a716-446655440005', 9, 6)
ON CONFLICT (submission_id, dimension_id) DO NOTHING;

-- Scores for Giorgio Armani
INSERT INTO submission_dimension_scores (submission_id, dimension_id, personal_score) VALUES
  ('770e8400-e29b-41d4-a716-446655440006', 1, 5),
  ('770e8400-e29b-41d4-a716-446655440006', 2, 6),
  ('770e8400-e29b-41d4-a716-446655440006', 3, 4),
  ('770e8400-e29b-41d4-a716-446655440006', 4, 6),
  ('770e8400-e29b-41d4-a716-446655440006', 5, 5),
  ('770e8400-e29b-41d4-a716-446655440006', 6, 6),
  ('770e8400-e29b-41d4-a716-446655440006', 7, 5),
  ('770e8400-e29b-41d4-a716-446655440006', 8, 4),
  ('770e8400-e29b-41d4-a716-446655440006', 9, 5)
ON CONFLICT (submission_id, dimension_id) DO NOTHING;

-- Success message
SELECT 'Seed data inserted successfully!' AS message,
       (SELECT COUNT(*) FROM users) AS users_count,
       (SELECT COUNT(*) FROM projects) AS projects_count,
       (SELECT COUNT(*) FROM project_members) AS project_members_count,
       (SELECT COUNT(*) FROM courses) AS courses_count,
       (SELECT COUNT(*) FROM dimensions) AS dimensions_count,
       (SELECT COUNT(*) FROM project_submissions) AS submissions_count,
       (SELECT COUNT(*) FROM submission_dimension_scores) AS scores_count;