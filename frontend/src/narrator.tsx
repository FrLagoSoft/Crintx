import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { api } from './api';

/**
 * Narrator Mode: the server turns text into speech (ElevenLabs) and we play the
 * MP3 in a hidden WebView. Using the WebView that's already in the dev build
 * (the map uses it) means no native audio module and no new build.
 */

let player: WebView | null = null;
let ready = false;

/** Speaks `text` through the phone's speaker. Throws with a readable message if it can't. */
export async function narrate(text: string) {
  if (!player || !ready) throw new Error('Narrator isn’t ready yet.');
  const mp3 = await api.speak(text);
  // base64 is only A-Z a-z 0-9 + / =, so it's safe to inline into the script.
  player.injectJavaScript(`window.play(${JSON.stringify(mp3)});true;`);
}

const HTML = `<!doctype html><html><body><script>
  var current = null;
  window.play = function (b64) {
    if (current) { current.pause(); }
    current = new Audio('data:audio/mpeg;base64,' + b64);
    current.play().catch(function (e) { window.ReactNativeWebView.postMessage('error:' + e.message); });
  };
</script></body></html>`;

/** Mount once near the root (app/_layout.tsx). It takes no space on screen. */
export function NarratorHost() {
  const ref = useRef<WebView>(null);

  useEffect(() => {
    player = ref.current;
    return () => {
      player = null;
      ready = false;
    };
  }, []);

  return (
    <View style={{ width: 0, height: 0, position: 'absolute', opacity: 0 }} pointerEvents="none">
      <WebView
        ref={ref}
        source={{ html: HTML, baseUrl: 'https://crintx.local/' }}
        originWhitelist={['*']}
        onLoadEnd={() => {
          player = ref.current;
          ready = true;
        }}
        onMessage={(e) => console.warn('Narrator:', e.nativeEvent.data)}
        // Let audio start without a tap inside the WebView.
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        style={{ width: 1, height: 1 }}
      />
    </View>
  );
}
