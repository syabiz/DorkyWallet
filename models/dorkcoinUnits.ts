export const DorkcoinUnit = {
  DORK: 'DORK',
  SATS: 'sats',
  LOCAL_CURRENCY: 'local_currency',
  MAX: 'MAX',
} as const;
export type DorkcoinUnit = (typeof DorkcoinUnit)[keyof typeof DorkcoinUnit];

export const Chain = {
  ONCHAIN: 'ONCHAIN',
  OFFCHAIN: 'OFFCHAIN',
} as const;
export type Chain = (typeof Chain)[keyof typeof Chain];
