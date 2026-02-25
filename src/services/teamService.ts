import { api } from "../lib/api";

export interface TeamMember {
  id: string;
  name: string;
  role: "owner" | "member";
  initials: string;
  email?: string;
  joinedAt?: string | null;
}

export interface TeamCourse {
  id: string;
  code: string;
  title: string;
}

export interface Team {
  id: string;
  projectName: string;
  status: string;
  course: TeamCourse;
  members: TeamMember[];
  ownerIsCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamDetails {
  id: string;
  projectName: string;
  status: string;
  projectType: string;
  course: TeamCourse;
  members: TeamMember[];
  ownerIsCurrentUser: boolean;
}

interface TeamsResponse {
  teams: Team[];
}

interface TeamDetailsResponse {
  team: TeamDetails;
}

interface AddMemberResponse {
  member: TeamMember;
  message: string;
}

interface MessageResponse {
  message: string;
}

export const teamService = {
  /**
   * Get all teams (group projects) for the current user
   */
  async getTeams(): Promise<Team[]> {
    const data = await api.get<TeamsResponse>("/teams");
    return data.teams;
  },

  /**
   * Get details for a specific team
   */
  async getTeamDetails(projectId: string): Promise<TeamDetails> {
    const data = await api.get<TeamDetailsResponse>(`/teams/${projectId}`);
    return data.team;
  },

  /**
   * Add a member to a team
   */
  async addMember(projectId: string, userId: string): Promise<AddMemberResponse> {
    return api.post<AddMemberResponse>(`/teams/${projectId}/members`, {
      userId,
    });
  },

  /**
   * Remove a member from a team
   */
  async removeMember(projectId: string, userId: string): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`/teams/${projectId}/members/${userId}`);
  },
};
