const CardInvoice = require('../models/CardInvoice');

// Helper function to build filter query
const buildFilterQuery = (queryParams) => {
  const filter = {};

  // Filter by bank
  if (queryParams.bank) {
    filter.bank = queryParams.bank;
  }

  // Filter by invoiceDate
  if (queryParams.invoiceDate) {
    filter.invoiceDate = new Date(queryParams.invoiceDate);
  }

  // Date range filters
  if (queryParams.startDate || queryParams.endDate) {
    filter.invoiceDate = {};
    if (queryParams.startDate) {
      filter.invoiceDate.$gte = new Date(queryParams.startDate);
    }
    if (queryParams.endDate) {
      filter.invoiceDate.$lte = new Date(queryParams.endDate);
    }
  }

  // Created at date range
  if (queryParams.createdStartDate || queryParams.createdEndDate) {
    filter.createdAt = {};
    if (queryParams.createdStartDate) {
      filter.createdAt.$gte = new Date(queryParams.createdStartDate);
    }
    if (queryParams.createdEndDate) {
      filter.createdAt.$lte = new Date(queryParams.createdEndDate);
    }
  }

  // Updated at date range
  if (queryParams.updatedStartDate || queryParams.updatedEndDate) {
    filter.updatedAt = {};
    if (queryParams.updatedStartDate) {
      filter.updatedAt.$gte = new Date(queryParams.updatedStartDate);
    }
    if (queryParams.updatedEndDate) {
      filter.updatedAt.$lte = new Date(queryParams.updatedEndDate);
    }
  }

  return filter;
};

// Get all invoices with optional filters
const getAllInvoices = async (request, reply) => {
  try {
    const filter = buildFilterQuery(request.query);
    const invoices = await CardInvoice.find(filter).sort({ invoiceDate: -1 });
    reply.send(invoices);
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

// Get invoice by ID
const getInvoiceById = async (request, reply) => {
  try {
    const invoice = await CardInvoice.findById(request.params.id);
    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }
    reply.send(invoice);
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

// Create new invoice
const createInvoice = async (request, reply) => {
  try {
    const invoice = new CardInvoice(request.body);
    await invoice.save();
    reply.status(201).send(invoice);
  } catch (error) {
    reply.status(400).send({ error: error.message });
  }
};

// Update invoice
const updateInvoice = async (request, reply) => {
  try {
    const invoice = await CardInvoice.findByIdAndUpdate(
      request.params.id,
      request.body,
      { new: true, runValidators: true }
    );
    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }
    reply.send(invoice);
  } catch (error) {
    reply.status(400).send({ error: error.message });
  }
};

// Delete invoice
const deleteInvoice = async (request, reply) => {
  try {
    const invoice = await CardInvoice.findByIdAndDelete(request.params.id);
    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }
    reply.send({ message: 'Invoice deleted successfully' });
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
