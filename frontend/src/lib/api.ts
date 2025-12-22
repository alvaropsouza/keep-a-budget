import {
  Invoice,
  Expense,
  CreateInvoiceDto,
  CreateExpenseDto,
  InvoiceFilters,
  ExpenseFilters,
} from "@/types";

const BASE_URL = "http://localhost:3000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }
  // Check if response has content before parsing JSON
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

function buildQueryString(params: object): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      (typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean")
    ) {
      query.append(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export const api = {
  invoices: {
    getAll: async (filters: InvoiceFilters = {}): Promise<Invoice[]> => {
      const response = await fetch(
        `${BASE_URL}/invoices${buildQueryString(filters)}`
      );
      return handleResponse<Invoice[]>(response);
    },
    getById: async (id: string): Promise<Invoice> => {
      const response = await fetch(`${BASE_URL}/invoices/${id}`);
      return handleResponse<Invoice>(response);
    },
    create: async (data: CreateInvoiceDto): Promise<Invoice> => {
      const response = await fetch(`${BASE_URL}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<Invoice>(response);
    },
    update: async (
      id: string,
      data: Partial<CreateInvoiceDto>
    ): Promise<Invoice> => {
      const response = await fetch(`${BASE_URL}/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<Invoice>(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${BASE_URL}/invoices/${id}`, {
        method: "DELETE",
      });
      return handleResponse<void>(response);
    },
  },
  expenses: {
    getAll: async (filters: ExpenseFilters = {}): Promise<Expense[]> => {
      const response = await fetch(
        `${BASE_URL}/expenses${buildQueryString(filters)}`
      );
      return handleResponse<Expense[]>(response);
    },
    getById: async (id: string): Promise<Expense> => {
      const response = await fetch(`${BASE_URL}/expenses/${id}`);
      return handleResponse<Expense>(response);
    },
    create: async (data: CreateExpenseDto): Promise<Expense> => {
      const formData = new FormData();
      formData.append("bank", data.bank);
      formData.append("category", data.category);
      formData.append("amount", String(data.amount));
      if (data.description) formData.append("description", data.description);
      if (data.installmentTotal)
        formData.append("installmentTotal", String(data.installmentTotal));
      if (data.installmentStartDate)
        formData.append("installmentStartDate", data.installmentStartDate);
      if (data.file) formData.append("file", data.file);

      const response = await fetch(`${BASE_URL}/expenses`, {
        method: "POST",
        body: formData,
      });
      return handleResponse<Expense>(response);
    },
    update: async (
      id: string,
      data: Partial<Omit<CreateExpenseDto, "file">>
    ): Promise<Expense> => {
      const response = await fetch(`${BASE_URL}/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<Expense>(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${BASE_URL}/expenses/${id}`, {
        method: "DELETE",
      });
      return handleResponse<void>(response);
    },
    uploadReceipt: async (id: string, file: File): Promise<void> => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${BASE_URL}/expenses/${id}/receipt`, {
        method: "POST",
        body: formData,
      });
      return handleResponse<void>(response);
    },
  },
};
