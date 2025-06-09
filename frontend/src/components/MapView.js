import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

const MapView = ({
  guests,
  vehicles,
  activityLocation,
  departureLocation,
  optimizedRoutes,
  onGuestLocationUpdate,
  onActivityLocationUpdate,
  onDepartureLocationUpdate,
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);
  const directionsRenderersRef = useRef([]);
  const [mapError, setMapError] = useState(false);
  const [apiWarning, setApiWarning] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const mapStateRef = useRef({ center: null, zoom: null });

  // Google Maps初期化用のuseEffect
  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setMapError(true);
      console.warn('Google Maps APIキーが設定されていません');
      return;
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    loader
      .load()
      .then(() => {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: 24.3454, lng: 124.1572 },
          zoom: 12,
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        // 複数のDirectionsRendererを初期化（車両数分）
        // 車両の色に合わせて8台分のレンダラーを作成
        const vehicleColors = ['#1a73e8', '#34a853', '#ea4335', '#fbbc04', '#673ab7', '#ff6d00', '#00acc1', '#ab47bc'];
        
        // 既存のレンダラーをクリア
        directionsRenderersRef.current.forEach(renderer => {
          renderer.setMap(null);
        });
        directionsRenderersRef.current = [];

        // 8台分のDirectionsRendererを作成
        for (let i = 0; i < 8; i++) {
          const renderer = new window.google.maps.DirectionsRenderer({
            map: mapInstance,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: vehicleColors[i],
              strokeOpacity: 0.8,
              strokeWeight: 5,
            },
          });
          directionsRenderersRef.current.push(renderer);
        }

        // Places Serviceを初期化
        const service = new window.google.maps.places.PlacesService(mapInstance);

        // 地図の状態変更を監視
        mapInstance.addListener('zoom_changed', () => {
          mapStateRef.current.zoom = mapInstance.getZoom();
        });

        mapInstance.addListener('center_changed', () => {
          mapStateRef.current.center = mapInstance.getCenter();
        });

        // 初期状態を保存
        mapStateRef.current = {
          center: mapInstance.getCenter(),
          zoom: mapInstance.getZoom(),
        };

        setMap(mapInstance);
        setPlacesService(service);
      })
      .catch((error) => {
        console.error('Google Maps読み込みエラー:', error);
        setMapError(true);
      });
  }, []);

  // マーカー更新用のuseEffect
  useEffect(() => {
    if (!map) return;

    // 地図の状態を保持
    if (mapStateRef.current.center && mapStateRef.current.zoom) {
      map.setCenter(mapStateRef.current.center);
      map.setZoom(mapStateRef.current.zoom);
    }

    // 既存のマーカーをクリア
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 出発地点マーカー
    const departureMarker = new window.google.maps.Marker({
      position: departureLocation,
      map: map,
      title: '出発地点',
      draggable: true,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        scaledSize: new window.google.maps.Size(45, 45),
      },
    });

    departureMarker.addListener('dragend', (event) => {
      onDepartureLocationUpdate({
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      });
    });

    const departureInfoWindow = new window.google.maps.InfoWindow({
      content: '<div><strong>🚗 出発地点</strong></div>',
    });

    departureMarker.addListener('click', () => {
      departureInfoWindow.open(map, departureMarker);
    });

    markersRef.current.push(departureMarker);

    // ゲストマーカーを作成（車両の色で表示）
    guests.forEach((guest, index) => {
      // ゲストが割り当てられている車両を見つける
      let vehicleColor = '#1a73e8'; // デフォルト色
      let vehicleIndex = -1;
      
      if (optimizedRoutes && vehicles) {
        optimizedRoutes.forEach((route, vIndex) => {
          const guestInRoute = route.route?.find(r => r.name === guest.name);
          if (guestInRoute && vehicles[vIndex]) {
            vehicleColor = vehicles[vIndex].color;
            vehicleIndex = vIndex;
          }
        });
      }

      const marker = new window.google.maps.Marker({
        position: guest.location,
        map: map,
        label: {
          text: `${index + 1}`,
          color: 'white',
        },
        title: guest.name,
        draggable: true,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: vehicleColor,
          fillOpacity: 0.8,
          strokeColor: 'white',
          strokeWeight: 2,
        },
      });

      marker.addListener('dragend', (event) => {
        onGuestLocationUpdate(guest.id, {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        });
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <strong>${guest.name}</strong><br>
            ${guest.hotel}<br>
            ${guest.people}名<br>
            ${guest.pickupTime ? `ピックアップ: ${guest.pickupTime}` : ''}
            ${vehicleIndex >= 0 ? `<br>車両: ${vehicles[vehicleIndex].name}` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // アクティビティマーカー
    const activityMarker = new window.google.maps.Marker({
      position: activityLocation,
      map: map,
      title: 'アクティビティ地点',
      draggable: true,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(45, 45),
      },
    });

    activityMarker.addListener('dragend', (event) => {
      onActivityLocationUpdate({
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      });
    });

    const activityInfoWindow = new window.google.maps.InfoWindow({
      content: '<div><strong>🏊 アクティビティ地点</strong></div>',
    });

    activityMarker.addListener('click', () => {
      activityInfoWindow.open(map, activityMarker);
    });

    markersRef.current.push(activityMarker);
  }, [map, guests, activityLocation, departureLocation, optimizedRoutes, vehicles, onGuestLocationUpdate, onActivityLocationUpdate, onDepartureLocationUpdate]);

  // ルート描画用の別のuseEffect
  useEffect(() => {
    if (!map || directionsRenderersRef.current.length === 0 || !optimizedRoutes || optimizedRoutes.length === 0) return;

    // すべてのレンダラーをクリア
    directionsRenderersRef.current.forEach(renderer => renderer.setDirections({ routes: [] }));

    // 各車両のルートを描画
    optimizedRoutes.forEach((vehicleRoute, index) => {
      if (index >= directionsRenderersRef.current.length) return;
      
      // ルートが空の場合は処理しない
      if (!vehicleRoute.route || vehicleRoute.route.length === 0) {
        return;
      }

      const directionsService = new window.google.maps.DirectionsService();
      const renderer = directionsRenderersRef.current[index];

      // 車両の色を設定（vehiclesが存在する場合）
      if (vehicles && vehicles[index] && vehicles[index].color) {
        renderer.setOptions({
          polylineOptions: {
            strokeColor: vehicles[index].color,
            strokeOpacity: 0.8,
            strokeWeight: 5,
          },
        });
      }

      const waypoints = vehicleRoute.route.map(item => ({
        location: { lat: item.pickup_lat, lng: item.pickup_lng },
        stopover: true,
      }));

      // 出発地点から開始
      const origin = departureLocation;
      const destination = activityLocation;

      directionsService.route(
        {
          origin: origin,
          destination: destination,
          waypoints: waypoints,
          optimizeWaypoints: false,
          travelMode: window.google.maps.TravelMode.DRIVING,
          region: 'JP',
        },
        (response, status) => {
          if (status === 'OK') {
            renderer.setDirections(response);
          } else {
            console.warn(`車両${index + 1}のルート計算エラー:`, status);
            renderer.setDirections({ routes: [] });
            
            if (status === 'REQUEST_DENIED') {
              console.error('Directions APIが有効化されていません。');
              setApiWarning('ルート表示にはDirections APIの有効化が必要です');
            }
          }
        }
      );
    });
  }, [map, optimizedRoutes, activityLocation, departureLocation, vehicles]);

  // Places検索機能を外部に公開
  useEffect(() => {
    if (!placesService || !map) return;

    // グローバルに検索関数を公開（GuestListから呼び出し可能）
    window.searchHotelLocation = (hotelName, callback) => {
      const request = {
        query: `${hotelName} 石垣島`,
        fields: ['name', 'geometry'],
      };

      placesService.findPlaceFromQuery(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          callback({
            lat: location.lat(),
            lng: location.lng(),
            name: results[0].name
          });
        } else {
          console.error('場所が見つかりませんでした:', hotelName);
          callback(null);
        }
      });
    };
  }, [placesService, map]);

  if (mapError) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="warning">
          Google Maps APIキーが設定されていません。
          <br />
          開発用のマップ表示モードで動作しています。
        </Alert>
      </Box>
    );
  }

  return (
    <>
      {apiWarning && (
        <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
          <Alert severity="info" onClose={() => setApiWarning(null)}>
            {apiWarning}
          </Alert>
        </Box>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </>
  );
};

export default MapView;