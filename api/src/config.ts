import type { Env } from "./index";

export function getGroqApiKey(env: Env): string {
  return env.GROQ_API_KEY;
}
