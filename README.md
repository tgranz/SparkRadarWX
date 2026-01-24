# About
### SparkRadarWX is a free, open source, beautiful weather app for android, built with Expo and React Native and integrated with SparkRadar.

> This project is a WIP. When a release is available, it will be listed under the GitHub releases section.

> Note: Staring in preview v0.1.10, SparkRadarWX now uses the backend at [SparkRadarWXAPI OneCall](https://github.com/tgranz/sparkradarwxapi)

Licensed with Apache 2.0. (c) Tyler Granzow 2025.

<br>

# Download
- Get it with **Obtainium**: Add `https://github.com/tgranz/SparkRadarWX` as a source. Optionally, tick "include prereleases".
- Get it from the releases section on this page.

<br>

*Instructions are for Linux/Ubuntu systems.*
# Test
1) Clone or download the source code.
2) Download the Expo Go app from the Play Store or App Store.
3) Install and setup EAS with `sudo npm install -g eas-cli`. Then run `eas init`. You will need an expo.dev account.
4) Install dependencies with `npm install`.
5) Add a .env file with `ONECALL_API_KEY=<your_key>`. This is the same API key you set up in the OneCall API .env file.
6) Start the development server with `npx expo start`.
7) In Expo Go, find the QR scanner and scan the QR code in the terminal. The app should compile and be running on your device.

# Build (Android)
Follow "Test", then...
1) Configure your OneCall API key for the app with  `eas env:create --scope project --name ONECALL_API_KEY --value "your_key_here"`. For "visibility" choose "secret", and for "environment", choose "development", "preview", and "production". This is necessary since expo will not compile your .env file with the app.
2) Ensure your `eas.json` file looks something like this:
```json
...
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk" // Important
      }
    },
...
```
3) Run `eas build --profile preview --platform android`. (Build may take a while as it is built on the EAS server, not your local machine.)
4) If asked to create an EAS project, enter `y`.
5) If asked to generate an android keystore, enter `y`.
6) EAS will compile an `apk` file of the app. You can now install it to your device.

# Will we see an iOS app?
**No.** I do not wish to pay $100 a year to put the app on the App Store. I also do not own an iPhone to perform native testing. If you are up to it, however, feel free to for the code and build an iOS version!