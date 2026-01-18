# Aura Knot Photography - Setup Guide

## Prerequisites

1. Node.js 18+ installed (see installation instructions below)
2. Google Cloud Console account
3. Google Workspace account (for Google Sheets and Calendar)

## Step 0: Install Node.js

If you don't have Node.js installed, follow these steps:

### Check if Node.js is Already Installed

Open your terminal and run:
```bash
node --version
npm --version
```

If you see version numbers (e.g., `v20.11.0` and `10.2.4`), Node.js is already installed. You can skip to Step 1.

### Installation Methods

#### Option 1: Official Installer (Recommended for Beginners)

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version (recommended for most users)
3. Run the installer:
   - **macOS**: Double-click the `.pkg` file and follow the installation wizard
   - **Windows**: Run the `.msi` installer and follow the prompts
   - **Linux**: Follow the instructions for your distribution
4. **Restart your terminal** after installation
5. Verify installation:
   ```bash
   node --version   # Should show v18.x.x or higher
   npm --version    # Should show 9.x.x or higher
   ```

#### Option 2: Using Homebrew (macOS)

If you have Homebrew installed:
```bash
brew install node
```

Verify installation:
```bash
node --version
npm --version
```

#### Option 3: Using nvm (Node Version Manager)

For managing multiple Node.js versions:

**macOS/Linux:**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.bashrc  # or ~/.zshrc

# Install and use latest LTS version
nvm install --lts
nvm use --lts
```

**Windows:**
Download and install [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)

Then:
```bash
nvm install lts
nvm use lts
```

### Requirements

- **Node.js version**: 18.0 or higher (LTS version recommended)
- **npm**: Comes automatically with Node.js (no separate installation needed)

### Troubleshooting Node.js Installation

- **Command not found**: Make sure to restart your terminal after installation
- **Version mismatch**: Ensure you have Node.js 18+ installed
- **Permission errors**: On macOS/Linux, you may need to use `sudo` or fix npm permissions

Once Node.js is installed, proceed to Step 1.

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Sheets API
   - Google Calendar API
   - Google Maps API (optional, for location services)

### 1.2 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
5. Copy the Client ID and Client Secret

### 1.3 Create Service Account (for Google Sheets & Calendar)
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service account"
3. Create a service account and download the JSON key file
4. Note the service account email address
5. Copy the private key from the JSON file

## Step 2: Google Sheets Setup

1. Create a new Google Spreadsheet
2. Name it "Aura Knot Photography Data"
3. Create the following sheets (tabs):
   - **Customers**: Headers: `customerId`, `name`, `mobile`, `email`, `eventType`, `eventDateStart`, `eventDateEnd`, `location`, `packageType`, `sessionType`, `createdAt`
   - **Quotations**: Headers: `quotationId`, `customerId`, `eventType`, `eventDateStart`, `eventDateEnd`, `location`, `packageType`, `sessionType`, `services`, `customerTotal`, `status`, `createdAt`, `confirmedAt`
   - **Orders**: Headers: `orderId`, `quotationId`, `customerId`, `estimatedBudget`, `revisedBudget`, `finalBudget`, `workflowStatus`, `createdAt`
   - **Expenses**: Headers: `expenseId`, `orderId`, `costHead`, `amount`, `vendorName`, `description`, `date`
   - **Payments**: Headers: `paymentId`, `orderId`, `paymentType`, `amount`, `date`, `notes`
   - **Packages**: Headers: `packageId`, `name`, `photographyRate`, `videographyRate`, `additionalServices`
   - **WorkflowStatus**: Headers: `orderId`, `videoWorking`, `printing`, `albumDispatched`, `outdoorShoot`, `photoSelection`, `lastUpdated`

4. Share the spreadsheet with the service account email (from Step 1.3) with "Editor" permissions
5. Copy the Spreadsheet ID from the URL (the long string between `/d/` and `/edit`)

## Step 3: Google Calendar Setup

1. Create a new Google Calendar or use your existing one
2. Share the calendar with the service account email with "Make changes to events" permission
3. Get the Calendar ID:
   - For primary calendar: use `primary`
   - For custom calendar: Go to Calendar Settings > Integrate calendar > Copy the Calendar ID

## Step 4: Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in all the required values:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Google Sheets API
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"

# Google Calendar API
GOOGLE_CALENDAR_ID=primary

# NextAuth
NEXTAUTH_SECRET=GcA8ysanXj+Kln9NyJRSEjWhjwpE+jiDAu6vPFTKZTE=
NEXTAUTH_URL=http://localhost:3000

# Google Maps API (optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Generate NEXTAUTH_SECRET
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## Step 5: Install Dependencies

**Note**: Make sure Node.js is installed (see Step 0) before proceeding.

Install all project dependencies:
```bash
npm install
``` 

This will install all packages listed in `package.json`, including:
- Next.js framework
- React and TypeScript
- Google APIs client libraries
- UI components and utilities
- And other required dependencies

The installation may take a few minutes. Once complete, you'll see a `node_modules` folder created in your project directory.

## Step 6: Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Step 7: First Login

1. Navigate to `http://localhost:3000/login`
2. Sign in with your Google account
3. You'll be redirected to the dashboard

## Production Deployment (Vercel)

1. Push your code to a Git repository
2. Import the project in Vercel
3. Add all environment variables in Vercel's project settings
4. Deploy

## Troubleshooting

### Google Sheets API Errors
- Ensure the service account has access to the spreadsheet
- Check that all sheet names match exactly (case-sensitive)
- Verify the spreadsheet ID is correct

### Authentication Issues
- Check that OAuth redirect URIs match exactly
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Ensure NEXTAUTH_SECRET is set

### Calendar Integration Not Working
- Verify the service account has calendar access
- Check that GOOGLE_CALENDAR_ID is correct
- Ensure Calendar API is enabled in Google Cloud Console

## Features Overview

- **Customer Form**: Entry point for new quotations
- **Quotation Maker**: Create detailed quotations with services
- **Order Management**: Track orders with workflow status
- **Expense Tracking**: Record and track expenses per order
- **Payment Management**: Track payments and advances
- **Dashboard**: Analytics and overview
- **Reports**: Export PDF and Excel reports
- **Customer View**: Public quotation view for customers

## Support

For issues or questions, refer to the main README.md file.
