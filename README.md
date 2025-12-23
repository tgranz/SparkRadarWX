# About
### SparkRadarWX is a free, open source, beautiful weather app for android, built with Expo and React Native and integrated with SparkRadar.

> This project is a WIP. When a release is available, it will be listed under the GitHub releases section.

Licensed with Apache 2.0. (c) Tyler Granzow 2025.

<br>

# Download
- Get it with **Obtainium**: Add `https://github.com/tgranz/SparkRadarWX` as a source. Optionally, tick "include prereleases".
- Get it from the releases section on this page.

<br>

# Test
1) Clone or download the source code.
2) Download the Expo Go app from the Play Store or App Store.
3) Install dependencies with `npm install`.
4) Add your OpenWeatherMap API key to Expo secrets using `eas env:create --scope project --name OPENWEATHER_API_KEY --value "your_key_here"`.
5) Start the development server with `npx expo start`.
6) In Expo Go, find the QR scanner and scan the QR code in the terminal. The app should compile and be running on your device.

# Build (Android)
Follow "Test", then...
1) Install EAS if not installed already with `sudo npm install -g eas-cli`.
2) Create an accound at [expo.dev](https://expo.dev).
3) Run `eas login` and login with your account.
4) Ensure your `eas.json` file looks something like this:
```json
{
  "cli": {
    "version": ">= 16.28.0",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk" // Important
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}

```
5) Run `eas build --profile preview --platform android`. (Build may take a while as it is built on the EAS public server, not your local machine.)
6) If asked to create an EAS project, enter `y`.
7) If asked to generate an android keystore, enter `y`.
8) EAS will compile an `apk` file of the app. You can now install it to your device.

# Will we see an iOS app?
**No.** I do not wish to pay $100 a year to put the app on the App Store. I also do not own an iPhone to perform native testing. If you are up to it, however, feel free to for the code and build an iOS version!