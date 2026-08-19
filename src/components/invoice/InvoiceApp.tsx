import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  ImagePlus,
  X,
  Receipt,
} from "lucide-react";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  price: number;
};

type InvoiceData = {
  companyName: string;
  companyDetails: string;
  logo: string | null;
  billTo: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  currency: string;
  notes: string;
  taxPercent: number;
  discountPercent: number;
  items: LineItem[];
};

const STORAGE_KEY = "invoice-generator-draft-v1";

const uid = () => Math.random().toString(36).slice(2, 10);

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) =>
  new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

function emptyInvoice(): InvoiceData {
  return {
    companyName: "Northwind Studio",
    companyDetails: "12 Market Street\nBengaluru, IN 560001\nhello@northwind.studio",
    logo: null,
    billTo: "Acme Corporation\n88 Grand Avenue\nSan Francisco, CA 94103",
    invoiceNumber: `INV-${new Date().getFullYear()}-0001`,
    date: today(),
    dueDate: inDays(14),
    currency: "$",
    notes: "Payment due within 14 days. Thank you for your business!",
    taxPercent: 18,
    discountPercent: 0,
    items: [
      { id: uid(), description: "Brand identity design", quantity: 1, price: 1200 },
      { id: uid(), description: "Landing page development", quantity: 2, price: 450 },
    ],
  };
}

/** Money math in integer cents to avoid floating point drift. */
const cents = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100);
const fromCents = (c: number) => c / 100;

function useInvoiceTotals(data: InvoiceData) {
  return useMemo(() => {
    const lineTotals = data.items.map((i) =>
      Math.round(cents(i.price) * (Number.isFinite(i.quantity) ? i.quantity : 0)),
    );
    const subtotal = lineTotals.reduce((a, b) => a + b, 0);
    const discount = Math.round((subtotal * (data.discountPercent || 0)) / 100);
    const taxable = subtotal - discount;
    const tax = Math.round((taxable * (data.taxPercent || 0)) / 100);
    const total = taxable + tax;
    return {
      lineTotals: lineTotals.map(fromCents),
      subtotal: fromCents(subtotal),
      discount: fromCents(discount),
      tax: fromCents(tax),
      total: fromCents(total),
    };
  }, [data.items, data.discountPercent, data.taxPercent]);
}

function fmt(value: number, currency: string) {
  return `${currency}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(value: string) {
  if (!value) return "—";
  const d = new Date(value + "T00:00:00");
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function InvoiceApp() {
  const [data, setData] = useState<InvoiceData>(emptyInvoice);
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const totals = useInvoiceTotals(data);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<InvoiceData>;
        setData((prev) => ({
          ...prev,
          ...parsed,
          items:
            Array.isArray(parsed.items) && parsed.items.length
              ? parsed.items.map((i) => ({
                  id: i.id ?? uid(),
                  description: i.description ?? "",
                  quantity: Number(i.quantity) || 0,
                  price: Number(i.price) || 0,
                }))
              : prev.items,
        }));
      }
    } catch {
      /* ignore corrupt draft */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable */
    }
  }, [data, loaded]);

  const set = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setData((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));

  const addItem = () =>
    setData((d) => ({
      ...d,
      items: [...d.items, { id: uid(), description: "", quantity: 1, price: 0 }],
    }));

  const removeItem = (id: string) =>
    setData((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));

  const onLogo = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("logo", String(reader.result));
    reader.readAsDataURL(file);
  };

  const reset = () => {
    if (!confirm("Reset the form? Your current draft will be cleared.")) return;
    localStorage.removeItem(STORAGE_KEY);
    setData(emptyInvoice());
  };

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <header className="no-print sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-brand">
              <Receipt className="size-5" />
            </span>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold tracking-tight">
                Invoice &amp; Receipt Generator
              </h1>
              <p className="text-xs text-muted-foreground">
                Autosaved locally · no account needed
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={reset} className="btn-ghost">
              <RotateCcw className="size-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button onClick={() => window.print()} className="btn-primary">
              <Download className="size-4" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* ---------------- Editor ---------------- */}
        <section className="no-print space-y-5">
          <div className="panel">
            <h2 className="panel-title">
              <FileText className="size-4 text-primary" /> Your business
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/50">
                  {data.logo ? (
                    <img
                      src={data.logo}
                      alt="Company logo preview"
                      className="size-full object-contain"
                    />
                  ) : (
                    <ImagePlus className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => fileRef.current?.click()} className="btn-soft">
                    Upload logo
                  </button>
                  {data.logo && (
                    <button onClick={() => set("logo", null)} className="btn-ghost">
                      <X className="size-4" /> Remove
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onLogo(e.target.files?.[0])}
                  />
                </div>
              </div>
              <Field label="Company name">
                <input
                  className="field"
                  value={data.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                />
              </Field>
              <Field label="Company details">
                <textarea
                  className="field min-h-20 resize-y"
                  value={data.companyDetails}
                  onChange={(e) => set("companyDetails", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="panel">
            <h2 className="panel-title">Invoice details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Invoice number">
                <input
                  className="field"
                  value={data.invoiceNumber}
                  onChange={(e) => set("invoiceNumber", e.target.value)}
                />
              </Field>
              <Field label="Currency symbol">
                <input
                  className="field"
                  value={data.currency}
                  maxLength={3}
                  onChange={(e) => set("currency", e.target.value)}
                />
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  className="field"
                  value={data.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </Field>
              <Field label="Due date">
                <input
                  type="date"
                  className="field"
                  value={data.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Bill to">
                  <textarea
                    className="field min-h-20 resize-y"
                    value={data.billTo}
                    onChange={(e) => set("billTo", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="panel-title mb-0">Line items</h2>
              <button onClick={addItem} className="btn-soft">
                <Plus className="size-4" /> Add row
              </button>
            </div>
            <div className="space-y-3">
              {data.items.map((item, idx) => (
                <div key={item.id} className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Item {idx + 1}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label={`Delete item ${idx + 1}`}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <input
                    className="field mb-2"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Qty">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className="field"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, { quantity: Number(e.target.value) })
                        }
                      />
                    </Field>
                    <Field label="Price">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className="field"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, { price: Number(e.target.value) })}
                      />
                    </Field>
                    <Field label="Total">
                      <div className="field flex items-center justify-end font-medium tabular-nums">
                        {fmt(totals.lineTotals[idx] ?? 0, data.currency)}
                      </div>
                    </Field>
                  </div>
                </div>
              ))}
              {data.items.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No items yet — add your first row.
                </p>
              )}
            </div>
          </div>

          <div className="panel">
            <h2 className="panel-title">Tax, discount &amp; notes</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tax %">
                <input
                  type="number"
                  min={0}
                  step="any"
                  className="field"
                  value={data.taxPercent}
                  onChange={(e) => set("taxPercent", Number(e.target.value))}
                />
              </Field>
              <Field label="Discount %">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  className="field"
                  value={data.discountPercent}
                  onChange={(e) => set("discountPercent", Number(e.target.value))}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes">
                  <textarea
                    className="field min-h-20 resize-y"
                    value={data.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Preview ---------------- */}
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="print-sheet mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sheet sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
              <div className="flex items-start gap-3">
                {data.logo && (
                  <img
                    src={data.logo}
                    alt={`${data.companyName} logo`}
                    className="size-14 object-contain"
                  />
                )}
                <div>
                  <p className="text-lg font-semibold tracking-tight">
                    {data.companyName || "Your company"}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                    {data.companyDetails}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold uppercase tracking-[0.2em] text-primary">
                  Invoice
                </p>
                <p className="mt-1 text-sm font-medium tabular-nums">{data.invoiceNumber}</p>
              </div>
            </div>

            <div className="grid gap-6 py-6 sm:grid-cols-3">
              <div>
                <p className="label-xs">Bill to</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{data.billTo}</p>
              </div>
              <div>
                <p className="label-xs">Issued</p>
                <p className="mt-1 text-sm">{fmtDate(data.date)}</p>
              </div>
              <div>
                <p className="label-xs">Due</p>
                <p className="mt-1 text-sm">{fmtDate(data.dueDate)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/60 text-left">
                    <th className="rounded-l-lg px-3 py-2 font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Price
                    </th>
                    <th className="rounded-r-lg px-3 py-2 text-right font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-border/70 last:border-0">
                      <td className="px-3 py-2.5">{item.description || "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {fmt(item.price, data.currency)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                        {fmt(totals.lineTotals[idx] ?? 0, data.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <dl className="w-full max-w-xs space-y-2 text-sm">
                <Row label="Subtotal" value={fmt(totals.subtotal, data.currency)} />
                <Row
                  label={`Discount (${data.discountPercent || 0}%)`}
                  value={`− ${fmt(totals.discount, data.currency)}`}
                />
                <Row
                  label={`Tax (${data.taxPercent || 0}%)`}
                  value={fmt(totals.tax, data.currency)}
                />
                <div className="flex items-center justify-between rounded-lg bg-primary px-3 py-2.5 text-primary-foreground">
                  <dt className="text-sm font-medium">Grand total</dt>
                  <dd className="text-base font-semibold tabular-nums">
                    {fmt(totals.total, data.currency)}
                  </dd>
                </div>
              </dl>
            </div>

            {data.notes && (
              <div className="mt-8 border-t border-border pt-4">
                <p className="label-xs">Notes</p>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                  {data.notes}
                </p>
              </div>
            )}
          </div>
          <p className="no-print mt-3 text-center text-xs text-muted-foreground">
            “Download PDF” opens your browser print dialog — choose “Save as PDF”.
          </p>
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-xs">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
