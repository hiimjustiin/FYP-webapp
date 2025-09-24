-- Insert default admin user
INSERT INTO users (email, password_hash, display_name, role, is_active) 
VALUES (
  'admin@ila.com', 
  '$2a$12$c6BZps2r6NfHn5O.fBFNWOtXbEQWvN19Em1eTbK9Gm9xTvClqSjTK',
  'ILA Administrator', 
  'admin', 
  true
);

-- Insert sample instructor
INSERT INTO users (email, password_hash, display_name, role, is_active) 
VALUES (
  'instructor@ila.com', 
  '$2a$12$6lbdBnWkIJyzktwDnbhxgukhIU/Uf8ZxMAjblDOIehJy2ZkfSYO8W', -- password: instructor123
  'Dr. Jane Smith', 
  'instructor', 
  true
);

-- Insert sample students
INSERT INTO users (email, password_hash, display_name, role, is_active) 
VALUES 
  (
    'student1@ila.com', 
    '$2a$12$z/dyPqj7UT.BGs5h39nhVe0qeUEL2EjTMBi.pZje.b8TyzihY8sVS', -- password: student123
    'Alice Johnson', 
    'student', 
    true
  ),
  (
    'student2@ila.com', 
    '$2a$12$z/dyPqj7UT.BGs5h39nhVe0qeUEL2EjTMBi.pZje.b8TyzihY8sVS', -- password: student123
    'Bob Wilson', 
    'student', 
    true
  ),
  (
    'student3@ila.com', 
    '$2a$12$z/dyPqj7UT.BGs5h39nhVe0qeUEL2EjTMBi.pZje.b8TyzihY8sVS', -- password: student123
    'Carol Davis', 
    'student', 
    true
  );

-- Insert default tags
INSERT INTO tags (name, description) VALUES
  ('interdisciplinary', 'Content that bridges multiple academic disciplines'),
  ('argumentation', 'Essays that focus on building and presenting arguments'),
  ('evidence', 'Content that emphasizes the use of evidence and data'),
  ('synthesis', 'Work that combines ideas from multiple sources'),
  ('critical-thinking', 'Essays that demonstrate critical analysis'),
  ('research', 'Research-based academic writing'),
  ('collaboration', 'Work that involves collaborative elements'),
  ('innovation', 'Content that presents innovative ideas or approaches');

-- Insert sample course
INSERT INTO courses (code, title, description, instructor_id, term)
SELECT 
  'ILA101', 
  'Introduction to Interdisciplinary Learning Analytics', 
  'A foundational course exploring the intersection of data analytics and interdisciplinary education.',
  id,
  'Fall 2025'
FROM users WHERE email = 'instructor@ila.com';

-- Insert sample assignment
INSERT INTO assignments (course_id, title, description, due_date, max_score)
SELECT 
  id,
  'Interdisciplinary Essay Analysis',
  'Write a 1000-word essay analyzing a topic from multiple disciplinary perspectives.',
  NOW() + INTERVAL '14 days',
  100.00
FROM courses WHERE code = 'ILA101';

-- Insert sample project
INSERT INTO projects (title, description, owner_id, status, settings)
SELECT 
  'Sample Interdisciplinary Analysis Project',
  'A project focused on analyzing interdisciplinary content across multiple domains.',
  id,
  'active',
  '{"privacy": "public", "collaboration_enabled": true}'
FROM users WHERE email = 'instructor@ila.com';