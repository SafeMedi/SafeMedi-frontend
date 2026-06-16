interface KakaoMapMarkerInput {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly category: "pharmacy" | "emergency";
}

interface BuildKakaoMapHtmlParams {
  readonly mapJsKey: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly level: number;
  readonly facilities: readonly KakaoMapMarkerInput[];
}

export const MAP_MARKER_COLORS = {
  current: "#2B7FFF",
  pharmacy: "#00A63E",
  emergency: "#DC2626",
} as const;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function serializeMarkers(markers: readonly KakaoMapMarkerInput[]): string {
  return JSON.stringify(markers);
}

export function buildKakaoMapHtml({
  mapJsKey,
  latitude,
  longitude,
  level,
  facilities,
}: BuildKakaoMapHtmlParams): string {
  const safeMapJsKey = escapeHtml(mapJsKey);
  const serializedFacilities = serializeMarkers(facilities);
  const markerColorsJson = JSON.stringify(MAP_MARKER_COLORS);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #f5f5f5;
      }
    </style>
    <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${safeMapJsKey}&autoload=false"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const INITIAL_CENTER = { lat: ${latitude}, lng: ${longitude} };
      const INITIAL_LEVEL = ${level};
      const FACILITY_MARKERS = ${serializedFacilities};
      const MARKER_COLORS = ${markerColorsJson};
      const MARKER_SIZE = { width: 24, height: 35 };
      const MARKER_ANCHOR = { x: 12, y: 35 };

      let map = null;
      let currentMarker = null;
      const markerRegistry = new Map();
      const markerImageRegistry = new Map();

      function postMessage(payload) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function createMarkerImage(color) {
        const svg = [
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="35" viewBox="0 0 24 35">',
          '<path d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 23 12 23s12-14.75 12-23C24 5.373 18.627 0 12 0z" fill="' + color + '"/>',
          '<circle cx="12" cy="12" r="4.5" fill="#ffffff"/>',
          "</svg>",
        ].join("");
        const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        return new kakao.maps.MarkerImage(
          src,
          new kakao.maps.Size(MARKER_SIZE.width, MARKER_SIZE.height),
          { offset: new kakao.maps.Point(MARKER_ANCHOR.x, MARKER_ANCHOR.y) },
        );
      }

      function getMarkerImage(type) {
        if (!markerImageRegistry.has(type)) {
          markerImageRegistry.set(type, createMarkerImage(MARKER_COLORS[type]));
        }
        return markerImageRegistry.get(type);
      }

      function createColoredMarker(position, type) {
        return new kakao.maps.Marker({
          position,
          map,
          image: getMarkerImage(type),
        });
      }

      function addMarker(marker) {
        const position = new kakao.maps.LatLng(marker.latitude, marker.longitude);
        const markerType = marker.category === "pharmacy" ? "pharmacy" : "emergency";
        const kakaoMarker = createColoredMarker(position, markerType);
        kakao.maps.event.addListener(kakaoMarker, "click", () => {
          postMessage({ type: "selectFacility", facilityId: marker.id });
        });
        markerRegistry.set(marker.id, kakaoMarker);
      }

      function clearFacilityMarkers() {
        markerRegistry.forEach((marker) => marker.setMap(null));
        markerRegistry.clear();
      }

      function renderFacilityMarkers(markers) {
        clearFacilityMarkers();
        markers.forEach((marker) => {
          addMarker(marker);
        });
      }

      function renderCurrentMarker() {
        const position = new kakao.maps.LatLng(INITIAL_CENTER.lat, INITIAL_CENTER.lng);
        currentMarker = createColoredMarker(position, "current");
      }

      function updateCurrentMarkerPosition(latitude, longitude) {
        if (!currentMarker) {
          return;
        }
        currentMarker.setPosition(new kakao.maps.LatLng(latitude, longitude));
      }

      function initializeMap() {
        const container = document.getElementById("map");
        map = new kakao.maps.Map(container, {
          center: new kakao.maps.LatLng(INITIAL_CENTER.lat, INITIAL_CENTER.lng),
          level: INITIAL_LEVEL,
        });

        renderCurrentMarker();
        renderFacilityMarkers(FACILITY_MARKERS);
        postMessage({ type: "ready" });
      }

      function handleCommand(command) {
        if (!map || !command || !command.type) {
          return;
        }

        if (command.type === "setCamera") {
          const nextPosition = new kakao.maps.LatLng(command.latitude, command.longitude);
          map.setCenter(nextPosition);
          updateCurrentMarkerPosition(command.latitude, command.longitude);
          if (typeof command.level === "number") {
            map.setLevel(command.level);
          }
          return;
        }

        if (command.type === "setMarkers") {
          renderFacilityMarkers(command.markers ?? []);
        }
      }

      window.addEventListener("message", (event) => {
        try {
          const command = JSON.parse(event.data);
          handleCommand(command);
        } catch (_error) {
          postMessage({ type: "error", message: "invalid_command" });
        }
      });

      document.addEventListener("message", (event) => {
        try {
          const command = JSON.parse(event.data);
          handleCommand(command);
        } catch (_error) {
          postMessage({ type: "error", message: "invalid_command" });
        }
      });

      kakao.maps.load(initializeMap);
    </script>
  </body>
</html>`;
}

export function regionToKakaoMapLevel(latitudeDelta: number): number {
  if (latitudeDelta <= 0.005) {
    return 3;
  }
  if (latitudeDelta <= 0.01) {
    return 4;
  }
  return 5;
}
