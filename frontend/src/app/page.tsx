import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { ExpenseList } from "@/components/expenses/expense-list";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="invoices" className="space-y-4">
            <InvoiceList />
          </TabsContent>
          <TabsContent value="expenses" className="space-y-4">
            <ExpenseList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
