import assert from 'assert';

import {
  _setExchangeRate,
  _setPreferredFiatCurrency,
  DORKToLocalCurrency,
  satoshiToDORK,
  satoshiToLocalCurrency,
} from '../../dorky_modules/currency';
import { FiatUnit } from '../../models/fiatUnit';

describe('currency', () => {
  it('formats everything correctly', async () => {
    _setExchangeRate('DORK_USD', 10000);

    assert.strictEqual(satoshiToLocalCurrency(1), '$0.0001');
    assert.strictEqual(satoshiToLocalCurrency(-1), '-$0.0001');
    assert.strictEqual(satoshiToLocalCurrency(123), '$0.01');
    assert.strictEqual(satoshiToLocalCurrency(156), '$0.02');
    assert.strictEqual(satoshiToLocalCurrency(51), '$0.01');
    assert.strictEqual(satoshiToLocalCurrency(45), '$0.0045');
    assert.strictEqual(satoshiToLocalCurrency(123456789), '$12,345.68');

    assert.strictEqual(DORKToLocalCurrency(1), '$10,000.00');
    assert.strictEqual(DORKToLocalCurrency(-1), '-$10,000.00');
    assert.strictEqual(DORKToLocalCurrency(1.00000001), '$10,000.00');
    assert.strictEqual(DORKToLocalCurrency(1.0000123), '$10,000.12');
    assert.strictEqual(DORKToLocalCurrency(1.0000146), '$10,000.15');

    assert.strictEqual(satoshiToDORK(1), '0.00000001');
    assert.strictEqual(satoshiToDORK(-1), '-0.00000001');
    assert.strictEqual(satoshiToDORK(100000000), '1');
    assert.strictEqual(satoshiToDORK(123456789123456789), '1234567891.2345678'); // eslint-disable-line @typescript-eslint/no-loss-of-precision

    _setPreferredFiatCurrency(FiatUnit.JPY);
    _setExchangeRate('DORK_JPY', 1043740.8614);

    assert.ok(satoshiToLocalCurrency(1) === '¥0.01' || satoshiToLocalCurrency(1) === '￥0.01', 'Unexpected: ' + satoshiToLocalCurrency(1));
  });
});
