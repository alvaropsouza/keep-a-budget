import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import type { ParsedExpenseResponse } from "../dto/parse-expense.dto";

const CATEGORIES = ["Alimentação", "Transporte", "Lazer", "Compras", "Saúde", "Educação", "Contas", "Eletrônicos", "Viagem", "Outros"];
const BANKS = ["NUBANK", "XP"];

const SYSTEM_PROMPT = `Você é um assistente que extrai dados de despesas financeiras a partir de texto livre em português.
Dado um texto descrevendo uma despesa, extraia os campos abaixo e retorne SOMENTE um objeto JSON válido, sem markdown.

Campos a extrair:
- bank: banco do cartão. Valores válidos: ${BANKS.join(", ")}. null se não identificado.
- amount: valor numérico em reais (ex: "50 reais" → 50, "R$ 1.200,50" → 1200.50). null se não identificado.
- date: data no formato ISO YYYY-MM-DD. Resolva datas relativas com a data atual fornecida. null se não identificada.
- category: uma das categorias válidas: ${CATEGORIES.join(", ")}. null se não identificada ou não corresponder.
- description: descrição da despesa. null se não houver.
- installmentTotal: número total de parcelas (ex: "em 3x" → 3). null se não parcelado ou não informado.

Retorne APENAS o JSON, sem explicações.`;

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
      max_tokens: 400,
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
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Data atual: ${today}\n\nTexto: ${text}` }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");
    return parseJsonResponse(content.text);
  }
}
