#!/usr/bin/env node

/**
 * Comprehensive project structure test
 * Validates that all components are properly integrated
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running comprehensive project validation...\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

// Test 1: Required files exist
test('All required config files exist', () => {
  const required = [
    'package.json',
    'README.md',
    '.gitignore',
    '.env.example',
    'src/server.js',
  ];
  required.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, file))) {
      throw new Error(`Missing file: ${file}`);
    }
  });
});

// Test 2: Model files exist and load
test('Model files exist and load correctly', () => {
  require('./src/models/CardInvoice');
  require('./src/models/Expense');
});

// Test 3: Controller files exist and load
test('Controller files exist and load correctly', () => {
  const invoiceController = require('./src/controllers/invoiceController');
  const expenseController = require('./src/controllers/expenseController');
  
  // Check invoice controller exports
  if (!invoiceController.getAllInvoices) throw new Error('Missing getAllInvoices');
  if (!invoiceController.getInvoiceById) throw new Error('Missing getInvoiceById');
  if (!invoiceController.createInvoice) throw new Error('Missing createInvoice');
  if (!invoiceController.updateInvoice) throw new Error('Missing updateInvoice');
  if (!invoiceController.deleteInvoice) throw new Error('Missing deleteInvoice');
  
  // Check expense controller exports
  if (!expenseController.getAllExpenses) throw new Error('Missing getAllExpenses');
  if (!expenseController.getExpenseById) throw new Error('Missing getExpenseById');
  if (!expenseController.createExpense) throw new Error('Missing createExpense');
  if (!expenseController.updateExpense) throw new Error('Missing updateExpense');
  if (!expenseController.deleteExpense) throw new Error('Missing deleteExpense');
  if (!expenseController.uploadReceipt) throw new Error('Missing uploadReceipt');
});

// Test 4: Route files exist and load
test('Route files exist and load correctly', () => {
  require('./src/routes/invoices');
  require('./src/routes/expenses');
});

// Test 5: Config files exist and load
test('Config files exist and load correctly', () => {
  require('./src/config/s3');
  require('./src/config/validateEnv');
  // Skip database.js as it requires MongoDB connection
});

// Test 6: Utility files exist and load
test('Utility files exist and load correctly', () => {
  const s3Upload = require('./src/utils/s3Upload');
  if (!s3Upload.uploadToS3) throw new Error('Missing uploadToS3 function');
});

// Test 7: Package.json has correct structure
test('package.json has correct structure', () => {
  const pkg = require('./package.json');
  if (!pkg.name) throw new Error('Missing package name');
  if (!pkg.scripts) throw new Error('Missing scripts');
  if (!pkg.scripts.start) throw new Error('Missing start script');
  if (!pkg.scripts.dev) throw new Error('Missing dev script');
  if (!pkg.dependencies) throw new Error('Missing dependencies');
  if (!pkg.dependencies.fastify) throw new Error('Missing fastify dependency');
  if (!pkg.dependencies.mongoose) throw new Error('Missing mongoose dependency');
});

// Test 8: README has essential sections
test('README.md has essential documentation', () => {
  const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
  if (!readme.includes('Installation')) throw new Error('Missing Installation section');
  if (!readme.includes('API Endpoints')) throw new Error('Missing API Endpoints section');
  if (!readme.includes('Features')) throw new Error('Missing Features section');
});

// Test 9: .env.example has all required variables
test('.env.example has all required variables', () => {
  const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
  const required = [
    'MONGODB_URI',
    'PORT',
    'HOST',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME',
    'MAX_FILE_SIZE_MB',
  ];
  required.forEach(variable => {
    if (!envExample.includes(variable)) {
      throw new Error(`Missing ${variable} in .env.example`);
    }
  });
});

// Test 10: Directory structure is correct
test('Directory structure is correct', () => {
  const dirs = [
    'src',
    'src/models',
    'src/controllers',
    'src/routes',
    'src/config',
    'src/utils',
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(path.join(__dirname, dir))) {
      throw new Error(`Missing directory: ${dir}`);
    }
  });
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 All tests passed! Project structure is valid.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
}
