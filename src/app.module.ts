import { Module } from "@nestjs/common";
import { HealthController } from "./modules/health.controller";
import { AuthHttpController } from "./modules/auth-http.controller";
import { UsersHttpController } from "./modules/users-http.controller";
import { InvoicesHttpController } from "./modules/invoices-http.controller";
import { ExpensesHttpController } from "./modules/expenses-http.controller";
import { FixedExpensesHttpController } from "./modules/fixed-expenses-http.controller";

@Module({
  controllers: [
    HealthController,
    AuthHttpController,
    UsersHttpController,
    InvoicesHttpController,
    ExpensesHttpController,
    FixedExpensesHttpController,
  ],
})
export class AppModule {}
