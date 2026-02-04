/**
 * Template variable parser for modular prompts
 * Handles {Variable} syntax in prompt templates
 */

const VARIABLE_REGEX = /\{([^}]+)\}/g;

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
    if (varName && !seen.has(varName)) {
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
  // Use a fresh regex to avoid lastIndex issues with global flag
  return /\{([^}]+)\}/.test(text);
}

/**
 * Replace all {Variable} placeholders with provided values
 * If a value is not provided or empty, keeps the original placeholder
 * @example replaceTemplateVariables("Find {Stock} for {Year}", {Stock: "AAPL", Year: "2024"}) → "Find AAPL for 2024"
 */
export function replaceTemplateVariables(
  text: string,
  values: Record<string, string>
): string {
  return text.replace(VARIABLE_REGEX, (match, varName) => {
    const trimmed = varName.trim();
    const value = values[trimmed];
    // Keep placeholder if value is empty or not provided
    return value && value.trim() ? value : match;
  });
}
