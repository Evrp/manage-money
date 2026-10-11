import { Injectable } from "@nestjs/common";
import { GeminiService } from "../gemini/gemini.service";
import { AiProvider } from "./ai-provider";

@Injectable()
export class GeminiAiProvider implements AiProvider {
  constructor(private readonly geminiService: GeminiService) {}

  async generateText(prompt: string): Promise<string> {
    const result = await this.geminiService.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
    });
    const text = result?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    if (!text) throw new Error("AI provider returned an empty response");
    return text;
  }
}
