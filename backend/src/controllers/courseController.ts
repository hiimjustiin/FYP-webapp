import { Response } from "express";
import { query } from "../models/database.js";
import { AuthRequest } from "../middleware/auth.js";

// Get all courses with enrollment status
export const getCourses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const result = await query(
      `SELECT 
        c.*,
        u.display_name as instructor_name,
        u.email as instructor_email,
        EXISTS(
          SELECT 1 FROM course_enrollments ce 
          WHERE ce.course_id = c.id 
          AND ce.user_id = $1 
          AND ce.status = 'active'
        ) as enrolled,
        (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id AND ce.status = 'active') as enrollment_count
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: { courses: result.rows },
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

// Get enrolled courses for current user
export const getEnrolledCourses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const result = await query(
      `SELECT 
        c.*,
        u.display_name as instructor_name,
        u.email as instructor_email,
        ce.enrolled_at,
        ce.status as enrollment_status
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       LEFT JOIN users u ON c.instructor_id = u.id
       WHERE ce.user_id = $1 AND ce.status = 'active'
       ORDER BY ce.enrolled_at DESC`,
      [req.user.id]
    );

    console.log(`📚 User ${req.user.id} has ${result.rows.length} active enrollments`);
    result.rows.forEach((course) => {
      console.log(`  - ${course.code}: status=${course.enrollment_status}`);
    });

    res.json({
      success: true,
      data: { courses: result.rows },
    });
  } catch (error) {
    console.error("Get enrolled courses error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

// Enroll in a course
export const enrollCourse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const { courseId } = req.params;

    // Check if course exists
    const courseResult = await query("SELECT * FROM courses WHERE id = $1", [
      courseId,
    ]);

    if (courseResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Course not found" },
      });
      return;
    }

    // Check if already enrolled
    const enrollmentCheck = await query(
      "SELECT * FROM course_enrollments WHERE course_id = $1 AND user_id = $2",
      [courseId, req.user.id]
    );

    if (enrollmentCheck.rows.length > 0) {
      const enrollment = enrollmentCheck.rows[0];
      if (enrollment.status === "active") {
        res.status(400).json({
          success: false,
          error: { message: "Already enrolled in this course" },
        });
        return;
      } else {
        // Reactivate enrollment
        const reactivateResult = await query(
          `UPDATE course_enrollments 
           SET status = 'active', enrolled_at = now() 
           WHERE id = $1 
           RETURNING *`,
          [enrollment.id]
        );

        res.json({
          success: true,
          data: {
            enrollment: reactivateResult.rows[0],
            message: "Re-enrolled in course successfully",
          },
        });
        return;
      }
    }

    // Create new enrollment
    const result = await query(
      `INSERT INTO course_enrollments (course_id, user_id, status)
       VALUES ($1, $2, 'active')
       RETURNING *`,
      [courseId, req.user.id]
    );

    res.status(201).json({
      success: true,
      data: {
        enrollment: result.rows[0],
        message: "Enrolled in course successfully",
      },
    });
  } catch (error) {
    console.error("Enroll course error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

// Unenroll from a course
export const unenrollCourse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const { courseId } = req.params;
    console.log(`🚪 User ${req.user.id} unenrolling from course ${courseId}`);

    const result = await query(
      `UPDATE course_enrollments 
       SET status = 'dropped' 
       WHERE course_id = $1 AND user_id = $2 AND status = 'active'
       RETURNING *`,
      [courseId, req.user.id]
    );

    if (result.rows.length === 0) {
      console.log(`⚠️  No active enrollment found for course ${courseId}`);
      res.status(404).json({
        success: false,
        error: { message: "Enrollment not found or already inactive" },
      });
      return;
    }

    console.log(`✅ Successfully updated enrollment status to 'dropped'`);
    console.log(`   Old status: ${result.rows[0].status || 'active'}`);

    res.json({
      success: true,
      data: { message: "Unenrolled from course successfully" },
    });
  } catch (error) {
    console.error("Unenroll course error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};
