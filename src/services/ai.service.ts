import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import type { ParsedExpenseResponse } from "../dto/parse-expense.dto";

const CATEGORIES = ["Alimentação", "Transporte", "Lazer", "Compras", "Saúde", "Educação", "Contas", "Eletrônicos", "Viagem", "Outros"];
const BANKS = ["NUBANK", "XP"];

const SYSTEM_PROMPT = `Extrai despesa de texto PT-BR. Retorne JSON puro, sem markdown, sem explicações.
Schema: {"bank":"${BANKS.join("|")}|null","amount":number|null,"date":"YYYY-MM-DD|null","category":"${CATEGORIES.join("|")}|null","description":"string|null","installmentTotal":number|null}
Datas relativas: resolver com a data fornecida. Valores em reais: "R$ 1.200,50"→1200.50.`;

function parseJsonResponse(raw: string): ParsedExpenseResponse {
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return JSON.parse(text) as ParsedExpenseResponse;
  } catch (error: any) {
    throw new Error(`Falha ao interpretar resposta da IA: ${error?.message}\nResposta recebida: ${raw}`);
  }
}

@Injectable()
export class AiService {
  private readonly client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async parseExpenseFromImage(imageBuffer: Buffer, mimeType: string): Promise<ParsedExpenseResponse> {
    const today = new Date().toISOString().split("T")[0];
    const base64 = imageBuffer.toString("base64");

    const message = await this.client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 250,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/webp",
              data: base64,
            },
          },
          {
            type: "text",
            text: `Data atual: ${today}\n\nEsta é uma imagem de um recibo ou comprovante. Extraia os dados da despesa.`,
          },
        ],
      }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");
    return parseJsonResponse(content.text);
  }

  async parseExpense(text: string): Promise<ParsedExpenseResponse> {
    const today = new Date().toISOString().split("T")[0];

    const message = await this.client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Data atual: ${today}\n\nTexto: ${text}` }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");
    return parseJsonResponse(content.text);
  }
}
