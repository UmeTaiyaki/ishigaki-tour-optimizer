import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

const MapView = ({
  guests,
  vehicles,
  activityLocation,
  departureLocation,
  optimizedRoutes,
  onGuestLocationUpdate,
  onActivityLocationUpdate,
  onDepartureLocationUpdate,
  ishigakiMode = false
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);
  const directionsRenderersRef = useRef([]);
  const [mapError, setMapError] = useState(false);
  const [apiWarning, setApiWarning] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const mapStateRef = useRef({ center: null, zoom: null });

  // 石垣島の地図設定
  const ishigakiMapConfig = {
    center: { lat: 24.3454, lng: 124.1572 }, // 石垣島中心部
    zoom: 11,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#4fc3f7' }],
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#c8e6c9' }],
      }
    ]
  };

  // 石垣島の有名地点
  const ishigakiLandmarks = [
    { name: '川平湾', lat: 24.4219, lng: 124.1542, type: 'scenic' },
    { name: '白保海岸', lat: 24.3065, lng: 124.2158, type: 'beach' },
    { name: '米原ビーチ', lat: 24.4542, lng: 124.1628, type: 'beach' },
    { name: '玉取崎展望台', lat: 24.4445, lng: 124.2134, type: 'viewpoint' },
    { name: '石垣港', lat: 24.3380, lng: 124.1572, type: 'port' },
    { name: '新石垣空港', lat: 24.3965, lng: 124.2451, type: 'airport' }
  ];

  // Google Maps初期化
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
          ...ishigakiMapConfig,
          mapTypeId: 'roadmap',
          gestureHandling: 'greedy',
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true
        });

        // 複数車両用のDirectionsRendererを初期化
        const vehicleColors = vehicles.map(v => v.color || '#1a73e8');
        
        // 既存のレンダラーをクリア
        directionsRenderersRef.current.forEach(renderer => {
          renderer.setMap(null);
        });
        directionsRenderersRef.current = [];

        // 各車両用のレンダラーを作成
        vehicleColors.forEach((color, index) => {
          const renderer = new window.google.maps.DirectionsRenderer({
            map: mapInstance,
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: color,
              strokeOpacity: 0.8,
              strokeWeight: 6,
            },
          });
          directionsRenderersRef.current.push(renderer);
        });

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

        // 石垣島モードの場合、ランドマークを表示
        if (ishigakiMode) {
          addIshigakiLandmarks(mapInstance);
        }
      })
      .catch((error) => {
        console.error('Google Maps読み込みエラー:', error);
        setMapError(true);
      });
  }, [ishigakiMode]);

  // 石垣島のランドマーク表示
  const addIshigakiLandmarks = (mapInstance) => {
    ishigakiLandmarks.forEach((landmark) => {
      const marker = new window.google.maps.Marker({
        position: { lat: landmark.lat, lng: landmark.lng },
        map: mapInstance,
        title: landmark.name,
        icon: {
          url: getLandmarkIcon(landmark.type),
          scaledSize: new window.google.maps.Size(24, 24),
        },
        zIndex: 1
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>${landmark.name}</strong><br>
            <span style="color: #666; font-size: 12px;">${getLandmarkTypeText(landmark.type)}</span>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
      });
    });
  };

  // ランドマークアイコンの取得
  const getLandmarkIcon = (type) => {
    const iconMap = {
      'scenic': 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      'beach': 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
      'viewpoint': 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
      'port': 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
      'airport': 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
    };
    return iconMap[type] || 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
  };

  // ランドマークタイプのテキスト変換
  const getLandmarkTypeText = (type) => {
    const typeMap = {
      'scenic': '景勝地',
      'beach': 'ビーチ',
      'viewpoint': '展望台',
      'port': '港',
      'airport': '空港'
    };
    return typeMap[type] || type;
  };

  // マーカー更新
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
    if (departureLocation) {
      const departureMarker = new window.google.maps.Marker({
        position: departureLocation,
        map: map,
        title: '出発地点',
        draggable: true,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new window.google.maps.Size(48, 48),
        },
        zIndex: 1000
      });

      departureMarker.addListener('dragend', (event) => {
        onDepartureLocationUpdate({
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        });
      });

      const departureInfoWindow = new window.google.maps.InfoWindow({
        content: '<div><strong>🚗 出発地点</strong><br><small>ドラッグで移動可能</small></div>',
      });

      departureMarker.addListener('click', () => {
        departureInfoWindow.open(map, departureMarker);
      });

      markersRef.current.push(departureMarker);
    }

    // ゲストマーカーを作成（車両の色で表示）
    guests.forEach((guest, index) => {
      // ゲストが割り当てられている車両を見つける
      let vehicleColor = '#1a73e8'; // デフォルト色
      let vehicleInfo = '';
      
      if (optimizedRoutes && vehicles) {
        optimizedRoutes.forEach((route, vIndex) => {
          const guestInRoute = route.route?.find(r => r.name === guest.name);
          if (guestInRoute && vehicles[vIndex]) {
            vehicleColor = vehicles[vIndex].color;
            vehicleInfo = ` | 車両: ${vehicles[vIndex].name}`;
          }
        });
      }

      const marker = new window.google.maps.Marker({
        position: guest.location,
        map: map,
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontWeight: 'bold',
        },
        title: guest.name,
        draggable: true,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 22,
          fillColor: vehicleColor,
          fillOpacity: 0.9,
          strokeColor: 'white',
          strokeWeight: 3,
        },
        zIndex: 900
      });

      marker.addListener('dragend', (event) => {
        onGuestLocationUpdate(guest.id, {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        });
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <strong>${guest.name}</strong><br>
            <span style="color: #666;">${guest.hotel}</span><br>
            <span style="color: #333;">${guest.people}名</span>${vehicleInfo}<br>
            ${guest.pickupTime ? 
              `<div style="background: #e3f2fd; padding: 4px; border-radius: 4px; margin-top: 4px;">
                <strong>ピックアップ: ${guest.pickupTime}</strong>
              </div>` : 
              '<small style="color: #999;">未最適化</small>'
            }
            ${ishigakiMode ? '<br><small>🏝️ 石垣島ツアー</small>' : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // アクティビティマーカー
    if (activityLocation) {
      const activityMarker = new window.google.maps.Marker({
        position: activityLocation,
        map: map,
        title: 'アクティビティ地点',
        draggable: true,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(48, 48),
        },
        zIndex: 1000
      });

      activityMarker.addListener('dragend', (event) => {
        onActivityLocationUpdate({
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        });
      });

      const activityInfoWindow = new window.google.maps.InfoWindow({
        content: '<div><strong>🏊 アクティビティ地点</strong><br><small>ドラッグで移動可能</small></div>',
      });

      activityMarker.addListener('click', () => {
        activityInfoWindow.open(map, activityMarker);
      });

      markersRef.current.push(activityMarker);
    }
  }, [map, guests, activityLocation, departureLocation, optimizedRoutes, vehicles]);

  // ルート描画
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
          optimizeWaypoints: false, // 既に最適化済み
          travelMode: window.google.maps.TravelMode.DRIVING,
          region: 'JP',
          avoidHighways: false, // 石垣島では高速道路なし
          avoidTolls: true,     // 石垣島では有料道路なし
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
            } else if (status === 'ZERO_RESULTS') {
              setApiWarning(`車両${index + 1}: ルートが見つかりませんでした`);
            }
          }
        }
      );
    });
  }, [map, optimizedRoutes, activityLocation, departureLocation]);

  // Places検索機能
  useEffect(() => {
    if (!placesService || !map) return;

    // グローバルに検索関数を公開
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

    // 石垣島専用のホテル検索
    if (ishigakiMode) {
      window.searchIshigakiHotel = (hotelName, callback) => {
        const request = {
          query: `${hotelName} 石垣島 ホテル`,
          fields: ['name', 'geometry', 'formatted_address'],
          locationBias: {
            radius: 20000, // 20km範囲
            center: ishigakiMapConfig.center
          }
        };

        placesService.findPlaceFromQuery(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            const location = results[0].geometry.location;
            callback({
              lat: location.lat(),
              lng: location.lng(),
              name: results[0].name,
              address: results[0].formatted_address
            });
          } else {
            callback(null);
          }
        });
      };
    }
  }, [placesService, map, ishigakiMode]);

  if (mapError) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="warning">
          Google Maps APIキーが設定されていません。
          <br />
          {ishigakiMode ? '石垣島専用' : ''}開発用のマップ表示モードで動作しています。
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* APIエラー/警告表示 */}
      {apiWarning && (
        <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
          <Alert severity="info" onClose={() => setApiWarning(null)}>
            {apiWarning}
          </Alert>
        </Box>
      )}

      {/* 石垣島モード表示 */}
      {ishigakiMode && (
        <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
          <Chip 
            label="🏝️ 石垣島モード" 
            color="primary" 
            variant="filled"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
      )}

      {/* 車両凡例 */}
      {optimizedRoutes && optimizedRoutes.length > 0 && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: 10, 
          left: 10, 
          zIndex: 1000,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          p: 1,
          borderRadius: 1,
          maxWidth: 300
        }}>
          <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
            車両ルート
          </Typography>
          {optimizedRoutes.map((route, index) => {
            const vehicle = vehicles[index];
            if (!vehicle || !route.route || route.route.length === 0) return null;
            
            return (
              <Box key={route.vehicle_id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 4,
                    backgroundColor: vehicle.color,
                    borderRadius: 1
                  }}
                />
                <Typography variant="caption">
                  {vehicle.name} ({route.route.length}名)
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

export default MapView;