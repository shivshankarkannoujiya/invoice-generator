import React, { useState } from 'react';
import { Invoice, InvoiceProfile } from '../types/invoice';
import {
  formatAmountNumber,
  formatFullDate,
  formatPeriodDisplay,
  maskAccountNumber,
} from '../utils/formatting';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

interface InvoicePreviewProps {
  invoice: Partial<Invoice>;
  profile: InvoiceProfile;
  previewId?: string;
  isPdfRendering?: boolean;
  isBankRevealed?: boolean;
  onToggleBankReveal?: () => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  profile,
  previewId = 'invoice-preview-capture',
  isPdfRendering = false,
  isBankRevealed,
  onToggleBankReveal,
}) => {
  const [localUnmask, setLocalUnmask] = useState(false);
  const [copied, setCopied] = useState(false);

  const isRevealed = isPdfRendering ? true : isBankRevealed !== undefined ? isBankRevealed : localUnmask;

  const handleToggleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleBankReveal) {
      onToggleBankReveal();
    } else {
      setLocalUnmask(!localUnmask);
    }
  };

  const snapshot = invoice.profileSnapshot;
  const issuer = snapshot?.issuer || profile.issuer;
  const client = snapshot?.client || profile.client;
  const payment = snapshot?.payment || profile.payment;
  const paymentTerms = snapshot?.defaults?.paymentTerms || profile.defaults?.paymentTerms || 'Due on receipt';

  const items = invoice.items || [];
  const subtotal = invoice.subtotal ?? items.reduce((acc, it) => acc + (it.amount || 0), 0);
  const total = invoice.total ?? subtotal;

  const handleCopyAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (payment.accountNumber) {
      navigator.clipboard.writeText(payment.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const periodDisplay =
    invoice.periodCustom ||
    formatPeriodDisplay(invoice.periodFrom, invoice.periodTo) ||
    '1 September – 30 September 2026';

  const invoiceDateDisplay = formatFullDate(invoice.invoiceDate) || '1 October 2026';

  return (
    <div className="flex justify-center w-full">
      <div
        id={previewId}
        style={{
          width: '794px',
          minHeight: '1123px',
          boxSizing: 'border-box',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        }}
        className={`bg-white text-gray-900 px-16 py-14 flex flex-col relative overflow-hidden ${
          isPdfRendering ? 'shadow-none border-none' : 'shadow-lg border border-gray-200 rounded-sm'
        }`}
      >

        {/* ── TITLE ── */}
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-extrabold text-gray-900 uppercase tracking-[0.04em]">
            {invoice.title || 'Salary Invoice'}
          </h1>
        </div>

        {/* ── FROM + INVOICE META ── */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-left">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">From</p>
            <p className="text-[13px] font-bold text-gray-900 leading-snug">
              {issuer.name || 'John Doe'}
            </p>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {issuer.email || 'john.doe@example.com'}
            </p>
            {issuer.phone && (
              <p className="text-[11px] text-gray-500 mt-0.5">{issuer.phone}</p>
            )}
            {issuer.address && (
              <p className="text-[11px] text-gray-500 whitespace-pre-line leading-relaxed mt-0.5">
                {issuer.address}
              </p>
            )}
          </div>

          <div className="text-right">
            <table className="ml-auto text-[11px]">
              <tbody>
                <tr>
                  <td className="text-gray-400 pr-5 py-0.5 text-right">Invoice Number:</td>
                  <td className="font-semibold text-gray-900 text-right py-0.5 font-mono text-xs">
                    {invoice.invoiceNumber || 'INV-001'}
                  </td>
                </tr>
                <tr>
                  <td className="text-gray-400 pr-5 py-0.5 text-right">Invoice Date:</td>
                  <td className="font-semibold text-gray-900 text-right py-0.5">
                    {invoiceDateDisplay}
                  </td>
                </tr>
                <tr>
                  <td className="text-gray-400 pr-5 py-0.5 text-right">Period:</td>
                  <td className="font-semibold text-gray-900 text-right py-0.5">
                    {periodDisplay}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── BILL TO ── */}
        <div className="mb-10">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Bill To</p>
          <p className="text-[13px] font-bold text-gray-900 leading-snug">
            {client.name || 'Sensiwise AI'}
          </p>
          <div className="text-[11px] text-gray-600 whitespace-pre-line leading-relaxed mt-0.5">
            {client.address || '167-169 Great Portland St\nFirst Floor\nLondon, W1W 7LT, GB'}
          </div>
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <div>
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="pb-2 pr-4 text-left font-bold text-gray-900">Description</th>
                <th className="pb-2 px-4 text-right font-bold text-gray-900 w-16">Qty</th>
                <th className="pb-2 px-4 text-right font-bold text-gray-900 w-28">Rate</th>
                <th className="pb-2 pl-4 text-right font-bold text-gray-900 w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                    No line items
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-gray-200">
                    <td className="py-3.5 pr-4 text-gray-800">
                      {item.description || 'Salary — 1 September to 30 September 2026 (inclusive)'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-700 font-mono">
                      {item.quantity ?? 1}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-700 font-mono">
                      {formatAmountNumber(item.rate)}
                    </td>
                    <td className="py-3.5 pl-4 text-right font-medium text-gray-900 font-mono">
                      {formatAmountNumber(item.amount ?? (item.quantity || 1) * (item.rate || 0))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── TOTALS ── */}
        <div className="flex justify-end mt-4">
          <div className="w-64 text-[11px]">
            <div className="flex justify-between py-2 text-gray-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium text-gray-800 border-b border-gray-300 pb-1">
                {formatAmountNumber(subtotal)}
              </span>
            </div>
            <div className="flex justify-between py-2 items-baseline">
              <span className="font-extrabold text-gray-900 text-xs uppercase tracking-wide">
                Total Due:
              </span>
              <span className="font-extrabold text-gray-900 text-base font-mono">
                {formatAmountNumber(total)}
              </span>
            </div>
          </div>
        </div>

        {/* ── SPACER ── */}
        <div className="flex-grow min-h-[30px]" />

        {/* ── PAYMENT DETAILS ── */}
        <div className="text-left mt-6">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-[12px] font-bold text-gray-900">Payment Details</h4>

            {!isPdfRendering && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleReveal}
                  className="text-[10px] text-gray-400 hover:text-gray-700 font-medium flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 hover:border-gray-400 transition cursor-pointer select-none"
                  title={isRevealed ? 'Hide account number' : 'Reveal account number'}
                >
                  {isRevealed ? <EyeOff size={10} /> : <Eye size={10} />}
                  <span>{isRevealed ? 'Mask' : 'Reveal'}</span>
                </button>

                {isRevealed && payment.accountNumber && (
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="text-[10px] text-gray-400 hover:text-gray-700 font-medium flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 hover:border-gray-400 transition cursor-pointer"
                    title="Copy account number"
                  >
                    {copied ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1 text-[11px] text-gray-800 leading-relaxed">
            <p>
              <span className="font-bold text-gray-900">Bank Name:</span>{' '}
              {payment.bankName || 'HDFC Bank'}
            </p>
            <p>
              <span className="font-bold text-gray-900">Account Number:</span>{' '}
              <span className="font-mono">
                {isRevealed || isPdfRendering
                  ? payment.accountNumber || '50100234567890'
                  : maskAccountNumber(payment.accountNumber || '50100234567890', false)}
              </span>
            </p>
            <p>
              <span className="font-bold text-gray-900">IFSC Code:</span>{' '}
              <span className="font-mono">{payment.ifsc || 'HDFC0001234'}</span>
            </p>
            <p>
              <span className="font-bold text-gray-900">Account Type:</span>{' '}
              {payment.accountType || 'Savings'}
            </p>
            <p>
              <span className="font-bold text-gray-900">Account Holder Name:</span>{' '}
              {payment.accountHolder || 'John Doe'}
            </p>
            <p>
              <span className="font-bold text-gray-900">Payment Terms:</span>{' '}
              {paymentTerms || 'Due on receipt'}
            </p>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="mt-8">
          <p className="text-[11px] text-gray-500 italic">
            {invoice.notes || 'Thank you for your service.'}
          </p>
        </div>

      </div>
    </div>
  );
};
