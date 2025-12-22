require('dotenv').config();
const fastify = require('fastify');
const multipart = require('@fastify/multipart');
const connectDB = require('./config/database');
const invoiceRoutes = require('./routes/invoices');
const expenseRoutes = require('./routes/expenses');

const app = fastify({ logger: true });

// Register multipart for file uploads
app.register(multipart);

// Register routes
app.register(invoiceRoutes, { prefix: '/api/invoices' });
app.register(expenseRoutes, { prefix: '/api/expenses' });

// Health check route
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Fastify server
    const port = process.env.PORT || 3000;
    const host = '0.0.0.0';
    
    await app.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

module.exports = app;
