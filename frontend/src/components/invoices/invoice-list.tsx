"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Edit, Plus, Trash2 } from "lucide-react";

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
import { Invoice } from "@/types";
import { InvoiceForm } from "./invoice-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(
    undefined
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bankFilter, setBankFilter] = useState<string>("ALL");
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = bankFilter === "ALL" ? {} : { bank: bankFilter };
      const data = await api.invoices.getAll(filters);
      setInvoices(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [bankFilter, toast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await api.invoices.delete(id);
      toast({ title: "Success", description: "Invoice deleted successfully" });
      fetchInvoices();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedInvoice(undefined);
    setIsFormOpen(true);
  };

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center h-24">
            Loading...
          </TableCell>
        </TableRow>
      );
    }

    if (invoices.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center h-24">
            No invoices found.
          </TableCell>
        </TableRow>
      );
    }

    return invoices.map((invoice) => (
      <TableRow key={invoice._id}>
        <TableCell className="font-medium">{invoice.bank}</TableCell>
        <TableCell>{format(new Date(invoice.openDate), "PP")}</TableCell>
        <TableCell>{format(new Date(invoice.closingDate), "PP")}</TableCell>
        <TableCell>{format(new Date(invoice.dueDate), "PP")}</TableCell>
        <TableCell className="text-right">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(invoice.amount)}
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(invoice)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => handleDelete(invoice._id)}
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
          <Select value={bankFilter} onValueChange={setBankFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Bank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Banks</SelectItem>
              <SelectItem value="NUBANK">Nubank</SelectItem>
              <SelectItem value="XP">XP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Invoice
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bank</TableHead>
              <TableHead>Open Date</TableHead>
              <TableHead>Closing Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableBody()}</TableBody>
        </Table>
      </div>

      <InvoiceForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        invoice={selectedInvoice}
        onSuccess={fetchInvoices}
      />
    </div>
  );
}
