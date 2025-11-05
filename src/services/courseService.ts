import { api } from "../lib/api";

export interface Course {
  id: string;
  code: string;
  title: string;
  description?: string;
  instructor_id?: string;
  term?: string;
  created_at: string;
  updated_at: string;
  instructor_name?: string;
  instructor_email?: string;
  enrolled?: boolean;
  enrollment_count?: number;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  status: "active" | "completed" | "dropped";
  enrolled_at: string;
  completed_at?: string;
}

interface CoursesResponse {
  courses: Course[];
}

interface EnrollmentResponse {
  enrollment: CourseEnrollment;
  message: string;
}

interface MessageResponse {
  message: string;
}

export const courseService = {
  async getCourses(): Promise<Course[]> {
    const data = await api.get<CoursesResponse>("/courses");
    return data.courses;
  },

  async getEnrolledCourses(): Promise<Course[]> {
    const data = await api.get<CoursesResponse>("/courses/enrolled");
    return data.courses;
  },

  async enrollCourse(courseId: string, passcode: string): Promise<EnrollmentResponse> {
    return api.post<EnrollmentResponse>(`/courses/${courseId}/enroll`, { passcode });
  },

  async unenrollCourse(courseId: string): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`/courses/${courseId}/enroll`);
  },
};
