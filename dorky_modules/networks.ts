// dorky_modules/networks.ts
/**
 * DorkyWallet — Dorkcoin Network Parameters for bitcoinjs-lib
 * Internal config — do not modify unless network params change.
 */

// Dorkcoin Mainnet
export const DORKCOIN = {
  messagePrefix: '\x18Dorkcoin Signed Message:\n',
  bech32: 'dork',
  bip32: {
    public: 0x0488B21E,
    private: 0x0488ADE4,
  },
  pubKeyHash: 0x1e, // Prefix 'D...'
  scriptHash: 0x08, // Prefix '4...'
  wif: 0x9e,        // Prefix 'Q...'
};

// Dorkcoin Testnet
export const DORKCOIN_TESTNET = {
  messagePrefix: '\x18Dorkcoin Signed Message:\n',
  bech32: 'dorktest',
  bip32: {
    public: 0x043587CF,
    private: 0x04358394,
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x08,
  wif: 0xef,
};

// Khusus untuk Taproot jika bech32 berbeda (dorkcoin)
export const DORKCOIN_TAPROOT = {
  ...DORKCOIN,
  bech32: 'dorkcoin',
};