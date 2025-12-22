#!/usr/bin/env node

// Simple validation script to check module loading
console.log('🔍 Validating project structure...\n');

try {
  console.log('✓ Loading models...');
  require('./src/models/CardInvoice');
  require('./src/models/Expense');
  
  console.log('✓ Loading controllers...');
  require('./src/controllers/invoiceController');
  require('./src/controllers/expenseController');
  
  console.log('✓ Loading routes...');
  require('./src/routes/invoices');
  require('./src/routes/expenses');
  
  console.log('✓ Loading config...');
  require('./src/config/s3');
  // Skip database to avoid connection attempt
  
  console.log('✓ Loading utils...');
  require('./src/utils/s3Upload');
  
  console.log('\n✅ All modules loaded successfully!');
  console.log('\n📋 Project structure:');
  console.log('   - Models: CardInvoice, Expense');
  console.log('   - Controllers: invoiceController, expenseController');
  console.log('   - Routes: /api/invoices, /api/expenses');
  console.log('   - Features: CRUD, Query filters, Installments, S3 uploads');
  
} catch (error) {
  console.error('\n❌ Error loading modules:', error.message);
  process.exit(1);
}
