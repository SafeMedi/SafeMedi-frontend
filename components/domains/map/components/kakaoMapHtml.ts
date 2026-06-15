interface KakaoMapMarkerInput {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly caption: string;
}

interface BuildKakaoMapHtmlParams {
  readonly mapJsKey: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly level: number;
  readonly currentMarkerCaption: string;
  readonly facilities: readonly KakaoMapMarkerInput[];
}

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
  currentMarkerCaption,
  facilities,
}: BuildKakaoMapHtmlParams): string {
  const safeMapJsKey = escapeHtml(mapJsKey);
  const safeCurrentCaption = escapeHtml(currentMarkerCaption);
  const serializedFacilities = serializeMarkers(facilities);

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
      .marker-label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        border-radius: 11px;
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.12);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        font-size: 12px;
        font-weight: 700;
        color: #111111;
        white-space: nowrap;
      }
      .marker-label.current {
        background: #2f9e44;
        border-color: #2f9e44;
        color: #ffffff;
      }
    </style>
    <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${safeMapJsKey}&autoload=false"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const INITIAL_CENTER = { lat: ${latitude}, lng: ${longitude} };
      const INITIAL_LEVEL = ${level};
      const CURRENT_MARKER_CAPTION = "${safeCurrentCaption}";
      const FACILITY_MARKERS = ${serializedFacilities};

      let map = null;
      const markerRegistry = new Map();

      function postMessage(payload) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function createMarkerContent(caption, isCurrent) {
        const element = document.createElement("div");
        element.className = isCurrent ? "marker-label current" : "marker-label";
        element.textContent = caption;
        return element;
      }

      function addMarker(marker) {
        const position = new kakao.maps.LatLng(marker.latitude, marker.longitude);
        const content = createMarkerContent(marker.caption, false);
        content.style.cursor = "pointer";
        content.addEventListener("click", () => {
          postMessage({ type: "selectFacility", facilityId: marker.id });
        });
        const overlay = new kakao.maps.CustomOverlay({
          position,
          content,
          yAnchor: 1.2,
        });
        overlay.setMap(map);
        markerRegistry.set(marker.id, overlay);
      }

      function clearFacilityMarkers() {
        markerRegistry.forEach((overlay) => overlay.setMap(null));
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
        const overlay = new kakao.maps.CustomOverlay({
          position,
          content: createMarkerContent(CURRENT_MARKER_CAPTION, true),
          yAnchor: 1.2,
        });
        overlay.setMap(map);
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
