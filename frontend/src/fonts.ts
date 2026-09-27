import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { Jost_300Light } from '@expo-google-fonts/jost/300Light';
import { Jost_400Regular } from '@expo-google-fonts/jost/400Regular';
import * as Font from 'expo-font';

/**
 * The app's three fonts. Names here are what `font-title` / `font-heading` /
 * `font-mono` in global.css refer to. Per-weight imports keep the APK small.
 */
export function loadFonts() {
  return Font.loadAsync({ Jost_300Light, Jost_400Regular, IBMPlexMono_400Regular });
}
