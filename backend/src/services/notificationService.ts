import { query } from "../models/database.js";
import { emailService } from "./emailService.js";

interface NotificationData {
  user_id: string;
  type:
    | "submission_received"
    | "scoring_complete"
    | "review_complete"
    | "general";
  title: string;
  message: string;
  related_submission_id?: string;
  related_course_id?: string;
  related_project_id?: string;
}

class NotificationService {
  /**
   * Create a notification record in the database
   */
  async createNotification(data: NotificationData): Promise<void> {
    try {
      await query(
        `INSERT INTO notifications (
          user_id, type, title, message, 
          related_submission_id, related_course_id, related_project_id,
          is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())`,
        [
          data.user_id,
          data.type,
          data.title,
          data.message,
          data.related_submission_id || null,
          data.related_course_id || null,
          data.related_project_id || null,
        ]
      );
      console.log(`✅ Notification created for user ${data.user_id}`);
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw error;
    }
  }

  /**
   * Notify instructor when a student submits work
   */
  async notifySubmissionReceived(
    submissionId: string,
    courseId: string,
    projectId: string
  ): Promise<void> {
    try {
      // Get submission details
      const submissionResult = await query(
        `SELECT 
          ps.id, ps.name as submission_name, ps.submitted_at,
          u.display_name as student_name,
          p.title as project_title,
          c.title as course_title, c.instructor_id
        FROM project_submissions ps
        JOIN users u ON ps.user_id = u.id
        JOIN projects p ON ps.project_id = p.id
        JOIN courses c ON p.course_id = c.id
        WHERE ps.id = $1`,
        [submissionId]
      );

      if (submissionResult.rows.length === 0) {
        throw new Error("Submission not found");
      }

      const submission = submissionResult.rows[0];
      const instructorId = submission.instructor_id;

      // Get instructor details
      const instructorResult = await query(
        "SELECT email, display_name FROM users WHERE id = $1",
        [instructorId]
      );

      if (instructorResult.rows.length === 0) {
        throw new Error("Instructor not found");
      }

      const instructor = instructorResult.rows[0];

      // Create in-app notification
      await this.createNotification({
        user_id: instructorId,
        type: "submission_received",
        title: "New Submission Received",
        message: `${submission.student_name} submitted "${submission.project_title}" for ${submission.course_title}`,
        related_submission_id: submissionId,
        related_course_id: courseId,
        related_project_id: projectId,
      });

      // Send email notification
      if (emailService.isEnabled()) {
        const dashboardUrl = `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/instructor/courses/${courseId}/submissions`;

        await emailService.sendSubmissionReceivedNotification(
          instructor.email,
          {
            instructorName: instructor.display_name,
            studentName: submission.student_name,
            projectTitle: submission.project_title,
            courseName: submission.course_title,
            submissionDate: new Date(submission.submitted_at).toLocaleString(),
            dashboardUrl,
          }
        );
      }

      console.log(
        `✅ Submission notification sent to instructor ${instructorId}`
      );
    } catch (error) {
      console.error("Failed to notify submission received:", error);
      // Don't throw - notification failures shouldn't break the submission flow
    }
  }

  /**
   * Notify student when their submission has been scored
   */
  async notifyScoringComplete(submissionId: string): Promise<void> {
    try {
      // Get submission and scoring details
      const result = await query(
        `SELECT 
          ps.id, ps.user_id, ps.name,
          u.email, u.display_name as student_name,
          p.title as project_title, p.course_id,
          c.title as course_title,
          (SELECT COUNT(*) FROM submission_dimension_scores WHERE submission_id = ps.id) as scores_count
        FROM project_submissions ps
        JOIN users u ON ps.user_id = u.id
        JOIN projects p ON ps.project_id = p.id
        JOIN courses c ON p.course_id = c.id
        WHERE ps.id = $1`,
        [submissionId]
      );

      if (result.rows.length === 0) {
        throw new Error("Submission not found");
      }

      const submission = result.rows[0];

      // Get dimension scores
      const scoresResult = await query(
        `SELECT 
          d.name as dimension_name,
          sds.ai_score_original,
          COALESCE(sds.instructor_override, sds.ai_score_original) as final_score,
          sds.ai_feedback_raw
        FROM submission_dimension_scores sds
        JOIN project_dimensions pd ON sds.dimension_id = pd.id
        JOIN dimensions d ON pd.dimension_id = d.id
        WHERE sds.submission_id = $1
        ORDER BY d.id`,
        [submissionId]
      );

      // Get overall feedback from the first score record
      const feedbackResult = await query(
        `SELECT ai_feedback_raw FROM submission_dimension_scores 
        WHERE submission_id = $1 LIMIT 1`,
        [submissionId]
      );

      const overallFeedback =
        feedbackResult.rows.length > 0
          ? JSON.parse(feedbackResult.rows[0].ai_feedback_raw || "{}")
              .overall_feedback || "Your submission has been scored."
          : "Your submission has been scored.";

      const dimensionScores = scoresResult.rows.map((score) => ({
        dimension: score.dimension_name,
        score: parseFloat(score.final_score),
        maxScore: 10,
      }));

      // Create in-app notification
      await this.createNotification({
        user_id: submission.user_id,
        type: "scoring_complete",
        title: "Scoring Complete",
        message: `Your submission "${submission.project_title}" has been scored. Check your results!`,
        related_submission_id: submissionId,
        related_course_id: submission.course_id,
      });

      // Send email notification
      if (emailService.isEnabled()) {
        const reviewUrl = `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/projects/${submission.project_id}`;

        await emailService.sendScoringCompleteNotification(submission.email, {
          studentName: submission.student_name,
          projectTitle: submission.project_title,
          courseName: submission.course_title,
          overallFeedback:
            overallFeedback.substring(0, 200) +
            (overallFeedback.length > 200 ? "..." : ""),
          dimensionScores,
          reviewUrl,
        });
      }

      console.log(
        `✅ Scoring notification sent to student ${submission.user_id}`
      );
    } catch (error) {
      console.error("Failed to notify scoring complete:", error);
      // Don't throw - notification failures shouldn't break the scoring flow
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit: number = 20
  ): Promise<unknown[]> {
    const result = await query(
      `SELECT 
        id, type, title, message, 
        related_submission_id, related_course_id, related_project_id,
        is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await query(
      "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
      [notificationId, userId]
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await query(
      "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false",
      [userId]
    );
  }

  /**
   * Delete old read notifications (cleanup)
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<void> {
    await query(
      `DELETE FROM notifications 
      WHERE is_read = true 
      AND created_at < NOW() - INTERVAL '${daysOld} days'`
    );
    console.log(`✅ Cleaned up notifications older than ${daysOld} days`);
  }
}

// Export a singleton instance
export const notificationService = new NotificationService();
