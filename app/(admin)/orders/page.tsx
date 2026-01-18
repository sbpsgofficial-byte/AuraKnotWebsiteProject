'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { WorkflowStatus } from '@/types';
import { SearchBar } from '@/components/shared/SearchBar';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/customers'),
      ]);
      
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setAllOrders(data);
        setOrders(data);
      }
      
      if (customersRes.ok) {
        const customersData = await customersRes.json();
        const customerMap: Record<string, string> = {};
        customersData.forEach((c: any) => {
          customerMap[c.customerId] = c.name;
        });
        setCustomers(customerMap);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkflowStatus = (order: any): WorkflowStatus => {
    if (typeof order.workflowStatus === 'string') {
      const parsed = JSON.parse(order.workflowStatus);
      // Migrate old structure if needed
      if ('videoWorking' in parsed) {
        return {
          photoSelection: parsed.photoSelection === 'Selected' ? 'Yes' : (parsed.photoSelection === 'Pending' ? 'No' : 'No'),
          albumDesign: 'No',
          albumPrinting: parsed.printing === 'Yes' ? 'Yes' : 'No',
          videoEditing: parsed.videoWorking === 'Completed' ? 'Yes' : 'No',
          outdoorShoot: parsed.outdoorShoot === 'Completed' ? 'Yes' : 'No',
          albumDelivery: parsed.albumDispatched === 'Yes' ? 'Yes' : 'No',
        };
      }
      return parsed;
    }
      return order.workflowStatus || {
      photoSelection: 'No',
      albumDesign: 'No',
      albumPrinting: 'No',
      videoEditing: 'No',
      outdoorShoot: 'No',
      albumDelivery: 'No',
    };
  };

  const getStatusIndicator = (status: string) => {
    if (status === 'Yes' || status === 'Not needed') {
      return <span className="text-green-600">🟢</span>;
    }
    return <span className="text-red-600">🔴</span>;
  };

  useEffect(() => {
    let filtered = allOrders;

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const customerName = customers[order.customerId]?.toLowerCase() || '';
        return (
          order.orderId?.toLowerCase().includes(lowerQuery) ||
          order.customerId?.toLowerCase().includes(lowerQuery) ||
          order.quotationId?.toLowerCase().includes(lowerQuery) ||
          customerName.includes(lowerQuery)
        );
      });
    }

    setOrders(filtered);
  }, [searchQuery, allOrders, customers]);

  // Only show orders from confirmed quotations (all orders are from confirmed quotations)
  const filteredOrders = orders;

  if (isLoading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Orders</h1>
        <Button onClick={() => router.push('/customer-form')} className="w-full sm:w-auto">
          New Order
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const workflow = getWorkflowStatus(order);
            return (
              <Card key={order.orderId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        <Link
                          href={`/orders/${order.orderId}`}
                          className="hover:underline"
                        >
                          {order.orderId}
                          {customers[order.customerId] && ` - ${customers[order.customerId]}`}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        Created: {formatDate(order.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{formatCurrency(order.finalBudget || 0)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                      <div>
                        Photo Selection: {getStatusIndicator(workflow.photoSelection)}
                      </div>
                      <div>
                        Album Design: {getStatusIndicator(workflow.albumDesign)}
                      </div>
                      <div>
                        Album Printing: {getStatusIndicator(workflow.albumPrinting)}
                      </div>
                      <div>
                        Video Editing: {getStatusIndicator(workflow.videoEditing)}
                      </div>
                      <div>
                        Outdoor Shoot: {getStatusIndicator(workflow.outdoorShoot)}
                      </div>
                      <div>
                        Album Delivery: {getStatusIndicator(workflow.albumDelivery)}
                      </div>
                      {/* Order Complete removed from UI */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
