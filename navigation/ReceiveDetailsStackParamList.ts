export type ReceiveDetailsStackParamList = {
  ReceiveDetails: {
    walletID?: string;
    address?: string;
    customLabel?: string;
    customAmount?: string;
    customUnit?: import('../models/bitcoinUnits').DorkcoinUnit;
    bip21encoded?: string;
    isCustom?: boolean;
  };
  ReceiveCustomAmount: {
    address: string;
    currentLabel?: string;
    currentAmount?: string;
    currentUnit?: import('../models/bitcoinUnits').DorkcoinUnit;
    preferredUnit?: import('../models/bitcoinUnits').DorkcoinUnit;
  };
};
