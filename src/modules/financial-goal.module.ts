import { Module } from "@nestjs/common";
import { FinancialGoalService } from "../services/financial-goal.service";
import { FinancialGoalController } from "../controllers/financial-goal.controller";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [FinancialGoalController],
  providers: [FinancialGoalService],
  exports: [FinancialGoalService],
})
export class FinancialGoalModule {}
