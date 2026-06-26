import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import type { ParsedExpenseResponse } from "../dto/parse-expense.dto";

const CATEGORIES = ["Alimentação", "Transporte", "Lazer", "Compras", "Saúde", "Educação", "Contas", "Eletrônicos", "Viagem", "Outros"];
const BANKS = ["NUBANK", "XP"];

export interface ParsedIrReceiptResponse {
  date: string | null;
  category: string | null;
  amount: number | null;
  description: string | null;
}

export interface ParsedStockTicketResponse {
  ticker: string | null;
  companyName: string | null;
  broker: string | null;
  date: string | null;
  type: "COMPRA" | "VENDA" | null;
  operationType: "NORMAL" | "DAY_TRADE" | null;
  quantity: number | null;
  unitPrice: number | null;
  fees: number | null;
}

const ITEM_SCHEMA = `{"bank":"${BANKS.join("|")}|null","amount":number|null,"date":"YYYY-MM-DD"|null,"category":"${CATEGORIES.join("|")}|null","description":"string|null","installmentTotal":number|null}`;

const SYSTEM_PROMPT = `Extrai despesa de comprovante ou texto PT-BR. Retorne JSON puro, sem markdown, sem explicações.
Schema (objeto único): ${ITEM_SCHEMA}
Banco — prioridade: logo > cor dominante > texto institucional. NUBANK = fundo branco, roxo/violeta (#820AD1) em destaques, logo "Nu" circle ou texto "Nubank", Nu Pagamentos, Nu Financeira. XP = fundo preto/escuro, texto branco, logo "XP" minimalista, variações aceitas: XP Investimentos, XP Inc, Banco XP, Rico. bank=null se banco não suportado, imagem ilegível ou sinais insuficientes.
Datas relativas: resolver com a data fornecida. Valores em reais: "R$ 1.200,50"→1200.50.`;

const IMAGE_SYSTEM_PROMPT = `Extrai TODAS as transações visíveis em comprovante ou extrato bancário PT-BR. Retorne JSON puro, sem markdown, sem explicações.
Schema (array obrigatório — mesmo com uma única transação): [${ITEM_SCHEMA}]
Banco — prioridade: logo > cor dominante > texto institucional. NUBANK = fundo branco, roxo/violeta (#820AD1) em destaques, logo "Nu" circle ou texto "Nubank", Nu Pagamentos, Nu Financeira. XP = fundo preto/escuro, texto branco, logo "XP" minimalista, variações: XP Investimentos, XP Inc, Banco XP, Rico. bank=null se banco não suportado ou sinais insuficientes.
Regras: uma entrada por transação; nunca agregar; valores "R$ 1.200,50"→1200.50; datas relativas resolver com data fornecida; imagem ilegível → [].`;

function parseJsonResponse(raw: string): ParsedExpenseResponse {
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return JSON.parse(text) as ParsedExpenseResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Falha ao interpretar resposta da IA: ${message}\nResposta recebida: ${raw}`);
  }
}

function parseJsonArrayResponse(raw: string): ParsedExpenseResponse[] {
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    const parsed: unknown = JSON.parse(text);
    return Array.isArray(parsed)
      ? (parsed as ParsedExpenseResponse[])
      : [(parsed as ParsedExpenseResponse)];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Falha ao interpretar resposta da IA: ${message}\nResposta recebida: ${raw}`);
  }
}

@Injectable()
export class AiService {
  private readonly client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async parseExpenseFromImage(imageBuffer: Buffer, mimeType: string): Promise<ParsedExpenseResponse[]> {
    const today = new Date().toISOString().split("T")[0];
    const base64 = imageBuffer.toString("base64");

    const isImage = mimeType.startsWith("image/");
    const contentBlock = isImage
      ? {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mimeType as "image/jpeg" | "image/png" | "image/webp",
            data: base64,
          },
        }
      : {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: base64,
          },
        };

    const message = await this.client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: IMAGE_SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [
          contentBlock,
          {
            type: "text",
            text: `Data atual: ${today}\n\nExtraia todas as transações visíveis neste comprovante ou extrato.`,
          },
        ],
      }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");
    return parseJsonArrayResponse(content.text);
  }

  async parseIrReceiptFromFile(fileBuffer: Buffer, mimeType: string): Promise<ParsedIrReceiptResponse> {
    const today = new Date().toISOString().split("T")[0];
    const base64 = fileBuffer.toString("base64");
    const irSystemPrompt = `Extrai dados de comprovante PIX/TED/débito para declaração IR. Retorne JSON puro, sem markdown, sem explicações.
Schema: {"date":"YYYY-MM-DD|null","category":"${CATEGORIES.join("|")}|null","amount":number|null,"description":"string|null"}
Regras: date=data do pagamento, amount=valor em reais (ex "R$ 1.200,50"→1200.50), category=categoria mais adequada ao beneficiário, description=nome do beneficiário/prestador.`;

    const isImage = mimeType.startsWith("image/");
    const contentBlock = isImage
      ? {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mimeType as "image/jpeg" | "image/png" | "image/webp",
            data: base64,
          },
        }
      : {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: base64,
          },
        };

    const message = await this.client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 250,
      system: irSystemPrompt,
      messages: [{
        role: "user",
        content: [
          contentBlock,
          { type: "text", text: `Data atual: ${today}\n\nExtraia os dados do comprovante.` },
        ],
      }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");
    return parseJsonResponse(content.text) as unknown as ParsedIrReceiptResponse;
  }

  async parseStockTicket(fileBuffer: Buffer, mimeType: string): Promise<ParsedStockTicketResponse> {
    const today = new Date().toISOString().split("T")[0];
    const base64 = fileBuffer.toString("base64");
    const schema = `{"ticker":"string|null","companyName":"string|null","broker":"string|null","date":"YYYY-MM-DD|null","type":"COMPRA|VENDA|null","operationType":"NORMAL|DAY_TRADE|null","quantity":number|null,"unitPrice":number|null,"fees":number|null}`;
    const systemPrompt = `Extrai dados de nota de corretagem ou comprovante de operação em bolsa (B3/Brasil). Retorne JSON puro, sem markdown, sem explicações.
Schema: ${schema}
Regras:
- ticker: código de negociação na B3 (ex: PETR4, ITUB3, MXRF11, WEGE3)
- companyName: nome da empresa/fundo. Se não aparecer explicitamente no comprovante, infira a partir do ticker usando seu conhecimento de ativos B3 (ex: MXRF11→"Maxi Renda FII", PETR4→"Petróleo Brasileiro SA", ITUB4→"Itaú Unibanco SA", BBDC4→"Banco Bradesco SA", VALE3→"Vale SA", WEGE3→"WEG SA"). Para FIIs o nome termina em "FII" ou "Fundo de Investimento Imobiliário".
- broker: nome da corretora. Detecte pela identidade visual: XP=tela preta/verde "XP Investimentos", Rico, Clear, BTG, NuInvest (Easynvest), Genial, Ágora, Toro.
- date: data da operação em YYYY-MM-DD
- type: COMPRA se compra/aquisição, VENDA se venda/alienação
- operationType: DAY_TRADE se compra e venda no mesmo dia, NORMAL caso contrário
- quantity: quantidade de ações/cotas (inteiro). Em comprovantes XP usar "Quantidade executada".
- unitPrice: preço unitário em reais. Em comprovantes XP usar "Preço médio executado". Ex: "R$ 9,69"→9.69
- fees: total de taxas (corretagem + emolumentos + liquidação). Se não visível, retorne 0.
- Retorne null apenas quando genuinamente impossível inferir.`;

    const isImage = mimeType.startsWith("image/");
    const contentBlock = isImage
      ? {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mimeType as "image/jpeg" | "image/png" | "image/webp",
            data: base64,
          },
        }
      : {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: base64,
          },
        };

    const message = await this.client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: [
          contentBlock,
          { type: "text", text: `Data atual: ${today}\n\nExtraia os dados da operação em bolsa.` },
        ],
      }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");
    return parseJsonResponse(content.text) as unknown as ParsedStockTicketResponse;
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
