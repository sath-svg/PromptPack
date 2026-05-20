export type Platform =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "midjourney"
  | "dall-e"
  | "stable-diffusion"
  | "flux"
  | "grok"
  | "deepseek"
  | "perplexity"
  | "copilot"
  | "cursor";

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
  platforms: Platform[];
}

export interface FAQ {
  question: string;
  answer: string;
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
  faqs?: FAQ[];
}

export interface PlatformPage {
  slug: string;
  name: string;
  title: string;
  description: string;
  longDescription: string;
  keywords: string[];
  icon: string;
}

export interface RoleHowToStep {
  name: string;
  text: string;
}

export interface RoleComparisonRow {
  feature: string;
  skillset: string;
  consultant: string;
  winner: "skillset" | "consultant" | "tie";
}

export interface RoleCitation {
  label: string;
  url: string;
}

export interface RolePage {
  slug: string;
  role: string;
  title: string;
  description: string;
  longDescription: string;
  keywords: string[];
  icon: string;
  relevantCategories: string[];
  relevantTags: string[];
  skillsetHeadline?: string;
  skillsetSubhead?: string;
  medianSalary?: number;
  employmentCount?: number;
  aiAdoptionPct?: number;
  hoursSavedPerWeek?: number;
  oNetCode?: string;
  keyTasks?: string[];
  faqs?: FAQ[];
  vsConsultant?: RoleComparisonRow[];
  howToSteps?: RoleHowToStep[];
  lastUpdated?: string;
  citations?: RoleCitation[];
}

export interface ComparisonPoint {
  feature: string;
  skillset: string;
  competitor: string;
  winner: "skillset" | "competitor" | "tie";
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
