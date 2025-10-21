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
INSERT INTO projects (id, title, description, owner_id, status, course_code, submission_date, interq_score, created_at, updated_at) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'Urban Heat Islands Study',
    'A comprehensive study on urban heat islands and their environmental impact.',
    '550e8400-e29b-41d4-a716-446655440001', -- Calvin Klein
    'Submitted',
    'MSL 902',
    '2025-09-12 10:00:00+00',
    '—',
    now() - interval '2 months',
    now() - interval '1 month'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'Renewable Microgrids Pilot',
    'Pilot project for implementing renewable energy microgrids in urban areas.',
    '550e8400-e29b-41d4-a716-446655440005', -- Tommy Hilfiger
    'Completed',
    'EEE 311',
    '2025-03-18 10:00:00+00',
    '—',
    now() - interval '6 months',
    now() - interval '5 months'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'AI Ethics in Clinics',
    'Exploring ethical considerations of AI implementation in clinical settings.',
    '550e8400-e29b-41d4-a716-446655440007', -- Jane Smith
    'Submitted',
    'HSS 210',
    '2025-06-01 10:00:00+00',
    '—',
    now() - interval '4 months',
    now() - interval '3 months'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440004',
    'Coastal Erosion Mitigation',
    'Research project on innovative methods to mitigate coastal erosion.',
    '550e8400-e29b-41d4-a716-446655440008', -- David Chen
    'Draft',
    'CEE 450',
    '2025-08-10 10:00:00+00',
    '—',
    now() - interval '1 month',
    now() - interval '1 week'
  )
ON CONFLICT (id) DO NOTHING;

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
  )
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Seed data inserted successfully!' AS message,
       (SELECT COUNT(*) FROM users) AS users_count,
       (SELECT COUNT(*) FROM projects) AS projects_count,
       (SELECT COUNT(*) FROM project_members) AS project_members_count,
       (SELECT COUNT(*) FROM courses) AS courses_count;