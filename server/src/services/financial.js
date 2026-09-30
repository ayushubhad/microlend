/**
 * Financial Calculation Engine for MicroLend
 * Strictly deterministic monetary and amortization calculations.
 * Uses exact decimal arithmetic and standard banking rounding rules.
 */

/**
 * Calculates Equated Monthly Installment (EMI) using the standard Reducing Balance Amortization Formula:
 * E = P * [r * (1 + r)^n] / [(1 + r)^n - 1]
 * 
 * @param {number|string} principal - Loan Principal (P)
 * @param {number|string} annualRatePercent - Annual Percentage Rate (APR) in % (e.g. 9.75)
 * @param {number} tenureMonths - Total installment months (n)
 * @returns {object} - { emi, totalPayable, totalInterest }
 */
function calculateEMI(principal, annualRatePercent, tenureMonths) {
  const P = parseFloat(principal);
  const R = parseFloat(annualRatePercent);
  const n = parseInt(tenureMonths, 10);

  if (isNaN(P) || P <= 0) throw new Error('Invalid principal amount');
  if (isNaN(R) || R < 0) throw new Error('Invalid interest rate');
  if (isNaN(n) || n <= 0) throw new Error('Invalid tenure months');

  if (R === 0) {
    const emi = roundToTwoDecimals(P / n);
    const totalPayable = roundToTwoDecimals(emi * n);
    return {
      emi,
      totalPayable,
      totalInterest: 0.00
    };
  }

  // Monthly interest rate
  const r = R / (12 * 100);
  const compoundFactor = Math.pow(1 + r, n);
  const emiUnrounded = (P * r * compoundFactor) / (compoundFactor - 1);
  const emi = roundToTwoDecimals(emiUnrounded);
  const totalPayable = roundToTwoDecimals(emi * n);
  const totalInterest = roundToTwoDecimals(totalPayable - P);

  return {
    emi,
    totalPayable,
    totalInterest
  };
}

/**
 * Generates an exact amortization schedule for each installment month 1..N.
 * Adjusts the final installment so the ending balance reduces to exactly 0.00.
 * 
 * @param {number|string} principal 
 * @param {number|string} annualRatePercent 
 * @param {number} tenureMonths 
 * @param {Date|string} startDate 
 * @returns {Array<object>} - Array of schedule objects
 */
function generateAmortizationSchedule(principal, annualRatePercent, tenureMonths, startDate = new Date()) {
  const P = parseFloat(principal);
  const R = parseFloat(annualRatePercent);
  const n = parseInt(tenureMonths, 10);
  const { emi } = calculateEMI(P, R, n);

  const r = R / (12 * 100);
  let currentBalance = P;
  const schedule = [];
  const start = new Date(startDate);

  for (let i = 1; i <= n; i++) {
    // Due date is i months after disbursement
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + i);

    let interestComponent = roundToTwoDecimals(currentBalance * r);
    let principalComponent = roundToTwoDecimals(emi - interestComponent);

    // Final month adjustment to eliminate rounding drift
    if (i === n || principalComponent > currentBalance) {
      principalComponent = roundToTwoDecimals(currentBalance);
      interestComponent = roundToTwoDecimals(emi - principalComponent);
      currentBalance = 0.00;
    } else {
      currentBalance = roundToTwoDecimals(currentBalance - principalComponent);
    }

    schedule.push({
      emiNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      emiAmount: emi,
      principalComponent,
      interestComponent,
      remainingBalance: currentBalance
    });
  }

  return schedule;
}

/**
 * Helper to round to exact two decimal places (half up).
 */
function roundToTwoDecimals(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a numeric value to Indian Rupee representation (e.g. ₹ 24,500.00)
 */
function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return '₹ 0.00';
  return '₹ ' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

module.exports = {
  calculateEMI,
  generateAmortizationSchedule,
  roundToTwoDecimals,
  formatCurrency
};
