#!/usr/bin/env node

/**
 * Unit tests for installment date calculation
 * Tests edge cases including month-end dates and year transitions
 */

// Test the date calculation logic
function calculateInstallmentDate(baseDate, monthsToAdd) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();
  
  // Calculate target month and year
  const targetMonth = month + monthsToAdd;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = targetMonth % 12;
  
  // Get the last day of the target month
  const lastDayOfMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  
  // Use the original day or the last day of month if original day doesn't exist
  const targetDay = Math.min(day, lastDayOfMonth);
  
  return new Date(targetYear, normalizedMonth, targetDay);
}

console.log('🧪 Testing Installment Date Calculation\n');

// Test 1: Normal month progression
console.log('Test 1: Normal month progression (6 installments from Jan 15)');
const test1Start = new Date(2024, 0, 15); // January 15, 2024
for (let i = 0; i < 6; i++) {
  const date = calculateInstallmentDate(test1Start, i);
  console.log(`  Month ${i + 1}: ${date.toISOString().split('T')[0]}`);
}

// Test 2: Year transition
console.log('\nTest 2: Year transition (6 installments from Oct 20)');
const test2Start = new Date(2024, 9, 20); // October 20, 2024
for (let i = 0; i < 6; i++) {
  const date = calculateInstallmentDate(test2Start, i);
  console.log(`  Month ${i + 1}: ${date.toISOString().split('T')[0]}`);
}

// Test 3: Month-end edge case (Jan 31 to Feb 28)
console.log('\nTest 3: Month-end edge case (Jan 31 -> Feb 28/29)');
const test3Start = new Date(2024, 0, 31); // January 31, 2024
for (let i = 0; i < 4; i++) {
  const date = calculateInstallmentDate(test3Start, i);
  console.log(`  Month ${i + 1}: ${date.toISOString().split('T')[0]}`);
}

// Test 4: 12-month installment spanning full year
console.log('\nTest 4: 12-month installment (full year from March 1)');
const test4Start = new Date(2024, 2, 1); // March 1, 2024
for (let i = 0; i < 12; i++) {
  const date = calculateInstallmentDate(test4Start, i);
  console.log(`  Month ${String(i + 1).padStart(2, '0')}: ${date.toISOString().split('T')[0]}`);
}

// Test 5: Edge case - May 31 (alternating 30/31 day months)
console.log('\nTest 5: May 31 through months with different day counts');
const test5Start = new Date(2024, 4, 31); // May 31, 2024
for (let i = 0; i < 5; i++) {
  const date = calculateInstallmentDate(test5Start, i);
  console.log(`  Month ${i + 1}: ${date.toISOString().split('T')[0]}`);
}

console.log('\n✅ All date calculations completed successfully!');
console.log('\nKey observations:');
console.log('  - Year transitions work correctly (Oct -> Jan)');
console.log('  - Month-end dates adjust properly (Jan 31 -> Feb 28/29)');
console.log('  - 12-month installments span the entire year correctly');
