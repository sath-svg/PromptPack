export interface PromptTemplate {
  slug: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  tags: string[];
  useCase: string;
  exampleInput?: string;
  exampleOutput?: string;
  targetKeywords: string[];
  relatedTemplates: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  platforms: ("chatgpt" | "claude" | "gemini")[];
}

export interface PromptCategory {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  keywords: string[];
  relatedCategories: string[];
  templates: PromptTemplate[];
}

export interface ComparisonPoint {
  feature: string;
  promptpack: string;
  competitor: string;
  winner: "promptpack" | "competitor" | "tie";
}

export interface ComparisonPage {
  slug: string;
  competitorName: string;
  title: string;
  metaDescription: string;
  competitorDescription: string;
  comparisonPoints: ComparisonPoint[];
  verdict: string;
  targetKeywords: string[];
}
