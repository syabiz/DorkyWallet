# DorkyWallet - A Dorkcoin & Lightning Wallet

[![GitHub tag](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/dorkcoin/DorkyWallet/main/package.json&query=$.version&label=Version)](https://github.com/dorkcoin/DorkyWallet)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Thin Dorkcoin Wallet.
Built with React Native and Electrum. Forked from BlueWallet.

Website: [dorkywallet.dorkcoin.org](https://dorkywallet.dorkcoin.org)

Community: [telegram group](https://t.me/dorkcoin)

* Private keys never leave your device
* Lightning Network supported
* SegWit-first. Replace-By-Fee support
* Encryption. Plausible deniability


## BUILD & RUN IT

Please refer to the engines field in package.json file for the minimum required versions of Node and npm. It is preferred that you use an even-numbered version of Node as these are LTS versions.

To view the version of Node and npm in your environment, run the following in your console:

```
node --version && npm --version
```

* In your console:

```
git clone https://github.com/dorkcoin/DorkyWallet.git
cd DorkyWallet
npm install
```

Please make sure that your console is running the most stable versions of npm and node (even-numbered versions).

* To run on Android:

You will now need to either connect an Android device to your computer or run an emulated Android device using AVD Manager which comes shipped with Android Studio. To run an emulator using AVD Manager:

1. Download and run Android Studio
2. Click on "Open an existing Android Studio Project"
3. Open `build.gradle` file under `DorkyWallet/android/` folder
4. Android Studio will take some time to set things up. Once everything is set up, go to `Tools` -> `AVD Manager`.
5. Click on "Create Virtual Device..." and go through the steps to create a virtual device
6. Launch your newly created virtual device by clicking the `Play` button under `Actions` column

Once you connected an Android device or launched an emulator, run this:

```
npx react-native run-android
```

The above command will build the app and install it.

* To run on iOS:

```
npx pod-install
npm start
```

In another terminal window within the DorkyWallet folder:
```
npx react-native run-ios
```

## TESTS

```bash
npm run test
```


## LICENSE

MIT

## WANT TO CONTRIBUTE?

Grab an issue from [the backlog](https://github.com/dorkcoin/DorkyWallet/issues), try to start or submit a PR, any doubts we will try to guide you. Contributors have a private telegram group, request access by email dorkywallet@dorkcoin.org

## RESPONSIBLE DISCLOSURE

Found critical bugs/vulnerabilities? Please email them dorkywallet@dorkcoin.org
Thanks!
