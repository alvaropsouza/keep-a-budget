import { Module } from "@nestjs/common";
import { HealthController } from "./modules/health.controller";
import { AuthModule } from "./modules/auth.module";
import { UsersModule } from "./modules/users.module";
import { InvoicesModule } from "./modules/invoices.module";
import { ExpensesModule } from "./modules/expenses.module";
import { FixedExpensesModule } from "./modules/fixed-expenses.module";
import { ExtraIncomesModule } from "./modules/extra-incomes.module";
import { PaymentMethodsModule } from "./modules/payment-methods.module";
import { CacheModule } from "./modules/cache.module";
import { AiModule } from "./modules/ai.module";
import { IrDocumentModule } from "./modules/ir-documents.module";
import { BudgetModule } from "./modules/budgets.module";
import { CategoryModule } from "./modules/categories.module";
import { VehiclesModule } from "./modules/vehicles.module";
import { IrStocksModule } from "./modules/ir-stocks.module";

@Module({
  imports: [
    CacheModule,
    AuthModule,
    UsersModule,
    InvoicesModule,
    ExpensesModule,
    FixedExpensesModule,
    ExtraIncomesModule,
    PaymentMethodsModule,
    AiModule,
    IrDocumentModule,
    IrStocksModule,
    BudgetModule,
    CategoryModule,
    VehiclesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
