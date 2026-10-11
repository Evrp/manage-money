import { Module } from "@nestjs/common";
import { GeminiModule } from "../gemini/gemini.module";
import { AI_PROVIDER } from "./ai-provider";
import { GeminiAiProvider } from "./gemini-ai.provider";

@Module({
  imports: [GeminiModule],
  providers: [{ provide: AI_PROVIDER, useClass: GeminiAiProvider }],
  exports: [AI_PROVIDER],
})
export class AiProviderModule {}
