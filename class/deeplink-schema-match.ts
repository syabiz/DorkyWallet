import bip21, { TOptions } from 'bip21';
import * as bitcoin from 'bitcoinjs-lib';
import URL from 'url';
import { readFileOutsideSandbox } from '../dorky_modules/fs';
import { Chain } from '../models/dorkcoinUnits';
import { WatchOnlyWallet } from './wallets/watch-only-wallet';
import Azteco from './azteco';
import Lnurl from './lnurl';
import type { TWallet } from './wallets/types';

type TCompletionHandlerParams = [string, object];
type TContext = {
  wallets: TWallet[];
  saveToDisk: () => void;
  addWallet: (wallet: TWallet) => void;
  setSharedCosigner: (cosigner: string) => void;
};

type TBothDorkcoinAndLightning = { bitcoin: string; lndInvoice: string } | undefined;

class DeeplinkSchemaMatch {
  static hasSchema(schemaString: string): boolean {
    if (typeof schemaString !== 'string' || schemaString.length <= 0) return false;
    const lowercaseString = schemaString.trim().toLowerCase();
    return (
      lowercaseString.startsWith('bitcoin:') ||
      lowercaseString.startsWith('lightning:') ||
      lowercaseString.startsWith('dorky:') ||
      lowercaseString.startsWith('dorkywallet:') ||
      lowercaseString.startsWith('lapp:')
    );
  }

  /**
   * Examines the content of the event parameter.
   * If the content is recognizable, create a dictionary with the respective
   * navigation dictionary required by react-navigation
   *
   * @param event {{url: string}} URL deeplink as passed to app, e.g. `bitcoin:bc1qh6tf004ty7z7un2v5ntu4mkf630545gvhs45u7?amount=666&label=Yo`
   * @param completionHandler {function} Callback that returns [string, params: object]
   */
  static navigationRouteFor(
    event: { url: string },
    completionHandler: (args: TCompletionHandlerParams) => void,
    context: TContext = { wallets: [], saveToDisk: () => {}, addWallet: () => {}, setSharedCosigner: () => {} },
  ) {
    if (event.url === null) {
      return;
    }
    if (typeof event.url !== 'string') {
      return;
    }

    if (event.url.toLowerCase().startsWith('dorkywallet:bitcoin:') || event.url.toLowerCase().startsWith('dorkywallet:lightning:')) {
      event.url = event.url.substring(11);
    } else if (event.url.toLocaleLowerCase().startsWith('dorkywallet://widget?action=')) {
      event.url = event.url.substring('dorkywallet://'.length);
    }

    if (DeeplinkSchemaMatch.isWidgetAction(event.url)) {
      if (context.wallets.length >= 0) {
        const wallet = context.wallets[0];
        const action = event.url.split('widget?action=')[1];
        if (wallet.chain === Chain.ONCHAIN) {
          if (action === 'openSend') {
            completionHandler([
              'SendDetailsRoot',
              {
                screen: 'SendDetails',
                params: {
                  walletID: wallet.getID(),
                },
              },
            ]);
          } else if (action === 'openReceive') {
            completionHandler([
              'DetailViewStackScreensStack',
              {
                screen: 'ReceiveDetails',
                params: {
                  walletID: wallet.getID(),
                },
              },
            ]);
          }
        } else if (wallet.chain === Chain.OFFCHAIN) {
          if (action === 'openSend') {
            completionHandler([
              'ScanLNDInvoiceRoot',
              {
                screen: 'ScanLNDInvoice',
                params: {
                  walletID: wallet.getID(),
                },
              },
            ]);
          } else if (action === 'openReceive') {
            completionHandler(['LNDCreateInvoiceRoot', { screen: 'LNDCreateInvoice', params: { walletID: wallet.getID() } }]);
          }
        }
      }
    } else if (DeeplinkSchemaMatch.isPossiblyPSBTFile(event.url)) {
      readFileOutsideSandbox(decodeURI(event.url))
        .then(file => {
          if (file) {
            completionHandler([
              'SendDetailsRoot',
              {
                screen: 'PsbtWithHardwareWallet',
                params: {
                  deepLinkPSBT: file,
                },
              },
            ]);
          }
        })
        .catch(e => console.warn(e));
      return;
    } else if (DeeplinkSchemaMatch.isPossiblyCosignerFile(event.url)) {
      readFileOutsideSandbox(decodeURI(event.url))
        .then(file => {
          // checks whether the necessary json keys are present in order to set a cosigner,
          // doesn't validate the values this happens later
          if (!file || !this.hasNeededJsonKeysForMultiSigSharing(file)) {
            return;
          }
          context.setSharedCosigner(file);
        })
        .catch(e => console.warn(e));
    }
    let isBothDorkcoinAndLightning: TBothDorkcoinAndLightning;
    try {
      isBothDorkcoinAndLightning = DeeplinkSchemaMatch.isBothDorkcoinAndLightning(event.url);
    } catch (e) {
      console.log(e);
    }
    if (isBothDorkcoinAndLightning) {
      completionHandler([
        'SelectWallet',
        {
          onWalletSelect: (wallet: TWallet, { navigation }: any) => {
            navigation.pop(); // close select wallet screen
            navigation.navigate(...DeeplinkSchemaMatch.isBothDorkcoinAndLightningOnWalletSelect(wallet, isBothDorkcoinAndLightning));
          },
        },
      ]);
    } else if (DeeplinkSchemaMatch.isDorkcoinAddress(event.url)) {
      completionHandler([
        'SendDetailsRoot',
        {
          screen: 'SendDetails',
          params: {
            uri: event.url.replace('://', ':'),
          },
        },
      ]);
    } else if (DeeplinkSchemaMatch.isLightningInvoice(event.url)) {
      completionHandler([
        'ScanLNDInvoiceRoot',
        {
          screen: 'ScanLNDInvoice',
          params: {
            uri: event.url.replace('://', ':'),
          },
        },
      ]);
    } else if (DeeplinkSchemaMatch.isLnUrl(event.url)) {
      // at this point we can not tell if it is lnurl-pay or lnurl-withdraw since it needs additional async call
      // to the server, which is undesirable here, so LNDCreateInvoice screen will handle it for us and will
      // redirect user to LnurlPay screen if necessary
      completionHandler([
        'LNDCreateInvoiceRoot',
        {
          screen: 'LNDCreateInvoice',
          params: {
            uri: event.url.replace('lightning:', '').replace('LIGHTNING:', ''),
          },
        },
      ]);
    } else if (Lnurl.isLightningAddress(event.url)) {
      // this might be not just an email but a lightning address
      // @see https://lightningaddress.com
      completionHandler([
        'ScanLNDInvoiceRoot',
        {
          screen: 'ScanLNDInvoice',
          params: {
            uri: event.url,
          },
        },
      ]);
    } else if (Azteco.isRedeemUrl(event.url)) {
      completionHandler([
        'AztecoRedeemRoot',
        {
          screen: 'AztecoRedeem',
          params: Azteco.getParamsFromUrl(event.url),
        },
      ]);
    } else if (new WatchOnlyWallet().setSecret(event.url).init().valid()) {
      completionHandler([
        'AddWalletRoot',
        {
          screen: 'ImportWallet',
          params: {
            triggerImport: true,
            label: event.url,
          },
        },
      ]);
    } else {
      const urlObject = URL.parse(event.url, true); // eslint-disable-line n/no-deprecated-api
      (async () => {
        if (urlObject.protocol === 'dorkywallet:' || urlObject.protocol === 'lapp:' || urlObject.protocol === 'dorky:') {
          switch (urlObject.host) {
            case 'setelectrumserver':
              completionHandler([
                'ElectrumSettings',
                {
                  server: DeeplinkSchemaMatch.getServerFromSetElectrumServerAction(event.url),
                },
              ]);
              break;
            case 'setlndhuburl':
              completionHandler([
                'LightningSettings',
                {
                  url: DeeplinkSchemaMatch.getUrlFromSetLndhubUrlAction(event.url),
                },
              ]);
              break;
          }
        }
      })();
    }
  }

  /**
   * Extracts server from a deeplink like `dorkywallet:setelectrumserver?server=electrum1.dorkywallet.io%3A443%3As`
   * returns FALSE if none found
   *
   * @param url {string}
   * @return {string|boolean}
   */
  static getServerFromSetElectrumServerAction(url: string): string | false {
    if (!url.startsWith('dorkywallet:setelectrumserver') && !url.startsWith('setelectrumserver')) return false;
    const splt = url.split('server=');
    if (splt[1]) return decodeURIComponent(splt[1]);
    return false;
  }

  /**
   * Extracts url from a deeplink like `dorkywallet:setlndhuburl?url=https%3A%2F%2Flndhub.herokuapp.com`
   * returns FALSE if none found
   *
   * @param url {string}
   * @return {string|boolean}
   */
  static getUrlFromSetLndhubUrlAction(url: string): string | false {
    if (!url.startsWith('dorkywallet:setlndhuburl') && !url.startsWith('setlndhuburl')) return false;
    const splt = url.split('url=');
    if (splt[1]) return decodeURIComponent(splt[1]);
    return false;
  }

  static isTXNFile(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.txn');
  }

  static isPossiblyPSBTFile(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.psbt');
  }

  static isPossiblyCosignerFile(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.bwcosigner');
  }

  static isBothDorkcoinAndLightningOnWalletSelect(wallet: TWallet, uri: any): TCompletionHandlerParams {
    if (wallet.chain === Chain.ONCHAIN) {
      return [
        'SendDetailsRoot',
        {
          screen: 'SendDetails',
          params: {
            uri: uri.bitcoin,
            walletID: wallet.getID(),
          },
        },
      ];
    } else {
      return [
        'ScanLNDInvoiceRoot',
        {
          screen: 'ScanLNDInvoice',
          params: {
            uri: uri.lndInvoice,
            walletID: wallet.getID(),
          },
        },
      ];
    }
  }

  static isDorkcoinAddress(address: string): boolean {
    address = address.replace('://', ':').replace('bitcoin:', '').replace('BITCOIN:', '').replace('bitcoin=', '').split('?')[0];
    let isValidDorkcoinAddress = false;
    try {
      bitcoin.address.toOutputScript(address);
      isValidDorkcoinAddress = true;
    } catch (err) {
      isValidDorkcoinAddress = false;
    }
    return isValidDorkcoinAddress;
  }

  static isLightningInvoice(invoice: string): boolean {
    let isValidLightningInvoice = false;
    if (
      invoice.toLowerCase().startsWith('lightning:lnb') ||
      invoice.toLowerCase().startsWith('lightning://lnb') ||
      invoice.toLowerCase().startsWith('lnb')
    ) {
      isValidLightningInvoice = true;
    }
    return isValidLightningInvoice;
  }

  static isLnUrl(text: string): boolean {
    return Lnurl.isLnurl(text);
  }

  static isWidgetAction(text: string): boolean {
    return text.startsWith('widget?action=');
  }

  static hasNeededJsonKeysForMultiSigSharing(str: string): boolean {
    let obj;

    // Check if it's a valid JSON
    try {
      obj = JSON.parse(str);
    } catch (e) {
      return false;
    }

    // Check for the existence and type of the keys
    return typeof obj.xfp === 'string' && typeof obj.xpub === 'string' && typeof obj.path === 'string';
  }

  static isBothDorkcoinAndLightning(url: string): TBothDorkcoinAndLightning {
    if (url.includes('lightning') && (url.includes('bitcoin') || url.includes('BITCOIN'))) {
      const txInfo = url.split(/(bitcoin:\/\/|BITCOIN:\/\/|bitcoin:|BITCOIN:|lightning:|lightning=|bitcoin=)+/);
      let btc: string | false = false;
      let lndInvoice: string | false = false;
      for (const [index, value] of txInfo.entries()) {
        try {
          // Inside try-catch. We dont wan't to  crash in case of an out-of-bounds error.
          if (value.startsWith('bitcoin') || value.startsWith('BITCOIN')) {
            btc = `bitcoin:${txInfo[index + 1]}`;
            if (!DeeplinkSchemaMatch.isDorkcoinAddress(btc)) {
              btc = false;
              break;
            }
          } else if (value.startsWith('lightning')) {
            const lnpart = txInfo[index + 1].split('&').find(el => el.toLowerCase().startsWith('ln'));
            lndInvoice = `lightning:${lnpart}`;
            if (!this.isLightningInvoice(lndInvoice)) {
              lndInvoice = false;
              break;
            }
          }
        } catch (e) {
          console.log(e);
        }
        if (btc && lndInvoice) break;
      }
      if (btc && lndInvoice) {
        return { bitcoin: btc, lndInvoice };
      } else {
        return undefined;
      }
    }
    return undefined;
  }

  static bip21decode(uri?: string) {
    if (!uri) {
      throw new Error('No URI provided');
    }
    let replacedUri = uri;
    for (const replaceMe of ['BITCOIN://', 'bitcoin://', 'BITCOIN:']) {
      replacedUri = replacedUri.replace(replaceMe, 'bitcoin:');
    }

    return bip21.decode(replacedUri);
  }

  static bip21encode(address: string, options?: TOptions): string {
    // uppercase address if bech32 to satisfy BIP_0173
    const isBech32 = address.startsWith('bc1');
    if (isBech32) {
      address = address.toUpperCase();
    }

    for (const key in options) {
      if (key === 'label' && String(options[key]).replace(' ', '').length === 0) {
        delete options[key];
      }
      if (key === 'amount' && !(Number(options[key]) > 0)) {
        delete options[key];
      }
    }
    return bip21.encode(address, options);
  }

  static decodeDorkcoinUri(uri: string) {
    let amount;
    let address = uri || '';
    let memo = '';
    let payjoinUrl = '';
    try {
      const parsedDorkcoinUri = DeeplinkSchemaMatch.bip21decode(uri);
      address = parsedDorkcoinUri.address ? parsedDorkcoinUri.address.toString() : address;
      if ('options' in parsedDorkcoinUri) {
        if (parsedDorkcoinUri.options.amount) {
          amount = Number(parsedDorkcoinUri.options.amount);
        }
        if (parsedDorkcoinUri.options.label) {
          memo = parsedDorkcoinUri.options.label;
        }
        if (parsedDorkcoinUri.options.pj) {
          payjoinUrl = parsedDorkcoinUri.options.pj;
        }
      }
    } catch (_) {}
    return { address, amount, memo, payjoinUrl };
  }
}

export default DeeplinkSchemaMatch;
