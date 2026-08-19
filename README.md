# Invoice Flow

Create a highly polished, professional Single-Page Invoice & Receipt Generator Web Application using React, Tailwind CSS, and Lucide Icons. The app must be fully responsive, bug-free, and work entirely client-side without requiring any external database connections.

Key Features to Include:

1. Dynamic Invoice Form: Fields for Company Name, Logo Upload (local data URL), Bill To, Invoice Number, Date, and Due Date.

2. Line Items Table: Users can add, edit, and delete multiple rows of items. Each row must automatically calculate 'Quantity x Price = Total'.

3. Automatic Tax & Discounts: Include inputs for Tax Percentage and Discount Percentage, updating the Subtotal and Grand Total in real-time with flawless floating-point math logic.

4. Professional PDF Export: Integrate a reliable client-side PDF export feature (like html2pdf or browser print layout optimizations) that generates a clean, single-page, beautifully formatted PDF invoice when the user clicks 'Download PDF'.

5. History & Templates: Automatically save the active invoice draft to the browser's LocalStorage so no data is lost on page refresh. Include a 'Reset Form' button.

6. Design Aesthetic: Modern, minimalist SaaS dashboard styling. Use a clean slate/indigo color palette, smooth transitions, and professional typography.

Ensure all code compiles perfectly on the first run with no missing dependencies or broken imports.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://zen-receipt-generator.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b2b0e891-1750-40e6-8f3a-aa5583f95d59).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
