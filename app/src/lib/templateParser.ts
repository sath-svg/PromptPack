/**
 * Template variable parser for modular prompts
 * Handles {Variable} syntax in prompt templates
 */

const VARIABLE_REGEX = /\{([^}]+)\}/g;

/**
 * Check if matched content inside braces is a valid variable name.
 * A variable is 1-3 words with no newlines and no JSON/code-like characters.
 */
function isValidVariable(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  // Reject if it contains newlines (multi-line content like JSON)
  if (/\n/.test(trimmed)) return false;
  // Reject if it contains characters typical of code/JSON: colons, semicolons, braces, brackets, quotes
  if (/[{}[\]:;"'`,]/.test(trimmed)) return false;
  // Count words (split on whitespace)
  const words = trimmed.split(/\s+/);
  // A variable should be 1-3 words max
  if (words.length > 3) return false;
  return true;
}

/**
 * Extract unique variable names from template text
 * @example parseTemplateVariables("Find {Stock} for {Month} {Year}") → ["Stock", "Month", "Year"]
 */
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

/**
 * Check if text contains any template variables
 */
export function hasTemplateVariables(text: string): boolean {
  return parseTemplateVariables(text).length > 0;
}

/**
 * Replace all {Variable} placeholders with provided values
 * If a value is not provided or empty, keeps the original placeholder
 * Only replaces valid variable placeholders (1-3 words, no code/JSON).
 * @example replaceTemplateVariables("Find {Stock} for {Year}", {Stock: "AAPL", Year: "2024"}) → "Find AAPL for 2024"
 */
export function replaceTemplateVariables(
  text: string,
  values: Record<string, string>
): string {
  return text.replace(VARIABLE_REGEX, (match, varName) => {
    if (!isValidVariable(varName)) return match;
    const trimmed = varName.trim();
    const value = values[trimmed];
    // Keep placeholder if value is empty or not provided
    return value && value.trim() ? value : match;
  });
}
