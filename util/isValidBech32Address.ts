import * as bitcoin from 'bitcoinjs-lib';
import { DORKCOIN } from '../dorky_modules/networks';

export function isValidBech32Address(address: string): boolean {
  try {
    bitcoin.address.fromBech32(address, DORKCOIN);
    return true;
  } catch (e) {
    return false;
  }
}