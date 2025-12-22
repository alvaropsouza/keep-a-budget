"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit, Plus, Trash2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Expense } from "@/types";
import { ExpenseForm } from "./expense-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(
    undefined
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bankFilter, setBankFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (bankFilter !== "ALL") filters.bank = bankFilter;
      if (categoryFilter) filters.category = categoryFilter;

      const data = await api.expenses.getAll(filters);
      setExpenses(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [bankFilter, categoryFilter, toast]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchExpenses();
    }, 500); // Debounce category filter
    return () => clearTimeout(timeoutId);
  }, [fetchExpenses]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.expenses.delete(id);
      toast({ title: "Success", description: "Expense deleted successfully" });
      fetchExpenses();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedExpense(undefined);
    setIsFormOpen(true);
  };

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center h-24">
            Loading...
          </TableCell>
        </TableRow>
      );
    }

    if (expenses.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center h-24">
            No expenses found.
          </TableCell>
        </TableRow>
      );
    }

    return expenses.map((expense) => (
      <TableRow key={expense._id}>
        <TableCell className="font-medium">{expense.bank}</TableCell>
        <TableCell>{expense.category}</TableCell>
        <TableCell>{expense.description || "-"}</TableCell>
        <TableCell className="text-right">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(expense.amount)}
        </TableCell>
        <TableCell className="text-center">
          {expense.installment
            ? `${expense.installment.current}/${expense.installment.total}`
            : "-"}
        </TableCell>
        <TableCell className="text-center">
          {expense.receipt ? (
            <a
              href={expense.receipt}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-500 hover:underline"
            >
              <FileText className="h-4 w-4 mr-1" /> View
            </a>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(expense)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => handleDelete(expense._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ));
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <h2 className="text-2xl font-bold tracking-tight mr-2">Expenses</h2>
          <Select value={bankFilter} onValueChange={setBankFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Bank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Banks</SelectItem>
              <SelectItem value="NUBANK">Nubank</SelectItem>
              <SelectItem value="XP">XP</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-[200px]"
          />
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bank</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Installment</TableHead>
              <TableHead className="text-center">Receipt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableBody()}</TableBody>
        </Table>
      </div>

      <ExpenseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        expense={selectedExpense}
        onSuccess={fetchExpenses}
      />
    </div>
  );
}
