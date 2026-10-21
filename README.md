# Dabbetha (ضبّطها) — Standalone Android Demo

An offline-first presentation build of the existing Expo / React Native app. The APK preview uses fictional UAE accounts and sample properties/bookings stored locally on the device. It does not need Supabase credentials and does not connect to the production backend.

The app bundle is built into the APK; the installed demo does not display or depend on an Expo development server. The app icon, adaptive icon, splash screen, and favicon use a custom house-and-check Dabbetha mark rather than a text character. The home and service screens use consistent vector service icons and short entrance animations that respect the device's reduced-motion preference.

Shared buttons and cards provide consistent press feedback and accessible disabled, loading, and selection states. Form controls expose their labels and validation hints to assistive technology. The presentation layout keeps readable content widths on larger screens, while service selection and booking details remain usable on compact phones in English and Arabic.

## Run locally

Requirements: Node.js 20.19+ and npm.

```powershell
npm.cmd install
npm.cmd run start
```

For a browser preview, run `npx.cmd expo start --web`. For Android, install Expo Go on a device and scan the QR code, or use an Android emulator with `npm.cmd run android`.

The app defaults to demo mode. Demo changes persist locally with AsyncStorage and are cleared from the profile screen using **Reset demo data**. To explicitly select the future backend mode for development, set `EXPO_PUBLIC_APP_MODE=production`, provide the public Supabase URL and anon key in `.env`, and restart Expo. The demo APK profile always sets `EXPO_PUBLIC_APP_MODE=demo`; the store profile explicitly selects production mode and requires the app's public Supabase URL and anon key to be configured in the EAS `production` environment before a release. Never put a service-role or payment secret in the app.

## Demo accounts

Open **Profile** and choose a role, or open the demo account chooser. Tap a role to switch instantly; there are no passwords or real user accounts.

| Role | Demo identity |
|---|---|
| Customer | Amal Hassan — `amal.customer@demo.dabbetha.ae` |
| Technician | Ali Mansoor — `ali.technician@demo.dabbetha.ae` |
| Property manager | Mariam Al Nuaimi — `mariam.landlord@demo.dabbetha.ae` |
| Administrator | Omar Khalid — `omar.admin@demo.dabbetha.ae` |

All names, addresses, booking references and records are fictional.

## Demonstration flows

- Browse/search the seeded AC, plumbing, electrical, handyman, appliance, painting, cleaning and water-heater services with AED starting prices.
- Switch English/Arabic; Arabic page direction and tab ordering update in-app.
- Create a service request for Ajman or Sharjah, choose a neighborhood, date and time window in UAE local time, and see a confirmation reference.
- View customer booking history; technician changes sample job status; a property manager approves/rejects a sample quotation; the admin assigns a sample job to the demo technician.
- Demo bookings, statuses, role selection and decisions are saved to this phone only. Clear them with **Reset demo data**.
- No real authentication, dispatch, quotation, approval, payment, notification, upload, email or WhatsApp action occurs.

## Build a directly installable Android APK

The EAS `preview` profile builds an APK (not an AAB), uses the `ae.dabbetha.demo` application ID, and explicitly enables demo mode. No Supabase or payment credentials are needed. A local APK can also be built with Android Studio's SDK without an Expo account.

### GitHub Actions build

The workflow at `.github/workflows/android-demo-apk.yml` builds the demo APK on every push to `main` and supports manual runs. It installs the Android SDK components required by this project, generates the Android project with Expo CNG, runs typecheck/lint/tests, builds a standalone release APK signed with the debug key, verifies the `ae.dabbetha.demo` package ID, and uploads `dabbetha-demo-apk`. It uses empty Supabase values and requires no Expo or production secrets.

To use it, push this project's source (including the workflow file) to `https://github.com/sayedel12/fixmate`. The repository currently contains only its initial README, so its existing Actions page has no build to run until the app source is pushed. On each push to `main`, open the repository's **Actions** tab, select **Android Demo APK**, then open the completed run and download `dabbetha-demo-apk` under **Artifacts**. For a manual build, choose **Run workflow** on that same workflow. GitHub retains the artifact for 14 days. Download the APK artifact, transfer `app-release.apk` to an Android phone, allow **Install unknown apps** for the browser/files app if prompted, and install it. This debug-signed APK is for demonstration/testing, not Play Store distribution.

### Local Android Studio build (Windows)

Requirements: Android Studio with an Android SDK platform/build tools installed, Node.js, and the project dependencies (`npm.cmd install`). This project uses Expo Continuous Native Generation; generate the ignored Android project from `app.json` before building if it is not present.

Open PowerShell in the project root and run:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:EXPO_PUBLIC_APP_MODE = 'demo'
$env:EXPO_PUBLIC_SUPABASE_URL = ''
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY = ''

if (-not (Test-Path .\android\gradlew.bat)) {
  npx.cmd expo prebuild --platform android --no-install
}

.\android\gradlew.bat -p android assembleRelease
```

The standalone, locally debug-signed APK is written to `android\app\build\outputs\apk\release\app-release.apk`. It includes the JavaScript bundle and does not depend on a development server. To install it on a USB-connected Android device with USB debugging enabled:

```powershell
& "$env:ANDROID_HOME\platform-tools\adb.exe" install -r .\android\app\build\outputs\apk\release\app-release.apk
```

Alternatively, transfer the APK to the phone, open it, allow **Install unknown apps** for the app handling the download if prompted, and confirm installation. The local debug signing key is for demonstration/testing only; do not use it for a Play Store release.

The first local build attempt could not resolve `org.jetbrains.kotlin:kotlin-native-utils:2.2.21` because `repo.maven.apache.org` could not be resolved. A later retry passed dependency resolution and began Android SDK/NDK setup, but its command session was interrupted before completion could be verified. No local APK has been confirmed. The GitHub Actions workflow provides a clean hosted build path after the project source is pushed.

### EAS cloud build (optional)

An Expo account and network access to EAS Build are required. Sign in with `npx.cmd eas-cli@latest login`. If the project is not linked, run `npx.cmd eas-cli@latest init`; before confirming, verify the selected Expo account/team and whether the existing `dabbetha-uae-demo` project should own Android package `ae.dabbetha.demo`. Then run:

```powershell
npx.cmd eas-cli@latest build --platform android --profile preview
```

When the EAS build completes, open its APK artifact URL on the phone to download and install it. The profile is an internal-install APK build, not a Play Store bundle.

## Commercial / Play Store readiness

This APK profile is a demonstration build. The separate `production` EAS profile produces an Android App Bundle for store submission; it is not a substitute for production readiness. The current app still uses local fictional accounts and simulated workflows, and the demonstration service coverage is Ajman and Sharjah. A sellable public release needs a configured and security-tested backend, real authentication and authorization, service/technician operations, privacy policy and data-safety disclosures, support and deletion flows, store assets, and end-to-end device testing. Do not distribute this demo as if it accepts real orders or payments.

## Verification performed in this workspace

- `npm.cmd run typecheck` — passed.
- `npm.cmd run lint` — passed.
- `npm.cmd test` — 3 suites / 6 tests passed, including local booking/assignment flows and UAE date helpers.
- `npx.cmd expo install --check` — passed.
- Android JavaScript export — passed with demo mode selected and the Supabase URL/key explicitly empty. This verifies bundling, not a native APK build or device install.
- Web HTML and JavaScript bundle — returned HTTP 200 in a local preview; this is not a substitute for physical-device layout testing.
- `npx.cmd expo-doctor` — 19/20 checks; the remaining `.expo/` warning is a false positive because this workspace has no `.git` metadata. `.gitignore` already contains `.expo/`.
- EAS `preview` is configured for an internal Android APK and explicitly selects demo mode without Supabase credentials. The project is not yet linked to an Expo project; confirm the intended Expo account/team and project before running `eas init`.
- Expo prebuild generated the ignored Android CNG project successfully. Android Studio's SDK platforms, build-tools, ADB, and bundled Java runtime are installed.
- Local `assembleRelease` passed Maven dependency resolution and started installing the Android NDK, but the command session was interrupted before completion could be verified. No APK or EAS/GitHub artifact link is available yet.
- GitHub repository `sayedel12/fixmate` is public but currently contains only its initial README and has no Actions workflows or runs. The workflow must be pushed along with the app source before GitHub can build or provide an artifact.
- PowerShell became unavailable in this session after the local build retry; native device installation, physical-device layout/RTL, EAS build, and real backend integration remain unverified.
- `npm.cmd audit --omit=dev` reports 48 advisories (21 high, 27 moderate) in the production dependency tree. Findings include the direct runtime packages `expo`, `expo-router`, `react-native`, and `expo-splash-screen`, as well as transitive dependencies. No automatic or breaking dependency fixes were applied; review these advisories and plan a compatible Expo/React Native update before a commercial release.

## Future production phase

The existing Supabase client, migration, production auth screens and protected backend calls remain in place. Demo mode takes precedence unless `EXPO_PUBLIC_APP_MODE=production` is explicitly set. The demo profile does not apply migrations or write to Supabase. Before a production release, configure Supabase, implement the remaining real workflows, validate RLS and storage policies against a test project, and complete native/device tests. Do not treat local demo identities or mock business actions as production authentication or authorization.
