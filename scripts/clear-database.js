const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

async function clearAllData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Starting to clear all data from Supabase...');

  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting expenses...');
    const { error: expensesError } = await supabase
      .from('expenses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (expensesError) {
      console.error('Error deleting expenses:', expensesError);
      return;
    }

    console.log('Deleting payments...');
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (paymentsError) {
      console.error('Error deleting payments:', paymentsError);
      return;
    }

    console.log('Deleting orders...');
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (ordersError) {
      console.error('Error deleting orders:', ordersError);
      return;
    }

    console.log('Deleting quotations...');
    const { error: quotationsError } = await supabase
      .from('quotations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (quotationsError) {
      console.error('Error deleting quotations:', quotationsError);
      return;
    }

    console.log('Deleting customers...');
    const { error: customersError } = await supabase
      .from('customers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (customersError) {
      console.error('Error deleting customers:', customersError);
      return;
    }

    console.log('Deleting packages...');
    const { error: packagesError } = await supabase
      .from('packages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (packagesError) {
      console.error('Error deleting packages:', packagesError);
      return;
    }

    console.log('✅ All data has been successfully cleared from Supabase!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
clearAllData();