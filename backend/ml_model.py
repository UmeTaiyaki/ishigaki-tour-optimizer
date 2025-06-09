import os
import json
import sqlite3
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
from typing import Dict, List, Tuple
import requests

class IshigakiMLPredictor:
    """石垣島専用機械学習予測モデル"""
    
    def __init__(self):
        self.models = {
            'rf': None,  # Random Forest
            'gb': None,  # Gradient Boosting
            'nn': None   # Neural Network
        }
        
        # 石垣島特有の重み調整
        self.ensemble_weights = {'rf': 0.45, 'gb': 0.35, 'nn': 0.2}
        self.feature_names = []
        self.last_trained = None
        self.model_dir = 'models'
        
        # 石垣島の特徴パラメータ
        self.ishigaki_features = {
            'tourist_seasons': {
                'peak': [1, 2, 3, 7, 8, 12],      # 観光ピーク月
                'high': [4, 5, 11],                # 観光繁忙月
                'normal': [6, 9, 10]               # 通常月
            },
            'typhoon_months': [6, 7, 8, 9, 10, 11],
            'rain_months': [5, 6, 9, 10],
            'cruise_ship_days': [1, 15],  # 月2回程度のクルーズ船寄港
            'areas': {
                'city_center': {'traffic_multiplier': 1.4, 'tourist_density': 'high'},
                'kabira_bay': {'traffic_multiplier': 1.3, 'tourist_density': 'very_high'},
                'shiraho': {'traffic_multiplier': 0.9, 'tourist_density': 'medium'},
                'yonehara': {'traffic_multiplier': 0.8, 'tourist_density': 'medium'},
                'fusaki': {'traffic_multiplier': 1.1, 'tourist_density': 'high'},
                'airport': {'traffic_multiplier': 1.2, 'tourist_density': 'high'},
                'north_coast': {'traffic_multiplier': 0.7, 'tourist_density': 'low'}
            }
        }
        
        # モデル保存ディレクトリの作成
        os.makedirs(self.model_dir, exist_ok=True)
    
    def train_from_records(self) -> Dict:
        """石垣島の実績データから学習"""
        try:
            # データベースから石垣島の実績データを取得
            conn = sqlite3.connect('tour_data.db')
            query = """
            SELECT * FROM pickup_records 
            WHERE delay_minutes IS NOT NULL
            AND created_at >= date('now', '-2 years')
            ORDER BY created_at DESC
            LIMIT 2000
            """
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            if len(df) < 30:  # 石垣島は少ないデータでも学習開始
                return {
                    'success': False,
                    'message': f'石垣島専用モデル: データ不足 {len(df)}件（最低30件必要）'
                }
            
            # 石垣島特有の特徴量を抽出
            X, y = self._prepare_ishigaki_features(df)
            
            # データ分割（石垣島の季節性を考慮）
            X_train, X_test, y_train, y_test = self._seasonal_train_test_split(X, y, df)
            
            # 各モデルの学習（石垣島最適化パラメータ）
            results = {}
            
            # Random Forest（石垣島特化パラメータ）
            self.models['rf'] = RandomForestRegressor(
                n_estimators=150,        # 少ないデータでも安定
                max_depth=8,             # オーバーフィッティング防止
                min_samples_split=5,     # 石垣島のデータ特性に合わせて
                min_samples_leaf=3,
                max_features='sqrt',
                random_state=42
            )
            self.models['rf'].fit(X_train, y_train)
            rf_pred = self.models['rf'].predict(X_test)
            results['rf'] = {
                'mae': mean_absolute_error(y_test, rf_pred),
                'r2': r2_score(y_test, rf_pred)
            }
            
            # Gradient Boosting（石垣島観光パターン対応）
            self.models['gb'] = GradientBoostingRegressor(
                n_estimators=120,
                learning_rate=0.08,      # ゆっくり学習で安定性重視
                max_depth=4,
                min_samples_split=8,
                subsample=0.8,           # バギング効果
                random_state=42
            )
            self.models['gb'].fit(X_train, y_train)
            gb_pred = self.models['gb'].predict(X_test)
            results['gb'] = {
                'mae': mean_absolute_error(y_test, gb_pred),
                'r2': r2_score(y_test, gb_pred)
            }
            
            # Neural Network（石垣島の複雑なパターン学習）
            self.models['nn'] = MLPRegressor(
                hidden_layer_sizes=(40, 20),  # 島の規模に合わせてコンパクト
                max_iter=800,
                learning_rate_init=0.01,
                alpha=0.1,                     # 正則化強め
                random_state=42,
                early_stopping=True,
                validation_fraction=0.2
            )
            self.models['nn'].fit(X_train, y_train)
            nn_pred = self.models['nn'].predict(X_test)
            results['nn'] = {
                'mae': mean_absolute_error(y_test, nn_pred),
                'r2': r2_score(y_test, nn_pred)
            }
            
            # アンサンブル予測の評価
            ensemble_pred = (
                self.ensemble_weights['rf'] * rf_pred +
                self.ensemble_weights['gb'] * gb_pred +
                self.ensemble_weights['nn'] * nn_pred
            )
            results['ensemble'] = {
                'mae': mean_absolute_error(y_test, ensemble_pred),
                'r2': r2_score(y_test, ensemble_pred)
            }
            
            # モデル保存
            self._save_models()
            
            # 特徴量重要度（石垣島特有要因の分析）
            feature_importance = pd.DataFrame({
                'feature': self.feature_names,
                'importance': self.models['rf'].feature_importances_
            }).sort_values('importance', ascending=False)
            
            return {
                'success': True,
                'location': '石垣島専用モデル',
                'data_size': len(df),
                'results': results,
                'ishigaki_feature_importance': feature_importance.head(15).to_dict('records'),
                'model_notes': self._generate_model_notes(feature_importance)
            }
            
        except Exception as e:
            print(f"石垣島モデル学習エラー: {str(e)}")
            return {
                'success': False,
                'message': f'石垣島モデル学習失敗: {str(e)}'
            }
    
    def _prepare_ishigaki_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """石垣島特有の特徴量を準備"""
        features = pd.DataFrame()
        
        # 基本特徴量
        features['distance_km'] = df['distance_km']
        
        # 時間関連特徴量
        df['planned_datetime'] = pd.to_datetime(df['planned_time'])
        features['hour'] = df['planned_datetime'].dt.hour
        features['minute'] = df['planned_datetime'].dt.minute
        features['day_of_week'] = df['planned_datetime'].dt.dayofweek
        features['day_of_month'] = df['planned_datetime'].dt.day
        features['is_weekend'] = (features['day_of_week'] >= 5).astype(int)
        
        # 石垣島特有の時間帯特徴量
        features['is_morning_rush'] = features['hour'].apply(
            lambda x: 1 if 7 <= x <= 9 else 0
        )
        features['is_tourist_peak'] = features['hour'].apply(
            lambda x: 1 if 10 <= x <= 14 else 0
        )
        features['is_evening_rush'] = features['hour'].apply(
            lambda x: 1 if 17 <= x <= 19 else 0
        )
        
        # 季節・観光特徴量
        features['month'] = df['planned_datetime'].dt.month
        features['tourist_season'] = features['month'].apply(self._get_tourist_season)
        features['is_typhoon_season'] = features['month'].apply(
            lambda x: 1 if x in self.ishigaki_features['typhoon_months'] else 0
        )
        features['is_rain_season'] = features['month'].apply(
            lambda x: 1 if x in self.ishigaki_features['rain_months'] else 0
        )
        
        # クルーズ船寄港日の影響
        features['is_cruise_day'] = features['day_of_month'].apply(
            lambda x: 1 if x in self.ishigaki_features['cruise_ship_days'] else 0
        )
        
        # 天候エンコーディング（石垣島特有の天候）
        weather_dummies = pd.get_dummies(df['weather'], prefix='weather')
        features = pd.concat([features, weather_dummies], axis=1)
        
        # 潮位特徴量（石垣島の海洋アクティビティ重要）
        features['tide_level'] = df['tide_level']
        features['is_high_tide'] = (features['tide_level'] > 150).astype(int)
        features['is_very_high_tide'] = (features['tide_level'] > 180).astype(int)
        features['is_low_tide'] = (features['tide_level'] < 100).astype(int)
        
        # 潮位と時間の組み合わせ特徴量
        features['tide_hour_interaction'] = features['tide_level'] * features['hour']
        
        # エリア特徴量（ピックアップ場所の特性）
        if 'pickup_area' in df.columns:
            area_dummies = pd.get_dummies(df['pickup_area'], prefix='area')
            features = pd.concat([features, area_dummies], axis=1)
        
        # 移動距離カテゴリ
        features['distance_category'] = pd.cut(
            features['distance_km'], 
            bins=[0, 5, 10, 20, float('inf')], 
            labels=['short', 'medium', 'long', 'very_long']
        )
        distance_cat_dummies = pd.get_dummies(features['distance_category'], prefix='dist')
        features = pd.concat([features, distance_cat_dummies], axis=1)
        features.drop('distance_category', axis=1, inplace=True)
        
        # 観光客密度（仮想特徴量：実際は外部データと連携）
        features['tourist_density_score'] = (
            features['tourist_season'] * 
            features['is_weekend'] * 
            features['is_tourist_peak']
        ).apply(lambda x: min(x, 3))
        
        # 交通渋滞予測スコア
        features['traffic_congestion_score'] = (
            features['is_morning_rush'] * 2 +
            features['is_evening_rush'] * 2 +
            features['is_tourist_peak'] * 1 +
            features['is_cruise_day'] * 3 +
            features['tourist_season']
        )
        
        # 特徴量名を保存
        self.feature_names = features.columns.tolist()
        
        # ターゲット変数
        y = df['delay_minutes']
        
        return features, y
    
    def _get_tourist_season(self, month: int) -> int:
        """月から観光シーズンレベルを取得"""
        if month in self.ishigaki_features['tourist_seasons']['peak']:
            return 3  # ピーク
        elif month in self.ishigaki_features['tourist_seasons']['high']:
            return 2  # 繁忙
        else:
            return 1  # 通常
    
    def _seasonal_train_test_split(self, X: pd.DataFrame, y: pd.Series, df: pd.DataFrame):
        """季節性を考慮したデータ分割"""
        # 最新のデータをテストセットに（季節変動をより正確に評価）
        df_with_features = pd.concat([X, y], axis=1)
        df_with_features['date'] = pd.to_datetime(df['planned_time'])
        df_sorted = df_with_features.sort_values('date')
        
        # 最新20%をテストデータとして使用
        test_size = int(len(df_sorted) * 0.2)
        
        train_data = df_sorted[:-test_size]
        test_data = df_sorted[-test_size:]
        
        X_train = train_data.drop(['delay_minutes', 'date'], axis=1)
        y_train = train_data['delay_minutes']
        X_test = test_data.drop(['delay_minutes', 'date'], axis=1)
        y_test = test_data['delay_minutes']
        
        return X_train, X_test, y_train, y_test
    
    def predict_tour_performance(self, date: str, activity_type: str,
                                guests: List[Dict], activity_location: Dict) -> Dict:
        """石垣島ツアーのパフォーマンス予測"""
        predictions = {
            'confidence_score': 85,
            'expected_delays': [],
            'recommendations': [],
            'ishigaki_weather_alert': [],
            'tide_advisory': []
        }
        
        # モデルが学習済みかチェック
        if not any(model is not None for model in self.models.values()):
            predictions['recommendations'].append(
                "🏝️ 石垣島専用予測モデルが未学習です。実績データを蓄積中です。"
            )
            return predictions
        
        # 石垣島の環境データを取得
        environmental_data = self._get_ishigaki_environmental_data(date)
        
        # 各ゲストの遅延予測
        for guest in guests:
            delay_pred = self._predict_ishigaki_delay(
                guest=guest,
                date=date,
                activity_type=activity_type,
                environmental_data=environmental_data
            )
            
            predictions['expected_delays'].append({
                'guest_name': guest['name'],
                'predicted_delay': delay_pred['prediction'],
                'confidence_interval': delay_pred['confidence_interval'],
                'ishigaki_factors': delay_pred['ishigaki_factors']
            })
        
        # 信頼度スコア計算（石垣島特有）
        predictions['confidence_score'] = self._calculate_ishigaki_confidence(
            len(guests), environmental_data
        )
        
        # 石垣島特有の推奨事項生成
        predictions['recommendations'] = self._generate_ishigaki_recommendations(
            date, activity_type, predictions['expected_delays'], environmental_data
        )
        
        # 天候・潮位アラート
        predictions['ishigaki_weather_alert'] = self._generate_weather_alerts(environmental_data)
        predictions['tide_advisory'] = self._generate_tide_advisory(environmental_data)
        
        return predictions
    
    def _predict_ishigaki_delay(self, guest: Dict, date: str, activity_type: str,
                              environmental_data: Dict) -> Dict:
        """石垣島の個別ゲスト遅延予測"""
        
        # 特徴量の準備
        features = self._prepare_guest_features(guest, date, activity_type, environmental_data)
        
        # 各モデルの予測
        predictions = {}
        for name, model in self.models.items():
            if model is not None:
                try:
                    predictions[name] = model.predict(features)[0]
                except Exception as e:
                    print(f"予測エラー {name}: {e}")
                    predictions[name] = 0
        
        # アンサンブル予測
        if predictions:
            ensemble_pred = sum(
                self.ensemble_weights.get(name, 0) * pred 
                for name, pred in predictions.items()
            )
        else:
            ensemble_pred = 0
        
        # 石垣島特有の調整
        ensemble_pred = self._apply_ishigaki_adjustments(
            ensemble_pred, guest, environmental_data
        )
        
        # 信頼区間
        std_dev = np.std(list(predictions.values())) if predictions else 3
        
        return {
            'prediction': max(0, int(ensemble_pred)),
            'confidence_interval': (
                max(0, int(ensemble_pred - 1.96 * std_dev)),
                int(ensemble_pred + 1.96 * std_dev)
            ),
            'individual_predictions': predictions,
            'ishigaki_factors': self._identify_ishigaki_factors(guest, environmental_data)
        }
    
    def _prepare_guest_features(self, guest: Dict, date: str, activity_type: str,
                              environmental_data: Dict) -> pd.DataFrame:
        """ゲスト用特徴量準備"""
        
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            pickup_time = datetime.strptime(guest.get('preferred_pickup_start', '09:00'), '%H:%M')
        except:
            date_obj = datetime.now()
            pickup_time = datetime.now().replace(hour=9, minute=0)
        
        # 距離計算（簡易版）
        distance = 10.0  # 実際はactivity_locationとの距離を計算
        
        features = pd.DataFrame({
            'distance_km': [distance],
            'hour': [pickup_time.hour],
            'minute': [pickup_time.minute],
            'day_of_week': [date_obj.weekday()],
            'day_of_month': [date_obj.day],
            'is_weekend': [1 if date_obj.weekday() >= 5 else 0],
            'is_morning_rush': [1 if 7 <= pickup_time.hour <= 9 else 0],
            'is_tourist_peak': [1 if 10 <= pickup_time.hour <= 14 else 0],
            'is_evening_rush': [1 if 17 <= pickup_time.hour <= 19 else 0],
            'month': [date_obj.month],
            'tourist_season': [self._get_tourist_season(date_obj.month)],
            'is_typhoon_season': [1 if date_obj.month in self.ishigaki_features['typhoon_months'] else 0],
            'is_rain_season': [1 if date_obj.month in self.ishigaki_features['rain_months'] else 0],
            'is_cruise_day': [1 if date_obj.day in self.ishigaki_features['cruise_ship_days'] else 0],
            'tide_level': [environmental_data.get('tide_level', 150)],
            'is_high_tide': [1 if environmental_data.get('tide_level', 150) > 150 else 0],
            'is_very_high_tide': [1 if environmental_data.get('tide_level', 150) > 180 else 0],
            'is_low_tide': [1 if environmental_data.get('tide_level', 150) < 100 else 0],
            'tide_hour_interaction': [environmental_data.get('tide_level', 150) * pickup_time.hour],
        })
        
        # 天候ダミー変数
        weather = environmental_data.get('weather', 'sunny')
        for weather_type in ['sunny', 'cloudy', 'rainy', 'typhoon']:
            features[f'weather_{weather_type}'] = 1 if weather == weather_type else 0
        
        # 距離カテゴリダミー変数
        if distance <= 5:
            dist_category = 'short'
        elif distance <= 10:
            dist_category = 'medium'
        elif distance <= 20:
            dist_category = 'long'
        else:
            dist_category = 'very_long'
        
        for cat in ['short', 'medium', 'long', 'very_long']:
            features[f'dist_{cat}'] = 1 if dist_category == cat else 0
        
        # その他の特徴量
        features['tourist_density_score'] = (
            features['tourist_season'].iloc[0] * 
            features['is_weekend'].iloc[0] * 
            features['is_tourist_peak'].iloc[0]
        )
        
        features['traffic_congestion_score'] = (
            features['is_morning_rush'].iloc[0] * 2 +
            features['is_evening_rush'].iloc[0] * 2 +
            features['is_tourist_peak'].iloc[0] * 1 +
            features['is_cruise_day'].iloc[0] * 3 +
            features['tourist_season'].iloc[0]
        )
        
        # 欠損している特徴量を0で埋める
        for col in self.feature_names:
            if col not in features.columns:
                features[col] = 0
        
        # 特徴量の順序を合わせる
        features = features[self.feature_names]
        
        return features
    
    def _apply_ishigaki_adjustments(self, base_prediction: float, guest: Dict, 
                                  environmental_data: Dict) -> float:
        """石垣島特有の調整を適用"""
        
        adjusted = base_prediction
        
        # 台風警報レベル調整
        if environmental_data.get('typhoon_risk', 0) > 0.3:
            adjusted *= 2.0  # 台風時は大幅遅延
        
        # 観光シーズン調整
        month = environmental_data.get('month', 1)
        if month in [7, 8]:  # 夏休みピーク
            adjusted *= 1.3
        elif month in [1, 2, 3]:  # 冬の観光ピーク
            adjusted *= 1.2
        
        # クルーズ船寄港日調整
        if environmental_data.get('is_cruise_day', False):
            adjusted *= 1.5
        
        # 潮位による海岸道路影響
        tide_level = environmental_data.get('tide_level', 150)
        if tide_level > 200:  # 異常高潮位
            adjusted *= 1.2
        
        return adjusted
    
    def _identify_ishigaki_factors(self, guest: Dict, environmental_data: Dict) -> List[str]:
        """石垣島特有の影響要因を特定"""
        factors = []
        
        month = environmental_data.get('month', 1)
        
        if month in [7, 8]:
            factors.append("夏休み観光ピーク期")
        
        if environmental_data.get('typhoon_risk', 0) > 0.1:
            factors.append("台風シーズン")
        
        if environmental_data.get('is_cruise_day', False):
            factors.append("クルーズ船寄港日")
        
        if environmental_data.get('tide_level', 150) > 180:
            factors.append("高潮位による影響")
        
        return factors
    
    def _get_ishigaki_environmental_data(self, date: str) -> Dict:
        """石垣島の環境データを取得"""
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d')
        except:
            date_obj = datetime.now()
        
        month = date_obj.month
        day = date_obj.day
        
        # 実際の実装では外部APIから取得
        return {
            'month': month,
            'typhoon_risk': 0.2 if month in self.ishigaki_features['typhoon_months'] else 0.0,
            'weather': 'rainy' if month in [6, 9, 10] else 'sunny',
            'tide_level': 150 + np.random.normal(0, 30),  # 実際は潮位APIから取得
            'is_cruise_day': day in self.ishigaki_features['cruise_ship_days'],
            'wind_speed': np.random.uniform(2, 8),  # 実際は気象APIから取得
            'temperature': 25 + (month - 6) * 2 if month <= 8 else 30 - (month - 8) * 2
        }
    
    def _calculate_ishigaki_confidence(self, guest_count: int, environmental_data: Dict) -> float:
        """石垣島特有の信頼度計算"""
        base_confidence = 85
        
        # データ蓄積による信頼度向上
        if self.last_trained:
            days_since_training = (datetime.now() - datetime.fromisoformat(self.last_trained)).days
            if days_since_training < 30:
                base_confidence += 5
        
        # 台風などの予測困難な状況では信頼度低下
        if environmental_data.get('typhoon_risk', 0) > 0.3:
            base_confidence -= 15
        
        # ゲスト数による調整
        if guest_count <= 8:
            base_confidence += 5  # 少数精鋭で予測しやすい
        elif guest_count >= 20:
            base_confidence -= 5  # 大人数で変動要因増加
        
        return min(95, max(60, base_confidence))
    
    def _generate_ishigaki_recommendations(self, date: str, activity_type: str,
                                         expected_delays: List[Dict], 
                                         environmental_data: Dict) -> List[str]:
        """石垣島特有の推奨事項生成"""
        recommendations = []
        
        month = environmental_data.get('month', 1)
        
        # 季節別推奨
        if month in [7, 8]:
            recommendations.append("🌞 夏の観光ピーク期です。通常より30分早めの出発をお勧めします。")
        elif month in [1, 2, 3]:
            recommendations.append("❄️ 冬の観光シーズンです。北風が強い場合があります。")
        elif month in self.ishigaki_features['typhoon_months']:
            recommendations.append("🌀 台風シーズンです。最新の気象情報をご確認ください。")
        
        # 活動タイプ別推奨
        if activity_type == 'snorkeling':
            tide_level = environmental_data.get('tide_level', 150)
            if tide_level > 170:
                recommendations.append("🌊 高潮位のため、シュノーケリングに最適な条件です。")
            elif tide_level < 120:
                recommendations.append("🏖️ 干潮時のため、浅瀬での観察がしやすくなります。")
        
        elif activity_type == 'diving':
            recommendations.append("🤿 石垣島の透明度は世界トップクラス。存分にお楽しみください。")
        
        elif activity_type in ['kayak', 'sup']:
            wind_speed = environmental_data.get('wind_speed', 3)
            if wind_speed > 5:
                recommendations.append("💨 風が強めです。初心者の方は注意してください。")
        
        # 交通関連推奨
        if environmental_data.get('is_cruise_day', False):
            recommendations.append("🚢 クルーズ船寄港日のため、市街地の交通渋滞にご注意ください。")
        
        # 遅延予測に基づく推奨
        max_delay = max([d['predicted_delay'] for d in expected_delays], default=0)
        if max_delay > 15:
            recommendations.append(f"⏰ 最大{max_delay}分の遅延が予想されます。余裕を持った計画をお勧めします。")
        elif max_delay < 5:
            recommendations.append("✅ スムーズな送迎が予想されます。予定通りの進行が期待できます。")
        
        # 石垣島特有の推奨
        recommendations.append("🏝️ 石垣島の美しい自然をお楽しみください。移動中も絶景ポイントをご案内します。")
        
        if month in [11, 12, 1, 2]:
            recommendations.append("🐋 この時期はザトウクジラの回遊シーズンです。")
        
        return recommendations
    
    def _generate_weather_alerts(self, environmental_data: Dict) -> List[str]:
        """天候アラート生成"""
        alerts = []
        
        typhoon_risk = environmental_data.get('typhoon_risk', 0)
        if typhoon_risk > 0.5:
            alerts.append("🚨 台風警報: 強い台風の影響が予想されます")
        elif typhoon_risk > 0.3:
            alerts.append("⚠️ 台風注意: 台風の影響を受ける可能性があります")
        
        wind_speed = environmental_data.get('wind_speed', 3)
        if wind_speed > 8:
            alerts.append("💨 強風注意: 海上活動に影響する可能性があります")
        
        weather = environmental_data.get('weather', 'sunny')
        if weather == 'rainy':
            alerts.append("☔ 雨天予報: 道路状況の悪化にご注意ください")
        
        return alerts
    
    def _generate_tide_advisory(self, environmental_data: Dict) -> List[str]:
        """潮位アドバイス生成"""
        advisory = []
        
        tide_level = environmental_data.get('tide_level', 150)
        
        if tide_level > 200:
            advisory.append("🌊 大潮: 非常に高い潮位です。海岸道路の通行にご注意ください。")
        elif tide_level > 170:
            advisory.append("🌊 高潮: 海洋アクティビティに適した潮位です。")
        elif tide_level < 100:
            advisory.append("🏖️ 干潮: 浅瀬が広がり、ビーチコーミングに最適です。")
        elif tide_level < 120:
            advisory.append("🏖️ 低潮: 普段見えない岩場や生物観察ができます。")
        
        return advisory
    
    def _generate_model_notes(self, feature_importance: pd.DataFrame) -> List[str]:
        """モデル特性に関する注釈"""
        notes = []
        
        top_features = feature_importance.head(5)['feature'].tolist()
        
        notes.append(f"🔍 最も影響する要因: {', '.join(top_features[:3])}")
        
        if 'tourist_season' in top_features:
            notes.append("📈 観光シーズンが遅延に大きく影響しています")
        
        if 'tide_level' in top_features:
            notes.append("🌊 潮位が石垣島の交通に重要な影響を与えています")
        
        if 'traffic_congestion_score' in top_features:
            notes.append("🚗 交通渋滞予測スコアが高い精度を示しています")
        
        return notes
    
    def load_model(self):
        """保存済みモデルの読み込み"""
        try:
            for model_name in self.models.keys():
                model_path = os.path.join(self.model_dir, f'ishigaki_{model_name}_model.pkl')
                if os.path.exists(model_path):
                    self.models[model_name] = joblib.load(model_path)
                    print(f"石垣島{model_name}モデルを読み込みました")
            
            # メタデータの読み込み
            meta_path = os.path.join(self.model_dir, 'ishigaki_model_metadata.json')
            if os.path.exists(meta_path):
                with open(meta_path, 'r') as f:
                    metadata = json.load(f)
                    self.feature_names = metadata.get('feature_names', [])
                    self.last_trained = metadata.get('last_trained')
                    self.ensemble_weights = metadata.get('ensemble_weights', self.ensemble_weights)
        except Exception as e:
            print(f"石垣島モデル読み込みエラー: {str(e)}")
    
    def _save_models(self):
        """モデルの保存"""
        for model_name, model in self.models.items():
            if model is not None:
                model_path = os.path.join(self.model_dir, f'ishigaki_{model_name}_model.pkl')
                joblib.dump(model, model_path)
        
        # メタデータの保存
        metadata = {
            'location': '石垣島',
            'feature_names': self.feature_names,
            'last_trained': datetime.now().isoformat(),
            'ensemble_weights': self.ensemble_weights,
            'ishigaki_version': '1.0'
        }
        
        meta_path = os.path.join(self.model_dir, 'ishigaki_model_metadata.json')
        with open(meta_path, 'w') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        self.last_trained = metadata['last_trained']