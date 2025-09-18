export interface Essay {
  id: string;
  author_id?: string;
  title?: string;
  body: string;
  source?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEssayInput {
  author_id?: string;
  title?: string;
  body: string;
  source?: string;
}

export interface UpdateEssayInput {
  title?: string;
  body?: string;
  source?: string;
}

export interface Feedback {
  id: string;
  essay_id: string;
  author_type: "system" | "instructor";
  author_id?: string;
  score?: number;
  summary?: string;
  details_json?: Record<string, unknown>;
  created_at: Date;
}

export interface CreateFeedbackInput {
  essay_id: string;
  author_type: "system" | "instructor";
  author_id?: string;
  score?: number;
  summary?: string;
  details_json?: Record<string, unknown>;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EssayTag {
  essay_id: string;
  tag_id: string;
  assigned_by?: string;
  assigned_at: Date;
}

export interface EssayWithTags extends Essay {
  tags: Tag[];
  feedbacks: Feedback[];
}
