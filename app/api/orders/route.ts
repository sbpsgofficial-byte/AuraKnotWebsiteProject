import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (orderId) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            customer_id,
            name,
            phone,
            email,
            address
          ),
          quotations (
            quotation_id,
            event_type,
            event_date_start,
            event_date_end,
            location,
            photography_services,
            videography_services,
            additional_services,
            manual_total,
            customer_total,
            status
          )
        `)
        .eq('order_id', orderId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Transform to match existing API format
      const order = {
        orderId: data.order_id,
        quotationId: data.quotation_id,
        customerId: data.customer_id,
        customer: data.customers ? {
          customerId: data.customers.customer_id,
          name: data.customers.name,
          mobile: data.customers.phone,
          email: data.customers.email,
          location: data.customers.address,
        } : null,
        quotation: data.quotations ? {
          quotationId: data.quotations.quotation_id,
          eventType: data.quotations.event_type,
          eventDateStart: data.quotations.event_date_start,
          eventDateEnd: data.quotations.event_date_end,
          location: data.quotations.location,
          services: data.quotations.photography_services,
          deliverables: data.quotations.additional_services,
          manualTotal: data.quotations.manual_total,
          customerTotal: data.quotations.customer_total,
          status: data.quotations.status,
        } : null,
        status: data.status,
        estimatedBudget: data.estimated_budget || (data.quotations ? (data.quotations.customer_total || data.quotations.manual_total) : null),
        finalBudget: data.final_budget,
        createdAt: data.created_at || data.quotations?.created_at || new Date().toISOString(),
      };

      return NextResponse.json(order);
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          customer_id,
          name,
          phone,
          email,
          address
        ),
        quotations (
          quotation_id,
          event_type,
          event_date_start,
          event_date_end,
          location,
          photography_services,
          videography_services,
          additional_services,
          manual_total,
          customer_total,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Transform to match existing API format
    const orders = data.map(order => ({
      orderId: order.order_id,
      quotationId: order.quotation_id,
      customerId: order.customer_id,
      customer: order.customers ? {
        customerId: order.customers.customer_id,
        name: order.customers.name,
        mobile: order.customers.phone,
        email: order.customers.email,
        location: order.customers.address,
      } : null,
      quotation: order.quotations ? {
        quotationId: order.quotations.quotation_id,
        eventType: order.quotations.event_type,
        eventDateStart: order.quotations.event_date_start,
        eventDateEnd: order.quotations.event_date_end,
        location: order.quotations.location,
        services: order.quotations.photography_services,
        deliverables: order.quotations.additional_services,
        manualTotal: order.quotations.manual_total,
        customerTotal: order.quotations.customer_total,
        status: order.quotations.status,
      } : null,
      status: order.status,
      estimatedBudget: order.estimated_budget || (order.quotations ? (order.quotations.customer_total || order.quotations.manual_total) : null),
      finalBudget: order.final_budget,
      createdAt: order.created_at || order.quotations?.created_at || new Date().toISOString(),
    }));

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
