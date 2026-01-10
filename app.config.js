require('dotenv').config();

module.exports = {
  expo: {
    owner: "tgranz",
    name: "SparkRadarWX",
    slug: "SparkRadarWX",
    version: "0.1.6",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "io.github.tgranz.SparkRadarWX",
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-font"
    ],
    extra: {
      eas: {
        projectId: "ac6336c0-9902-49b5-9ab3-daa62101c0e6"
      },
      openWeatherApiKey: process.env.OPENWEATHER_API_KEY
    }
  }
};
