import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  // List of models to try in order
  private readonly models = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
  ];

  async generateContent(
    payload: any,
    options: { responseMimeType?: string } = {},
  ) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

    let lastError: any;

    for (const model of this.models) {
      try {
        this.logger.log(`Attempting with model: ${model}`);

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            ...payload,
            generationConfig: {
              ...payload.generationConfig,
              ...(options.responseMimeType
                ? { response_mime_type: options.responseMimeType }
                : {}),
            },
          },
          { headers: { "Content-Type": "application/json" } },
        );

        return response.data;
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;

        if (status === 429) {
          this.logger.warn(
            `Model ${model} hit rate limit (429). Switching to next model...`,
          );
          continue; // Try next model
        }

        this.logger.error(`Gemini Error (${model}): ${message}`);
        throw error; // If not 429, throw immediately
      }
    }

    throw new Error(
      `All Gemini models failed. Last error: ${lastError?.message}`,
    );
  }
}
