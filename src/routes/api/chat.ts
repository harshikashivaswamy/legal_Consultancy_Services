import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createGroqProvider,
  createOllamaProvider,
  createLovableAiGatewayProvider,
} from "@/lib/ai-gateway.server";
import { getEnv } from "@/lib/env.server";

const SYSTEM_PROMPT = `You are "TekoraAI", the in-app legal assistant of Legal Consultancy Service, an Indian legal consultation marketplace.

You help users with:
- Legal FAQs and basic legal information under Indian law
- Identifying the likely case category (e.g. Criminal, Family & Divorce, Property, Corporate, Cyber Crime, Consumer, Employment, Taxation, IP)
- Recommending the kind of lawyer to book on Legal Consultancy Service (specialisation, experience level, expected fee range in INR)
- Summarising legal documents the user pastes or describes
- Guiding users through booking an appointment on the platform (search -> choose slot -> consultation mode -> upload documents -> pay -> confirmation)

Style: warm, concise, plain language, no heavy jargon. Use short paragraphs and bullets. Amounts in ₹.
Always end advice that touches a real dispute with a one-line reminder that this is general information, not legal advice, and suggest booking a verified lawyer on Legal Consultancy Service.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const modelMessages = await convertToModelMessages(messages as UIMessage[]);

        const groqApiKey = getEnv("GROQ_API_KEY");
        const groqModelName = getEnv("GROQ_MODEL") || "llama-3.3-70b-versatile";
        const ollamaBaseUrl = getEnv("OLLAMA_BASE_URL") || "http://127.0.0.1:11434/v1";
        const ollamaModelName = getEnv("OLLAMA_MODEL") || "llama3.2";
        const lovableKey = getEnv("LOVABLE_API_KEY");

        // 1. Try Groq if API key is configured
        if (groqApiKey) {
          try {
            const groq = createGroqProvider(groqApiKey);
            const result = streamText({
              model: groq(groqModelName),
              system: SYSTEM_PROMPT,
              messages: modelMessages,
            });

            return result.toUIMessageStreamResponse({
              originalMessages: messages as UIMessage[],
            });
          } catch (groqError) {
            console.warn("Groq provider encountered an error, falling back to Ollama...", groqError);
          }
        }

        // 2. Fallback to Ollama (local or hosted)
        try {
          const ollama = createOllamaProvider(ollamaBaseUrl);
          const result = streamText({
            model: ollama(ollamaModelName),
            system: SYSTEM_PROMPT,
            messages: modelMessages,
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
          });
        } catch (ollamaError) {
          console.warn("Ollama fallback failed, checking alternative providers...", ollamaError);
        }

        // 3. Fallback to Lovable Gateway if available
        if (lovableKey) {
          try {
            const gateway = createLovableAiGatewayProvider(lovableKey);
            const result = streamText({
              model: gateway("google/gemini-3.6-flash"),
              system: SYSTEM_PROMPT,
              messages: modelMessages,
            });

            return result.toUIMessageStreamResponse({
              originalMessages: messages as UIMessage[],
            });
          } catch (lovableError) {
            console.error("Lovable gateway failed:", lovableError);
          }
        }

        return new Response(
          JSON.stringify({
            error:
              "AI provider unavailable. Please set GROQ_API_KEY in your environment or run Ollama locally (e.g. `ollama run llama3.2`).",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});