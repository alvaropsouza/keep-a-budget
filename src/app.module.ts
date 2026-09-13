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
import { IrDocumentsModule } from "./modules/ir-documents.module";
import { BudgetsModule } from "./modules/budgets.module";
import { CategoriesModule } from "./modules/categories.module";
import { VehiclesModule } from "./modules/vehicles.module";
import { VehicleRevisionsModule } from "./modules/vehicle-revisions.module";
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
    IrDocumentsModule,
    IrStocksModule,
    BudgetsModule,
    CategoriesModule,
    VehiclesModule,
    VehicleRevisionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
