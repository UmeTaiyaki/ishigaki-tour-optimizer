import React, { createContext, useContext, useState, useEffect } from 'react';

// デフォルト設定値
const defaultSettings = {
  companyName: '石垣島ツアー会社',
  defaultTourTime: '09:00',
  defaultActivityDuration: 180,
  
  vehicleDefaults: {
    defaultCapacity: 8,
    defaultVehicleType: 'mini_van',
    defaultSpeedFactor: 1.0,
    bufferTimeMinutes: 10,
    averageSpeedKmh: 35,
  },
  
  locations: {
    defaultDeparture: {
      name: '石垣港離島ターミナル',
      lat: 24.3448,
      lng: 124.1551
    },
    commonDestinations: [
      {
        id: 'kawahira',
        name: '川平湾',
        lat: 24.4525,
        lng: 124.1447,
        estimatedDuration: 120
      },
      {
        id: 'kabira',
        name: 'かびらビーチ',
        lat: 24.4505,
        lng: 124.1422,
        estimatedDuration: 90
      },
      {
        id: 'taketomi',
        name: '竹富島行き桟橋',
        lat: 24.3341,
        lng: 124.1551,
        estimatedDuration: 240
      }
    ]
  },
  
  optimization: {
    priorityMode: 'balanced',
    allowOverCapacity: false,
    maxPickupDelay: 30,
    groupNearbyGuests: true,
    nearbyRadiusKm: 2,
    considerTraffic: true,
    considerWeather: true,
    preferredRouteType: 'scenic'
  },
  
  environmental: {
    enableTideInfo: true,
    enableWeatherAlert: true,
    lowTideThreshold: 0.5,
    highWindSpeedThreshold: 15,
    rainProbabilityThreshold: 70
  },
  
  notifications: {
    enableEmailNotifications: false,
    enableSMSNotifications: false,
    notifyDriversBeforeDeparture: 60,
    notifyGuestsBeforePickup: 30
  }
};

// コンテキストの作成
const SettingsContext = createContext();

// カスタムフック
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// プロバイダーコンポーネント
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // 設定の読み込み
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('tourAppSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.error('設定の読み込みエラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 設定の更新
  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('tourAppSettings', JSON.stringify(newSettings));
  };

  // 部分的な設定の更新
  const updateSettingsSection = (section, updates) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        ...updates
      }
    };
    updateSettings(newSettings);
  };

  // 設定のリセット
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('tourAppSettings');
  };

  // よく使う目的地の取得
  const getCommonDestinations = () => {
    return settings.locations.commonDestinations;
  };

  // デフォルト出発地点の取得
  const getDefaultDeparture = () => {
    return settings.locations.defaultDeparture;
  };

  // 車両デフォルト設定の取得
  const getVehicleDefaults = () => {
    return settings.vehicleDefaults;
  };

  // 最適化設定の取得
  const getOptimizationSettings = () => {
    return settings.optimization;
  };

  // 環境設定の取得
  const getEnvironmentalSettings = () => {
    return settings.environmental;
  };

  const value = {
    settings,
    isLoading,
    updateSettings,
    updateSettingsSection,
    resetSettings,
    getCommonDestinations,
    getDefaultDeparture,
    getVehicleDefaults,
    getOptimizationSettings,
    getEnvironmentalSettings,
    defaultSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;