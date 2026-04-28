import React, { Component } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import PropTypes from 'prop-types';
import * as DorkyElectrum from '../../dorky_modules/DorkyElectrum';
import triggerHapticFeedback, { HapticFeedbackTypes } from '../../dorky_modules/hapticFeedback';
import { DorkyCard, DorkyText } from '../../DorkyComponents';
import { HDSegwitBech32Transaction } from '../../class/hd-segwit-bech32-transaction';
import { HDSegwitBech32Wallet } from '../../class/wallets/hd-segwit-bech32-wallet';
import presentAlert, { AlertType } from '../../components/Alert';
import Button from '../../components/Button';
import SafeArea from '../../components/SafeArea';
import { DorkyCurrentTheme } from '../../components/themes';
import loc from '../../loc';
import { StorageContext } from '../../components/Context/StorageProvider';
import ReplaceFeeSuggestions from '../../components/ReplaceFeeSuggestions';
import { majorTomToGroundControl } from '../../dorky_modules/notifications';
import { DorkySpacing, DorkySpacing20 } from '../../components/DorkySpacing';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 20,
  },
  explain: {
    paddingBottom: 16,
  },
  center: {
    alignItems: 'center',
    flex: 1,
  },
  hex: {
    color: DorkyCurrentTheme.colors.buttonAlternativeTextColor,
    fontWeight: '500',
  },
  hexInput: {
    borderColor: '#ebebeb',
    backgroundColor: '#d2f8d6',
    borderRadius: 4,
    marginTop: 20,
    color: '#37c0a1',
    fontWeight: '500',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 16,
  },
  action: {
    marginVertical: 24,
  },
  actionText: {
    color: '#9aa0aa',
    fontSize: 15,
    fontWeight: '500',
    alignSelf: 'center',
  },
});

export default class CPFP extends Component {
  static contextType = StorageContext;
  constructor(props) {
    super(props);
    let txid;
    let wallet;
    if (props.route.params) txid = props.route.params.txid;
    if (props.route.params) wallet = props.route.params.wallet;

    this.state = {
      isLoading: true,
      stage: 1,
      txid,
      wallet,
      isElectrumDisabled: true,
    };
  }

  broadcast = () => {
    this.setState({ isLoading: true }, async () => {
      try {
        await DorkyElectrum.ping();
        await DorkyElectrum.waitTillConnected();
        const result = await this.state.wallet.broadcastTx(this.state.txhex);
        if (result) {
          this.onSuccessBroadcast();
        } else {
          triggerHapticFeedback(HapticFeedbackTypes.NotificationError);
          this.setState({ isLoading: false });
          presentAlert({ message: loc.errors.broadcast });
        }
      } catch (error) {
        triggerHapticFeedback(HapticFeedbackTypes.NotificationError);
        this.setState({ isLoading: false });
        presentAlert({ message: error.message, type: AlertType.Toast });
      }
    });
  };

  onSuccessBroadcast() {
    this.context.txMetadata[this.state.newTxid] = { memo: 'Child pays for parent (CPFP)' };
    majorTomToGroundControl([], [], [this.state.newTxid]);
    this.context.sleep(4000).then(() => this.context.fetchAndSaveWalletTransactions(this.state.wallet.getID()));
    this.props.navigation.navigate('Success', { amount: undefined });
  }

  async componentDidMount() {
    console.log('transactions/CPFP - componentDidMount');
    this.setState({
      isLoading: true,
      newFeeRate: '',
      nonReplaceable: false,
    });
    try {
      await this.checkPossibilityOfCPFP();
    } catch (_) {
      // if anything goes wrong we just show "this is not bumpable" message
      this.setState({ nonReplaceable: true, isLoading: false });
    }
  }

  async checkPossibilityOfCPFP() {
    if (this.state.wallet.type !== HDSegwitBech32Wallet.type) {
      return this.setState({ nonReplaceable: true, isLoading: false });
    }

    const tx = new HDSegwitBech32Transaction(null, this.state.txid, this.state.wallet);
    if ((await tx.isToUsTransaction()) && (await tx.getRemoteConfirmationsNum()) === 0) {
      const info = await tx.getInfo();
      return this.setState({ nonReplaceable: false, feeRate: info.feeRate + 1, isLoading: false, tx });
      // 1 sat makes a lot of difference, since sometimes because of rounding created tx's fee might be insufficient
    } else {
      return this.setState({ nonReplaceable: true, isLoading: false });
    }
  }

  async createTransaction() {
    const newFeeRate = parseInt(this.state.newFeeRate, 10);
    if (newFeeRate > this.state.feeRate) {
      /** @type {HDSegwitBech32Transaction} */
      const tx = this.state.tx;
      this.setState({ isLoading: true });
      try {
        const { tx: newTx } = await tx.createCPFPbumpFee(newFeeRate);
        this.setState({ stage: 2, txhex: newTx.toHex(), newTxid: newTx.getId() });
        this.setState({ isLoading: false });
      } catch (_) {
        this.setState({ isLoading: false });
        presentAlert({ message: loc.errors.error + ': ' + _.message });
      }
    }
  }

  renderStage1(text) {
    return (
      <SafeArea style={styles.root}>
        <DorkySpacing />
        <DorkyCard style={styles.center}>
          <DorkyText>{text}</DorkyText>
          <DorkySpacing20 />
          <ReplaceFeeSuggestions onFeeSelected={fee => this.setState({ newFeeRate: fee })} transactionMinimum={this.state.feeRate} />
          <DorkySpacing />
          <Button
            disabled={this.state.newFeeRate <= this.state.feeRate}
            onPress={() => this.createTransaction()}
            title={loc.transactions.cpfp_create}
          />
        </DorkyCard>
      </SafeArea>
    );
  }

  renderStage2() {
    return (
      <View style={styles.root}>
        <DorkyCard style={styles.center}>
          <DorkyText style={styles.hex}>{loc.send.create_this_is_hex}</DorkyText>
          <TextInput style={styles.hexInput} height={112} multiline editable value={this.state.txhex} />

          <TouchableOpacity accessibilityRole="button" style={styles.action} onPress={() => Clipboard.setString(this.state.txhex)}>
            <Text style={styles.actionText}>{loc.send.create_copy}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.action}
            onPress={() => Linking.openURL('https://coinb.in/?verify=' + this.state.txhex)}
          >
            <Text style={styles.actionText}>{loc.send.create_verify}</Text>
          </TouchableOpacity>
          <Button disabled={this.context.isElectrumDisabled} onPress={this.broadcast} title={loc.send.confirm_sendNow} />
        </DorkyCard>
      </View>
    );
  }

  render() {
    if (this.state.isLoading) {
      return (
        <View style={styles.root}>
          <ActivityIndicator />
        </View>
      );
    }

    if (this.state.stage === 2) {
      return this.renderStage2();
    }

    if (this.state.nonReplaceable) {
      return (
        <SafeArea style={styles.root}>
          <DorkySpacing20 />
          <DorkySpacing20 />
          <DorkySpacing20 />
          <DorkySpacing20 />
          <DorkySpacing20 />

          <DorkyText h4>{loc.transactions.cpfp_no_bump}</DorkyText>
        </SafeArea>
      );
    }

    return (
      <SafeArea style={styles.explain}>
        <ScrollView
          automaticallyAdjustContentInsets
          automaticallyAdjustKeyboardInsets
          automaticallyAdjustsScrollIndicatorInsets
          contentInsetAdjustmentBehavior="automatic"
        >
          {this.renderStage1(loc.transactions.cpfp_exp)}
        </ScrollView>
      </SafeArea>
    );
  }
}

CPFP.propTypes = {
  navigation: PropTypes.shape({
    popToTop: PropTypes.func,
    navigate: PropTypes.func,
  }),
  route: PropTypes.shape({
    params: PropTypes.shape({
      txid: PropTypes.string,
      wallet: PropTypes.object,
    }),
  }),
};
