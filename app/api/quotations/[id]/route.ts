import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { supabase } from '@/lib/supabase';
import { generateOrderId } from '@/lib/quotation-generator';
import { Quotation, EventType, PackageType, SessionType, QuotationStatus } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Type for PATCH request body
interface PatchBody {
  status: 'Confirmed' | 'Declined' | string;
}

// GET handler — fetch single quotation by id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      .eq('quotation_id', params.id)
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
  } catch (error: any) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quotation' },
      { status: 500 }
    );
  }
}

// PATCH handler — update quotation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, services, customerTotal, manualTotal, deliverables } = body;

    // Prepare update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (services !== undefined) updateData.photography_services = services;
    if (manualTotal !== undefined) updateData.manual_total = manualTotal;
    if (customerTotal !== undefined) updateData.customer_total = customerTotal;
    if (deliverables !== undefined) updateData.additional_services = deliverables;

    const { data, error } = await supabase
      .from('quotations')
      .update(updateData)
      .eq('quotation_id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating quotation:', error);
      return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // If quotation is confirmed, create an order automatically
    if (status === 'Confirmed') {
      try {
        // Check if order already exists for this quotation
        const { data: existingOrder, error: checkError } = await supabase
          .from('orders')
          .select('order_id')
          .eq('quotation_id', params.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error checking existing order:', checkError);
        } else if (existingOrder) {
          console.log(`Order ${existingOrder.order_id} already exists for quotation ${params.id}`);
        } else {
          const orderId = await generateOrderId();

          // Fetch the full quotation data for order creation
          const { data: quotationData, error: fetchError } = await supabase
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
            .eq('quotation_id', params.id)
            .single();

          if (fetchError || !quotationData) {
            console.error('Error fetching quotation for order creation:', fetchError);
          } else {
            // Create order data
            const orderData = {
              order_id: orderId,
              customer_id: quotationData.customer_id,
              quotation_id: quotationData.quotation_id,
              estimated_budget: quotationData.customer_total || quotationData.manual_total || null,
              final_budget: null, // To be set later
            };

            const { error: orderError } = await supabase
              .from('orders')
              .insert(orderData);

            if (orderError) {
              console.error('Error creating order:', orderError);
              // Don't fail the quotation update if order creation fails
            } else {
              console.log(`Order ${orderId} created for quotation ${params.id}`);
            }
          }
        }
      } catch (orderCreationError) {
        console.error('Error in order creation:', orderCreationError);
        // Don't fail the quotation update
      }
    }

    return NextResponse.json({
      quotationId: data.quotation_id,
      status: data.status,
      services: data.photography_services,
      manualTotal: data.manual_total,
      customerTotal: data.customer_total,
      deliverables: data.additional_services,
    });
  } catch (error: any) {
    console.error('Error updating quotation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update quotation' },
      { status: 500 }
    );
  }
}