import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "../services/ai.service";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
