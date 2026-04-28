import { DorkcoinUnit } from '../models/dorkcoinUnits';

export type PaymentCodeStackParamList = {
  PaymentCode: { paymentCode: string };
  PaymentCodesList: {
    memo: string;
    address: string;
    walletID: string;
    amount: number;
    amountSats: number;
    unit: DorkcoinUnit;
    isTransactionReplaceable: boolean;
    launchedBy: string;
    isEditable: boolean;
    uri: string /* payjoin uri */;
  };
};
