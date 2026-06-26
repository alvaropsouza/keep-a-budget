import { Injectable } from "@nestjs/common";
import Brapi from "brapi";

interface BrapiTickerInfo {
  companyName: string | null;
  cnpj: string | null;
}

interface BrapiFiiListResponse {
  fiis: Array<{ symbol: string; name: string | null; cnpj: string | null }>;
}

@Injectable()
export class BrapiService {
  async getTickerInfo(ticker: string): Promise<BrapiTickerInfo> {
    const token = process.env.BRAPI_TOKEN;
    if (!token) return { companyName: null, cnpj: null };

    const fiiRes = await fetch(
      `https://brapi.dev/api/v2/fii/list?symbols=${encodeURIComponent(ticker)}`,
      { headers: { Authorization: `Bearer ${token}` } },
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
  }
}
