import { promptCategories } from "./prompts";
import type { PromptTemplate, RolePage } from "./types";

export function getTemplatesForRole(role: {
  relevantCategories: string[];
  relevantTags: string[];
}): PromptTemplate[] {
  const categoryTemplates = promptCategories
    .filter((c) => role.relevantCategories.includes(c.slug))
    .flatMap((c) => c.templates);

  const tagTemplates = promptCategories
    .flatMap((c) => c.templates)
    .filter(
      (t) =>
        t.tags.some((tag) =>
          role.relevantTags.some(
            (rt) =>
              tag.toLowerCase().includes(rt.toLowerCase()) ||
              rt.toLowerCase().includes(tag.toLowerCase()),
          ),
        ) && !categoryTemplates.includes(t),
    );

  return [...categoryTemplates, ...tagTemplates];
}

export function getRelevantCategories(role: RolePage) {
  return promptCategories.filter((c) => role.relevantCategories.includes(c.slug));
}
