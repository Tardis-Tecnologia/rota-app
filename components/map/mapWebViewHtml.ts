/** HTML embutido com MapLibre GL JS — compatível com Expo Go via WebView. */
export const MAP_WEBVIEW_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e8ecf1; }
    .maplibregl-ctrl-logo { display: none !important; }
    .card-marker-wrap { display: flex; flex-direction: column; align-items: center; width: 76px; cursor: pointer; }
    .card-marker-card {
      width: 76px; background: #fff; border-radius: 10px; border: 1px solid #e2e8f0;
      padding: 5px; box-shadow: 0 2px 4px rgba(15,23,42,0.12);
    }
    .card-marker-avatar {
      width: 66px; height: 48px; border-radius: 7px; background: #7C3AED;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 15px; font-weight: 700;
    }
    .card-marker-label {
      margin-top: 4px; font-size: 9px; line-height: 11px; font-weight: 700;
      color: #475569; text-align: center; max-height: 22px; overflow: hidden;
    }
    .card-marker-pointer {
      width: 8px; height: 4px; margin-top: 2px; border-radius: 1px;
      background: #fff; border: 1px solid #e2e8f0;
    }
    .route-dot {
      width: 20px; height: 20px; border-radius: 10px; border: 3px solid #fff;
      box-shadow: 0 2px 3px rgba(15,23,42,0.35);
    }
    .route-dot.origin { background: #2563eb; }
    .route-dot.destination { background: #dc2626; }
    .user-dot {
      width: 16px; height: 16px; border-radius: 8px; background: #2563eb;
      border: 3px solid #fff; box-shadow: 0 0 0 2px rgba(37,99,235,0.35);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function () {
      var map = null;
      var is3d = false;
      var belowLayerId = null;
      var suppressRegionEvents = false;
      var defaultPitch = 0;
      var cardMarkers = [];
      var routeMarkers = [];
      var userMarker = null;
      var userWatchId = null;
      var dotsLayerId = null;
      var dotsSourceId = null;

      function post(payload) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function clearCardMarkers() {
        cardMarkers.forEach(function (m) { m.remove(); });
        cardMarkers = [];
      }

      function clearRouteMarkers() {
        routeMarkers.forEach(function (m) { m.remove(); });
        routeMarkers = [];
      }

      function markerInitial(name) {
        var t = (name || '').trim();
        return t ? t.charAt(0).toUpperCase() : '?';
      }

      function addCardMarker(ponto) {
        var wrap = document.createElement('div');
        wrap.className = 'card-marker-wrap';
        wrap.innerHTML =
          '<div class="card-marker-card">' +
            '<div class="card-marker-avatar">' + markerInitial(ponto.titulo) + '</div>' +
            '<div class="card-marker-label">' + (ponto.titulo || '') + '</div>' +
          '</div>' +
          '<div class="card-marker-pointer"></div>';
        wrap.addEventListener('click', function (e) {
          e.stopPropagation();
          post({ type: 'markerPress', id: String(ponto.id) });
        });
        var marker = new maplibregl.Marker({ element: wrap, anchor: 'bottom' })
          .setLngLat([ponto.longitude, ponto.latitude])
          .addTo(map);
        cardMarkers.push(marker);
      }

      function addRouteDot(lng, lat, kind) {
        var el = document.createElement('div');
        el.className = 'route-dot ' + kind;
        var marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map);
        routeMarkers.push(marker);
      }

      function ensureUserMarker(lng, lat) {
        if (!userMarker) {
          var el = document.createElement('div');
          el.className = 'user-dot';
          userMarker = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat([lng, lat])
            .addTo(map);
        } else {
          userMarker.setLngLat([lng, lat]);
        }
      }

      function startUserLocation() {
        if (!navigator.geolocation || userWatchId != null) return;
        userWatchId = navigator.geolocation.watchPosition(
          function (pos) {
            ensureUserMarker(pos.coords.longitude, pos.coords.latitude);
          },
          function () {},
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
      }

      function removeLayerIfExists(id) {
        if (map && map.getLayer(id)) map.removeLayer(id);
      }

      function removeSourceIfExists(id) {
        if (map && map.getSource(id)) map.removeSource(id);
      }

      function findLabelLayerId() {
        if (!map || !map.getStyle() || !map.getStyle().layers) return null;
        var layers = map.getStyle().layers;
        for (var i = 0; i < layers.length; i++) {
          var layer = layers[i];
          if (layer.type === 'symbol' && layer.id && /road|label/i.test(layer.id)) {
            return layer.id;
          }
        }
        for (var j = 0; j < layers.length; j++) {
          if (layers[j].type === 'symbol') return layers[j].id;
        }
        return null;
      }

      function hideDefaultBuildingExtrusions() {
        if (!map || !map.getStyle() || !map.getStyle().layers) return;
        map.getStyle().layers.forEach(function (layer) {
          if (layer.type === 'fill-extrusion' && layer.id && map.getLayer(layer.id)) {
            try { map.setLayoutProperty(layer.id, 'visibility', 'none'); } catch (e) {}
          }
        });
      }

      function apply3dBuildings() {
        removeLayerIfExists('rota-explore-3d-buildings');
        if (!is3d || !map) return;
        var sourceId = map.getSource('maptiler_planet') ? 'maptiler_planet' : null;
        if (!sourceId) return;
        hideDefaultBuildingExtrusions();
        var insertBefore = belowLayerId || findLabelLayerId();
        var layer = {
          id: 'rota-explore-3d-buildings',
          type: 'fill-extrusion',
          source: sourceId,
          'source-layer': 'building',
          minzoom: 10,
          filter: ['!', ['has', 'hide_3d']],
          paint: {
            'fill-extrusion-color': '#e8ecf1',
            'fill-extrusion-height': ['get', 'render_height'],
            'fill-extrusion-base': ['get', 'render_min_height'],
            'fill-extrusion-opacity': 0.74
          }
        };
        try {
          if (insertBefore && map.getLayer(insertBefore)) {
            map.addLayer(layer, insertBefore);
          } else {
            map.addLayer(layer);
          }
        } catch (e) {
          post({ type: 'mapError', message: String(e && e.message ? e.message : e) });
        }
      }

      function applyDots(pontos, layerKey) {
        if (dotsLayerId) removeLayerIfExists(dotsLayerId);
        if (dotsSourceId) removeSourceIfExists(dotsSourceId);
        dotsLayerId = null;
        dotsSourceId = null;
        if (!pontos || !pontos.length) return;
        dotsSourceId = 'map-dots-' + layerKey;
        dotsLayerId = 'map-dots-layer-' + layerKey;
        map.addSource(dotsSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: pontos.map(function (p) {
              return {
                type: 'Feature',
                id: p.id,
                geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
                properties: { id: String(p.id), markerColor: p.markerColor || '#7C3AED' }
              };
            })
          }
        });
        map.addLayer({
          id: dotsLayerId,
          type: 'circle',
          source: dotsSourceId,
          paint: {
            'circle-radius': 7,
            'circle-color': ['get', 'markerColor'],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });
        map.on('click', dotsLayerId, function (e) {
          var f = e.features && e.features[0];
          if (f && f.properties && f.properties.id) {
            post({ type: 'markerPress', id: String(f.properties.id) });
          }
        });
      }

      function applyRoute(coords) {
        removeLayerIfExists('route-line');
        removeSourceIfExists('route-source');
        if (!coords || coords.length < 2) return;
        map.addSource('route-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords },
            properties: {}
          }
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          paint: {
            'line-color': '#7C3AED',
            'line-width': 5,
            'line-opacity': 0.92
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' }
        });
      }

      function emitRegion(isUserInteraction) {
        if (!map || suppressRegionEvents) return;
        var c = map.getCenter();
        var z = map.getZoom();
        var latDelta = 360 / Math.pow(2, z + 1);
        var bounds = map.getBounds();
        var lngSpan = Math.abs(bounds.getEast() - bounds.getWest());
        var latSpan = Math.abs(bounds.getNorth() - bounds.getSouth());
        var lngDelta = latSpan > 1e-9 ? latDelta * (lngSpan / latSpan) : latDelta;
        post({
          type: 'regionChange',
          latitude: c.lat,
          longitude: c.lng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
          isUserInteraction: !!isUserInteraction
        });
      }

      function setCamera(payload) {
        if (!map) return;
        var duration = typeof payload.duration === 'number' ? payload.duration : 0;
        var center = payload.center || [payload.longitude, payload.latitude];
        var zoom = typeof payload.zoom === 'number' ? payload.zoom : map.getZoom();
        var pitch = typeof payload.pitch === 'number' ? payload.pitch : (is3d ? defaultPitch : 0);
        suppressRegionEvents = true;
        map.easeTo({ center: center, zoom: zoom, pitch: pitch, duration: duration });
        setTimeout(function () {
          suppressRegionEvents = false;
          emitRegion(false);
        }, duration + 40);
      }

      function resolveStyle(payload) {
        if (payload.styleUrl) return payload.styleUrl;
        if (payload.styleJson) {
          if (typeof payload.styleJson === 'string') {
            try { return JSON.parse(payload.styleJson); } catch (e) { return payload.styleJson; }
          }
          return payload.styleJson;
        }
        return 'https://demotiles.maplibre.org/style.json';
      }

      function bindMapEvents() {
        map.on('load', function () {
          apply3dBuildings();
          startUserLocation();
          post({ type: 'ready' });
          emitRegion(false);
        });
        map.on('style.load', function () {
          apply3dBuildings();
        });
        map.on('moveend', function () { emitRegion(true); });
        map.on('error', function (e) {
          post({ type: 'mapError', message: e && e.error ? String(e.error.message || e.error) : 'map error' });
        });
      }

      function initMap(payload) {
        if (map) return;
        if (!window.maplibregl) {
          post({ type: 'mapError', message: 'MapLibre GL JS não carregou' });
          return;
        }
        is3d = !!payload.is3d;
        defaultPitch = typeof payload.defaultPitch === 'number' ? payload.defaultPitch : 0;
        belowLayerId = payload.belowLayerId || null;
        map = new maplibregl.Map({
          container: 'map',
          style: resolveStyle(payload),
          center: payload.center || [-42.8186, -22.9189],
          zoom: typeof payload.zoom === 'number' ? payload.zoom : 12,
          pitch: is3d ? defaultPitch : 0,
          bearing: 0,
          attributionControl: false
        });
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
        bindMapEvents();
      }

      function handleCommand(raw) {
        var cmd;
        try { cmd = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return; }
        if (!cmd || !cmd.type) return;

        if (cmd.type === 'init') {
          initMap(cmd);
          return;
        }
        if (!map) return;

        if (cmd.type === 'setStyle') {
          is3d = !!cmd.is3d;
          defaultPitch = typeof cmd.defaultPitch === 'number' ? cmd.defaultPitch : defaultPitch;
          belowLayerId = cmd.belowLayerId || belowLayerId;
          map.setStyle(resolveStyle(cmd));
          return;
        }

        if (cmd.type === 'setCamera') {
          setCamera(cmd);
          return;
        }

        if (cmd.type === 'setPontos') {
          clearCardMarkers();
          if (dotsLayerId) removeLayerIfExists(dotsLayerId);
          if (dotsSourceId) removeSourceIfExists(dotsSourceId);
          dotsLayerId = null;
          dotsSourceId = null;
          if (!cmd.pontos || !cmd.pontos.length) return;
          if (cmd.variant === 'card') {
            cmd.pontos.forEach(addCardMarker);
          } else {
            applyDots(cmd.pontos, cmd.layerKey || 'default');
          }
          return;
        }

        if (cmd.type === 'setRoute') {
          clearRouteMarkers();
          applyRoute(cmd.coordinates || []);
          if (cmd.origin) addRouteDot(cmd.origin.longitude, cmd.origin.latitude, 'origin');
          if (cmd.destination) addRouteDot(cmd.destination.longitude, cmd.destination.latitude, 'destination');
          return;
        }

        if (cmd.type === 'set3d') {
          is3d = !!cmd.enabled;
          defaultPitch = typeof cmd.defaultPitch === 'number' ? cmd.defaultPitch : defaultPitch;
          apply3dBuildings();
          setCamera({ pitch: is3d ? defaultPitch : 0, duration: 0 });
        }
      }

      window.__handleMapCommand = handleCommand;

      document.addEventListener('message', function (event) {
        if (typeof event.data === 'string') handleCommand(event.data);
      });
      window.addEventListener('message', function (event) {
        if (typeof event.data === 'string') handleCommand(event.data);
      });

      function boot() {
        if (!window.maplibregl) {
          post({ type: 'mapError', message: 'Falha ao carregar MapLibre GL JS' });
          return;
        }
        post({ type: 'htmlReady' });
      }

      var script = document.createElement('script');
      script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
      script.onload = boot;
      script.onerror = function () {
        post({ type: 'mapError', message: 'CDN MapLibre indisponível' });
      };
      document.head.appendChild(script);
    })();
  </script>
</body>
</html>`;
