# Invoice Generator (Frontend-Only)

A lightweight, lightning-fast frontend application where users can fill in their details and immediately download a clean, high-resolution, print-accurate A4 PDF invoice.

No backend or database setup required. It runs 100% locally in the browser with automatic `localStorage` persistence.

---

## 🚀 Features

- **Direct Form Entry**:
  - **Invoice Details & Dates**: Invoice number, invoice date, billing period with 1-click presets (*Last Month*, *This Month*, *Next Month*), currency selection, and payment terms.
  - **From (Your Details)**: Name, email, phone, and address.
  - **Bill To (Client Details)**: Client company name, address, and country.
  - **Line Items**: Dynamic line items (add/remove), quantity, rate, and automatic subtotal & total calculation.
  - **Bank & Payment Details**: Bank name, account holder, account number, IFSC / SWIFT code.
  - **Notes / Remarks**: Customizable notes printed cleanly on the invoice.
- **Real-Time Live A4 Preview**:
  - Live side-by-side preview with custom Sensiwise artwork background (`invoice-bg.png`) and typography.
  - Zoom controls (fit / 75% / 100%).
  - Account number mask/reveal toggle.
- **1-Click A4 PDF Download**:
  - Deterministic high-resolution PDF download using `html2canvas` and `jsPDF`.
  - Automatic file naming: `<Client>_Invoice_<InvoiceNumber>_<Mon-YYYY>.pdf`.
- **Auto-Save**: Automatically saves entered details to browser `localStorage` so changes are never lost on refresh.
- **Sample Data**: 1-click button to load or restore standard sample values.

---

## 🛠️ Quick Start

```bash
# Install dependencies
npm --prefix client install

# Start the development server
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 📦 Build for Production

```bash
npm run build
```

The production assets will be built into `client/dist`.
