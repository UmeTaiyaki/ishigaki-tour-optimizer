// GoogleMapIntegration.js - 石垣島ツアー管理システム Google Maps完全統合版
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Alert,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  List, ListItem, ListItemText, ListItemIcon, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Accordion, AccordionSummary, AccordionDetails, Paper, Stack,
  Tooltip, CircularProgress, Divider
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Hotel as HotelIcon,
  Place as PlaceIcon,
  Navigation as NavigationIcon,
  Route as RouteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  MyLocation as MyLocationIcon,
  Directions as DirectionsIcon,
  Traffic as TrafficIcon
} from '@mui/icons-material';

// Google Maps APIキー
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// 石垣島の座標とズームレベル
const ISHIGAKI_CONFIG = {
  center: { lat: 24.3336, lng: 124.1543 }, // 石垣市役所
  zoom: 13,
  bounds: {
    north: 24.46,
    south: 24.28,
    east: 124.32,
    west: 124.08
  }
};

// 人気観光スポット
const POPULAR_SPOTS = [
  { name: '川平湾', lat: 24.4167, lng: 124.1556, type: 'scenic' },
  { name: '石垣港離島ターミナル', lat: 24.3380, lng: 124.1570, type: 'transport' },
  { name: '新石垣空港', lat: 24.3968, lng: 124.2451, type: 'transport' },
  { name: '玉取崎展望台', lat: 24.4556, lng: 124.2167, type: 'scenic' },
  { name: '平久保崎灯台', lat: 24.4889, lng: 124.2833, type: 'scenic' },
  { name: '石垣やいま村', lat: 24.4167, lng: 124.1833, type: 'cultural' },
  { name: '白保海岸', lat: 24.3333, lng: 124.2333, type: 'beach' },
  { name: '米原海岸', lat: 24.4500, lng: 124.1667, type: 'beach' }
];

// 主要ホテル
const MAJOR_HOTELS = [
  { name: 'ANAインターコンチネンタル石垣リゾート', lat: 24.3214, lng: 124.1397 },
  { name: 'フサキビーチリゾート', lat: 24.3431, lng: 124.1142 },
  { name: 'グランヴィリオリゾート石垣島', lat: 24.3394, lng: 124.1547 },
  { name: 'アートホテル石垣島', lat: 24.3333, lng: 124.1567 },
  { name: 'ホテルミヤヒラ', lat: 24.3389, lng: 124.1569 },
  { name: '石垣島ビーチホテルサンシャイン', lat: 24.3467, lng: 124.1533 },
  { name: 'ホテル日航八重山', lat: 24.3394, lng: 124.1556 }
];

const GoogleMapIntegration = ({
  guests = [],
  vehicles = [],
  optimizedRoutes = [],
  activityLocation = null,
  onActivityLocationUpdate,
  onGuestLocationUpdate,
  onVehicleLocationUpdate,
  showTraffic = false,
  showRoutes = true,
  showGuestMarkers = true,
  showVehicleMarkers = true
}) => {
  // State management
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [trafficLayer, setTrafficLayer] = useState(null);
  
  // UI State
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(-1);
  const [mapStyle, setMapStyle] = useState('roadmap');
  
  // Display settings
  const [displaySettings, setDisplaySettings] = useState({
    showGuestMarkers: true,
    showVehicleMarkers: true,
    showRoutes: true,
    showTraffic: false,
    showPopularSpots: true,
    showHotels: false
  });

  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  // Google Maps初期化
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API キーが設定されていません');
      return;
    }

    if (!window.google) {
      loadGoogleMapsScript();
    } else {
      initializeMap();
    }
  }, []);

  const loadGoogleMapsScript = () => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places&language=ja`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    script.onerror = () => {
      console.error('Google Maps APIの読み込みに失敗しました');
    };
    document.head.appendChild(script);
  };

  const initializeMap = useCallback(() => {
    if (!window.google || !mapRef.current) return;

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: ISHIGAKI_CONFIG.center,
        zoom: ISHIGAKI_CONFIG.zoom,
        mapTypeId: mapStyle,
        restriction: {
          latLngBounds: ISHIGAKI_CONFIG.bounds,
          strictBounds: false
        },
        gestureHandling: 'cooperative',
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        styles: getMapStyles()
      });

      // サービス初期化
      const directionsServiceInstance = new window.google.maps.DirectionsService();
      const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
        suppressMarkers: false,
        draggable: true,
        polylineOptions: {
          strokeColor: '#2196F3',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });

      const trafficLayerInstance = new window.google.maps.TrafficLayer();

      // InfoWindow初期化
      infoWindowRef.current = new window.google.maps.InfoWindow();

      // 地図クリックイベント
      mapInstance.addListener('click', handleMapClick);

      // State更新
      setMap(mapInstance);
      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);
      setTrafficLayer(trafficLayerInstance);
      setMapLoaded(true);

      directionsRendererInstance.setMap(mapInstance);

    } catch (error) {
      console.error('Google Maps初期化エラー:', error);
    }
  }, [mapStyle]);

  // マップクリックハンドラー
  const handleMapClick = (event) => {
    const clickedLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };

    // アクティビティ地点設定モード
    if (onActivityLocationUpdate) {
      onActivityLocationUpdate(clickedLocation);
    }
  };

  // マーカー更新
  useEffect(() => {
    if (!map || !mapLoaded) return;

    clearMarkers();
    const newMarkers = [];

    // ゲストマーカー
    if (displaySettings.showGuestMarkers) {
      guests.forEach((guest, index) => {
        if (guest.location?.lat && guest.location?.lng) {
          const marker = createGuestMarker(guest, index);
          newMarkers.push(marker);
        }
      });
    }

    // 車両マーカー
    if (displaySettings.showVehicleMarkers) {
      vehicles.forEach((vehicle, index) => {
        if (vehicle.location?.lat && vehicle.location?.lng) {
          const marker = createVehicleMarker(vehicle, index);
          newMarkers.push(marker);
        }
      });
    }

    // アクティビティ地点マーカー
    if (activityLocation?.lat && activityLocation?.lng) {
      const marker = createActivityMarker(activityLocation);
      newMarkers.push(marker);
    }

    // 人気スポットマーカー
    if (displaySettings.showPopularSpots) {
      POPULAR_SPOTS.forEach((spot, index) => {
        const marker = createSpotMarker(spot, index);
        newMarkers.push(marker);
      });
    }

    // ホテルマーカー
    if (displaySettings.showHotels) {
      MAJOR_HOTELS.forEach((hotel, index) => {
        const marker = createHotelMarker(hotel, index);
        newMarkers.push(marker);
      });
    }

    setMarkers(newMarkers);
    markersRef.current = newMarkers;
  }, [map, mapLoaded, guests, vehicles, activityLocation, displaySettings]);

  // ルート表示
  useEffect(() => {
    if (!map || !directionsRenderer || !displaySettings.showRoutes) return;

    if (optimizedRoutes.length > 0) {
      displayOptimizedRoutes();
    }
  }, [map, directionsRenderer, optimizedRoutes, selectedRoute, displaySettings.showRoutes]);

  // 交通情報表示切り替え
  useEffect(() => {
    if (!trafficLayer || !map) return;

    if (displaySettings.showTraffic) {
      trafficLayer.setMap(map);
    } else {
      trafficLayer.setMap(null);
    }
  }, [trafficLayer, map, displaySettings.showTraffic]);

  // マーカー作成関数群
  const createGuestMarker = (guest, index) => {
    const marker = new window.google.maps.Marker({
      position: { lat: guest.location.lat, lng: guest.location.lng },
      map: map,
      title: `${guest.name} (${guest.hotel})`,
      icon: {
        url: createCustomIcon('guest', guest.people),
        scaledSize: new window.google.maps.Size(40, 40)
      },
      animation: window.google.maps.Animation.DROP
    });

    marker.addListener('click', () => {
      showGuestInfo(guest, marker);
    });

    return marker;
  };

  const createVehicleMarker = (vehicle, index) => {
    const marker = new window.google.maps.Marker({
      position: { lat: vehicle.location.lat, lng: vehicle.location.lng },
      map: map,
      title: `${vehicle.name} (${vehicle.capacity}人乗り)`,
      icon: {
        url: createCustomIcon('vehicle', vehicle.capacity),
        scaledSize: new window.google.maps.Size(45, 45)
      },
      animation: window.google.maps.Animation.BOUNCE
    });

    marker.addListener('click', () => {
      showVehicleInfo(vehicle, marker);
    });

    return marker;
  };

  const createActivityMarker = (location) => {
    const marker = new window.google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: map,
      title: 'アクティビティ地点',
      icon: {
        url: createCustomIcon('activity'),
        scaledSize: new window.google.maps.Size(50, 50)
      },
      animation: window.google.maps.Animation.BOUNCE
    });

    marker.addListener('click', () => {
      showActivityInfo(location, marker);
    });

    return marker;
  };

  const createSpotMarker = (spot, index) => {
    const marker = new window.google.maps.Marker({
      position: { lat: spot.lat, lng: spot.lng },
      map: map,
      title: spot.name,
      icon: {
        url: createCustomIcon('spot', spot.type),
        scaledSize: new window.google.maps.Size(30, 30)
      }
    });

    marker.addListener('click', () => {
      showSpotInfo(spot, marker);
    });

    return marker;
  };

  const createHotelMarker = (hotel, index) => {
    const marker = new window.google.maps.Marker({
      position: { lat: hotel.lat, lng: hotel.lng },
      map: map,
      title: hotel.name,
      icon: {
        url: createCustomIcon('hotel'),
        scaledSize: new window.google.maps.Size(35, 35)
      }
    });

    marker.addListener('click', () => {
      showHotelInfo(hotel, marker);
    });

    return marker;
  };

  // カスタムアイコン生成
  const createCustomIcon = (type, data = null) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 60;
    canvas.height = 60;

    // アイコンの種類に応じて描画
    switch (type) {
      case 'guest':
        drawGuestIcon(ctx, data);
        break;
      case 'vehicle':
        drawVehicleIcon(ctx, data);
        break;
      case 'activity':
        drawActivityIcon(ctx);
        break;
      case 'spot':
        drawSpotIcon(ctx, data);
        break;
      case 'hotel':
        drawHotelIcon(ctx);
        break;
      default:
        drawDefaultIcon(ctx);
    }

    return canvas.toDataURL();
  };

  const drawGuestIcon = (ctx, peopleCount) => {
    // 青い円
    ctx.fillStyle = '#2196F3';
    ctx.beginPath();
    ctx.arc(30, 30, 25, 0, 2 * Math.PI);
    ctx.fill();
    
    // 白い境界線
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 人数表示
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(peopleCount || '1', 30, 35);
  };

  const drawVehicleIcon = (ctx, capacity) => {
    // 緑の円
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(30, 30, 25, 0, 2 * Math.PI);
    ctx.fill();
    
    // 白い境界線
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 車のアイコン（簡略化）
    ctx.fillStyle = '#fff';
    ctx.fillRect(15, 20, 30, 12);
    ctx.fillRect(18, 32, 6, 6);
    ctx.fillRect(36, 32, 6, 6);
    
    // 定員表示
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(capacity || '4', 30, 48);
  };

  const drawActivityIcon = (ctx) => {
    // 赤の円
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(30, 30, 25, 0, 2 * Math.PI);
    ctx.fill();
    
    // 白い境界線
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 星マーク
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('★', 30, 38);
  };

  const drawSpotIcon = (ctx, spotType) => {
    let color = '#FF9800'; // オレンジ（デフォルト）
    
    switch (spotType) {
      case 'scenic': color = '#8BC34A'; break;
      case 'transport': color = '#607D8B'; break;
      case 'beach': color = '#00BCD4'; break;
      case 'cultural': color = '#9C27B0'; break;
    }
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(30, 30, 20, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawHotelIcon = (ctx) => {
    // 紫の円
    ctx.fillStyle = '#9C27B0';
    ctx.beginPath();
    ctx.arc(30, 30, 20, 0, 2 * Math.PI);
    ctx.fill();
    
    // 白い境界線
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Hマーク
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('H', 30, 35);
  };

  const drawDefaultIcon = (ctx) => {
    ctx.fillStyle = '#757575';
    ctx.beginPath();
    ctx.arc(30, 30, 20, 0, 2 * Math.PI);
    ctx.fill();
  };

  // 情報ウィンドウ表示関数群
  const showGuestInfo = (guest, marker) => {
    const content = `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; color: #2196F3;">🧑‍🤝‍🧑 ${guest.name}</h3>
        <p><strong>ホテル:</strong> ${guest.hotel}</p>
        <p><strong>人数:</strong> ${guest.people}名</p>
        <p><strong>希望時間:</strong> ${guest.preferredTime?.start || ''} - ${guest.preferredTime?.end || ''}</p>
        <div style="margin-top: 10px;">
          <button onclick="editGuestLocation('${guest.id}')" style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
            📍 位置を編集
          </button>
        </div>
      </div>
    `;
    
    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(map, marker);
  };

  const showVehicleInfo = (vehicle, marker) => {
    const content = `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; color: #4CAF50;">🚗 ${vehicle.name}</h3>
        <p><strong>定員:</strong> ${vehicle.capacity}名</p>
        <p><strong>ドライバー:</strong> ${vehicle.driver}</p>
        <p><strong>ステータス:</strong> ${vehicle.status === 'available' ? '利用可能' : '使用中'}</p>
        <div style="margin-top: 10px;">
          <button onclick="editVehicleLocation('${vehicle.id}')" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
            📍 位置を編集
          </button>
        </div>
      </div>
    `;
    
    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(map, marker);
  };

  const showActivityInfo = (location, marker) => {
    const content = `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; color: #F44336;">🎯 アクティビティ地点</h3>
        <p><strong>緯度:</strong> ${location.lat.toFixed(6)}</p>
        <p><strong>経度:</strong> ${location.lng.toFixed(6)}</p>
        <div style="margin-top: 10px;">
          <button onclick="editActivityLocation()" style="background: #F44336; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
            📍 位置を変更
          </button>
        </div>
      </div>
    `;
    
    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(map, marker);
  };

  const showSpotInfo = (spot, marker) => {
    const content = `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; color: #FF9800;">📍 ${spot.name}</h3>
        <p><strong>種類:</strong> ${getSpotTypeLabel(spot.type)}</p>
        <div style="margin-top: 10px;">
          <button onclick="setAsActivityLocation(${spot.lat}, ${spot.lng})" style="background: #FF9800; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
            🎯 アクティビティ地点に設定
          </button>
        </div>
      </div>
    `;
    
    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(map, marker);
  };

  const showHotelInfo = (hotel, marker) => {
    const content = `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; color: #9C27B0;">🏨 ${hotel.name}</h3>
        <div style="margin-top: 10px;">
          <button onclick="addGuestAtHotel('${hotel.name}', ${hotel.lat}, ${hotel.lng})" style="background: #9C27B0; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
            👥 ゲストを追加
          </button>
        </div>
      </div>
    `;
    
    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(map, marker);
  };

  // グローバル関数として設定（InfoWindowから呼び出し用）
  useEffect(() => {
    window.editGuestLocation = (guestId) => {
      const guest = guests.find(g => g.id === guestId);
      if (guest && onGuestLocationUpdate) {
        setEditingLocation({ type: 'guest', data: guest });
        setEditDialogOpen(true);
      }
    };

    window.editVehicleLocation = (vehicleId) => {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle && onVehicleLocationUpdate) {
        setEditingLocation({ type: 'vehicle', data: vehicle });
        setEditDialogOpen(true);
      }
    };

    window.editActivityLocation = () => {
      setEditingLocation({ type: 'activity', data: activityLocation });
      setEditDialogOpen(true);
    };

    window.setAsActivityLocation = (lat, lng) => {
      if (onActivityLocationUpdate) {
        onActivityLocationUpdate({ lat, lng });
      }
    };

    window.addGuestAtHotel = (hotelName, lat, lng) => {
      console.log('Add guest at hotel:', hotelName, lat, lng);
    };

    return () => {
      delete window.editGuestLocation;
      delete window.editVehicleLocation;
      delete window.editActivityLocation;
      delete window.setAsActivityLocation;
      delete window.addGuestAtHotel;
    };
  }, [guests, vehicles, activityLocation, onGuestLocationUpdate, onVehicleLocationUpdate, onActivityLocationUpdate]);

  // ルート表示
  const displayOptimizedRoutes = () => {
    if (!directionsService || !directionsRenderer) return;

    const routesToShow = selectedRoute === -1 ? optimizedRoutes : [optimizedRoutes[selectedRoute]];

    routesToShow.forEach((route, index) => {
      if (!route.route || route.route.length < 2) return;

      const waypoints = route.route.slice(1, -1).map(point => ({
        location: new window.google.maps.LatLng(point.lat, point.lng),
        stopover: true
      }));

      const request = {
        origin: new window.google.maps.LatLng(route.route[0].lat, route.route[0].lng),
        destination: new window.google.maps.LatLng(
          route.route[route.route.length - 1].lat,
          route.route[route.route.length - 1].lng
        ),
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          const renderer = new window.google.maps.DirectionsRenderer({
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: getRouteColor(index),
              strokeWeight: 4,
              strokeOpacity: 0.8
            }
          });
          renderer.setDirections(result);
          renderer.setMap(map);
        }
      });
    });
  };

  // ユーティリティ関数
  const getRouteColor = (index) => {
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#607D8B'];
    return colors[index % colors.length];
  };

  const getSpotTypeLabel = (type) => {
    const labels = {
      scenic: '景観スポット',
      transport: '交通機関',
      beach: 'ビーチ',
      cultural: '文化施設'
    };
    return labels[type] || type;
  };

  const getMapStyles = () => {
    return [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ];
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
  };

  // 現在地取得
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          if (map) {
            map.panTo(location);
            map.setZoom(15);
          }
        },
        (error) => {
          console.error('位置情報取得エラー:', error);
        }
      );
    }
  };

  // フィット・トゥ・バウンズ
  const fitToBounds = () => {
    if (!map || markers.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    markers.forEach(marker => {
      bounds.extend(marker.getPosition());
    });
    
    map.fitBounds(bounds);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* 地図コントロールパネル */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🗺️ 地図設定
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>地図タイプ</InputLabel>
                    <Select
                      value={mapStyle}
                      onChange={(e) => setMapStyle(e.target.value)}
                      label="地図タイプ"
                    >
                      <MenuItem value="roadmap">通常</MenuItem>
                      <MenuItem value="satellite">衛星写真</MenuItem>
                      <MenuItem value="hybrid">ハイブリッド</MenuItem>
                      <MenuItem value="terrain">地形</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>表示ルート</InputLabel>
                    <Select
                      value={selectedRoute}
                      onChange={(e) => setSelectedRoute(e.target.value)}
                      label="表示ルート"
                      disabled={optimizedRoutes.length === 0}
                    >
                      <MenuItem value={-1}>すべてのルート</MenuItem>
                      {optimizedRoutes.map((route, index) => (
                        <MenuItem key={index} value={index}>
                          {route.vehicle_name || `ルート ${index + 1}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="現在地を表示">
                      <IconButton onClick={getCurrentLocation} size="small">
                        <MyLocationIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="全体を表示">
                      <IconButton onClick={fitToBounds} size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={displaySettings.showTraffic}
                        onChange={(e) => setDisplaySettings(prev => ({
                          ...prev,
                          showTraffic: e.target.checked
                        }))}
                        size="small"
                      />
                    }
                    label="交通情報"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 表示設定パネル */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">表示設定</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={displaySettings.showGuestMarkers}
                        onChange={(e) => setDisplaySettings(prev => ({
                          ...prev,
                          showGuestMarkers: e.target.checked
                        }))}
                        size="small"
                      />
                    }
                    label="ゲスト"
                  />
                </Grid>

                <Grid item xs={6} sm={4} md={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={displaySettings.showVehicleMarkers}
                        onChange={(e) => setDisplaySettings(prev => ({
                          ...prev,
                          showVehicleMarkers: e.target.checked
                        }))}
                        size="small"
                      />
                    }
                    label="車両"
                  />
                </Grid>

                <Grid item xs={6} sm={4} md={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={displaySettings.showRoutes}
                        onChange={(e) => setDisplaySettings(prev => ({
                          ...prev,
                          showRoutes: e.target.checked
                        }))}
                        size="small"
                      />
                    }
                    label="ルート"
                  />
                </Grid>

                <Grid item xs={6} sm={4} md={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={displaySettings.showPopularSpots}
                        onChange={(e) => setDisplaySettings(prev => ({
                          ...prev,
                          showPopularSpots: e.target.checked
                        }))}
                        size="small"
                      />
                    }
                    label="観光スポット"
                  />
                </Grid>

                <Grid item xs={6} sm={4} md={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={displaySettings.showHotels}
                        onChange={(e) => setDisplaySettings(prev => ({
                          ...prev,
                          showHotels: e.target.checked
                        }))}
                        size="small"
                      />
                    }
                    label="ホテル"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Google Map本体 */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              {!mapLoaded && (
                <Box 
                  sx={{ 
                    height: 600, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}
                >
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Google Maps を読み込み中...
                  </Typography>
                </Box>
              )}
              
              <Box
                ref={mapRef}
                sx={{
                  height: 600,
                  width: '100%',
                  display: mapLoaded ? 'block' : 'none'
                }}
              />
              
              {!GOOGLE_MAPS_API_KEY && (
                <Alert severity="error" sx={{ m: 2 }}>
                  Google Maps API キーが設定されていません。
                  .envファイルにREACT_APP_GOOGLE_MAPS_API_KEYを設定してください。
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 凡例 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏷️ 地図凡例
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        bgcolor: '#2196F3', 
                        borderRadius: '50%' 
                      }} 
                    />
                    <Typography variant="body2">ゲスト</Typography>
                  </Stack>
                </Grid>
                
                <Grid item xs={6} sm={4} md={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        bgcolor: '#4CAF50', 
                        borderRadius: '50%' 
                      }} 
                    />
                    <Typography variant="body2">車両</Typography>
                  </Stack>
                </Grid>
                
                <Grid item xs={6} sm={4} md={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        bgcolor: '#F44336', 
                        borderRadius: '50%' 
                      }} 
                    />
                    <Typography variant="body2">アクティビティ</Typography>
                  </Stack>
                </Grid>
                
                <Grid item xs={6} sm={4} md={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        bgcolor: '#FF9800', 
                        borderRadius: '50%' 
                      }} 
                    />
                    <Typography variant="body2">観光スポット</Typography>
                  </Stack>
                </Grid>
                
                <Grid item xs={6} sm={4} md={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        bgcolor: '#9C27B0', 
                        borderRadius: '50%' 
                      }} 
                    />
                    <Typography variant="body2">ホテル</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 位置編集ダイアログ */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          📍 位置を編集
        </DialogTitle>
        <DialogContent>
          {editingLocation && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                地図をクリックして新しい位置を設定するか、座標を直接入力してください
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="緯度"
                    type="number"
                    inputProps={{ step: "any" }}
                    defaultValue={editingLocation.data?.location?.lat || editingLocation.data?.lat || ''}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="経度"
                    type="number"
                    inputProps={{ step: "any" }}
                    defaultValue={editingLocation.data?.location?.lng || editingLocation.data?.lng || ''}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            キャンセル
          </Button>
          <Button variant="contained" onClick={() => setEditDialogOpen(false)}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoogleMapIntegration;