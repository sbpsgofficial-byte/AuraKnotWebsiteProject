'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { SearchBar } from '@/components/shared/SearchBar';
import { useToast } from '@/components/ui/use-toast';
import { calculateTotalQuotationCost } from '@/lib/calculations';
import { generateQuotationPDF } from '@/lib/pdf-generator';

export default function QuotationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [allQuotations, setAllQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'Pending' | 'Declined' | 'Confirmed'>('all');

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const [quotationsRes, customersRes] = await Promise.all([
        fetch('/api/quotations'),
        fetch('/api/customers'),
      ]);
      
      if (quotationsRes.ok) {
        const data = await quotationsRes.json();
        setAllQuotations(data);
        setQuotations(data);
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
      console.error('Error fetching quotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpdateQuotations = async () => {
    setIsUpdating(true);
    try {
      const updatePromises = allQuotations.map(async (quotation) => {
        try {
          // Parse services
          const services = quotation.services ? 
            (typeof quotation.services === 'string' ? JSON.parse(quotation.services) : quotation.services) 
            : {};

          // Recalculate total
          const calculatedTotal = calculateTotalQuotationCost(services);

          // Update quotation with recalculated total
          const response = await fetch(`/api/quotations/${quotation.quotationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              manualTotal: calculatedTotal,
              services: services,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to update ${quotation.quotationId}`);
          }

          return { success: true, id: quotation.quotationId };
        } catch (error) {
          console.error(`Error updating quotation ${quotation.quotationId}:`, error);
          return { success: false, id: quotation.quotationId, error };
        }
      });

      const results = await Promise.all(updatePromises);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      toast({
        title: 'Bulk Update Complete',
        description: `Updated ${successful} quotations successfully${failed > 0 ? `, ${failed} failed` : ''}`,
      });

      // Refresh quotations
      await fetchQuotations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to perform bulk update',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDownloadPDFs = async () => {
    setIsUpdating(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const quotation of allQuotations) {
        try {
          // Fetch fresh customer data for each quotation
          let customerName = customers[quotation.customerId] || 'Unknown Customer';
          if (quotation.customerId) {
            try {
              const customerRes = await fetch(`/api/customers?id=${quotation.customerId}`);
              if (customerRes.ok) {
                const customerData = await customerRes.json();
                customerName = customerData.name || customerName;
              }
            } catch (customerError) {
              console.warn(`Failed to fetch customer data for ${quotation.customerId}:`, customerError);
            }
          }

          // Parse deliverables
          const deliverables = quotation.deliverables
            ? (typeof quotation.deliverables === 'string' ? JSON.parse(quotation.deliverables) : quotation.deliverables)
            : null;

          // Generate PDF with fresh data
          generateQuotationPDF(quotation, customerName, deliverables);

          successCount++;

          // Small delay to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error generating PDF for ${quotation.quotationId}:`, error);
          failCount++;
        }
      }

      toast({
        title: 'Bulk PDF Download Complete',
        description: `Downloaded ${successCount} PDFs successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDFs',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    let filtered = allQuotations;

    // Apply status filter
    if (activeTab !== 'all') {
      filtered = filtered.filter((q) => q.status === activeTab);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((q) => {
        const customerName = customers[q.customerId]?.toLowerCase() || '';
        return (
          q.quotationId?.toLowerCase().includes(lowerQuery) ||
          q.customerId?.toLowerCase().includes(lowerQuery) ||
          customerName.includes(lowerQuery)
        );
      });
    }

    setQuotations(filtered);
  }, [searchQuery, activeTab, allQuotations, customers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return <div>Loading quotations...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Service & Deliverables</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleBulkUpdateQuotations} 
            disabled={isUpdating}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isUpdating ? 'Updating...' : 'Update All Quotations'}
          </Button>
          <Button 
            onClick={handleBulkDownloadPDFs} 
            disabled={isUpdating}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isUpdating ? 'Downloading...' : 'Download All PDFs'}
          </Button>
          <Button onClick={() => router.push('/customer-form')} className="w-full sm:w-auto">
            New Quotation
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('Pending')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'Pending'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab('Declined')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'Declined'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Declined
        </button>
        <button
          onClick={() => setActiveTab('Confirmed')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'Confirmed'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Confirmed
        </button>
      </div>

      <div className="grid gap-4">
        {quotations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No quotations found</p>
            </CardContent>
          </Card>
        ) : (
          quotations.map((quotation) => (
            <Card key={quotation.quotationId}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      <Link
                        href={`/quotations/${quotation.quotationId}`}
                        className="hover:underline"
                      >
                        {quotation.quotationId}
                        {customers[quotation.customerId] && ` - ${customers[quotation.customerId]}`}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {quotation.eventType} - {formatDate(quotation.eventDateStart)}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      quotation.status
                    )}`}
                  >
                    {quotation.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Location: {quotation.location}</p>
                    <p className="text-sm text-gray-600">Package: {quotation.packageType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatCurrency(quotation.customerTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
