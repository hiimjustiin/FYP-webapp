import { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { query } from "../models/database.js";
import { validationResult } from "express-validator";
import { hashPassword } from "../utils/password.js";

// GET /api/admin/dashboard - Get admin dashboard statistics
export const getDashboardStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [usersResult, coursesResult, submissionsResult, projectsResult] =
      await Promise.all([
        query("SELECT COUNT(*) as total, role FROM users GROUP BY role"),
        query("SELECT COUNT(*) as total FROM courses"),
        query(
          "SELECT COUNT(*) as total, status FROM project_submissions GROUP BY status"
        ),
        query("SELECT COUNT(*) as total FROM projects"),
      ]);

    const stats = {
      users: {
        total: usersResult.rows.reduce(
          (sum, row) => sum + parseInt(row.total),
          0
        ),
        byRole: usersResult.rows.reduce((acc, row) => {
          acc[row.role] = parseInt(row.total);
          return acc;
        }, {} as Record<string, number>),
      },
      courses: parseInt(coursesResult.rows[0]?.total || "0"),
      projects: parseInt(projectsResult.rows[0]?.total || "0"),
      submissions: {
        total: submissionsResult.rows.reduce(
          (sum, row) => sum + parseInt(row.total),
          0
        ),
        byStatus: submissionsResult.rows.reduce((acc, row) => {
          acc[row.status] = parseInt(row.total);
          return acc;
        }, {} as Record<string, number>),
      },
    };

    return res.json({ success: true, data: { stats } });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch dashboard statistics" },
    });
  }
};

// GET /api/admin/users - Get all users with pagination and filtering
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    let whereClause = "";
    const params: (string | number)[] = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      whereClause += `WHERE role = $${paramCount}`;
      params.push(role);
    }

    if (search) {
      paramCount++;
      whereClause += whereClause ? " AND " : "WHERE ";
      whereClause += `(email ILIKE $${paramCount} OR display_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const [usersResult, countResult] = await Promise.all([
      query(
        `SELECT id, email, display_name, role, is_active, created_at, student_id, department, phone
         FROM users 
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params),
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch users" },
    });
  }
};

// POST /api/admin/users - Create new user
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
    }

    const {
      email,
      password,
      display_name,
      role,
      student_id,
      department,
      phone,
    } = req.body;

    // Check if user already exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: "User with this email already exists" },
      });
    }

    const passwordHash = await hashPassword(password);

    const result = await query(
      `INSERT INTO users (email, password_hash, display_name, role, student_id, department, phone, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, email, display_name, role, is_active, created_at`,
      [
        email,
        passwordHash,
        display_name,
        role || "student",
        student_id,
        department,
        phone,
      ]
    );

    return res.status(201).json({
      success: true,
      data: { user: result.rows[0] },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to create user" },
    });
  }
};

// PUT /api/admin/users/:id - Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { display_name, role, is_active, student_id, department, phone } =
      req.body;

    const updateFields: string[] = [];
    const values: (string | number | boolean)[] = [];
    let paramCount = 0;

    if (display_name !== undefined) {
      paramCount++;
      updateFields.push(`display_name = $${paramCount}`);
      values.push(display_name);
    }

    if (role !== undefined) {
      paramCount++;
      updateFields.push(`role = $${paramCount}`);
      values.push(role);
    }

    if (is_active !== undefined) {
      paramCount++;
      updateFields.push(`is_active = $${paramCount}`);
      values.push(is_active);
    }

    if (student_id !== undefined) {
      paramCount++;
      updateFields.push(`student_id = $${paramCount}`);
      values.push(student_id);
    }

    if (department !== undefined) {
      paramCount++;
      updateFields.push(`department = $${paramCount}`);
      values.push(department);
    }

    if (phone !== undefined) {
      paramCount++;
      updateFields.push(`phone = $${paramCount}`);
      values.push(phone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "No fields to update" },
      });
    }

    updateFields.push("updated_at = NOW()");
    paramCount++;
    values.push(id as string);

    const result = await query(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = $${paramCount}
       RETURNING id, email, display_name, role, is_active, student_id, department, phone, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found" },
      });
    }

    return res.json({
      success: true,
      data: { user: result.rows[0] },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to update user" },
    });
  }
};

// DELETE /api/admin/users/:id - Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (req.user?.id === id) {
      return res.status(400).json({
        success: false,
        error: { message: "Cannot delete your own account" },
      });
    }

    const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found" },
      });
    }

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to delete user" },
    });
  }
};

// GET /api/admin/courses - Get all courses with details
export const getAllCourses = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT 
        c.*,
        u.display_name as instructor_name,
        u.email as instructor_email,
        COUNT(DISTINCT ce.user_id) as enrollment_count,
        COUNT(DISTINCT ps.id) as submission_count
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'active'
       LEFT JOIN project_submissions ps ON ps.course_id = c.id
       GROUP BY c.id, u.display_name, u.email
       ORDER BY c.created_at DESC`
    );

    return res.json({
      success: true,
      data: { courses: result.rows },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch courses" },
    });
  }
};

// POST /api/admin/courses - Create new course
export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
    }

    const { code, title, description, instructor_id, term, passcode } =
      req.body;

    const result = await query(
      `INSERT INTO courses (code, title, description, instructor_id, term, passcode)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, $1))
       RETURNING *`,
      [code, title, description, instructor_id, term, passcode]
    );

    return res.status(201).json({
      success: true,
      data: { course: result.rows[0] },
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to create course" },
    });
  }
};

// PUT /api/admin/courses/:id - Update course
export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, title, description, instructor_id, term, passcode } =
      req.body;

    const updateFields: string[] = [];
    const values: (string | undefined)[] = [];
    let paramCount = 0;

    if (code !== undefined) {
      paramCount++;
      updateFields.push(`code = $${paramCount}`);
      values.push(code);
    }

    if (title !== undefined) {
      paramCount++;
      updateFields.push(`title = $${paramCount}`);
      values.push(title);
    }

    if (description !== undefined) {
      paramCount++;
      updateFields.push(`description = $${paramCount}`);
      values.push(description);
    }

    if (instructor_id !== undefined) {
      paramCount++;
      updateFields.push(`instructor_id = $${paramCount}`);
      values.push(instructor_id);
    }

    if (term !== undefined) {
      paramCount++;
      updateFields.push(`term = $${paramCount}`);
      values.push(term);
    }

    if (passcode !== undefined) {
      paramCount++;
      updateFields.push(`passcode = $${paramCount}`);
      values.push(passcode);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "No fields to update" },
      });
    }

    updateFields.push("updated_at = NOW()");
    paramCount++;
    values.push(id as string);

    const result = await query(
      `UPDATE courses SET ${updateFields.join(", ")} WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: "Course not found" },
      });
    }

    return res.json({
      success: true,
      data: { course: result.rows[0] },
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to update course" },
    });
  }
};

// DELETE /api/admin/courses/:id - Delete course
export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      "DELETE FROM courses WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: "Course not found" },
      });
    }

    return res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to delete course" },
    });
  }
};

// GET /api/admin/submissions - Get all submissions with filters
export const getAllSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string;
    const courseId = req.query.courseId as string;

    let whereClause = "";
    const params: string[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += `WHERE ps.status = $${paramCount}`;
      params.push(status);
    }

    if (courseId) {
      paramCount++;
      whereClause += whereClause ? " AND " : "WHERE ";
      whereClause += `ps.course_id = $${paramCount}`;
      params.push(courseId);
    }

    const result = await query(
      `SELECT 
        ps.*,
        u.display_name as student_name,
        u.email as student_email,
        p.title as project_title,
        c.title as course_title,
        c.code as course_code,
        COUNT(sds.id) as scores_count
       FROM project_submissions ps
       JOIN users u ON ps.user_id = u.id
       JOIN projects p ON ps.project_id = p.id
       JOIN courses c ON ps.course_id = c.id
       LEFT JOIN submission_dimension_scores sds ON ps.id = sds.submission_id
       ${whereClause}
       GROUP BY ps.id, u.display_name, u.email, p.title, c.title, c.code
       ORDER BY ps.submitted_at DESC`,
      params
    );

    return res.json({
      success: true,
      data: { submissions: result.rows },
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch submissions" },
    });
  }
};

// GET /api/admin/instructors - Get all instructors for dropdown
export const getInstructors = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, display_name 
       FROM users 
       WHERE role IN ('instructor', 'admin')
       ORDER BY display_name ASC`
    );

    return res.json({
      success: true,
      data: { instructors: result.rows },
    });
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch instructors" },
    });
  }
};
