'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Payment } from '@/types';
import { SearchBar } from '@/components/shared/SearchBar';
import Link from 'next/link';

export default function PaymentsPage() {
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [balanceFilter, setBalanceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [paymentsRes, ordersRes, customersRes, expensesRes] = await Promise.all([
      fetch('/api/payments'),
      fetch('/api/orders'),
      fetch('/api/customers'),
      fetch('/api/expenses'),
    ]);

    const paymentsData: Payment[] = await paymentsRes.json();
    const ordersData = await ordersRes.json();
    const customersData = await customersRes.json();
    const expensesData = await expensesRes.json();

    setAllPayments(paymentsData);
    setPayments(paymentsData);
    setOrders(ordersData);
    setExpenses(expensesData);

    const map: Record<string, string> = {};
    customersData.forEach((c: any) => {
      map[c.customerId] = c.name;
    });
    setCustomers(map);

    setIsLoading(false);
  };

  useEffect(() => {
    let filtered = [...allPayments];

    // First, get the latest payment per orderId from all payments
    const latestPaymentsPerOrder = Object.values(
      allPayments.reduce((acc: Record<string, Payment>, p) => {
        const existing = acc[p.orderId];
        if (!existing) acc[p.orderId] = p;
        else if (new Date(p.date).getTime() > new Date(existing.date).getTime()) acc[p.orderId] = p;
        return acc;
      }, {})
    );

    // Now filter the latest payments
    if (balanceFilter === 'with-balance' || balanceFilter === 'no-balance') {
      // Calculate orders with pending balance
      const ordersWithBalance = new Set<string>();
      orders.forEach(order => {
        const totalPaid = allPayments
          .filter(p => p.orderId === order.orderId)
          .reduce((sum, p) => sum + p.amount, 0);
        if (order.finalBudget > totalPaid) {
          ordersWithBalance.add(order.orderId);
        }
      });

      if (balanceFilter === 'with-balance') {
        filtered = latestPaymentsPerOrder.filter(p => ordersWithBalance.has(p.orderId));
      } else if (balanceFilter === 'no-balance') {
        filtered = latestPaymentsPerOrder.filter(p => !ordersWithBalance.has(p.orderId));
      } else {
        filtered = latestPaymentsPerOrder;
      }
    } else {
      filtered = latestPaymentsPerOrder;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();

      filtered = filtered.filter(p => {
        const order = orders.find(o => o.orderId === p.orderId);
        const customerName =
          customers[order?.customerId || '']?.toLowerCase() || '';

        return (
          p.orderId.toLowerCase().includes(q) ||
          p.paymentId.toLowerCase().includes(q) ||
          customerName.includes(q)
        );
      });
    }

    setPayments(filtered);
  }, [balanceFilter, searchQuery, allPayments, orders, customers]);

  if (isLoading) return <div>Loading payments...</div>;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Payments</h1>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <Select value={balanceFilter} onValueChange={setBalanceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Balance Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="with-balance">With Balance</SelectItem>
              <SelectItem value="no-balance">No Balance</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Order</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-right">Total Budget</th>
              <th className="p-4 text-right">Amount Paid</th>
              <th className="p-4 text-right">Balance</th>
              <th className="p-4 text-right">Profit</th>
              <th className="p-4 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map(p => {
                const order = orders.find(o => o.orderId === p.orderId);
                const customerName = customers[order?.customerId || ''] || 'Unknown';
                const totalPaid = allPayments
                  .filter(pay => pay.orderId === p.orderId)
                  .reduce((sum, pay) => sum + pay.amount, 0);
                const balance = (order?.finalBudget || order?.estimatedBudget || 0) - totalPaid;
                const totalExpenses = expenses
                  .filter(e => e.orderId === p.orderId)
                  .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                const profit = (order?.finalBudget || order?.estimatedBudget || 0) - totalExpenses;

                return (
                  <tr key={p.paymentId} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <Link href={`/orders/${p.orderId}`} className="text-blue-600 hover:underline">
                        {p.orderId}
                      </Link>
                    </td>
                    <td className="p-4">{customerName}</td>
                    <td className="p-4">{p.paymentType}</td>
                    <td className="p-4 text-right">{formatCurrency(order?.finalBudget || order?.estimatedBudget || 0)}</td>
                    <td className="p-4 text-right">{formatCurrency(p.amount)}</td>
                    <td className="p-4 text-right">
                      <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(balance)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(profit)}</span>
                    </td>
                    <td className="p-4">{formatDate(p.date)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}