'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Quotation } from '@/types';

export default function CustomerQuotationViewPage() {
  const params = useParams();
  const { toast } = useToast();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchQuotation = useCallback(async () => {
    try {
      const response = await fetch(`/api/quotations/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setQuotation(data);
      }
    } catch (error) {
      console.error('Error fetching quotation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchQuotation();
  }, [fetchQuotation]);

  const handleAccept = async () => {
    if (!quotation) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/quotations/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Confirmed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept quotation');
      }

      toast({
        title: 'Success',
        description: 'Quotation accepted successfully',
      });

      fetchQuotation();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept quotation',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecline = async () => {
    if (!quotation) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/quotations/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Declined' }),
      });

      if (!response.ok) {
        throw new Error('Failed to decline quotation');
      }

      toast({
        title: 'Success',
        description: 'Quotation declined',
      });

      fetchQuotation();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline quotation',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading quotation...</div>;
  }

  if (!quotation) {
    return <div className="min-h-screen flex items-center justify-center">Quotation not found</div>;
  }

  const services = typeof quotation.services === 'string' 
    ? JSON.parse(quotation.services) 
    : quotation.services;

  const isConfirmed = quotation.status === 'Confirmed';
  const isDeclined = quotation.status === 'Declined';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Quotation {quotation.quotationId}</CardTitle>
            <CardDescription>
              Aura Knot Photography
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Event Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Event Type:</span> {quotation.eventType}
                </div>
                <div>
                  <span className="text-gray-600">Package:</span> {quotation.packageType}
                </div>
                <div>
                  <span className="text-gray-600">Start Date:</span> {formatDate(quotation.eventDateStart)}
                </div>
                <div>
                  <span className="text-gray-600">End Date:</span> {formatDate(quotation.eventDateEnd)}
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Location:</span> {quotation.location}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Services</h3>
              {services.photography && services.photography.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Photography</h4>
                  {services.photography.map((service: any, idx: number) => (
                    <div key={idx} className="text-sm text-gray-600 mb-1">
                      {service.type} - {service.stage} ({service.cameraCount} cameras, {service.session})
                    </div>
                  ))}
                </div>
              )}
              {services.videography && services.videography.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Videography</h4>
                  {services.videography.map((service: any, idx: number) => (
                    <div key={idx} className="text-sm text-gray-600 mb-1">
                      {service.type} - {service.stage} ({service.cameraCount} cameras, {service.session})
                    </div>
                  ))}
                </div>
              )}
              {services.additional && services.additional.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Additional Services</h4>
                  {services.additional.map((service: any, idx: number) => (
                    <div key={idx} className="text-sm text-gray-600 mb-1">
                      {service.name} (Qty: {service.quantity}, {service.session})
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold">Total:</span>
                <span className="text-2xl font-bold">{formatCurrency(quotation.customerTotal)}</span>
              </div>
            </div>

            {!isConfirmed && !isDeclined && (
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  disabled={isUpdating}
                >
                  Decline
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Processing...' : 'Accept Quotation'}
                </Button>
              </div>
            )}

            {isConfirmed && (
              <div className="pt-4">
                <p className="text-green-600 font-semibold text-center">
                  ✓ Quotation Confirmed
                </p>
              </div>
            )}

            {isDeclined && (
              <div className="pt-4">
                <p className="text-red-600 font-semibold text-center">
                  Quotation Declined
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
