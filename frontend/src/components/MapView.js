import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

const MapView = ({
  guests,
  activityLocation,
  optimizedRoute,
  onGuestLocationUpdate,
  onActivityLocationUpdate,
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    // Google Maps APIキーを環境変数から取得
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
        // 地図を初期化
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: 24.3454, lng: 124.1572 }, // 石垣島の中心
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

        // DirectionsRendererを初期化
        const renderer = new window.google.maps.DirectionsRenderer({
          map: mapInstance,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#1a73e8',
            strokeOpacity: 0.8,
            strokeWeight: 5,
          },
        });

        setMap(mapInstance);
        setDirectionsRenderer(renderer);
      })
      .catch((error) => {
        console.error('Google Maps読み込みエラー:', error);
        setMapError(true);
      });
  }, []);

  useEffect(() => {
    if (!map) return;

    // 既存のマーカーをクリア
    markers.forEach(marker => marker.setMap(null));
    const newMarkers = [];

    // ゲストマーカーを作成
    guests.forEach((guest, index) => {
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
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        },
      });

      // ドラッグ終了時のイベント
      marker.addListener('dragend', (event) => {
        onGuestLocationUpdate(guest.id, {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        });
      });

      // 情報ウィンドウ
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <strong>${guest.name}</strong><br>
            ${guest.hotel}<br>
            ${guest.people}名
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
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

    newMarkers.push(activityMarker);
    setMarkers(newMarkers);

    // ルートを描画
    if (optimizedRoute && optimizedRoute.route && directionsRenderer) {
      drawOptimizedRoute();
    }
  }, [map, guests, activityLocation, optimizedRoute, directionsRenderer, markers, onGuestLocationUpdate, onActivityLocationUpdate]);

  const drawOptimizedRoute = () => {
    if (!optimizedRoute || !optimizedRoute.route || !directionsRenderer || !map) return;

    const directionsService = new window.google.maps.DirectionsService();

    // ウェイポイントを作成
    const waypoints = optimizedRoute.route.map(item => ({
      location: { lat: item.pickup_lat, lng: item.pickup_lng },
      stopover: true,
    }));

    // 最初の地点を起点に設定
    const origin = waypoints.length > 0 ? waypoints[0].location : activityLocation;
    const destination = activityLocation;

    // 最初の地点を除外
    const middleWaypoints = waypoints.slice(1);

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        waypoints: middleWaypoints,
        optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'JP',
      },
      (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
        } else {
          console.error('ルート計算エラー:', status);
        }
      }
    );
  };

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

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default MapView;