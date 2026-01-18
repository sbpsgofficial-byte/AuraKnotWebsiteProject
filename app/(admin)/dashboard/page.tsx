'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    totalProfit: 0,
    totalBalance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [allData, setAllData] = useState<{ orders: any[]; quotations: any[]; customers: any[] }>({
    orders: [],
    quotations: [],
    customers: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, paymentsRes, expensesRes, quotationsRes, customersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/payments'),
        fetch('/api/expenses'),
        fetch('/api/quotations'),
        fetch('/api/customers'),
      ]);

      const orders = await ordersRes.json();
      const payments = await paymentsRes.json();
      const expenses = await expensesRes.json();
      const quotations = await quotationsRes.json();
      const customers = await customersRes.json();

      setAllData({ orders, quotations, customers });

      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o: any) => {
        const ws = typeof o.workflowStatus === 'string' ? JSON.parse(o.workflowStatus) : o.workflowStatus;
        // Check if any workflow field is 'No' (red)
        return ws.photoSelection === 'No' || 
               ws.albumDesign === 'No' || 
               ws.albumPrinting === 'No' || 
               ws.videoEditing === 'No' || 
               ws.outdoorShoot === 'No' || 
               ws.albumDelivery === 'No';
      }).length;
      const completedOrders = totalOrders - pendingOrders;

      const monthlyRevenue = payments
        .filter((p: any) => {
          const date = new Date(p.date);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      const yearlyRevenue = payments
        .filter((p: any) => {
          const date = new Date(p.date);
          const now = new Date();
          return date.getFullYear() === now.getFullYear();
        })
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
      const totalProfit = orders.reduce((sum: number, order: any) => {
        const orderExpenses = expenses.filter((e: any) => e.orderId === order.orderId).reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0);
        const profit = (order.finalBudget || order.estimatedBudget || 0) - orderExpenses;
        return sum + profit;
      }, 0);

      const totalBalance = orders.reduce((sum: number, order: any) => {
        const totalPaid = payments.filter((p: any) => p.orderId === order.orderId).reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0);
        const balance = (order.finalBudget || order.estimatedBudget || 0) - totalPaid;
        return sum + Math.max(0, balance);
      }, 0);

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        monthlyRevenue,
        yearlyRevenue,
        totalProfit,
        totalBalance,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  const statusData = [
    { name: 'Pending', value: stats.pendingOrders, color: '#ef4444' },
    { name: 'Completed', value: stats.completedOrders, color: '#22c55e' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-0">
          Welcome back! Here&apos;s your business overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Yearly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.yearlyRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.totalProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(stats.totalBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
