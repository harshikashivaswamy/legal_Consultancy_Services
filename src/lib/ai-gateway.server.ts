import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createGroqProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export function createOllamaProvider(baseURL = process.env["OLLAMA_BASE_URL"] || "http://127.0.0.1:11434/v1") {
  return createOpenAICompatible({
    name: "ollama",
    baseURL,
  });
}

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable-ai-gateway",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}