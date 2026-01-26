# Aura Knot — Quotation PDF Generator

Dynamic PDF generation for Aura Knot Photography quotations with customer-specific data.

## Features
- Dynamic customer data replacement
- Professional quotation layout
- High-quality PDF output using Puppeteer
- Customizable branding and styling

## Files
- `quotation.html` — HTML template with placeholders
- `assets/ak-logo-final.svg` — Logo and watermark graphics
- `generate-pdf.js` — Node script with dynamic data replacement
- `package.json` — Scripts and dependencies

## Usage

### Basic Usage (Default Data)
```bash
cd "C:/Users/SNAPPY BOYS/Documents/auraknot wedding income/pdf-report"
npm install
npm run generate-pdf
```

### Custom Customer Data
Pass customer details as command line arguments:
```bash
npm run generate-pdf-custom
# OR manually:
node generate-pdf.js "Q-AKP-26-0002" "19 January 2026" "John Doe" "22 January 2026 - 23 January 2026" "Grand Hotel" "₹1,25,000"
```

### Parameters Order
1. **Quotation ID** (e.g., "Q-AKP-26-0001")
2. **Date** (e.g., "18 January 2026")
3. **Client Name** (e.g., "Naveen")
4. **Event Dates** (e.g., "20 January 2026 - 21 January 2026") - use any separator (-, –, to), it will be converted to em dash
5. **Location** (e.g., "SSM Mahal")
6. **Total Amount** (e.g., "₹95,000")

### Integration with Main App
For automatic PDF generation from your Next.js application, you can call this script from your API routes or use the existing `lib/pdf-generator.ts` which uses jsPDF.

## Output
- `quotation.pdf` will be created in the same folder
- Each generation overwrites the previous PDF

## Requirements
- Node.js 18+
- npm
- Internet connection (for font loading)

## Notes
- Replace `assets/ak-logo-final.svg` with your actual logo if needed
- Puppeteer downloads Chromium on first run (~200MB)
- All customer data is dynamically replaced in the HTML template
