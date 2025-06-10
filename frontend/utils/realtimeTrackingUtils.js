// utils/realtimeTrackingUtils.js - 🗺️ リアルタイム追跡ユーティリティ

// 🚗 車両追跡データ管理
export class VehicleTracker {
  constructor() {
    this.vehicles = new Map();
    this.listeners = new Set();
    this.updateInterval = null;
    this.isTracking = false;
  }

  // 📡 追跡開始
  startTracking(vehicles, routes) {
    this.isTracking = true;
    
    // 車両データ初期化
    vehicles.forEach((vehicle, index) => {
      const route = routes[index];
      if (route) {
        this.vehicles.set(vehicle.id, {
          id: vehicle.id,
          name: vehicle.name || route.vehicle_name,
          driver: vehicle.driver,
          route: route.route,
          currentStopIndex: 0,
          status: 'ready', // ready, en_route, picking_up, completed, delayed
          lastUpdate: new Date(),
          estimatedArrival: route.route[0]?.pickup_time,
          location: {
            lat: route.departure_lat || 24.3336,
            lng: route.departure_lng || 124.1543
          },
          passengers: [],
          totalCapacity: vehicle.capacity || 8,
          totalDistance: route.total_distance,
          distanceCovered: 0,
          delayMinutes: 0,
          notifications: [],
          emergencyContact: vehicle.emergencyContact || 'manager@ishigaki-tours.com'
        });
      }
    });

    // 定期更新開始
    this.updateInterval = setInterval(() => {
      this.simulateProgress();
      this.notifyListeners();
    }, 30000); // 30秒間隔

    console.log('🚗 車両追跡開始:', this.vehicles.size, '台');
  }

  // 📍 追跡停止
  stopTracking() {
    this.isTracking = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('🛑 車両追跡停止');
  }

  // 🎯 進捗シミュレーション（実際の実装では GPS/API から取得）
  simulateProgress() {
    this.vehicles.forEach((vehicle, vehicleId) => {
      if (vehicle.status === 'completed') return;

      // ランダムな進捗更新（実際はGPSデータ）
      const updateProbability = 0.3; // 30%の確率で更新
      
      if (Math.random() < updateProbability) {
        this.updateVehicleProgress(vehicleId);
      }

      // 遅延検出
      this.checkForDelays(vehicleId);
    });
  }

  // 📊 車両進捗更新
  updateVehicleProgress(vehicleId) {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle || vehicle.status === 'completed') return;

    const now = new Date();
    const route = vehicle.route;

    // 現在のストップが完了している場合、次に進む
    if (vehicle.currentStopIndex < route.length) {
      const currentStop = route[vehicle.currentStopIndex];
      const nextStopIndex = vehicle.currentStopIndex + 1;

      // 進捗状況の判定
      const pickupTime = new Date(`2024-01-01 ${currentStop.pickup_time}`);
      const currentTime = new Date(`2024-01-01 ${now.toTimeString().substr(0, 5)}`);

      if (vehicle.status === 'ready' && Math.random() > 0.7) {
        // 出発
        vehicle.status = 'en_route';
        vehicle.lastUpdate = now;
        this.addNotification(vehicleId, 'info', `${vehicle.name} が出発しました`);
      } else if (vehicle.status === 'en_route' && Math.random() > 0.6) {
        // ピックアップ地点到着
        vehicle.status = 'picking_up';
        vehicle.location = {
          lat: currentStop.pickup_lat || 24.3336 + Math.random() * 0.01,
          lng: currentStop.pickup_lng || 124.1543 + Math.random() * 0.01
        };
        this.addNotification(vehicleId, 'success', `${currentStop.name} のピックアップ地点に到着`);
      } else if (vehicle.status === 'picking_up' && Math.random() > 0.5) {
        // ピックアップ完了、次の地点へ
        vehicle.passengers.push({
          name: currentStop.name,
          people: currentStop.num_people,
          pickupTime: now.toTimeString().substr(0, 5)
        });
        
        vehicle.currentStopIndex = nextStopIndex;
        vehicle.distanceCovered += (vehicle.totalDistance / route.length);
        
        if (nextStopIndex >= route.length) {
          vehicle.status = 'completed';
          this.addNotification(vehicleId, 'success', `${vehicle.name} 全ピックアップ完了`);
        } else {
          vehicle.status = 'en_route';
          vehicle.estimatedArrival = route[nextStopIndex].pickup_time;
          this.addNotification(vehicleId, 'info', `${route[nextStopIndex].name} へ向かっています`);
        }
      }

      vehicle.lastUpdate = now;
    }
  }

  // ⏰ 遅延チェック
  checkForDelays(vehicleId) {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle || vehicle.status === 'completed') return;

    const now = new Date();
    const route = vehicle.route;
    
    if (vehicle.currentStopIndex < route.length) {
      const currentStop = route[vehicle.currentStopIndex];
      const scheduledTime = new Date(`2024-01-01 ${currentStop.pickup_time}`);
      const currentTime = new Date(`2024-01-01 ${now.toTimeString().substr(0, 5)}`);
      
      const delayMinutes = Math.max(0, (currentTime - scheduledTime) / (1000 * 60));
      
      if (delayMinutes > 10 && vehicle.status !== 'delayed') {
        vehicle.status = 'delayed';
        vehicle.delayMinutes = Math.round(delayMinutes);
        this.addNotification(vehicleId, 'warning', 
          `${vehicle.name} が ${Math.round(delayMinutes)}分遅延しています`);
      }
    }
  }

  // 📢 通知追加
  addNotification(vehicleId, type, message) {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return;

    const notification = {
      id: Date.now() + Math.random(),
      type, // info, success, warning, error
      message,
      timestamp: new Date(),
      read: false
    };

    vehicle.notifications.unshift(notification);
    
    // 最大10件まで保持
    if (vehicle.notifications.length > 10) {
      vehicle.notifications = vehicle.notifications.slice(0, 10);
    }
  }

  // 📊 車両データ取得
  getVehicleData(vehicleId) {
    return this.vehicles.get(vehicleId);
  }

  // 📊 全車両データ取得
  getAllVehiclesData() {
    return Array.from(this.vehicles.values());
  }

  // 📊 車両状態更新
  updateVehicleStatus(vehicleId, status, location = null) {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return false;

    vehicle.status = status;
    vehicle.lastUpdate = new Date();
    
    if (location) {
      vehicle.location = location;
    }

    this.notifyListeners();
    return true;
  }

  // 🎧 リスナー管理
  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners() {
    const data = this.getAllVehiclesData();
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('リスナー通知エラー:', error);
      }
    });
  }

  // 🚨 緊急停止
  emergencyStop(vehicleId, reason) {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return false;

    vehicle.status = 'emergency';
    this.addNotification(vehicleId, 'error', `緊急停止: ${reason}`);
    
    // 緊急通知送信（実際の実装では SMS/メール送信）
    console.log(`🚨 緊急停止通知: ${vehicle.name} - ${reason}`);
    
    return true;
  }

  // 📱 通信機能
  sendDriverMessage(vehicleId, message) {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return false;

    // 実際の実装では SMS/WhatsApp API を使用
    console.log(`📱 ドライバーメッセージ送信: ${vehicle.driver} - ${message}`);
    
    this.addNotification(vehicleId, 'info', `メッセージ送信: ${message}`);
    return true;
  }

  // 📊 統計情報取得
  getTrackingStatistics() {
    const vehicles = this.getAllVehiclesData();
    
    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.status !== 'completed').length,
      completedVehicles: vehicles.filter(v => v.status === 'completed').length,
      delayedVehicles: vehicles.filter(v => v.status === 'delayed').length,
      averageProgress: vehicles.length > 0 ? 
        vehicles.reduce((sum, v) => sum + (v.currentStopIndex / Math.max(v.route.length, 1)), 0) / vehicles.length * 100 : 0,
      totalNotifications: vehicles.reduce((sum, v) => sum + v.notifications.length, 0)
    };
  }
}

// 🗺️ 位置情報ユーティリティ
export class LocationUtils {
  // 📍 石垣島の境界
  static ISHIGAKI_BOUNDS = {
    north: 24.46,
    south: 24.28,
    east: 124.32,
    west: 124.08
  };

  // 📏 距離計算（ハバーサイン公式）
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球の半径 (km)
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // 🎯 石垣島範囲内チェック
  static isWithinIshigaki(lat, lng) {
    return lat >= this.ISHIGAKI_BOUNDS.south && 
           lat <= this.ISHIGAKI_BOUNDS.north &&
           lng >= this.ISHIGAKI_BOUNDS.west && 
           lng <= this.ISHIGAKI_BOUNDS.east;
  }

  // 📍 ランダム位置生成（テスト用）
  static generateRandomLocation() {
    const lat = this.ISHIGAKI_BOUNDS.south + 
                Math.random() * (this.ISHIGAKI_BOUNDS.north - this.ISHIGAKI_BOUNDS.south);
    const lng = this.ISHIGAKI_BOUNDS.west + 
                Math.random() * (this.ISHIGAKI_BOUNDS.east - this.ISHIGAKI_BOUNDS.west);
    return { lat, lng };
  }

  // 🗺️ Google Maps URL生成
  static generateMapsUrl(lat, lng, zoom = 15) {
    return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
  }
}

// 📱 通信ユーティリティ
export class CommunicationUtils {
  // 📞 WhatsApp メッセージ送信
  static sendWhatsAppMessage(phoneNumber, message) {
    const formattedNumber = phoneNumber.replace(/\D/g, ''); // 数字のみ
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    return whatsappUrl;
  }

  // 📧 メール送信準備
  static prepareEmail(email, subject, body) {
    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
    return emailUrl;
  }

  // 📱 SMS送信準備
  static prepareSMS(phoneNumber, message) {
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl);
    return smsUrl;
  }

  // 🎯 ピックアップ通知メッセージ生成
  static generatePickupMessage(guestName, pickupTime, hotelName, vehicleName, driverName) {
    return `【石垣島ツアー】${guestName}様
ピックアップ時間: ${pickupTime}
場所: ${hotelName}
車両: ${vehicleName}
ドライバー: ${driverName}

ロビーでお待ちください。
緊急連絡先: 090-XXXX-XXXX`;
  }

  // 📊 進捗更新メッセージ生成
  static generateProgressMessage(vehicleName, currentLocation, estimatedArrival) {
    return `【進捗更新】${vehicleName}
現在地: ${currentLocation}
到着予定: ${estimatedArrival}
リアルタイム追跡: https://app.ishigaki-tour.com/tracking`;
  }

  // 🚨 遅延通知メッセージ生成
  static generateDelayMessage(vehicleName, delayMinutes, newEstimatedTime) {
    return `【遅延通知】${vehicleName}
${delayMinutes}分の遅延が発生しています。
新しい到着予定時間: ${newEstimatedTime}
ご迷惑をおかけして申し訳ございません。`;
  }
}

// 📊 QRコードユーティリティ
export class QRCodeUtils {
  // 🎯 追跡用QRコード生成
  static generateTrackingQR(vehicleId, tourDate) {
    const trackingUrl = `${window.location.origin}/tracking/${vehicleId}/${tourDate}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trackingUrl)}`;
  }

  // 📱 ゲスト情報QRコード生成
  static generateGuestQR(guestName, tourDate, pickupTime) {
    const guestData = {
      name: guestName,
      date: tourDate,
      pickup_time: pickupTime,
      info_url: `${window.location.origin}/guest/${guestName.replace(/\s+/g, '')}`
    };
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(guestData))}`;
  }

  // 🌐 スケジュール全体QRコード生成
  static generateScheduleQR(tourDate) {
    const scheduleUrl = `${window.location.origin}/schedule/${tourDate}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(scheduleUrl)}`;
  }
}

// 🎯 メインエクスポート
export default {
  VehicleTracker,
  LocationUtils,
  CommunicationUtils,
  QRCodeUtils
};

// 📊 グローバル追跡インスタンス（シングルトン）
export const globalVehicleTracker = new VehicleTracker();