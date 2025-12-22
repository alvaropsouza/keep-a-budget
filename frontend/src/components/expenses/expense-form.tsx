"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Expense } from "@/types";

const expenseSchema = z.object({
  bank: z.enum(["NUBANK", "XP"]),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().optional(),
  installmentTotal: z.coerce.number().min(1).optional(),
  installmentStartDate: z.string().optional(),
  file: z.any().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  readonly expense?: Expense;
  readonly onSuccess: () => void;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function ExpenseForm({
  expense,
  onSuccess,
  open,
  onOpenChange,
}: ExpenseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      bank: expense?.bank || "NUBANK",
      category: expense?.category || "",
      amount: expense?.amount || 0,
      description: expense?.description || "",
      installmentTotal: expense?.installment?.total || 1,
      installmentStartDate: "",
    },
  });

  const onSubmit = async (data: ExpenseFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        file: data.file?.[0],
      };

      if (expense) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { file, ...updateData } = payload;
        await api.expenses.update(expense._id, updateData);

        if (payload.file) {
          await api.expenses.uploadReceipt(expense._id, payload.file);
        }

        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
      } else {
        await api.expenses.create(payload);
        toast({
          title: "Success",
          description: "Expense created successfully",
        });
      }
      onSuccess();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Edit Expense" : "Create Expense"}
          </DialogTitle>
          <DialogDescription>
            {expense
              ? "Update the expense details below."
              : "Enter the details for the new expense."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="bank">Bank</Label>
            <Select
              onValueChange={(value) =>
                setValue("bank", value as "NUBANK" | "XP")
              }
              defaultValue={watch("bank")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NUBANK">Nubank</SelectItem>
                <SelectItem value="XP">XP</SelectItem>
              </SelectContent>
            </Select>
            {errors.bank && (
              <p className="text-sm text-destructive">{errors.bank.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" {...register("category")} />
            {errors.category && (
              <p className="text-sm text-destructive">
                {errors.category.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
          {!expense && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="installmentTotal">Installments</Label>
                <Input
                  id="installmentTotal"
                  type="number"
                  min="1"
                  {...register("installmentTotal")}
                />
                {errors.installmentTotal && (
                  <p className="text-sm text-destructive">
                    {errors.installmentTotal.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="installmentStartDate">
                  Installment Start Date
                </Label>
                <Input
                  id="installmentStartDate"
                  type="date"
                  {...register("installmentStartDate")}
                />
                {errors.installmentStartDate && (
                  <p className="text-sm text-destructive">
                    {errors.installmentStartDate.message}
                  </p>
                )}
              </div>
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="file">Receipt</Label>
            <Input
              id="file"
              type="file"
              accept="image/*"
              {...register("file")}
            />
            {errors.file && (
              <p className="text-sm text-destructive">
                {errors.file.message as string}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
