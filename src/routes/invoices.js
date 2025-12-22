const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} = require('../controllers/invoiceController');

async function invoiceRoutes(fastify, options) {
  // Get all invoices with optional query filters
  fastify.get('/', getAllInvoices);

  // Get invoice by ID
  fastify.get('/:id', getInvoiceById);

  // Create new invoice
  fastify.post('/', createInvoice);

  // Update invoice
  fastify.put('/:id', updateInvoice);

  // Delete invoice
  fastify.delete('/:id', deleteInvoice);
}

module.exports = invoiceRoutes;
