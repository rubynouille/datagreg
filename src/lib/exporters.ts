import { DatasetPair, ExportFormat } from "./types";

function toGeminiJSONL(items: DatasetPair[]): string {
  const lines = items.map((item) => {
    const obj = {
      contents: [
        { role: "user", parts: [{ text: item.input }] },
        { role: "model", parts: [{ text: item.output }] },
      ],
    };
    return JSON.stringify(obj);
  });
  return lines.join("\n");
}

// Example alternative format to show extensibility (OpenAI chat-style)
function toOpenAIChatJSONL(items: DatasetPair[]): string {
  const lines = items.map((item) => {
    const obj = {
      messages: [
        { role: "user", content: item.input },
        { role: "assistant", content: item.output },
      ],
    };
    return JSON.stringify(obj);
  });
  return lines.join("\n");
}

export function exportDataset(format: ExportFormat, items: DatasetPair[]): { filename: string; mimeType: string; body: string } {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  switch (format) {
    case "gemini": {
      return {
        filename: `dataset-gemini-${timestamp}.jsonl`,
        mimeType: "application/x-ndjson",
        body: toGeminiJSONL(items),
      };
    }
    case "openai_chat": {
      return {
        filename: `dataset-openai-chat-${timestamp}.jsonl`,
        mimeType: "application/x-ndjson",
        body: toOpenAIChatJSONL(items),
      };
    }
    default: {
      const _exhaustive: never = format;
      return _exhaustive;
    }
  }
}


