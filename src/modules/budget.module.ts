import { Module } from "@nestjs/common";
import { BudgetService } from "../services/budget.service";
import { BudgetController } from "./budget.controller";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}
