export interface InvoiceProfile {
  issuer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  client: {
    name: string;
    address: string;
    country?: string;
  };
  payment: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountType?: string;
    accountHolder: string;
  };
  defaults: {
    currency: string;
    paymentTerms: string;
    rate: number;
    prefix?: string;
  };
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  title?: string;
  invoiceNumber: string;
  invoiceDate: string;
  periodFrom: string;
  periodTo: string;
  periodCustom?: string;
  items: InvoiceItem[];
  notes?: string;
  subtotal: number;
  total: number;
  profileSnapshot?: InvoiceProfile;
}
