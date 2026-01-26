import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ===== FETCH ORDER + RELATIONS =====
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
          status,
          created_at
        )
      `)
      .eq('order_id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ===== NORMALIZE DATA FOR PDF & UI =====
    const order = {
      orderId: data.order_id,
      quotationId: data.quotation_id,
      customerId: data.customer_id,

      customer: data.customers
        ? {
            customerId: data.customers.customer_id,
            name: data.customers.name,
            mobile: data.customers.phone,
            email: data.customers.email,
            location: data.customers.address,
          }
        : null,

      quotation: data.quotations
        ? {
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
          }
        : null,

      estimatedBudget: data.estimated_budget || (data.quotations ? (data.quotations.customer_total || data.quotations.manual_total) : null),
      finalBudget: data.final_budget,
      workflowStatus: data.workflow_status,
      createdAt: data.created_at || data.quotations?.created_at || new Date().toISOString(),

      // ===== PDF-CRITICAL FIX =====
      expenses: (data.expenses || []).map((e: any) => ({
        expenseId: e.expense_id,
        category: e.category || 'Miscellaneous Expense',
        description: e.description || '',
        amount: Number(e.amount || 0),
        date: e.expense_date,
      })),

      payments: (data.payments || []).map((p: any) => ({
        paymentId: p.payment_id,
        amount: Number(p.amount || 0),
        date: p.payment_date,
        method: p.payment_method || '—',
      })),
    };

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
