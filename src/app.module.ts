import { Module } from "@nestjs/common";
import { HealthController } from "./modules/health.controller";
import { AuthModule } from "./modules/auth.module";
import { UsersModule } from "./modules/users.module";
import { InvoicesModule } from "./modules/invoices.module";
import { ExpensesModule } from "./modules/expenses.module";
import { FixedExpensesModule } from "./modules/fixed-expenses.module";
import { CacheModule } from "./modules/cache.module";
import { AiModule } from "./modules/ai.module";
import { IrDocumentModule } from "./modules/ir-document.module";
import { BudgetModule } from "./modules/budget.module";
import { VehiclesModule } from "./modules/vehicles.module";

@Module({
  imports: [
    CacheModule,
    AuthModule,
    UsersModule,
    InvoicesModule,
    ExpensesModule,
    FixedExpensesModule,
    AiModule,
    IrDocumentModule,
    BudgetModule,
    VehiclesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
