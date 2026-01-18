import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { sheetsClient } from '@/lib/google-sheets';
import { GOOGLE_SHEETS_SHEET_NAMES } from '@/config/constants';
import { customerFormSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = customerFormSchema.parse(body);

    // Generate customer ID
    const customerId = `CUST-${Date.now()}`;

    // Prepare customer data
    const customerData = [
      customerId,
      validated.name,
      validated.mobile,
      validated.email || '',
      validated.eventType,
      validated.eventDateStart,
      validated.eventDateEnd,
      validated.location,
      validated.packageType,
      validated.sessionType,
      new Date().toISOString(),
    ];

    // Get headers first
    const headers = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.CUSTOMERS);
    if (headers.length === 0) {
      // Create headers if sheet is empty
      await sheetsClient.writeSheet(GOOGLE_SHEETS_SHEET_NAMES.CUSTOMERS, [
        ['customerId', 'name', 'mobile', 'email', 'eventType', 'eventDateStart', 'eventDateEnd', 'location', 'packageType', 'sessionType', 'createdAt'],
        customerData,
      ]);
    } else {
      // Append new customer
      await sheetsClient.appendRow(GOOGLE_SHEETS_SHEET_NAMES.CUSTOMERS, customerData);
    }

    return NextResponse.json({
      customerId,
      ...validated,
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');

    if (customerId) {
      const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.CUSTOMERS);
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      const headers = rows[0];
      const customerRow = rows.find((row: any[]) => row[0] === customerId);
      
      if (!customerRow) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      const customer: any = {};
      headers.forEach((header, index) => {
        customer[header] = customerRow[index] || '';
      });

      return NextResponse.json(customer);
    }

    const { getCustomers } = await import('@/lib/google-sheets');
    const customers = await getCustomers();

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
