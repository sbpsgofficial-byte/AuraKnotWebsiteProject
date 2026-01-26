import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { supabase } from '@/lib/supabase';
import { customerFormSchema } from '@/lib/validations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const customerData = {
      customer_id: customerId,
      name: validated.name,
      phone: validated.mobile,
      email: validated.email || null,
      address: validated.location, // Using location as address for now
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
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
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      // Transform to match existing API format
      const customer = {
        customerId: data.customer_id,
        name: data.name,
        mobile: data.phone,
        email: data.email,
        location: data.address,
        createdAt: data.created_at,
      };

      return NextResponse.json(customer);
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Transform to match existing API format
    const customers = data.map(customer => ({
      customerId: customer.customer_id,
      name: customer.name,
      mobile: customer.phone,
      email: customer.email,
      location: customer.address,
      createdAt: customer.created_at,
    }));

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
