# Aura Knot Photography Management System

A complete quotation → order → expense → profit management system for photography business, optimized for events, packages, sessions, and financial tracking with automation and reporting.

## Tech Stack

- **Frontend/Backend**: Next.js 14+ with TypeScript (App Router)
- **Database**: Google Sheets API (primary data store)
- **Authentication**: Google OAuth via NextAuth.js
- **Integrations**: Google Calendar API, Google Maps API
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + Zustand
- **PDF Generation**: jsPDF
- **Excel Export**: xlsx
- **Charts**: Recharts
- **Hosting**: Vercel

## Features

### Core Modules

1. **Customer Form** - Entry point to capture customer & event details
2. **Quotation Maker** - Create detailed quotations with photography, videography, and additional services
3. **Order Management** - Track orders with full cost breakdown and workflow status
4. **Expense Tracking** - Record expenses with cost heads, vendors, and descriptions
5. **Payment Management** - Track initial advance, function advance, printing advance, and final payments
6. **Dashboard** - Analytics with revenue charts, order status, and profit/loss summary
7. **Reports** - Export PDF and Excel reports (monthly/yearly, category-wise)
8. **Workflow Status** - Track video working, printing, album dispatch, outdoor shoot, and photo selection
9. **Google Calendar Integration** - Auto-create events on order confirmation with reminders

### Key Features

- ✅ Quotation lock mechanism (non-editable after confirmation)
- ✅ Auto-generated quotation numbers (Q-AKP-YY-0001 format)
- ✅ Session-based pricing calculations
- ✅ Camera count multipliers
- ✅ Real-time profit/loss calculations
- ✅ Color-coded workflow status indicators
- ✅ Role-based access control (Admin vs Customer)
- ✅ Customer-facing quotation view (no internal costs)
- ✅ Mobile responsive design

## Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Copy `.env.example` to `.env.local` and fill in all values.

3. **Set up Google Sheets:**
Create a spreadsheet with the required sheets (see SETUP.md for details).

4. **Run development server:**
```bash
npm run dev
```

## Project Structure

```
/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (admin)/         # Admin-only pages
│   ├── (customer)/      # Customer-facing pages
│   └── api/             # API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── forms/           # Form components
│   ├── orders/          # Order-related components
│   └── shared/          # Shared components
├── lib/
│   ├── google-sheets.ts # Google Sheets API client
│   ├── google-calendar.ts # Google Calendar integration
│   ├── google-auth.ts   # NextAuth configuration
│   ├── calculations.ts  # Business logic calculations
│   └── quotation-generator.ts # Quotation ID generator
├── types/               # TypeScript type definitions
└── config/              # Configuration constants
```

## Environment Variables

Required environment variables (see `.env.example`):

- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_SHEETS_SPREADSHEET_ID` - Google Spreadsheet ID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Service account email
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` - Service account private key
- `GOOGLE_CALENDAR_ID` - Google Calendar ID (use "primary" for default)
- `NEXTAUTH_SECRET` - NextAuth secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Application URL
- `GOOGLE_MAPS_API_KEY` - (Optional) For location services

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Deployment

The application is optimized for Vercel deployment:

1. Push code to Git repository
2. Import project in Vercel
3. Add environment variables in Vercel settings
4. Deploy

## License

Private - Aura Knot Photography

## Support

For setup assistance, refer to [SETUP.md](./SETUP.md)
