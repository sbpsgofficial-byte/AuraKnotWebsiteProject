# Migration Guide: Google Sheets to Supabase

This guide will help you migrate your Aura Knot Photography application from Google Sheets to Supabase.

## 🚀 Step-by-Step Migration Process

### 1. Set Up Supabase

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Create a new account or sign in

2. **Create a New Project**
   - Click "New Project"
   - Choose your organization
   - Enter project details:
     - Name: `aura-knot-photography`
     - Database Password: Choose a strong password
     - Region: Select closest to your users

3. **Get Your Project Credentials**
   - Go to Settings → API
   - Copy the following values:
     - Project URL
     - Project API Key (anon/public)

### 2. Update Environment Variables

Update your `.env.local` file with Supabase credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Create Database Schema

1. **Run the SQL Schema**
   - In your Supabase dashboard, go to SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Click "Run" to create all tables, indexes, and policies

### 4. Migrate Your Data

**⚠️ IMPORTANT: Backup your Google Sheets data first!**

1. **Run the Migration Script**
   ```bash
   npm run migrate
   ```

   This will:
   - Read all data from your Google Sheets
   - Transform it to match Supabase schema
   - Insert data into Supabase tables
   - Maintain all relationships and data integrity

2. **Verify Migration**
   - Check your Supabase dashboard → Table Editor
   - Ensure all data has been migrated correctly
   - Verify row counts match your Google Sheets

### 5. Update Remaining API Routes

The customers API has been updated. You'll need to update these APIs similarly:

- `/api/quotations/route.ts`
- `/api/orders/route.ts`
- `/api/expenses/route.ts`
- `/api/payments/route.ts`

Each route needs to be converted from Google Sheets operations to Supabase queries.

### 6. Test Your Application

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Test all features:**
   - Customer creation
   - Quotation generation
   - Order management
   - Expense tracking
   - Payment recording
   - PDF generation

### 7. Optional: Remove Google Sheets Integration

Once everything is working with Supabase:

1. **Remove Google Sheets dependencies** (optional)
   ```bash
   npm uninstall googleapis
   ```

2. **Remove Google Sheets environment variables**
3. **Remove Google Sheets related code**

## 📋 Database Schema Overview

### Tables Created:
- `customers` - Customer information
- `quotations` - Quotation records
- `orders` - Order details
- `expenses` - Order expenses
- `payments` - Payment records
- `packages` - Package pricing

### Key Features:
- **Row Level Security (RLS)** enabled
- **Automatic timestamps** with triggers
- **Foreign key relationships** maintained
- **Indexes** for performance
- **Data validation** at database level

## 🔧 Troubleshooting

### Migration Issues:
- **Check your Google Sheets permissions** - Ensure service account has access
- **Verify environment variables** - All Supabase credentials must be correct
- **Check data format** - Some Google Sheets data may need format conversion

### API Issues:
- **CORS errors** - Add your domain to Supabase allowed origins
- **Authentication errors** - Ensure RLS policies are correct
- **Data type errors** - Check that data types match between Sheets and Supabase

### Performance:
- **Large datasets** - Migration might take time for large Google Sheets
- **Rate limiting** - Supabase has rate limits for free tier
- **Concurrent requests** - Migration script handles this sequentially

## 🎯 Benefits of Supabase Migration

1. **Better Performance** - Faster queries with proper indexing
2. **Real-time Features** - Live updates and subscriptions
3. **Better Security** - Row Level Security and authentication
4. **Scalability** - Handles more concurrent users
5. **Advanced Features** - Full-text search, analytics, edge functions
6. **Backup & Recovery** - Automatic backups and point-in-time recovery
7. **API Generation** - Automatic REST and GraphQL APIs

## 📞 Support

If you encounter issues during migration:
1. Check the console logs for detailed error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are correct
4. Test with a small dataset first

The migration script includes error handling and will log any issues encountered during the process.