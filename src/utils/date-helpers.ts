export interface MonthRange {
  label: string;
  periodFrom: string;
  periodTo: string;
  invoiceDate: string;
  description: string;
}

const formatDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getMonthRangeForOffset(offsetMonths: number = 0): MonthRange {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const year = target.getFullYear();
  const month = target.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const monthName = monthNames[month];

  let label = 'Current Month';
  if (offsetMonths === 0) label = 'This Month';
  else if (offsetMonths === -1) label = 'Last Month';
  else if (offsetMonths === 1) label = 'Next Month';
  else label = `${monthName} ${year}`;

  return {
    label,
    periodFrom: formatDate(firstDay),
    periodTo: formatDate(lastDay),
    invoiceDate: formatDate(lastDay),
    description: `Salary - ${monthName} ${year}`,
  };
}

export function getMonthYearAbbr(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Invoice';
  const monthAbbr = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${monthAbbr}-${year}`;
}
