import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { sheetsClient } from '@/lib/google-sheets';
import { GOOGLE_SHEETS_SHEET_NAMES } from '@/config/constants';
import { generateQuotationId } from '@/lib/quotation-generator';
import { quotationSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, services, customerTotal, manualTotal, deliverables } = body;

    // Fetch customer data
    const customers = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.CUSTOMERS);
    const customerRow = customers.find((row: any[]) => row[0] === customerId);
    
    if (!customerRow) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const quotationId = await generateQuotationId();
    const now = new Date().toISOString();

    // Create quotation data
    const quotationData = [
      quotationId,
      customerId,
      customerRow[4] || '', // eventType
      customerRow[5] || '', // eventDateStart
      customerRow[6] || '', // eventDateEnd
      customerRow[7] || '', // location
      customerRow[8] || '', // packageType
      customerRow[9] || '', // sessionType
      JSON.stringify(services),
      manualTotal || customerTotal || 0, // Use manualTotal if provided
      manualTotal || customerTotal || 0, // customerTotal (keep for backward compatibility)
      JSON.stringify(deliverables || null),
      'Pending',
      now,
      '', // confirmedAt
    ];

    // Get headers first
    const sheetRows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.QUOTATIONS);
    if (sheetRows.length === 0) {
      // Create default headers (keeps manualTotal for backward compatibility)
      await sheetsClient.writeSheet(GOOGLE_SHEETS_SHEET_NAMES.QUOTATIONS, [
        [
          'quotationId',
          'customerId',
          'eventType',
          'eventDateStart',
          'eventDateEnd',
          'location',
          'packageType',
          'sessionType',
          'services',
          'manualTotal',
          'customerTotal',
          'deliverables',
          'status',
          'createdAt',
          'confirmedAt',
        ],
        quotationData,
      ]);
    } else {
      // Map values to existing header columns to avoid misalignment when sheet has different columns
      const headerRow: string[] = sheetRows[0];
      const mappedRow = headerRow.map((h) => {
        switch (h) {
          case 'quotationId':
            return quotationId;
          case 'customerId':
            return customerId;
          case 'eventType':
            return customerRow[4] || '';
          case 'eventDateStart':
            return customerRow[5] || '';
          case 'eventDateEnd':
            return customerRow[6] || '';
          case 'location':
            return customerRow[7] || '';
          case 'packageType':
            return customerRow[8] || '';
          case 'sessionType':
            return customerRow[9] || '';
          case 'services':
            return JSON.stringify(services);
          case 'manualTotal':
            return manualTotal || customerTotal || 0;
          case 'customerTotal':
            return manualTotal || customerTotal || 0;
          case 'deliverables':
            return JSON.stringify(deliverables || null);
          case 'status':
            return 'Pending';
          case 'createdAt':
            return now;
          case 'confirmedAt':
            return '';
          default:
            return '';
        }
      });

      await sheetsClient.appendRow(GOOGLE_SHEETS_SHEET_NAMES.QUOTATIONS, mappedRow);
    }

    return NextResponse.json({
      quotationId,
      customerId,
      services,
      customerTotal,
      status: 'Pending',
    });
  } catch (error: any) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quotation' },
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

    const { getQuotations } = await import('@/lib/google-sheets');
    const quotations = await getQuotations();

    return NextResponse.json(quotations);
  } catch (error: any) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}
