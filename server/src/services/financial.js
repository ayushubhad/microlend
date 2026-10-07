// Calculate EMI
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

// Generate Amortization Schedule
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
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + i);

    let interestComponent = roundToTwoDecimals(currentBalance * r);
    let principalComponent = roundToTwoDecimals(emi - interestComponent);

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

// Round to two decimal places
function roundToTwoDecimals(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// Format Currency
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
