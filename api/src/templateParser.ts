// Template variable parser for modular prompts
// Ported from app/src/lib/templateParser.ts
// Handles {Variable} syntax in prompt templates

const VARIABLE_REGEX = /\{([^}]+)\}/g;

function isValidVariable(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  if (/\n/.test(trimmed)) return false;
  if (/[{}[\]:;"'`,]/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  if (words.length > 3) return false;
  return true;
}

export function parseTemplateVariables(text: string): string[] {
  const matches = text.matchAll(VARIABLE_REGEX);
  const seen = new Set<string>();
  const variables: string[] = [];
  for (const match of matches) {
    const varName = match[1].trim();
    if (varName && !seen.has(varName) && isValidVariable(match[1])) {
      seen.add(varName);
      variables.push(varName);
    }
  }
  return variables;
}

export function hasTemplateVariables(text: string): boolean {
  return parseTemplateVariables(text).length > 0;
}

export function replaceTemplateVariables(
  text: string,
  values: Record<string, string>
): string {
  return text.replace(VARIABLE_REGEX, (match, varName) => {
    if (!isValidVariable(varName)) return match;
    const trimmed = varName.trim();
    const value = values[trimmed];
    return value && value.trim() ? value : match;
  });
}
