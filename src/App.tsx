import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, InvoiceProfile } from './types/invoice';
import { InvoicePreview } from './components/InvoicePreview';
import { downloadInvoicePDF } from './utils/pdf-download';
import { formatAmountNumber } from './utils/formatting';
import { getMonthRangeForOffset } from './utils/date-helpers';
import {
  Download,
  Plus,
  Trash2,
  Calendar,
  Building,
  User,
  CreditCard,
  FileText,
  RotateCcw,
  CheckCircle,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  DollarSign,
  MessageSquare,
} from 'lucide-react';

const STORAGE_KEY = 'sensiwise_salary_invoice_state_v3';

const DEFAULT_INVOICE_STATE: {
  invoice: Partial<Invoice>;
  profile: InvoiceProfile;
} = {
  profile: {
    issuer: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+91 98765 43210',
      address: 'Bangalore, Karnataka, India',
    },
    client: {
      name: 'Sensiwise AI',
      address: '85 Great Portland Street\nFirst Floor\nLondon, W1W 7LT, GB',
      country: 'GB',
    },
    payment: {
      bankName: 'HDFC Bank',
      accountNumber: '50100234567890',
      ifsc: 'HDFC0001234',
      accountType: 'Savings',
      accountHolder: 'John Doe',
    },
    defaults: {
      currency: 'INR',
      paymentTerms: 'Due on receipt',
      rate: 100000,
      prefix: 'INV-',
    },
  },
  invoice: {
    title: 'SALARY INVOICE',
    invoiceNumber: 'INV-001',
    invoiceDate: '2026-10-01',
    periodFrom: '2026-09-01',
    periodTo: '2026-09-30',
    periodCustom: '1 September – 30 September 2026',
    items: [
      {
        id: 'item-1',
        description: 'Salary — 1 September to 30 September 2026 (inclusive)',
        quantity: 1,
        rate: 100000,
        amount: 100000,
      },
    ],
    notes: 'Thank you!',
    subtotal: 100000,
    total: 100000,
  },
};

export const App: React.FC = () => {
  // Load saved state or default to exact sample
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile && parsed.invoice) {
          // Revert description back to "Salary — " and update default rate to 100,000 if using previous 25,000
          if (Array.isArray(parsed.invoice.items)) {
            parsed.invoice.items = parsed.invoice.items.map((it: any) => ({
              ...it,
              description: it.description?.replace(/^Software Engineering Consulting Services\s*—\s*/i, 'Salary — ') || it.description,
              rate: it.rate === 25000 ? 100000 : it.rate,
              amount: it.rate === 25000 ? 100000 * (it.quantity || 1) : it.amount,
            }));
            const newSubtotal = parsed.invoice.items.reduce((acc: number, it: any) => acc + (it.amount || 0), 0);
            parsed.invoice.subtotal = newSubtotal;
            parsed.invoice.total = newSubtotal;
          }
          if (parsed.profile?.defaults?.rate === 25000) {
            parsed.profile.defaults.rate = 100000;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved invoice from localStorage:', e);
    }
    return DEFAULT_INVOICE_STATE;
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [downloading, setDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.75);
  const [isBankRevealed, setIsBankRevealed] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [data]);

  const profile = data.profile;
  const invoice = data.invoice;

  // Update Issuer (From)
  const updateIssuer = (field: keyof typeof profile.issuer, val: string) => {
    setData((prev: typeof DEFAULT_INVOICE_STATE) => ({
      ...prev,
      profile: {
        ...prev.profile,
        issuer: { ...prev.profile.issuer, [field]: val },
      },
    }));
  };

  // Update Client (Bill To)
  const updateClient = (field: keyof typeof profile.client, val: string) => {
    setData((prev: typeof DEFAULT_INVOICE_STATE) => ({
      ...prev,
      profile: {
        ...prev.profile,
        client: { ...prev.profile.client, [field]: val },
      },
    }));
  };

  // Update Payment Details
  const updatePayment = (field: keyof typeof profile.payment, val: string) => {
    setData((prev: typeof DEFAULT_INVOICE_STATE) => ({
      ...prev,
      profile: {
        ...prev.profile,
        payment: { ...prev.profile.payment, [field]: val },
      },
    }));
  };

  // Update Invoice Details
  const updateInvoice = (field: keyof Invoice, val: any) => {
    setData((prev: typeof DEFAULT_INVOICE_STATE) => ({
      ...prev,
      invoice: { ...prev.invoice, [field]: val },
    }));
  };

  // Update Defaults
  const updateDefaults = (field: keyof typeof profile.defaults, val: any) => {
    setData((prev: typeof DEFAULT_INVOICE_STATE) => ({
      ...prev,
      profile: {
        ...prev.profile,
        defaults: { ...prev.profile.defaults, [field]: val },
      },
    }));
  };

  // Line Item Handlers
  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...(invoice.items || [])];
    const item = { ...updated[index] };

    if (field === 'quantity') {
      const q = Math.max(0, Number(val));
      item.quantity = q;
      item.amount = q * (item.rate || 0);
    } else if (field === 'rate') {
      const r = Math.max(0, Number(val));
      item.rate = r;
      item.amount = (item.quantity || 1) * r;
    } else {
      (item as any)[field] = val;
    }

    updated[index] = item;
    const subtotal = updated.reduce((acc: number, it: InvoiceItem) => acc + (it.amount || 0), 0);

    setData((prev: typeof DEFAULT_INVOICE_STATE) => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        items: updated,
        subtotal,
        total: subtotal,
      },
    }));
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: 'Salary',
      quantity: 1,
      rate: 100000,
      amount: 100000,
    };
    const updated = [...(invoice.items || []), newItem];
    const subtotal = updated.reduce((acc: number, it: InvoiceItem) => acc + (it.amount || 0), 0);

    setData((prev: typeof DEFAULT_INVOICE_STATE) => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        items: updated,
        subtotal,
        total: subtotal,
      },
    }));
  };

  const handleRemoveItem = (index: number) => {
    const updated = (invoice.items || []).filter((_: InvoiceItem, i: number) => i !== index);
    const subtotal = updated.reduce((acc: number, it: InvoiceItem) => acc + (it.amount || 0), 0);

    setData((prev: typeof DEFAULT_INVOICE_STATE) => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        items: updated,
        subtotal,
        total: subtotal,
      },
    }));
  };

  // Apply Quick Date Range Preset
  const applyDatePreset = (offsetMonths: number) => {
    const preset = getMonthRangeForOffset(offsetMonths);
    const updatedItems = [...(invoice.items || [])];
    const periodText = `${preset.periodFrom} – ${preset.periodTo}`;
    if (updatedItems[0]) {
      updatedItems[0] = {
        ...updatedItems[0],
        description: `Salary — ${preset.label} (inclusive)`,
      };
    }
    setData((prev: typeof DEFAULT_INVOICE_STATE) => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        periodFrom: preset.periodFrom,
        periodTo: preset.periodTo,
        periodCustom: periodText,
        invoiceDate: preset.invoiceDate,
        items: updatedItems,
      },
    }));
  };

  // Reset to default sample
  const handleResetSample = () => {
    if (confirm('Reset all details to the default invoice values?')) {
      setData(DEFAULT_INVOICE_STATE);
      setSuccessMsg('Default invoice details restored');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // PDF Download Handler
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const clientName = profile.client.name || 'Sensiwise_AI';
      const invoiceNumber = invoice.invoiceNumber || '003';
      const invoiceDate = invoice.invoiceDate || '2026-09-01';

      await downloadInvoicePDF({
        elementId: 'offscreen-pdf-capture-element',
        clientName,
        invoiceNumber,
        invoiceDate,
      });

      setSuccessMsg(`PDF downloaded successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Invoice combined object for preview
  const previewInvoiceData: Partial<Invoice> = {
    ...invoice,
    profileSnapshot: {
      issuer: profile.issuer,
      client: profile.client,
      payment: profile.payment,
      defaults: profile.defaults,
    },
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* 1. TOP NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-sm">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                  Salary Invoice Generator
                </h1>
                <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {profile.client.name || 'Sensiwise AI'}
                </span>
              </div>
              <p className="text-2xs text-slate-400 mt-0.5 font-medium">
                Edit details on left • Live print-ready PDF preview on right
              </p>
            </div>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeTab === 'editor'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fill Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Preview
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Reset Defaults Button */}
            <button
              type="button"
              onClick={handleResetSample}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
              title="Reset all fields to default invoice values"
            >
              <RotateCcw size={14} />
              <span>Reset Defaults</span>
            </button>

            {/* Primary Download PDF Button */}
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownload}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Download size={15} className={downloading ? 'animate-bounce' : ''} />
              <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {successMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle size={15} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: EDITABLE DETAILS                            */}
          {/* ======================================================== */}
          <div
            className={`lg:col-span-6 space-y-6 ${
              activeTab === 'editor' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* SECTION 1: INVOICE HEADER & DATES */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Invoice Details & Dates
                  </h2>
                </div>

                {/* Quick Month Presets */}
                <div className="flex items-center gap-1 text-2xs">
                  <button
                    type="button"
                    onClick={() => applyDatePreset(-1)}
                    className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-600 font-semibold transition"
                    title="Fill Last Month"
                  >
                    Last Month
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset(0)}
                    className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-600 font-semibold transition"
                    title="Fill This Month"
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset(1)}
                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-semibold transition"
                    title="Fill Next Month"
                  >
                    Next Month
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Invoice Title
                  </label>
                  <input
                    type="text"
                    value={invoice.title || ''}
                    onChange={(e) => updateInvoice('title', e.target.value)}
                    placeholder="SALARY INVOICE"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/60 font-bold text-slate-800 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoice.invoiceNumber || ''}
                    onChange={(e) => updateInvoice('invoiceNumber', e.target.value)}
                    placeholder="INV-001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/60 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="text"
                    value={invoice.invoiceDate || ''}
                    onChange={(e) => updateInvoice('invoiceDate', e.target.value)}
                    placeholder="1 October 2026 or 2026-10-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/60 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Period Text
                  </label>
                  <input
                    type="text"
                    value={invoice.periodCustom || ''}
                    onChange={(e) => updateInvoice('periodCustom', e.target.value)}
                    placeholder="1 September – 30 September 2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/60 text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: FROM & BILL TO DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FROM (ISSUER) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <User size={14} />
                  </div>
                  <h3 className="text-2xs font-bold uppercase tracking-wider text-slate-900">
                    From
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-2xs font-semibold text-slate-400 mb-0.5">Your Name</label>
                    <input
                      type="text"
                      value={profile.issuer.name || ''}
                      onChange={(e) => updateIssuer('name', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-slate-400 mb-0.5">Email</label>
                    <input
                      type="email"
                      value={profile.issuer.email || ''}
                      onChange={(e) => updateIssuer('email', e.target.value)}
                      placeholder="john.doe@example.com"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* BILL TO (CLIENT) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Building size={14} />
                  </div>
                  <h3 className="text-2xs font-bold uppercase tracking-wider text-slate-900">
                    Bill To (Client)
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-2xs font-semibold text-slate-400 mb-0.5">Company Name</label>
                    <input
                      type="text"
                      value={profile.client.name || ''}
                      onChange={(e) => updateClient('name', e.target.value)}
                      placeholder="Sensiwise AI"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-slate-400 mb-0.5">Address</label>
                    <textarea
                      rows={3}
                      value={profile.client.address || ''}
                      onChange={(e) => updateClient('address', e.target.value)}
                      placeholder="85 Great Portland Street&#10;First Floor&#10;London, W1W 7LT, GB"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-700 text-xs resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: LINE ITEMS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Line Items
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Item</span>
                </button>
              </div>

              {/* Items Table */}
              <div className="space-y-2.5">
                {(invoice.items || []).map((item: InvoiceItem, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 grid grid-cols-12 gap-2.5 items-center"
                  >
                    <div className="col-span-6">
                      <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="Salary — 1 August to 31 August 2026 (inclusive)"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-200 bg-white font-mono font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        Rate
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs text-right rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="col-span-1 flex items-center justify-end pt-3">
                      {(invoice.items || []).length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete item"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <span className="w-6"></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <div className="w-56 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">{formatAmountNumber(invoice.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>TOTAL DUE:</span>
                    <span className="font-mono text-base">{formatAmountNumber(invoice.total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: PAYMENT DETAILS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  <CreditCard size={16} />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Payment Details
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={profile.payment.bankName || ''}
                    onChange={(e) => updatePayment('bankName', e.target.value)}
                    placeholder="HDFC Bank"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50/60 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={profile.payment.accountHolder || ''}
                    onChange={(e) => updatePayment('accountHolder', e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50/60 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={profile.payment.accountNumber || ''}
                    onChange={(e) => updatePayment('accountNumber', e.target.value)}
                    placeholder="50100234567890"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50/60 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={profile.payment.ifsc || ''}
                    onChange={(e) => updatePayment('ifsc', e.target.value)}
                    placeholder="HDFC0001234"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50/60 font-mono font-bold text-slate-800 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Account Type
                  </label>
                  <input
                    type="text"
                    value={profile.payment.accountType || ''}
                    onChange={(e) => updatePayment('accountType', e.target.value)}
                    placeholder="Savings"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50/60 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={profile.defaults.paymentTerms || ''}
                    onChange={(e) => updateDefaults('paymentTerms', e.target.value)}
                    placeholder="Due on receipt"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50/60 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: NOTES / REMARKS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <MessageSquare size={14} />
                </div>
                <h3 className="text-2xs font-bold uppercase tracking-wider text-slate-900">
                  Footer / Notes
                </h3>
              </div>
              <input
                type="text"
                value={invoice.notes || ''}
                onChange={(e) => updateInvoice('notes', e.target.value)}
                placeholder="Thank you!"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/60 text-xs font-medium"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: LIVE A4 PREVIEW                            */}
          {/* ======================================================== */}
          <div
            className={`lg:col-span-6 lg:sticky lg:top-24 space-y-3 ${
              activeTab === 'preview' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Preview Toolbar */}
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">Live Invoice Preview</span>
                <span className="text-2xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  Print Ready A4
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Bank Mask / Reveal */}
                <button
                  type="button"
                  onClick={() => setIsBankRevealed(!isBankRevealed)}
                  className={`px-2 py-1 rounded-lg text-2xs font-semibold flex items-center gap-1 border transition cursor-pointer ${
                    isBankRevealed
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                  title={isBankRevealed ? 'Mask account number' : 'Reveal account number'}
                >
                  {isBankRevealed ? <EyeOff size={12} className="text-amber-600" /> : <Eye size={12} />}
                  <span>{isBankRevealed ? 'Mask A/C' : 'Reveal A/C'}</span>
                </button>

                {/* Zoom controls */}
                <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.1))}
                    className="p-1 hover:bg-white rounded text-slate-600 transition"
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="text-2xs font-mono px-1 font-semibold text-slate-600">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(1.0, z + 0.1))}
                    className="p-1 hover:bg-white rounded text-slate-600 transition"
                    title="Zoom In"
                  >
                    <ZoomIn size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* A4 Canvas Container */}
            <div className="bg-slate-200/70 p-4 sm:p-6 rounded-2xl border border-slate-300 flex justify-center overflow-x-auto min-h-[600px] shadow-inner">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  marginBottom: `-${(1 - zoomLevel) * 1123}px`,
                }}
                className="transition-transform duration-100"
              >
                <InvoicePreview
                  invoice={previewInvoiceData}
                  profile={profile}
                  previewId="screen-live-preview-canvas"
                  isBankRevealed={isBankRevealed}
                  onToggleBankReveal={() => setIsBankRevealed(!isBankRevealed)}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. DEDICATED OFFSCREEN PDF CAPTURE ELEMENT */}
      {/* Unscaled 100% 794x1123 A4 element captured by html2canvas for retina-sharp PDF */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -100 }}>
        <InvoicePreview
          invoice={previewInvoiceData}
          profile={profile}
          previewId="offscreen-pdf-capture-element"
          isPdfRendering={true}
        />
      </div>
    </div>
  );
};
