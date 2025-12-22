"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
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
import { Invoice } from "@/types";

const invoiceSchema = z.object({
  bank: z.enum(["NUBANK", "XP"]),
  openDate: z.string().min(1, "Open date is required"),
  closingDate: z.string().min(1, "Closing date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  amount: z.coerce.number().min(0, "Amount must be positive").optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  readonly invoice?: Invoice;
  readonly onSuccess: () => void;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function InvoiceForm({
  invoice,
  onSuccess,
  open,
  onOpenChange,
}: InvoiceFormProps) {
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
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      bank: invoice?.bank || "NUBANK",
      openDate: invoice?.openDate
        ? format(new Date(invoice.openDate), "yyyy-MM-dd")
        : "",
      closingDate: invoice?.closingDate
        ? format(new Date(invoice.closingDate), "yyyy-MM-dd")
        : "",
      dueDate: invoice?.dueDate
        ? format(new Date(invoice.dueDate), "yyyy-MM-dd")
        : "",
      amount: invoice?.amount || 0,
    },
  });

  const onSubmit = async (data: InvoiceFormValues) => {
    setIsLoading(true);
    try {
      // Convert dates to ISO strings as expected by API
      const payload = {
        ...data,
        openDate: new Date(data.openDate).toISOString(),
        closingDate: new Date(data.closingDate).toISOString(),
        dueDate: new Date(data.dueDate).toISOString(),
      };

      if (invoice) {
        await api.invoices.update(invoice._id, payload);
        toast({
          title: "Success",
          description: "Invoice updated successfully",
        });
      } else {
        await api.invoices.create(payload);
        toast({
          title: "Success",
          description: "Invoice created successfully",
        });
      }
      onSuccess();
      onOpenChange(false);
      reset();
    } catch (error) {
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
            {invoice ? "Edit Invoice" : "Create Invoice"}
          </DialogTitle>
          <DialogDescription>
            {invoice
              ? "Update the invoice details below."
              : "Enter the details for the new invoice."}
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
            <Label htmlFor="openDate">Open Date</Label>
            <Input id="openDate" type="date" {...register("openDate")} />
            {errors.openDate && (
              <p className="text-sm text-destructive">
                {errors.openDate.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="closingDate">Closing Date</Label>
            <Input id="closingDate" type="date" {...register("closingDate")} />
            {errors.closingDate && (
              <p className="text-sm text-destructive">
                {errors.closingDate.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
            {errors.dueDate && (
              <p className="text-sm text-destructive">
                {errors.dueDate.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Initial Amount</Label>
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
