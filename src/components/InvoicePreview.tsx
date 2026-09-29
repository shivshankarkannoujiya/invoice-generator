import React, { useState } from 'react';
import { Invoice, InvoiceProfile } from '../types/invoice';
import {
  formatAmountNumber,
  formatFullDate,
  formatPeriodDisplay,
  maskAccountNumber,
} from '../utils/formatting';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import invoiceBg from '../assets/invoice-bg.png';

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

  // Controlled or uncontrolled reveal state
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
    '1 August – 31 August 2026';

  const invoiceDateDisplay = formatFullDate(invoice.invoiceDate) || '1 September 2026';

  return (
    <div className="flex justify-center w-full">
      <div
        id={previewId}
        style={{
          width: '794px', // Standard 96DPI A4 width (210mm)
          minHeight: '1123px', // Standard 96DPI A4 height (297mm)
          boxSizing: 'border-box',
        }}
        className={`bg-white text-slate-800 px-16 py-14 flex flex-col justify-between relative text-sm overflow-hidden ${
          isPdfRendering ? 'shadow-none border-none' : 'shadow-2xl border border-indigo-100/60 rounded-xs'
        }`}
      >
        {/* Custom Artwork Background Image */}
        <img
          src={invoiceBg}
          alt="Invoice Background"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
        />

        {/* Content Container */}
        <div className="relative z-10 space-y-7">
          {/* 1. CENTERED TOP TITLE */}
          <div className="text-center pt-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans uppercase">
              {invoice.title || 'SALARY INVOICE'}
            </h1>
          </div>

          {/* 2. FROM & INVOICE METADATA ROW */}
          <div className="flex justify-between items-start pt-3">
            {/* FROM */}
            <div className="space-y-1 text-left">
              <span className="text-xs text-slate-500 font-medium block">From</span>
              <p className="font-bold text-slate-900 text-sm">{issuer.name || 'John Doe'}</p>
              <p className="text-slate-700 text-xs font-medium">{issuer.email || 'john.doe@example.com'}</p>
              {issuer.phone && <p className="text-slate-600 text-xs">{issuer.phone}</p>}
              {issuer.address && (
                <p className="text-slate-600 text-xs whitespace-pre-line leading-relaxed">{issuer.address}</p>
              )}
            </div>

            {/* INVOICE DETAILS TABLE */}
            <div className="text-right space-y-1.5 text-xs">
              <div className="flex justify-end items-baseline gap-2">
                <span className="text-slate-500">Invoice Number:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{invoice.invoiceNumber || 'INV-001'}</span>
              </div>

              <div className="flex justify-end items-baseline gap-2">
                <span className="text-slate-500">Invoice Date:</span>
                <span className="font-semibold text-slate-900">{invoiceDateDisplay}</span>
              </div>

              <div className="flex justify-end items-baseline gap-2">
                <span className="text-slate-500">Period:</span>
                <span className="font-semibold text-slate-900">{periodDisplay}</span>
              </div>
            </div>
          </div>

          {/* 3. BILL TO (CLIENT) */}
          <div className="pt-2 text-left space-y-1">
            <span className="text-xs text-slate-500 font-medium block">Bill To</span>
            <p className="font-bold text-slate-900 text-sm">{client.name || 'Sensiwise AI'}</p>
            <div className="text-slate-700 text-xs whitespace-pre-line leading-relaxed">
              {client.address || '85 Great Portland Street\nFirst Floor\nLondon, W1W 7LT, GB'}
            </div>
            {client.country && client.country !== 'GB' && client.country !== 'India' && (
              <p className="text-slate-600 text-xs font-medium">{client.country}</p>
            )}
          </div>

          {/* 4. LINE ITEMS TABLE */}
          <div className="pt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900/80 text-xs font-bold text-slate-900">
                  <th className="py-2.5 px-0 text-left">Description</th>
                  <th className="py-2.5 px-3 text-center w-16">Qty</th>
                  <th className="py-2.5 px-4 text-right w-28">Rate</th>
                  <th className="py-2.5 px-0 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-xs">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                      No line items specified
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3 px-0 font-medium text-slate-800">
                        {item.description || 'Salary — 1 September to 30 September 2026 (inclusive)'}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-800 font-mono">
                        {item.quantity ?? 1}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-800 font-mono">
                        {formatAmountNumber(item.rate)}
                      </td>
                      <td className="py-3 px-0 text-right font-medium text-slate-900 font-mono">
                        {formatAmountNumber(item.amount ?? (item.quantity || 1) * (item.rate || 0))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 5. SUBTOTAL & TOTAL DUE */}
          <div className="flex justify-end pt-1">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">Subtotal:</span>
                <span className="font-mono font-semibold">{formatAmountNumber(subtotal)}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between items-baseline">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-tight">
                  TOTAL DUE:
                </span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {formatAmountNumber(total)}
                </span>
              </div>
            </div>
          </div>

          {/* 6. PAYMENT DETAILS */}
          <div className="pt-6 text-left">
            <div className="rounded-xl border border-slate-200/90 bg-white/85 p-5 shadow-sm">
              <div className="flex justify-between items-center pb-2.5 mb-3.5 border-b border-slate-200/70">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Payment Details
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Direct bank transfer (NEFT / RTGS / IMPS)
                  </p>
                </div>

                {/* Reveal / Mask Toggle (Hidden on PDF export) */}
                {!isPdfRendering && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggleReveal}
                      className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-indigo-200 hover:border-indigo-300 shadow-2xs transition cursor-pointer select-none"
                      title={isRevealed ? 'Hide sensitive account number' : 'Reveal full account number'}
                    >
                      {isRevealed ? <EyeOff size={11} className="text-amber-600" /> : <Eye size={11} className="text-indigo-600" />}
                      <span>{isRevealed ? 'Mask' : 'Reveal'}</span>
                    </button>

                    {isRevealed && payment.accountNumber && (
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                        title="Copy full account number"
                      >
                        {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Balanced 2-Row Layout: No awkward gaps */}
              <div className="space-y-3 text-xs">
                {/* Row 1: Bank & Account Holder (50% / 50%) */}
                <div className="grid grid-cols-2 gap-x-8">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Bank Name
                    </span>
                    <span className="font-semibold text-slate-900 text-xs block mt-0.5">
                      {payment.bankName || 'HDFC Bank'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Account Holder Name
                    </span>
                    <span className="font-semibold text-slate-900 text-xs block mt-0.5 break-words">
                      {payment.accountHolder || 'John Doe'}
                    </span>
                  </div>
                </div>

                {/* Row 2: Account Number, IFSC, Account Type (33% / 33% / 33%) */}
                <div className="grid grid-cols-3 gap-x-6 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Account Number
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5 tracking-tight">
                      {isRevealed || isPdfRendering
                        ? payment.accountNumber || '50100234567890'
                        : maskAccountNumber(payment.accountNumber || '50100234567890', false)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      IFSC Code
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5 tracking-tight">
                      {payment.ifsc || 'HDFC0001234'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Account Type
                    </span>
                    <span className="font-semibold text-slate-900 text-xs block mt-0.5">
                      {payment.accountType || 'Savings'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. FOOTER */}
          <div className="pt-5 border-t border-slate-200/80 text-left space-y-1.5">
            <p className="text-xs text-slate-800">
              <strong className="font-bold text-slate-900">Payment Terms:</strong>{' '}
              <span className="font-medium text-slate-700">{paymentTerms || 'Due on receipt'}</span>
            </p>

            <p className="text-xs text-slate-600 italic font-medium">
              {invoice.notes || 'Thank you!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
