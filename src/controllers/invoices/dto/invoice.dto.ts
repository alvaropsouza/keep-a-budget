export interface CreateInvoiceDto {
  bank: string;
  invoiceDate: Date;
  amount: number;
  status?: string;
}

export interface UpdateInvoiceDto extends Partial<CreateInvoiceDto> {}

export interface InvoiceQueryParamsDto {
  bank?: string;
  invoiceDate?: string;
  startDate?: string;
  endDate?: string;
  createdStartDate?: string;
  createdEndDate?: string;
  updatedStartDate?: string;
  updatedEndDate?: string;
}
