import {
  PhotographyService,
  VideographyService,
  AdditionalService,
} from '@/types';
import { SESSION_MULTIPLIERS as multipliers } from '@/config/constants';

export function calculatePhotographyCost(service: PhotographyService): number {
  // Use the defined rate for photography (do not multiply by camera count)
  return service.rate;
}

export function calculateVideographyCost(service: VideographyService): number {
  // Use the defined rate for videography (do not multiply by camera count)
  return service.rate;
}

export function calculateAdditionalServiceCost(service: AdditionalService): number {
  // Session type does not affect price - only rate (do not multiply by quantity)
  return service.rate;
}

export function calculateTotalQuotationCost(services: {
  photography?: PhotographyService[];
  videography?: VideographyService[];
  additional?: AdditionalService[];
}): number {
  let total = 0;

  if (services.photography) {
    total += services.photography.reduce((sum, service) => sum + calculatePhotographyCost(service), 0);
  }

  if (services.videography) {
    total += services.videography.reduce((sum, service) => sum + calculateVideographyCost(service), 0);
  }

  if (services.additional) {
    total += services.additional.reduce((sum, service) => sum + calculateAdditionalServiceCost(service), 0);
  }

  return total;
}

export function calculateProfit(finalBudget: number, totalExpenses: number): number {
  return finalBudget - totalExpenses;
}

export function calculateProfitMargin(finalBudget: number, totalExpenses: number): number {
  if (finalBudget === 0) return 0;
  return ((finalBudget - totalExpenses) / finalBudget) * 100;
}

export function calculatePaymentPercentage(amount: number, budget: number): number {
  if (budget === 0) return 0;
  return (amount / budget) * 100;
}
