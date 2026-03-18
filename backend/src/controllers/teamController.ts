import { Response } from "express";
import { query } from "../models/database.js";
import { AuthRequest } from "../middleware/auth.js";

/**
 * Get all teams (group projects) for the current user
 * Returns projects where user is owner OR member, filtered to group projects only
 */
export const getUserTeams = async (
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

    // Get all group projects where user is owner or member
    const teamsResult = await query(
      `SELECT 
        p.id,
        p.title as project_name,
        p.status,
        p.owner_id,
        p.created_at,
        p.updated_at,
        c.id as course_id,
        c.code as course_code,
        c.title as course_title,
        owner.display_name as owner_name,
        owner.email as owner_email
       FROM projects p
       LEFT JOIN courses c ON p.course_id = c.id
       LEFT JOIN users owner ON p.owner_id = owner.id
       WHERE p.project_type = 'group'
       AND (
         p.owner_id = $1 
         OR p.id IN (
           SELECT pm.project_id FROM project_members pm WHERE pm.user_id = $1
         )
       )
       ORDER BY p.updated_at DESC`,
      [req.user.id]
    );

    const projectIds = teamsResult.rows.map((p) => p.id);

    // Get all members for these projects
    let membersData: {
      project_id: string;
      user_id: string;
      role: string;
      display_name: string;
      email: string;
    }[] = [];

    if (projectIds.length > 0) {
      const membersResult = await query(
        `SELECT 
          pm.project_id, 
          pm.user_id, 
          pm.role, 
          u.display_name,
          u.email
         FROM project_members pm
         LEFT JOIN users u ON pm.user_id = u.id
         WHERE pm.project_id = ANY($1)`,
        [projectIds]
      );
      membersData = membersResult.rows;
    }

    // Also add owners as members for display purposes
    const ownerMembers = teamsResult.rows.map((team) => ({
      project_id: team.id,
      user_id: team.owner_id,
      role: "owner",
      display_name: team.owner_name,
      email: team.owner_email,
    }));

    // Combine members and owners
    const allMembers = [...ownerMembers, ...membersData];

    // Group members by project and generate initials
    const membersByProject = allMembers.reduce(
      (acc, member) => {
        if (!acc[member.project_id]) {
          acc[member.project_id] = [];
        }

        // Generate initials from display_name
        const nameParts = (member.display_name || "Unknown").split(" ");
        const initials = nameParts
          .map((part: string) => part.charAt(0).toUpperCase())
          .join("")
          .substring(0, 2);

        // Avoid duplicate entries (owner might also be in project_members)
        const projectMembers = acc[member.project_id]!;
        const exists = projectMembers.some((m) => m.id === member.user_id);
        if (!exists) {
          projectMembers.push({
            id: member.user_id,
            name: member.display_name || "Unknown",
            role: member.role,
            initials,
            email: member.email,
          });
        }
        return acc;
      },
      {} as Record<
        string,
        {
          id: string;
          name: string;
          role: string;
          initials: string;
          email: string;
        }[]
      >
    );

    // Build response with members attached
    const teams = teamsResult.rows.map((team) => ({
      id: team.id,
      projectName: team.project_name,
      status: team.status,
      course: {
        id: team.course_id,
        code: team.course_code,
        title: team.course_title,
      },
      members: membersByProject[team.id] || [],
      ownerIsCurrentUser: team.owner_id === req.user!.id,
      createdAt: team.created_at,
      updatedAt: team.updated_at,
    }));

    res.json({
      success: true,
      data: { teams },
    });
  } catch (error) {
    console.error("Get user teams error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

/**
 * Get details for a specific team (project)
 */
export const getTeamDetails = async (
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

    const { projectId } = req.params;

    // Verify user has access to this project
    const projectResult = await query(
      `SELECT 
        p.id,
        p.title as project_name,
        p.status,
        p.owner_id,
        p.project_type,
        p.course_id,
        c.code as course_code,
        c.title as course_title,
        owner.display_name as owner_name,
        owner.email as owner_email
       FROM projects p
       LEFT JOIN courses c ON p.course_id = c.id
       LEFT JOIN users owner ON p.owner_id = owner.id
       WHERE p.id = $1 
       AND (
         p.owner_id = $2 
         OR p.id IN (
           SELECT pm.project_id FROM project_members pm WHERE pm.user_id = $2
         )
       )`,
      [projectId, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Team not found or access denied" },
      });
      return;
    }

    const project = projectResult.rows[0];

    // Get all members
    const membersResult = await query(
      `SELECT 
        pm.user_id,
        pm.role,
        pm.joined_at,
        u.display_name,
        u.email
       FROM project_members pm
       LEFT JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [projectId]
    );

    // Build members list including owner
    const members = [
      {
        id: project.owner_id,
        name: project.owner_name || "Unknown",
        role: "owner",
        email: project.owner_email,
        initials: (project.owner_name || "U")
          .split(" ")
          .map((p: string) => p.charAt(0).toUpperCase())
          .join("")
          .substring(0, 2),
        joinedAt: null,
      },
      ...membersResult.rows.map((m) => ({
        id: m.user_id,
        name: m.display_name || "Unknown",
        role: m.role,
        email: m.email,
        initials: (m.display_name || "U")
          .split(" ")
          .map((p: string) => p.charAt(0).toUpperCase())
          .join("")
          .substring(0, 2),
        joinedAt: m.joined_at,
      })),
    ];

    res.json({
      success: true,
      data: {
        team: {
          id: project.id,
          projectName: project.project_name,
          status: project.status,
          projectType: project.project_type,
          course: {
            id: project.course_id,
            code: project.course_code,
            title: project.course_title,
          },
          members,
          ownerIsCurrentUser: project.owner_id === req.user.id,
        },
      },
    });
  } catch (error) {
    console.error("Get team details error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

/**
 * Add a member to a team
 * Only the project owner can add members
 */
export const addTeamMember = async (
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

    const { projectId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: { message: "userId is required" },
      });
      return;
    }

    // Verify user owns this project
    const projectResult = await query(
      `SELECT p.id, p.owner_id, p.course_id, p.project_type
       FROM projects p
       WHERE p.id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Project not found" },
      });
      return;
    }

    const project = projectResult.rows[0];

    if (project.owner_id !== req.user.id) {
      res.status(403).json({
        success: false,
        error: { message: "Only the project owner can add team members" },
      });
      return;
    }

    if (project.project_type !== "group") {
      res.status(400).json({
        success: false,
        error: { message: "Cannot add members to individual projects" },
      });
      return;
    }

    // Verify the new member is enrolled in the same course
    const enrollmentCheck = await query(
      `SELECT user_id FROM course_enrollments 
       WHERE course_id = $1 AND user_id = $2 AND status = 'active'`,
      [project.course_id, userId]
    );

    if (enrollmentCheck.rows.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          message: "User must be enrolled in the course to join this team",
        },
      });
      return;
    }

    // Check if user is already a member
    const existingMember = await query(
      `SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (existingMember.rows.length > 0) {
      res.status(400).json({
        success: false,
        error: { message: "User is already a member of this team" },
      });
      return;
    }

    // Cannot add the owner as a member
    if (userId === project.owner_id) {
      res.status(400).json({
        success: false,
        error: { message: "Cannot add the project owner as a member" },
      });
      return;
    }

    // Add the member
    await query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, 'member')`,
      [projectId, userId]
    );

    // Get the added user's info
    const userResult = await query(
      `SELECT id, display_name, email FROM users WHERE id = $1`,
      [userId]
    );

    const addedUser = userResult.rows[0];
    const initials = (addedUser.display_name || "U")
      .split(" ")
      .map((p: string) => p.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);

    console.log(
      `✅ User ${userId} added to team ${projectId} by ${req.user.id}`
    );

    res.status(201).json({
      success: true,
      data: {
        member: {
          id: addedUser.id,
          name: addedUser.display_name,
          email: addedUser.email,
          role: "member",
          initials,
        },
        message: "Team member added successfully",
      },
    });
  } catch (error) {
    console.error("Add team member error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

/**
 * Remove a member from a team
 * Only the project owner can remove members
 */
export const removeTeamMember = async (
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

    const { projectId, userId } = req.params;

    // Verify user owns this project
    const projectResult = await query(
      `SELECT p.id, p.owner_id FROM projects p WHERE p.id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Project not found" },
      });
      return;
    }

    const project = projectResult.rows[0];

    if (project.owner_id !== req.user.id) {
      res.status(403).json({
        success: false,
        error: { message: "Only the project owner can remove team members" },
      });
      return;
    }

    // Cannot remove the owner
    if (userId === project.owner_id) {
      res.status(400).json({
        success: false,
        error: { message: "Cannot remove the project owner from the team" },
      });
      return;
    }

    // Remove the member
    const result = await query(
      `DELETE FROM project_members 
       WHERE project_id = $1 AND user_id = $2
       RETURNING id`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Member not found in this team" },
      });
      return;
    }

    console.log(
      `🗑️ User ${userId} removed from team ${projectId} by ${req.user.id}`
    );

    res.json({
      success: true,
      data: { message: "Team member removed successfully" },
    });
  } catch (error) {
    console.error("Remove team member error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};
