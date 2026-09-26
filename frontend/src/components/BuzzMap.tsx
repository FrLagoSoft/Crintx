import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { CARTO_KEY } from '../config';
import type { Coords } from '../location';
import { colors } from '../theme';

type Props = {
  lastBuzz: Coords | null; // orange
  me?: Coords | null; // green
  height?: number; // omit to fill the parent
  fly?: boolean; // animate in from the world view instead of jumping
};

/**
 * Leaflet map in a WebView. Tiles are CARTO's dark basemap when
 * EXPO_PUBLIC_CARTO_KEY is set, otherwise keyless OpenStreetMap tiles darkened
 * with a CSS filter. Points are pushed in with injectJavaScript, so moving
 * around updates the map without reloading it.
 */
export function BuzzMap({ lastBuzz, me = null, height, fly = false }: Props) {
  const web = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const fittedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const last = lastBuzz && [lastBuzz.latitude, lastBuzz.longitude];
    const you = me && [me.latitude, me.longitude];
    // Re-frame only when the buzz point changes or you first appear, not on every step you take.
    const key = `${last}|${you != null}`;
    const fit = fittedFor.current !== key;
    fittedFor.current = key;
    web.current?.injectJavaScript(`window.update(${JSON.stringify({ last, you, fit, fly })});true;`);
  }, [ready, lastBuzz, me, fly]);

  const box = height != null ? { height, borderRadius: 16 } : { flex: 1 };
  return (
    <View style={[box, { overflow: 'hidden', backgroundColor: colors.void }]}>
      <WebView
        ref={web}
        source={{ html: HTML, baseUrl: 'https://crintx.local/' }}
        originWhitelist={['*']}
        onLoadEnd={() => setReady(true)}
        style={{ backgroundColor: colors.void }}
        nestedScrollEnabled
        setBuiltInZoomControls={false}
      />
    </View>
  );
}

const TILES = CARTO_KEY
  ? {
      url: `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(CARTO_KEY)}`,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      darken: false,
    }
  : {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      darken: true, // OSM has no dark style; invert it to match the app
    };

const HTML = `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css">
<style>
  html, body, #map { margin: 0; height: 100%; background: ${colors.void}; }
  .leaflet-control-attribution { background: rgba(14,17,22,.7) !important; color: ${colors.dim}; font-size: 9px; }
  .leaflet-control-attribution a { color: ${colors.dim}; }
  .dot { width: 18px; height: 18px; box-sizing: border-box; border-radius: 50%; border: 3px solid ${colors.void}; }
  ${TILES.darken ? '.leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(.85) contrast(.9); }' : ''}
</style>
</head><body><div id="map"></div>
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: false }).setView([20, 0], 2);
  L.tileLayer(${JSON.stringify(TILES.url)}, { maxZoom: 19, attribution: ${JSON.stringify(TILES.attribution)} }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  // HTML markers, not circleMarker: vector shapes get stretched during zoom
  // animations (the dot ballooned mid-flyTo); HTML markers are only moved.
  function dot(p, color, label) {
    var icon = L.divIcon({
      className: '',
      html: '<div class="dot" style="background:' + color + '"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    return L.marker(p, { icon: icon, keyboard: false })
      .bindTooltip(label, { permanent: true, direction: 'top', offset: [0, -11] });
  }
  window.update = function (d) {
    layer.clearLayers();
    var pts = [];
    if (d.last && d.you) L.polyline([d.last, d.you], { color: '${colors.dim}', weight: 2, dashArray: '6 6' }).addTo(layer);
    if (d.last) { dot(d.last, '${colors.signal}', 'Last buzz').addTo(layer); pts.push(d.last); }
    if (d.you) { dot(d.you, '${colors.live}', 'You').addTo(layer); pts.push(d.you); }
    if (!d.fit || !pts.length) return;
    var fly = { duration: 2.5 };
    if (pts.length === 1) d.fly ? map.flyTo(pts[0], 16, fly) : map.setView(pts[0], 17);
    else if (d.fly) map.flyToBounds(pts, Object.assign({ padding: [48, 48], maxZoom: 18 }, fly));
    else map.fitBounds(pts, { padding: [48, 48], maxZoom: 18 });
  };
</script></body></html>`;
