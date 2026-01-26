'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PHOTOGRAPHY_TYPES,
  VIDEOGRAPHY_TYPES,
  SERVICE_STAGES,
  SESSION_TYPES,
  ADDITIONAL_SERVICES,
  EVENT_TYPES,
} from '@/config/constants';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { PhotographyService, VideographyService, AdditionalService, Deliverables, Quotation } from '@/types';
import { DeliverablesForm } from '@/components/quotations/DeliverablesForm';
import { calculateTotalQuotationCost } from '@/lib/calculations';

export default function NewQuotationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = searchParams.get('customerId');
  const quotationId = searchParams.get('quotationId'); // For edit mode

  const [customer, setCustomer] = useState<any>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [services, setServices] = useState<{
    photography?: PhotographyService[];
    videography?: VideographyService[];
    additional?: AdditionalService[];
  }>({});
  const [manualTotal, setManualTotal] = useState(0);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [deliverables, setDeliverables] = useState<Deliverables | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Event details state
  const [eventType, setEventType] = useState('');
  const [eventDateStart, setEventDateStart] = useState('');
  const [eventDateEnd, setEventDateEnd] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  const fetchQuotation = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/quotations/${quotationId}`);
      if (response.ok) {
        const data = await response.json();
        setQuotation(data);
        
        // Pre-populate form (editing allowed even after confirmation)
        setCustomer({ customerId: data.customerId });
        setEventType(data.eventType || '');
        setEventDateStart(data.eventDateStart || '');
        setEventDateEnd(data.eventDateEnd || '');
        setEventLocation(data.location || '');
        if (data.services) {
          const servicesData = typeof data.services === 'string' ? JSON.parse(data.services) : data.services;
          setServices(servicesData);
        }
        setManualTotal(data.manualTotal || data.customerTotal || 0);
        if (data.deliverables) {
          const deliverablesData = typeof data.deliverables === 'string' ? JSON.parse(data.deliverables) : data.deliverables;
          setDeliverables(deliverablesData);
        }
        
        // Fetch customer details
        const customerRes = await fetch(`/api/customers?id=${data.customerId}`);
        if (customerRes.ok) {
          const customerData = await customerRes.json();
          setCustomer(customerData);
        }
      }
    } catch (error) {
      console.error('Error fetching quotation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [quotationId]);

  const fetchCustomer = useCallback(async () => {
    try {
      const response = await fetch(`/api/customers?id=${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  }, [customerId]);

  useEffect(() => {
    if (quotationId) {
      // Edit mode - fetch existing quotation
      fetchQuotation();
    } else if (customerId) {
      // New mode - fetch customer
      fetchCustomer();
    }
  }, [customerId, quotationId, fetchQuotation, fetchCustomer]);

  const addPhotographyService = () => {
    setServices((prev) => ({
      ...prev,
      photography: [
        ...(prev.photography || []),
        {
          type: 'Traditional',
          stage: 'Stage',
          cameraCount: 1,
          rate: 0,
          session: 'Full Session',
        },
      ],
    }));
  };

  const addVideographyService = () => {
    setServices((prev) => ({
      ...prev,
      videography: [
        ...(prev.videography || []),
        {
          type: 'Traditional',
          stage: 'Stage',
          cameraCount: 1,
          rate: 0,
          session: 'Full Session',
        },
      ],
    }));
  };

  const addAdditionalService = () => {
    setServices((prev) => ({
      ...prev,
      additional: [
        ...(prev.additional || []),
        {
          name: 'LED Wall',
          session: 'Full Session',
          rate: 0,
          quantity: 1,
        },
      ],
    }));
  };

  // Auto-calculate total when services change
  useEffect(() => {
    const total = calculateTotalQuotationCost(services);
    setCalculatedTotal(total);
    setManualTotal(total); // Auto-update manual total
  }, [services]);

  const updateService = (
    type: 'photography' | 'videography' | 'additional',
    index: number,
    field: string,
    value: any
  ) => {
    setServices((prev) => {
      const updated = { ...prev };
      const serviceArray = updated[type] || [];
      serviceArray[index] = { ...serviceArray[index], [field]: value };
      return { ...updated, [type]: serviceArray };
    });
  };

  const removeService = (type: 'photography' | 'videography' | 'additional', index: number) => {
    setServices((prev) => {
      const updated = { ...prev };
      const serviceArray = updated[type] || [];
      serviceArray.splice(index, 1);
      return { ...updated, [type]: serviceArray };
    });
  };

  const handleSubmit = async () => {
    const targetCustomerId = quotation?.customerId || customerId;
    if (!targetCustomerId) {
      toast({
        title: 'Error',
        description: 'Customer ID is missing',
        variant: 'destructive',
      });
      return;
    }

    if (manualTotal <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid total amount',
        variant: 'destructive',
      });
      return;
    }

    if (!eventType || eventType.trim() === '') {
      toast({
        title: 'Error',
        description: 'Event type is required',
        variant: 'destructive',
      });
      return;
    }

    if (!eventDateStart || eventDateStart.trim() === '') {
      toast({
        title: 'Error',
        description: 'Event start date is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = quotationId ? `/api/quotations/${quotationId}` : '/api/quotations';
      const method = quotationId ? 'PATCH' : 'POST';
      
      const requestData = {
        customerId: targetCustomerId,
        eventType,
        eventDateStart,
        eventDateEnd: eventDateEnd || null,
        location: eventLocation || customer?.address || '',
        services,
        customerTotal: manualTotal,
        manualTotal,
        deliverables,
      };
      
      console.log('Sending quotation data:', requestData);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(quotationId ? 'Failed to update quotation' : 'Failed to create quotation');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: quotationId ? 'Quotation updated successfully' : 'Quotation created successfully',
      });
      router.push(`/quotations/${result.quotationId || quotationId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: quotationId ? 'Failed to update quotation' : 'Failed to create quotation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!customer && !quotation) {
    return <div>Loading customer data...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">{quotationId ? 'Edit Quotation' : 'Service & Deliverables'}</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Customer: {customer?.name || 'Loading...'} | Mobile: {customer?.mobile || 'Loading...'}
            {quotationId && ` | Quotation: ${quotationId}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Event Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Event Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventType">Event Type *</Label>
                  <Select value={eventType} onValueChange={setEventType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eventLocation">Event Location</Label>
                  <Input
                    id="eventLocation"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Enter event location"
                  />
                </div>
                <div>
                  <Label htmlFor="eventDateStart">Event Start Date *</Label>
                  <Input
                    id="eventDateStart"
                    type="date"
                    value={eventDateStart}
                    onChange={(e) => setEventDateStart(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="eventDateEnd">Event End Date</Label>
                  <Input
                    id="eventDateEnd"
                    type="date"
                    value={eventDateEnd}
                    onChange={(e) => setEventDateEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Photography Services */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Photography Services</h3>
                <Button type="button" onClick={addPhotographyService} variant="outline">
                  Add Photography
                </Button>
              </div>
              {services.photography?.map((service, index) => (
                <Card key={index} className="mb-4">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500 opacity-60">Type</Label>
                        <Select
                          value={service.type}
                          onValueChange={(value) =>
                            updateService('photography', index, 'type', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PHOTOGRAPHY_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500 opacity-60">Stage</Label>
                        <Select
                          value={service.stage}
                          onValueChange={(value) =>
                            updateService('photography', index, 'stage', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICE_STAGES.map((stage) => (
                              <SelectItem key={stage} value={stage}>
                                {stage}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500 opacity-60">Cameras</Label>
                        <Input
                          type="number"
                          placeholder="Cameras"
                          value={service.cameraCount}
                          onChange={(e) =>
                            updateService('photography', index, 'cameraCount', parseInt(e.target.value) || 0)
                          }
                          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500 opacity-60">Rate</Label>
                        <Input
                          type="number"
                          placeholder="Rate"
                          value={service.rate}
                          onChange={(e) =>
                            updateService('photography', index, 'rate', parseFloat(e.target.value) || 0)
                          }
                          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500 opacity-60">Session</Label>
                        <div className="flex gap-2">
                          <Select
                            value={service.session}
                            onValueChange={(value) =>
                              updateService('photography', index, 'session', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SESSION_TYPES.map((session) => (
                                <SelectItem key={session} value={session}>
                                  {session}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => removeService('photography', index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Videography Services */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Videography Services</h3>
                <Button type="button" onClick={addVideographyService} variant="outline">
                  Add Videography
                </Button>
              </div>
              {services.videography?.map((service, index) => (
                <Card key={index} className="mb-4">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500 opacity-60">Type</Label>
                        <Select
                          value={service.type}
                          onValueChange={(value) =>
                            updateService('videography', index, 'type', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VIDEOGRAPHY_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500 opacity-60">Stage</Label>
                        <Select
                          value={service.stage}
                          onValueChange={(value) =>
                            updateService('videography', index, 'stage', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICE_STAGES.map((stage) => (
                              <SelectItem key={stage} value={stage}>
                                {stage}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500 opacity-60">Cameras</Label>
                        <Input
                          type="number"
                          placeholder="Cameras"
                          value={service.cameraCount}
                          onChange={(e) =>
                            updateService('videography', index, 'cameraCount', parseInt(e.target.value) || 0)
                          }
                          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500 opacity-60">Rate</Label>
                        <Input
                          type="number"
                          placeholder="Rate"
                          value={service.rate}
                          onChange={(e) =>
                            updateService('videography', index, 'rate', parseFloat(e.target.value) || 0)
                          }
                          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500 opacity-60">Session</Label>
                        <div className="flex gap-2">
                          <Select
                            value={service.session}
                            onValueChange={(value) =>
                              updateService('videography', index, 'session', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SESSION_TYPES.map((session) => (
                                <SelectItem key={session} value={session}>
                                  {session}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => removeService('videography', index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Services */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Additional Services</h3>
                <Button type="button" onClick={addAdditionalService} variant="outline">
                  Add Service
                </Button>
              </div>
              {services.additional?.map((service, index) => (
                <Card key={index} className="mb-4">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm text-gray-500 opacity-60">Service Name</Label>
                          <Select
                            value={service.name}
                            onValueChange={(value) =>
                              updateService('additional', index, 'name', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ADDITIONAL_SERVICES.map((name) => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500 opacity-60">Session</Label>
                          <Select
                            value={service.session}
                            onValueChange={(value) =>
                              updateService('additional', index, 'session', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SESSION_TYPES.map((session) => (
                                <SelectItem key={session} value={session}>
                                  {session}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500 opacity-60">Rate</Label>
                          <Input
                            type="number"
                            placeholder="Rate"
                            value={service.rate}
                            onChange={(e) =>
                              updateService('additional', index, 'rate', parseFloat(e.target.value) || 0)
                            }
                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500 opacity-60">Quantity</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Quantity"
                              value={service.quantity}
                              onChange={(e) =>
                                updateService('additional', index, 'quantity', parseInt(e.target.value) || 1)
                              }
                              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => removeService('additional', index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                      {service.name === 'Others' && (
                        <div>
                          <Label className="text-sm text-gray-500 opacity-60">Service Name (Required for Others)</Label>
                          <Input
                            placeholder="Enter service name"
                            value={service.customName || ''}
                            onChange={(e) =>
                              updateService('additional', index, 'customName', e.target.value)
                            }
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Deliverables */}
            <DeliverablesForm
              deliverables={deliverables}
              onChange={(del) => setDeliverables(del)}
            />

            {/* Manual Total Input */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="manualTotal" className="text-lg font-semibold">Total Amount *</Label>
                  <Input
                    id="manualTotal"
                    type="number"
                    step="0.01"
                    value={manualTotal}
                    onChange={(e) => setManualTotal(parseFloat(e.target.value) || 0)}
                    onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                    placeholder="Enter total amount"
                    className="text-2xl font-bold"
                  />
                  <p className="text-sm text-gray-500">Enter the total quotation amount manually</p>
                </div>
              </CardContent>
            </Card>

            {/* Total Display */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">Total:</span>
                  <span className="text-3xl font-bold">{formatCurrency(manualTotal)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting 
                  ? (quotationId ? 'Updating...' : 'Creating...') 
                  : (quotationId ? 'Update Quotation' : 'Create Quotation')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
