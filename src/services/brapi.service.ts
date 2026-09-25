import { Injectable, Logger } from "@nestjs/common";
import Brapi from "brapi";

interface BrapiTickerInfo {
  companyName: string | null;
  cnpj: string | null;
}

interface BrapiFiiListResponse {
  fiis: Array<{ symbol: string; name: string | null; cnpj: string | null }>;
}

const REQUEST_TIMEOUT_MS = 8000;

const UNKNOWN_TICKER: BrapiTickerInfo = { companyName: null, cnpj: null };

@Injectable()
export class BrapiService {
  private readonly logger = new Logger(BrapiService.name);

  async getTickerInfo(ticker: string): Promise<BrapiTickerInfo> {
    const token = process.env.BRAPI_TOKEN;
    if (!token) return UNKNOWN_TICKER;

    try {
      const fiiRes = await fetch(
        `https://brapi.dev/api/v2/fii/list?symbols=${encodeURIComponent(ticker)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
      if (fiiRes.ok) {
        const fiiData = (await fiiRes.json()) as BrapiFiiListResponse;
        const fii = fiiData.fiis?.[0];
        if (fii) {
          return { companyName: fii.name ?? null, cnpj: fii.cnpj ?? null };
        }
      }

      const client = new Brapi({ apiKey: token });
      const quoteRes = await client.quote.retrieve(ticker);
      const result = quoteRes.results?.[0];
      return {
        companyName: result?.longName ?? result?.shortName ?? null,
        cnpj: null,
      };
    } catch (err) {
      this.logger.warn({ err, ticker }, "brapi lookup failed");
      return UNKNOWN_TICKER;
    }
  }
}
