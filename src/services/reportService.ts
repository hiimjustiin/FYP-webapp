import { api } from "../lib/api";

export interface PortfolioOverview {
  totalProjects: number;
  totalSubmissions: number;
  overallAvgScore: number;
  bestDimension: {
    label: string;
    score: number;
  } | null;
  worstDimension: {
    label: string;
    score: number;
  } | null;
}

export interface ProjectSummary {
  id: string;
  title: string;
  description: string;
  submissionCount: number;
  avgScore: number;
  lastSubmission: string | null;
}

export interface DimensionPerformance {
  id: number;
  label: string;
  color: string;
  avgScore: number;
  assessmentCount: number;
  minScore: number;
  maxScore: number;
}

export interface RecentSubmission {
  id: string;
  projectId: string;
  projectTitle: string;
  submittedAt: string;
  status: string;
  aiProcessingStatus: string | null;
  avgScore: number;
}

export interface TimelinePoint {
  date: string;
  dimension: string;
  score: number;
}

export interface HeatmapCell {
  projectId: string;
  projectTitle: string;
  dimensionId: number;
  dimensionLabel: string;
  color: string;
  score: number;
}

export interface PortfolioData {
  overview: PortfolioOverview;
  projects: ProjectSummary[];
  dimensions: DimensionPerformance[];
  recentSubmissions: RecentSubmission[];
  timeline: TimelinePoint[];
  heatmap: HeatmapCell[];
}

export const reportService = {
  async getPortfolioAnalytics(): Promise<PortfolioData> {
    const response = await api.get<PortfolioData>("/reports/portfolio");
    return response;
  },
};
