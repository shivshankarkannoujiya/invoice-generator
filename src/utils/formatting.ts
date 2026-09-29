export function formatAmountNumber(amount: number): string {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  const num = Number(amount) || 0;
  if (currencyCode === 'INR') {
    return `₹${num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`;
  } else if (currencyCode === 'USD') {
    return `$${num.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`;
  } else if (currencyCode === 'EUR') {
    return `€${num.toLocaleString('de-DE', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`;
  } else if (currencyCode === 'GBP') {
    return `£${num.toLocaleString('en-GB', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`;
  }

  return `${currencyCode} ${num.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

export function formatFullDate(dateStr?: string): string {
  if (!dateStr) return '';
  // Check if already human formatted e.g. "1 September 2026"
  if (dateStr.includes(' ')) return dateStr;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }); // e.g. "1 September 2026"
}

export function formatPeriodDisplay(from?: string, to?: string): string {
  if (!from && !to) return '';
  if (from && !to) return formatFullDate(from);
  if (!from && to) return formatFullDate(to);

  const d1 = new Date(from!);
  const d2 = new Date(to!);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return `${from} – ${to}`;
  }

  const m1 = d1.toLocaleDateString('en-GB', { month: 'long' });
  const m2 = d2.toLocaleDateString('en-GB', { month: 'long' });
  const y1 = d1.getFullYear();
  const y2 = d2.getFullYear();

  if (m1 === m2 && y1 === y2) {
    return `${d1.getDate()} ${m1} – ${d2.getDate()} ${m2} ${y1}`;
  }

  return `${d1.getDate()} ${m1} ${y1} – ${d2.getDate()} ${m2} ${y2}`;
}

export function formatDateDisplay(dateStr?: string): string {
  return formatFullDate(dateStr);
}

export function maskAccountNumber(accountNumber: string, show: boolean = false): string {
  if (!accountNumber) return '';
  if (show || accountNumber.length <= 4) return accountNumber;
  const last4 = accountNumber.slice(-4);
  return '•'.repeat(Math.max(accountNumber.length - 4, 4)) + ' ' + last4;
}
