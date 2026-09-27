# Development build compatibility

Rebased onto origin/main at bd42ae7, including its redesigned frontend and updated backend.

Main already declares llama.rn 0.13.0-rc.6, AsyncStorage 2.2.0, expo-location ~57.0.20, expo-file-system ~57.0.7, react-native-ble-plx ^3.5.1 and expo-dev-client ~57.0.19. Android location and BLE permissions are configured.

Named areas, event grouping, counts, caching and adding selected facts to a prompt need TypeScript work, not an additional native library. Main now keeps a local record-ID-to-tag-name mapping in src/tagNames.ts; this is not a named geographic area registry. Its latest frontend expects UTC timestamps and the feature/dev server contract. Those API changes are retained; the new AI-to-history bridge is still future work.

The tracker's picker is now optional: check its native module before dynamically importing the wrapper. A main-based client without ExpoDocumentPicker can use the model downloaded through Local AI. The tracker prefers an existing imported model; otherwise it uses the complete shared download. No native versions or permission settings changed. The picker dependency remains available for future builds.

Teammate workflow: pull the desired branch, run npm install in frontend, start npx expo start --dev-client, connect the installed development client to that Metro server, and reload. This requires an installed binary containing compatible native modules. We have not inspected that APK. The optional-picker and shared-model changes still need a device check. TypeScript and the 18 existing tracker tests pass; those tests do not prove native compatibility.

Native dependency, permission or native configuration changes can require rebuilding. A standalone APK needs an updated embedded bundle. No package list can guarantee that all future work avoids a rebuild.

Reference: https://docs.expo.dev/develop/development-builds/use-development-builds/
