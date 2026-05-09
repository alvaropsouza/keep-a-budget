import { Module } from "@nestjs/common";
import { HealthController } from "./modules/health.controller";
import { AuthModule } from "./modules/auth.module";
import { UsersModule } from "./modules/users.module";
import { InvoicesModule } from "./modules/invoices.module";
import { ExpensesModule } from "./modules/expenses.module";
import { FixedExpensesModule } from "./modules/fixed-expenses.module";

@Module({
  imports: [AuthModule, UsersModule, InvoicesModule, ExpensesModule, FixedExpensesModule],
  controllers: [HealthController],
})
export class AppModule {}
