# Fuel Tracker

Track fuel purchases, mileage and efficiency for your car. React + Tailwind, wrapped as an Android app with Capacitor. Data is stored in localStorage.

## Development

```sh
npm install
npm run dev
```

## Tests

```sh
npm run test
```

## Building the Android APK

No Android Studio required — builds via the Gradle wrapper on the command line.

Requires the Android SDK (`android/local.properties` points `sdk.dir` at it) and a JDK 21 (the script auto-detects `/usr/lib/jvm/java-21-openjdk-amd64` if `JAVA_HOME` isn't already JDK 21).

```sh
npm run android:apk
```

Produces `android/app/build/outputs/apk/debug/app-debug.apk`.

To just sync the web build into the native project (e.g. before opening Android Studio manually):

```sh
npm run cap:sync
```
