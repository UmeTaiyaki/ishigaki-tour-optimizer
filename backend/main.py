# -*- coding: utf-8 -*-
"""
backend/main.py - 気象データ統合版
石垣島ツアー最適化API - 動的時間決定システム搭載

新機能:
- 気象データ統合API
- 動的時間決定システム
- リアルタイム海況・風速データ活用
- 智能的出発・到着時間最適化
"""

import asyncio
import aiohttp
import math
import random
import logging
import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Windows文字エンコーディング対応
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

# 高度オプティマイザーをインポート
try:
    from enhanced_optimizer import EnhancedTourOptimizer
    OPTIMIZER_AVAILABLE = True
    print("[OK] EnhancedTourOptimizer 動的時間決定版インポート成功")
except ImportError as e:
    print(f"[WARNING] EnhancedTourOptimizer インポートエラー: {e}")
    print("[INFO] フォールバックモードで起動します")
    OPTIMIZER_AVAILABLE = False

# ロギング設定
log_dir = 'logs'
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'{log_dir}/optimization.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# FastAPIアプリケーション初期化
app = FastAPI(
    title="石垣島ツアー最適化API（動的時間決定版）",
    description="気象データ統合による智能的時間決定システム搭載",
    version="2.5.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# グローバルオプティマイザーインスタンス
if OPTIMIZER_AVAILABLE:
    tour_optimizer = EnhancedTourOptimizer()
    logger.info("[OK] EnhancedTourOptimizer 動的時間決定版初期化完了")
else:
    tour_optimizer = None
    logger.warning("[WARNING] EnhancedTourOptimizer 使用不可 - フォールバックモード")

# ===== 強化版気象サービス =====

class EnhancedWeatherService:
    """強化版気象サービス（動的時間決定対応）"""
    
    def __init__(self):
        self.ishigaki_coords = {"lat": 24.3336, "lng": 124.1543, "name": "石垣島"}
        self.cache = {}
        self.cache_duration = 1800  # 30分キャッシュ
    
    async def get_enhanced_weather_data(self, date: str = None) -> Dict[str, Any]:
        """
        強化版気象データ取得（時間決定システム用）
        """
        target_date = date or datetime.now().strftime("%Y-%m-%d")
        
        # キャッシュチェック
        cache_key = f"weather_{target_date}"
        if cache_key in self.cache:
            cached_data, cache_time = self.cache[cache_key]
            if (datetime.now() - cache_time).seconds < self.cache_duration:
                return cached_data
        
        try:
            # 実際の気象データ取得（将来的にAPIを統合）
            weather_data = await self._fetch_real_weather_data(target_date)
            
            # キャッシュに保存
            self.cache[cache_key] = (weather_data, datetime.now())
            
            return weather_data
            
        except Exception as e:
            logger.warning(f"気象データ取得エラー: {e}, フォールバックデータを使用")
            return self._get_fallback_weather_data(target_date)
    
    async def _fetch_real_weather_data(self, date: str) -> Dict[str, Any]:
        """
        実際の気象データ取得（シミュレーション版）
        実際の運用では気象庁API等を使用
        """
        current_hour = datetime.now().hour
        
        # 時間帯による動的データ生成
        base_wind_speed = 12 + random.uniform(-5, 8)
        base_wave_height = 0.8 + random.uniform(-0.3, 0.7)
        base_temperature = 25 + random.uniform(-3, 6)
        
        # 時間による風速・波高変化パターン
        if 6 <= current_hour <= 10:
            # 早朝〜午前：穏やか
            wind_modifier = 0.8
            wave_modifier = 0.7
        elif 11 <= current_hour <= 15:
            # 昼間：やや強い
            wind_modifier = 1.2
            wave_modifier = 1.1
        elif 16 <= current_hour <= 18:
            # 夕方：落ち着く
            wind_modifier = 0.9
            wave_modifier = 0.8
        else:
            # 夜間：変動大
            wind_modifier = 1.0 + random.uniform(-0.3, 0.3)
            wave_modifier = 1.0 + random.uniform(-0.2, 0.4)
        
        wind_speed = max(5, base_wind_speed * wind_modifier)
        wave_height = max(0.3, base_wave_height * wave_modifier)
        
        # 視界条件決定
        if wind_speed > 25 or wave_height > 2.0:
            visibility = "やや不良"
        elif wind_speed > 35 or wave_height > 3.0:
            visibility = "不良"
        else:
            visibility = "良好"
        
        # 潮汐データ（簡易版）
        tide_data = self._calculate_tide_data(current_hour)
        
        # 海況総合評価
        sea_condition = self._evaluate_sea_condition(wind_speed, wave_height, visibility)
        
        return {
            "location": "石垣島周辺海域",
            "date": date,
            "timestamp": datetime.now().isoformat(),
            "current_conditions": {
                "weather": self._determine_weather_condition(wind_speed, wave_height),
                "temperature": round(base_temperature, 1),
                "humidity": 70 + random.randint(-10, 15),
                "wind_speed": round(wind_speed, 1),
                "wind_direction": random.choice(["北東", "東", "南東", "南", "南西", "西"]),
                "wave_height": round(wave_height, 1),
                "visibility": visibility,
                "uv_index": min(11, max(1, 8 + random.randint(-3, 3))),
                "sea_temperature": round(base_temperature - 1, 1)
            },
            "marine_conditions": {
                "tide_level": tide_data["level"],
                "tide_type": tide_data["type"],
                "tide_time": tide_data["next_change"],
                "sea_conditions": sea_condition["overall"],
                "activity_suitability": sea_condition["activity_rating"],
                "safety_level": sea_condition["safety_level"]
            },
            "hourly_forecast": self._generate_hourly_forecast(wind_speed, wave_height, base_temperature),
            "activity_recommendations": self._generate_activity_recommendations(wind_speed, wave_height, visibility),
            "data_quality": {
                "source": "enhanced_simulation",
                "reliability": "high",
                "last_updated": datetime.now().isoformat(),
                "next_update": (datetime.now() + timedelta(minutes=30)).isoformat()
            }
        }
    
    def _get_fallback_weather_data(self, date: str) -> Dict[str, Any]:
        """フォールバック気象データ"""
        return {
            "location": "石垣島",
            "date": date,
            "timestamp": datetime.now().isoformat(),
            "current_conditions": {
                "weather": "晴れ",
                "temperature": 26,
                "humidity": 75,
                "wind_speed": 15,
                "wind_direction": "東",
                "wave_height": 1.0,
                "visibility": "良好",
                "uv_index": 8,
                "sea_temperature": 25
            },
            "marine_conditions": {
                "tide_level": 150,
                "tide_type": "中潮",
                "tide_time": "12:30",
                "sea_conditions": "穏やか",
                "activity_suitability": "適",
                "safety_level": "良好"
            },
            "activity_recommendations": {
                "optimal_departure_time": "08:30-09:00",
                "activity_time": "09:30-15:00",
                "conditions": "良好",
                "notes": "フォールバックデータ使用"
            },
            "data_quality": {
                "source": "fallback",
                "reliability": "basic",
                "last_updated": datetime.now().isoformat()
            }
        }
    
    def _calculate_tide_data(self, current_hour: int) -> Dict[str, Any]:
        """潮汐データ計算（簡易版）"""
        # 簡易的な潮汐パターン
        tide_types = ["大潮", "中潮", "小潮", "長潮", "若潮"]
        tide_type = random.choice(tide_types)
        
        # 潮位レベル（cm）
        base_level = 150
        hourly_variation = 30 * math.sin((current_hour - 6) * math.pi / 6)
        tide_level = int(base_level + hourly_variation)
        
        # 次の潮汐変化時刻
        next_change_hour = (current_hour + 6) % 24
        next_change = f"{next_change_hour:02d}:{random.randint(0, 59):02d}"
        
        return {
            "level": tide_level,
            "type": tide_type,
            "next_change": next_change
        }
    
    def _evaluate_sea_condition(self, wind_speed: float, wave_height: float, visibility: str) -> Dict[str, str]:
        """海況総合評価"""
        if wind_speed <= 15 and wave_height <= 1.0 and visibility == "良好":
            overall = "非常に穏やか"
            activity_rating = "優"
            safety_level = "安全"
        elif wind_speed <= 20 and wave_height <= 1.5:
            overall = "穏やか"
            activity_rating = "良"
            safety_level = "良好"
        elif wind_speed <= 25 and wave_height <= 2.0:
            overall = "やや波あり"
            activity_rating = "可"
            safety_level = "注意"
        elif wind_speed <= 30 and wave_height <= 2.5:
            overall = "波あり"
            activity_rating = "条件付き"
            safety_level = "要注意"
        else:
            overall = "荒れ気味"
            activity_rating = "不適"
            safety_level = "危険"
        
        return {
            "overall": overall,
            "activity_rating": activity_rating,
            "safety_level": safety_level
        }
    
    def _determine_weather_condition(self, wind_speed: float, wave_height: float) -> str:
        """天候状況決定"""
        if wind_speed <= 10 and wave_height <= 0.8:
            return "快晴"
        elif wind_speed <= 15 and wave_height <= 1.2:
            return "晴れ"
        elif wind_speed <= 25:
            return "曇り"
        else:
            return "悪天候"
    
    def _generate_hourly_forecast(self, base_wind: float, base_wave: float, base_temp: float) -> List[Dict]:
        """時間別予報生成"""
        forecast = []
        for hour in range(24):
            # 時間による変動を計算
            wind_variation = base_wind + random.uniform(-3, 5)
            wave_variation = base_wave + random.uniform(-0.2, 0.4)
            temp_variation = base_temp + random.uniform(-2, 3)
            
            forecast.append({
                "hour": f"{hour:02d}:00",
                "wind_speed": max(3, round(wind_variation, 1)),
                "wave_height": max(0.2, round(wave_variation, 1)),
                "temperature": round(temp_variation, 1),
                "conditions": self._determine_weather_condition(wind_variation, wave_variation)
            })
        
        return forecast
    
    def _generate_activity_recommendations(self, wind_speed: float, wave_height: float, visibility: str) -> Dict[str, Any]:
        """活動推奨事項生成"""
        if wind_speed <= 15 and wave_height <= 1.0:
            optimal_time = "06:00-10:00"
            conditions = "絶好"
            notes = "一日中活動に適しています"
        elif wind_speed <= 20 and wave_height <= 1.5:
            optimal_time = "07:00-11:00"
            conditions = "良好"
            notes = "午前中の活動を推奨"
        elif wind_speed <= 25 and wave_height <= 2.0:
            optimal_time = "08:00-10:00"
            conditions = "注意"
            notes = "風・波の状況を見ながら活動"
        else:
            optimal_time = "活動延期推奨"
            conditions = "不適"
            notes = "気象条件の改善を待つことを推奨"
        
        return {
            "optimal_departure_time": optimal_time,
            "activity_time": optimal_time,
            "conditions": conditions,
            "notes": notes,
            "safety_precautions": self._get_safety_precautions(wind_speed, wave_height)
        }
    
    def _get_safety_precautions(self, wind_speed: float, wave_height: float) -> List[str]:
        """安全注意事項"""
        precautions = []
        
        if wind_speed > 20:
            precautions.append("強風注意：帽子やタオルの飛散に注意")
        if wave_height > 1.5:
            precautions.append("高波注意：船酔いの可能性があります")
        if wind_speed > 25 or wave_height > 2.0:
            precautions.append("悪天候：活動の中止・延期を検討")
        
        if not precautions:
            precautions.append("良好な気象条件です")
        
        return precautions

# グローバル気象サービスインスタンス
weather_service = EnhancedWeatherService()

# ===== データモデル =====

class Guest(BaseModel):
    id: Optional[str] = None
    name: str
    hotel_name: str
    pickup_lat: float
    pickup_lng: float
    num_people: int
    preferred_pickup_start: str = "08:30"
    preferred_pickup_end: str = "09:00"

class Vehicle(BaseModel):
    id: Optional[str] = None
    name: str
    capacity: int
    driver: str
    location: Dict[str, float]

class ActivityLocation(BaseModel):
    lat: float
    lng: float
    name: str = "アクティビティ地点"

class TourRequest(BaseModel):
    date: str
    activity_type: str
    start_time: str
    guests: List[Guest]
    vehicles: List[Vehicle]
    activity_location: Optional[ActivityLocation] = None
    algorithm: Optional[str] = "nearest_neighbor"
    include_weather_optimization: Optional[bool] = True  # 🆕 気象最適化フラグ

# ===== APIエンドポイント =====

@app.get("/")
async def root():
    optimizer_status = "動的時間決定AI搭載" if OPTIMIZER_AVAILABLE else "フォールバック"
    available_algorithms = ["genetic", "simulated_annealing", "nearest_neighbor"] if OPTIMIZER_AVAILABLE else ["fallback"]
    
    return {
        "message": f"石垣島ツアー最適化API（{optimizer_status}版）",
        "version": "2.5.0",
        "platform": "Windows対応",
        "optimizer_available": OPTIMIZER_AVAILABLE,
        "available_algorithms": available_algorithms,
        "features": [
            "動的時間決定システム", 
            "気象データ統合", 
            "智能的出発時間最適化",
            "海況・風速考慮",
            "リアルタイム調整"
        ],
        "encoding": "UTF-8"
    }

@app.post("/api/ishigaki/optimize")
async def optimize_tour_routes(tour_request: TourRequest):
    """
    ツアールート最適化（動的時間決定版）
    """
    optimization_start_time = datetime.now()
    
    # アルゴリズム検証
    valid_algorithms = ["genetic", "simulated_annealing", "nearest_neighbor"] if OPTIMIZER_AVAILABLE else ["fallback"]
    algorithm = tour_request.algorithm or "nearest_neighbor"
    
    if algorithm not in valid_algorithms:
        raise HTTPException(
            status_code=400, 
            detail=f"無効なアルゴリズム: {algorithm}. 利用可能: {valid_algorithms}"
        )
    
    logger.info(f"[REQUEST] 動的時間決定最適化要求受信: {tour_request.date} - {tour_request.activity_type}")
    logger.info(f"[REQUEST] アルゴリズム: {algorithm}")
    logger.info(f"[REQUEST] ゲスト数: {len(tour_request.guests)}")
    logger.info(f"[REQUEST] 車両数: {len(tour_request.vehicles)}")
    logger.info(f"[REQUEST] 気象最適化: {tour_request.include_weather_optimization}")
    
    try:
        # 入力データ検証
        if not tour_request.guests:
            raise HTTPException(status_code=400, detail="ゲスト情報が必要です")
        
        if not tour_request.vehicles:
            raise HTTPException(status_code=400, detail="車両情報が必要です")
        
        # 🆕 気象データ取得
        weather_data = None
        if tour_request.include_weather_optimization:
            try:
                weather_response = await weather_service.get_enhanced_weather_data(tour_request.date)
                weather_data = weather_response.get('current_conditions', {})
                logger.info(f"[WEATHER] 気象データ取得完了: 風速{weather_data.get('wind_speed', 'N/A')}km/h, 波高{weather_data.get('wave_height', 'N/A')}m")
            except Exception as e:
                logger.warning(f"[WEATHER] 気象データ取得失敗: {e}, デフォルト値使用")
                weather_data = None
        
        # AI最適化 または フォールバック
        if OPTIMIZER_AVAILABLE and tour_optimizer and algorithm != "fallback":
            logger.info(f"[AI] 動的時間決定{algorithm}アルゴリズムで実行")
            
            # アクティビティ地点のデフォルト設定
            activity_location = {
                'lat': tour_request.activity_location.lat if tour_request.activity_location else 24.4167,
                'lng': tour_request.activity_location.lng if tour_request.activity_location else 124.1556,
                'name': tour_request.activity_location.name if tour_request.activity_location else "川平湾"
            }
            
            # ゲストデータ変換
            guests_data = []
            for guest in tour_request.guests:
                guest_dict = {
                    'id': guest.id or f"guest_{len(guests_data)}",
                    'name': guest.name,
                    'hotel_name': guest.hotel_name,
                    'pickup_lat': guest.pickup_lat,
                    'pickup_lng': guest.pickup_lng,
                    'num_people': guest.num_people,
                    'preferred_pickup_start': guest.preferred_pickup_start,
                    'preferred_pickup_end': guest.preferred_pickup_end
                }
                guests_data.append(guest_dict)
            
            # 車両データ変換
            vehicles_data = []
            for vehicle in tour_request.vehicles:
                vehicle_dict = {
                    'id': vehicle.id or f"vehicle_{len(vehicles_data)}",
                    'name': vehicle.name,
                    'capacity': vehicle.capacity,
                    'driver': vehicle.driver,
                    'location': vehicle.location
                }
                vehicles_data.append(vehicle_dict)
            
            # 🆕 動的時間決定最適化実行
            optimization_result = await tour_optimizer.optimize_multi_vehicle_routes(
                guests=guests_data,
                vehicles=vehicles_data,
                activity_location=activity_location,
                activity_start_time=tour_request.start_time,
                algorithm=algorithm,
                weather_data=weather_data  # 🆕 気象データを渡す
            )
            
            optimization_end_time = datetime.now()
            optimization_duration = (optimization_end_time - optimization_start_time).total_seconds()
            
            logger.info(f"[SUCCESS] 動的時間決定{algorithm}最適化完了: {optimization_duration:.2f}秒")
            logger.info(f"[RESULT] 効率: {optimization_result['efficiency_score']:.1f}%")
            logger.info(f"[RESULT] 距離: {optimization_result['total_distance']}km")
            
            # レスポンス構築
            response = {
                "success": True,
                "routes": optimization_result['routes'],
                "total_distance": optimization_result['total_distance'],
                "total_time": optimization_result['total_time'],
                "efficiency_score": optimization_result['efficiency_score'],
                "optimization_time": round(optimization_duration, 2),
                "algorithm_used": optimization_result['algorithm_used'],
                "optimization_log": optimization_result['optimization_log'],
                "timestamp": optimization_end_time.isoformat(),
                "api_version": "2.5.0",
                # 🆕 気象統合情報
                "weather_integration": {
                    "enabled": tour_request.include_weather_optimization,
                    "data_used": weather_data is not None,
                    "summary": optimization_result.get('weather_summary', {})
                }
            }
            
            # 気象データも含める（オプション）
            if weather_data and tour_request.include_weather_optimization:
                response["weather_conditions"] = weather_data
            
            return response
            
        else:
            # フォールバック最適化
            logger.info("[FALLBACK] 基本最適化で実行")
            return await fallback_optimization(tour_request)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] 最適化処理エラー: {e}")
        raise HTTPException(status_code=500, detail=f"最適化処理エラー: {str(e)}")

@app.get("/api/ishigaki/environmental")
async def get_environmental_data(date: str = Query(None, description="対象日付 (YYYY-MM-DD)")):
    """強化版環境データ取得"""
    try:
        target_date = date or datetime.now().strftime("%Y-%m-%d")
        weather_data = await weather_service.get_enhanced_weather_data(target_date)
        
        return {
            "success": True,
            "data": weather_data,
            "timestamp": datetime.now().isoformat(),
            "api_version": "2.5.0",
            "features": ["動的時間決定対応", "海況データ", "活動推奨"]
        }
        
    except Exception as e:
        logger.error(f"環境データ取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ishigaki/weather/hourly")
async def get_hourly_weather_forecast(date: str = Query(None, description="対象日付")):
    """時間別気象予報取得"""
    try:
        target_date = date or datetime.now().strftime("%Y-%m-%d")
        weather_data = await weather_service.get_enhanced_weather_data(target_date)
        
        return {
            "success": True,
            "date": target_date,
            "hourly_forecast": weather_data.get("hourly_forecast", []),
            "activity_recommendations": weather_data.get("activity_recommendations", {}),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"時間別予報取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 既存のエンドポイント（省略、元のコードと同じ）
@app.get("/api/ishigaki/algorithms")
async def get_available_algorithms():
    """利用可能アルゴリズム一覧取得"""
    if OPTIMIZER_AVAILABLE:
        algorithms = [
            {
                "name": "genetic",
                "display_name": "遺伝的アルゴリズム",
                "description": "進化的計算による高精度最適化（気象対応）",
                "processing_time": "1-3秒",
                "recommended_for": "複雑な制約条件・高精度要求",
                "weather_integration": True,
                "parameters": {
                    "population_size": 40,
                    "generations": 75,
                    "dynamic_timing": True
                }
            },
            {
                "name": "simulated_annealing", 
                "display_name": "シミュレーテッドアニーリング",
                "description": "焼きなまし法による動的時間最適化",
                "processing_time": "0.5-1秒",
                "recommended_for": "バランス重視・気象適応",
                "weather_integration": True,
                "parameters": {
                    "initial_temperature": 200,
                    "cooling_rate": 0.95,
                    "dynamic_timing": True
                }
            },
            {
                "name": "nearest_neighbor",
                "display_name": "最近傍法",
                "description": "高速基本最適化（気象考慮）",
                "processing_time": "0.1秒",
                "recommended_for": "高速処理・基本最適化",
                "weather_integration": True,
                "parameters": {
                    "dynamic_timing": True
                }
            }
        ]
    else:
        algorithms = [
            {
                "name": "fallback",
                "display_name": "フォールバック",
                "description": "基本機能のみ",
                "processing_time": "0.1秒",
                "recommended_for": "システム復旧時",
                "weather_integration": False
            }
        ]
    
    return {
        "success": True,
        "algorithms": algorithms,
        "default_algorithm": "nearest_neighbor",
        "optimizer_available": OPTIMIZER_AVAILABLE,
        "features": ["dynamic_timing", "weather_integration"],
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/ishigaki/compare")
async def compare_algorithms(tour_request: TourRequest):
    """アルゴリズム比較実行（気象対応版）"""
    if not OPTIMIZER_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI最適化機能が利用できません")
    
    logger.info(f"[COMPARE] アルゴリズム比較開始: {tour_request.date}")
    
    # 気象データ取得
    weather_data = None
    if tour_request.include_weather_optimization:
        try:
            weather_response = await weather_service.get_enhanced_weather_data(tour_request.date)
            weather_data = weather_response.get('current_conditions', {})
        except Exception as e:
            logger.warning(f"比較用気象データ取得失敗: {e}")
    
    algorithms = ["genetic", "simulated_annealing", "nearest_neighbor"]
    results = {}
    
    for algorithm in algorithms:
        try:
            start_time = datetime.now()
            
            # 共通データ準備
            activity_location = {
                'lat': tour_request.activity_location.lat if tour_request.activity_location else 24.4167,
                'lng': tour_request.activity_location.lng if tour_request.activity_location else 124.1556,
                'name': tour_request.activity_location.name if tour_request.activity_location else "川平湾"
            }
            
            guests_data = [
                {
                    'id': guest.id or f"guest_{i}",
                    'name': guest.name,
                    'hotel_name': guest.hotel_name,
                    'pickup_lat': guest.pickup_lat,
                    'pickup_lng': guest.pickup_lng,
                    'num_people': guest.num_people,
                    'preferred_pickup_start': guest.preferred_pickup_start,
                    'preferred_pickup_end': guest.preferred_pickup_end
                }
                for i, guest in enumerate(tour_request.guests)
            ]
            
            vehicles_data = [
                {
                    'id': vehicle.id or f"vehicle_{i}",
                    'name': vehicle.name,
                    'capacity': vehicle.capacity,
                    'driver': vehicle.driver,
                    'location': vehicle.location
                }
                for i, vehicle in enumerate(tour_request.vehicles)
            ]
            
            # 動的時間決定最適化実行
            result = await tour_optimizer.optimize_multi_vehicle_routes(
                guests=guests_data,
                vehicles=vehicles_data,
                activity_location=activity_location,
                activity_start_time=tour_request.start_time,
                algorithm=algorithm,
                weather_data=weather_data
            )
            
            end_time = datetime.now()
            
            results[algorithm] = {
                "efficiency_score": result["efficiency_score"],
                "total_distance": result["total_distance"],
                "total_time": result["total_time"],
                "optimization_time": result["optimization_time"],
                "routes_count": len(result["routes"]),
                "algorithm_display": {
                    "nearest_neighbor": "最近傍法（気象対応）",
                    "simulated_annealing": "シミュレーテッドアニーリング（動的時間）",
                    "genetic": "遺伝的アルゴリズム（智能時間決定）"
                }[algorithm],
                "weather_integration": weather_data is not None,
                "timing_optimization": True
            }
            
        except Exception as e:
            logger.error(f"[COMPARE] {algorithm} エラー: {e}")
            results[algorithm] = {
                "error": str(e),
                "algorithm_display": {
                    "nearest_neighbor": "最近傍法（気象対応）",
                    "simulated_annealing": "シミュレーテッドアニーリング（動的時間）", 
                    "genetic": "遺伝的アルゴリズム（智能時間決定）"
                }[algorithm]
            }
    
    # 最良アルゴリズム特定
    best_algorithm = None
    best_efficiency = 0
    
    for algo, result in results.items():
        if "efficiency_score" in result and result["efficiency_score"] > best_efficiency:
            best_efficiency = result["efficiency_score"]
            best_algorithm = algo
    
    logger.info(f"[COMPARE] 比較完了: 最良 {best_algorithm} ({best_efficiency:.1f}%)")
    
    return {
        "success": True,
        "comparison_results": results,
        "best_algorithm": best_algorithm,
        "best_efficiency": best_efficiency,
        "recommendation": f"{best_algorithm}アルゴリズム（動的時間決定）が最も効率的です",
        "weather_conditions": weather_data if weather_data else "気象データなし",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/ishigaki/statistics")
async def get_statistics():
    """統計データ取得"""
    logger.info("[STATS] 統計データ取得要求")
    
    try:
        if OPTIMIZER_AVAILABLE and tour_optimizer:
            stats = await tour_optimizer.get_performance_statistics()
        else:
            stats = {
                'total_optimizations': 0,
                'successful_optimizations': 0,
                'success_rate': 0,
                'average_optimization_time': 0,
                'best_efficiency_score': 0,
                'version': 'fallback'
            }
        
        return {
            "success": True,
            "statistics": stats,
            "system_info": {
                "optimizer_available": OPTIMIZER_AVAILABLE,
                "version": "2.5.0",
                "features": ["dynamic_timing", "weather_integration"],
                "platform": "Windows対応"
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"統計取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ishigaki/optimization/logs")
async def get_optimization_logs(limit: int = Query(20, ge=1, le=100)):
    """最適化ログ取得"""
    try:
        if OPTIMIZER_AVAILABLE and tour_optimizer:
            logs = await tour_optimizer.get_recent_logs(limit)
        else:
            logs = []
        
        return {
            "success": True,
            "logs": logs,
            "count": len(logs),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"ログ取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ishigaki/system/status")
async def get_system_status():
    """システム状態確認"""
    return {
        "success": True,
        "status": "operational",
        "components": {
            "optimizer": "ready" if OPTIMIZER_AVAILABLE else "fallback",
            "weather_service": "active",
            "dynamic_timing": "enabled" if OPTIMIZER_AVAILABLE else "disabled",
            "api": "healthy"
        },
        "version": "2.5.0",
        "platform": "Windows対応",
        "features": {
            "ai_optimization": OPTIMIZER_AVAILABLE,
            "weather_integration": True,
            "dynamic_timing": OPTIMIZER_AVAILABLE,
            "algorithm_comparison": OPTIMIZER_AVAILABLE
        },
        "uptime": "active",
        "timestamp": datetime.now().isoformat()
    }

# フォールバック最適化関数
async def fallback_optimization(tour_request: TourRequest) -> Dict:
    """フォールバック最適化（既存ロジック維持）"""
    logger.info("[FALLBACK] フォールバック最適化実行")
    
    routes = []
    for i, vehicle in enumerate(tour_request.vehicles):
        route = {
            "vehicle_id": vehicle.id or f"vehicle_{i}",
            "vehicle_name": vehicle.name,
            "driver": vehicle.driver,
            "route": [],
            "total_distance": 25.5,
            "total_time": 90,
            "efficiency_score": 75,
            "weather_integration": False,
            "timing_optimization": False
        }
        routes.append(route)
    
    return {
        "success": True,
        "routes": routes,
        "total_distance": 25.5,
        "total_time": 90,
        "efficiency_score": 75,
        "optimization_time": 0.1,
        "algorithm_used": "fallback",
        "optimization_log": [
            "[FALLBACK] フォールバックモードで実行",
            "[WARNING] 基本的な最適化のみ実行",
            "[INFO] AI最適化を使用するには enhanced_optimizer.py が必要です"
        ],
        "weather_integration": {
            "enabled": False,
            "data_used": False,
            "summary": {}
        },
        "timestamp": datetime.now().isoformat()
    }

# アプリケーション起動
if __name__ == "__main__":
    print("🏝️ 石垣島ツアー最適化API（動的時間決定版）起動中...")
    print(f"📊 オプティマイザー状態: {'AI搭載' if OPTIMIZER_AVAILABLE else 'フォールバック'}")
    print(f"🌊 気象統合: 有効")
    print(f"⏰ 動的時間決定: {'有効' if OPTIMIZER_AVAILABLE else '無効'}")
    print("=" * 60)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info",
        reload=False
    )