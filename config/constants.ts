import { EventType, PackageType, SessionType, AdditionalServiceName } from '@/types';

export const EVENT_TYPES: EventType[] = [
  'Engagement',
  'Reception',
  'Wedding',
  'Engagement + Reception + Wedding',
  'Puberty',
  'Baby Shower',
  'Outdoor Shoot',
  'Baby Shoot',
  'Corporate Events',
  'School / Colleges',
  'Other',
];

export const PACKAGE_TYPES: PackageType[] = [
  'Package 1',
  'Package 2',
  'Package 3',
  'Package 4',
  'Package 5',
  'Custom',
];

export const SESSION_TYPES: SessionType[] = [
  'Half Session',
  'Full Session',
  '1.5 Session',
  '2 Sessions',
  'Others',
];

export const ADDITIONAL_SERVICES: AdditionalServiceName[] = [
  'LED Wall',
  'Live Streaming',
  'Spinning',
  'Live Frames',
  'Photo Booth',
  'LED Wall + Mixing Unit',
  'Others',
];

export const SERVICE_STAGES = ['Stage', 'Reception', 'Extra'] as const;

export const PHOTOGRAPHY_TYPES = ['Traditional', 'Candid'] as const;
export const VIDEOGRAPHY_TYPES = ['Traditional', 'Candid'] as const;

export const PAYMENT_TYPES = [
  'Initial Advance',
  'Function Advance',
  'Printing Advance',
  'Final Payment',
] as const;

export const QUOTATION_PREFIX = 'Q-AKP';
export const ORDER_PREFIX = 'ORD-AKP';

export const SESSION_MULTIPLIERS: Record<SessionType, number> = {
  'Half Session': 0.5,
  'Full Session': 1,
  '1.5 Session': 1.5,
  '2 Sessions': 2,
  'Others': 1,
};
