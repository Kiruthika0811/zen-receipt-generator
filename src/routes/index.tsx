import { createFileRoute } from "@tanstack/react-router";
import InvoiceApp from "@/components/invoice/InvoiceApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Invoice & Receipt Generator — Free Client-Side Billing Tool" },
      {
        name: "description",
        content:
          "Create, calculate and export professional invoices and receipts as PDF. Runs fully in your browser with autosaved drafts.",
      },
      { property: "og:title", content: "Invoice & Receipt Generator" },
      {
        property: "og:description",
        content:
          "Build clean invoices with live tax and discount math, then export a print-perfect PDF — no account needed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvoiceApp,
});
