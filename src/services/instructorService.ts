import { api } from "../lib/api";

export interface InstructorCourse {
  id: string;
  code: string;
  title: string;
  description: string;
  term: string;
  passcode?: string;
  enrolled_count: number;
  submission_count: number;
  pending_count: number;
  dimension_ids?: number[];
}

export interface Dimension {
  id: number;
  label: string;
  short_label?: string;
  description?: string;
  color_hex: string;
  is_active: boolean;
}

export interface CreateCourseData {
  code: string;
  title: string;
  description?: string;
  term?: string;
  passcode?: string;
  dimension_ids?: number[];
}

export interface UpdateCourseData {
  code?: string;
  title?: string;
  description?: string;
  term?: string;
  passcode?: string;
  dimension_ids?: number[];
}

export interface CourseStudent {
  id: string;
  email: string;
  display_name: string;
  student_id: string;
  department: string;
  enrolled_at: string;
  submission_count: number;
  last_submission_at: string | null;
}

export interface CourseSubmission {
  id: string;
  name: string;
  submitted_at: string;
  status: "submitted" | "scoring" | "scored" | "reviewed";
  file_url: string;
  file_type: string;
  student_name: string;
  student_id: string;
  student_email: string;
  project_title: string;
  project_id: string;
  scores_count: number;
}

export interface DimensionScore {
  dimension_id: number;
  score: number;
  reasoning?: string;
  comments?: string;
}

export interface AIAnalysisResult {
  overall_feedback: string;
  dimension_scores: DimensionScore[];
  strengths: string[];
  areas_for_improvement: string[];
}

export interface InstructorSuggestion {
  suggestion_text: string;
  updated_at: string;
}

export interface SubmissionDetails {
  submission: {
    id: string;
    name: string;
    submitted_at: string;
    status: string;
    file_url: string;
    file_type: string;
    student_name: string;
    student_email: string;
    student_id: string;
    project_title: string;
    project_description: string;
    course_code: string;
    course_title: string;
    ai_overall_summary?: string | null;
    ai_overall_strengths?: string[] | null;
    ai_priority_improvements?: string[] | null;
    instructor_suggestion?: InstructorSuggestion | null;
  };
  scores: {
    dimension_id: number;
    dimension_label: string;
    score: number;
    reasoning?: string;
    ai_score_original?: number;
    instructor_override?: boolean;
    instructor_comments?: string;
  }[];
}

export interface RecentActivity {
  id: string;
  name: string;
  submitted_at: string;
  status: "submitted" | "scoring" | "scored" | "reviewed";
  student_name: string;
  student_id: string;
  project_title: string;
  course_code: string;
  course_title: string;
  course_id: string;
}

export interface AtRiskStudent {
  id: string;
  display_name: string;
  student_id: string;
  email: string;
  course_id: string;
  course_code: string;
  course_title: string;
  enrolled_at: string;
  submission_count: number;
  last_submission_at: string | null;
  days_since_last_submission: number | null;
}

export const instructorService = {
  async getCourses(): Promise<InstructorCourse[]> {
    const data = await api.get<{ courses: InstructorCourse[] }>(
      "/instructor/courses"
    );
    return data.courses;
  },

  async getDimensions(): Promise<Dimension[]> {
    const data = await api.get<{ dimensions: Dimension[] }>("/dimensions");
    return data.dimensions;
  },

  async createCourse(courseData: CreateCourseData): Promise<InstructorCourse> {
    const data = await api.post<{ course: InstructorCourse }>(
      "/instructor/courses",
      courseData
    );
    return data.course;
  },

  async updateCourse(
    courseId: string,
    courseData: UpdateCourseData
  ): Promise<InstructorCourse> {
    const data = await api.put<{ course: InstructorCourse }>(
      `/instructor/courses/${courseId}`,
      courseData
    );
    return data.course;
  },

  async deleteCourse(courseId: string): Promise<void> {
    await api.delete(`/instructor/courses/${courseId}`);
  },

  async getCourseStudents(courseId: string): Promise<CourseStudent[]> {
    const data = await api.get<{ students: CourseStudent[] }>(
      `/instructor/courses/${courseId}/students`
    );
    return data.students;
  },

  async getCourseSubmissions(courseId: string): Promise<CourseSubmission[]> {
    const data = await api.get<{ submissions: CourseSubmission[] }>(
      `/instructor/courses/${courseId}/submissions`
    );
    return data.submissions;
  },

  async getSubmissionDetails(submissionId: string): Promise<SubmissionDetails> {
    const data = await api.get<SubmissionDetails>(
      `/instructor/submissions/${submissionId}`
    );
    return data;
  },

  async triggerScoring(submissionId: string): Promise<AIAnalysisResult> {
    const data = await api.post<{ analysis: AIAnalysisResult }>(
      `/instructor/submissions/${submissionId}/score`,
      {}
    );
    return data.analysis;
  },

  async reviewSubmission(
    submissionId: string,
    dimensionScores: DimensionScore[]
  ): Promise<void> {
    await api.put(`/instructor/submissions/${submissionId}/review`, {
      dimension_scores: dimensionScores,
    });
  },

  async uploadSubmission(
    file: File,
    projectId: string,
    courseId: string,
    name: string
  ): Promise<CourseSubmission> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);
    formData.append("courseId", courseId);
    formData.append("name", name);

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL || "http://localhost:3001"
      }/api/instructor/submissions/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ila-token")}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload submission");
    }

    const result = await response.json();
    return result.data.submission;
  },

  async getRecentActivity(limit = 10): Promise<RecentActivity[]> {
    const data = await api.get<{ activities: RecentActivity[] }>(
      `/instructor/dashboard/recent-activity?limit=${limit}`
    );
    return data.activities;
  },

  async getAtRiskStudents(limit = 10): Promise<AtRiskStudent[]> {
    const data = await api.get<{ students: AtRiskStudent[] }>(
      `/instructor/dashboard/at-risk-students?limit=${limit}`
    );
    return data.students;
  },

  async upsertSubmissionSuggestion(
    submissionId: string,
    suggestion_text: string
  ): Promise<InstructorSuggestion> {
    const data = await api.put<{ suggestion: InstructorSuggestion }>(
      `/instructor/submissions/${submissionId}/suggestion`,
      { suggestion_text }
    );
    return data.suggestion;
  },
};
