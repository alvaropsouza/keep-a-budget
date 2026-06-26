import { Injectable, Logger } from "@nestjs/common";
import { BrapiService } from "../../services/brapi.service";

export type GetTickerInfoInput = { ticker: string };
export type GetTickerInfoOutput = { ticker: string; companyName: string | null; cnpj: string | null };

@Injectable()
export class GetTickerInfoUseCase {
  private readonly logger = new Logger(GetTickerInfoUseCase.name);

  constructor(private readonly brapiService: BrapiService) {}

  async execute(input: GetTickerInfoInput): Promise<GetTickerInfoOutput> {
    this.logger.log({ ticker: input.ticker }, "GetTickerInfoUseCase.execute");
    const info = await this.brapiService.getTickerInfo(input.ticker);
    this.logger.log({ ticker: input.ticker, ...info }, "GetTickerInfoUseCase.execute done");
    return { ticker: input.ticker.toUpperCase(), companyName: info.companyName, cnpj: info.cnpj };
  }
}
