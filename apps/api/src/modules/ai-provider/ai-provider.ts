export const AI_PROVIDER = Symbol("AI_PROVIDER");

export interface AiProvider {
  generateText(prompt: string): Promise<string>;
}
