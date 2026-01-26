import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { supabase } from '@/lib/supabase';
import { generateQuotationId } from '@/lib/quotation-generator';
import { quotationSchema } from '@/lib/validations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, services, customerTotal, manualTotal, deliverables, eventType, eventDateStart, eventDateEnd, location } = body;

    // Validate required fields
    if (!eventType || !eventDateStart) {
      return NextResponse.json({ error: 'Event type and start date are required' }, { status: 400 });
    }

    // Fetch customer data from Supabase
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const quotationId = await generateQuotationId();

    // Create quotation data for Supabase
    const quotationData = {
      quotation_id: quotationId,
      customer_id: customerId,
      event_type: eventType || '',
      event_date_start: eventDateStart || null,
      event_date_end: eventDateEnd || null,
      location: location || customer.address || '',
      photography_services: services || null,
      videography_services: null,
      additional_services: deliverables || null,
      manual_total: manualTotal || null,
      customer_total: customerTotal || 0,
      status: 'Pending',
    };

    const { data, error } = await supabase
      .from('quotations')
      .insert(quotationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating quotation:', error);
      return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 });
    }

    return NextResponse.json({
      quotationId,
      customerId,
      ...quotationData,
      createdAt: data.created_at,
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

    const { searchParams } = new URL(request.url);
    const quotationId = searchParams.get('id');

    if (quotationId) {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          customers (
            customer_id,
            name,
            phone,
            email,
            address
          )
        `)
        .eq('quotation_id', quotationId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
      }

      // Transform to match existing API format
      const quotation = {
        quotationId: data.quotation_id,
        customerId: data.customer_id,
        customer: data.customers ? {
          customerId: data.customers.customer_id,
          name: data.customers.name,
          mobile: data.customers.phone,
          email: data.customers.email,
          location: data.customers.address,
        } : null,
        eventType: data.event_type,
        eventDateStart: data.event_date_start,
        eventDateEnd: data.event_date_end,
        location: data.location,
        services: data.photography_services,
        deliverables: data.additional_services,
        manualTotal: data.manual_total,
        customerTotal: data.customer_total,
        status: data.status,
        createdAt: data.created_at,
      };

      return NextResponse.json(quotation);
    }

    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        customers (
          customer_id,
          name,
          phone,
          email,
          address
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotations:', error);
      return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
    }

    // Transform to match existing API format
    const quotations = data.map(quotation => ({
      quotationId: quotation.quotation_id,
      customerId: quotation.customer_id,
      customer: quotation.customers ? {
        customerId: quotation.customers.customer_id,
        name: quotation.customers.name,
        mobile: quotation.customers.phone,
        email: quotation.customers.email,
        location: quotation.customers.address,
      } : null,
      eventType: quotation.event_type,
      eventDateStart: quotation.event_date_start,
      eventDateEnd: quotation.event_date_end,
      location: quotation.location,
      services: quotation.photography_services,
      deliverables: quotation.additional_services,
      manualTotal: quotation.manual_total,
      customerTotal: quotation.customer_total,
      status: quotation.status,
      createdAt: quotation.created_at,
    }));

    return NextResponse.json(quotations);
  } catch (error: any) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}
