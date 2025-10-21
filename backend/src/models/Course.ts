export interface Course {
  id: string;
  code: string;
  title: string;
  description?: string;
  instructor_id?: string;
  term?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  status: "active" | "completed" | "dropped";
  enrolled_at: Date;
  completed_at?: Date;
}

export interface CourseWithInstructor extends Course {
  instructor_name?: string;
  instructor_email?: string;
  enrolled?: boolean;
  enrollment_count?: number;
}

export interface CreateCourseInput {
  code: string;
  title: string;
  description?: string;
  instructor_id?: string;
  term?: string;
}

export interface UpdateCourseInput {
  code?: string;
  title?: string;
  description?: string;
  instructor_id?: string;
  term?: string;
}
