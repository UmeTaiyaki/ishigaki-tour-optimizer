# -*- coding: utf-8 -*-
"""
backend/main.py - アルゴリズム選択対応版
石垣島ツアー最適化API - 高度AI搭載版

新機能:
- 遺伝的アルゴリズム対応
- シミュレーテッドアニーリング対応
- アルゴリズム選択API
- 詳細パフォーマンス比較
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
    print("[OK] EnhancedTourOptimizer 高度版インポート成功")
except ImportError as e:
    print(f"[WARNING] EnhancedTourOptimizer インポートエラー: {e}")
    print("[INFO] フォールバックモードで起動します")
    OPTIMIZER_AVAILABLE = False

# ロギング設定（Windows対応）
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
    title="石垣島ツアー最適化API（高度AI版）",
    description="遺伝的アルゴリズム搭載の高度なルート最適化システム",
    version="2.4.0"
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
    logger.info("[OK] EnhancedTourOptimizer 高度版初期化完了")
else:
    tour_optimizer = None
    logger.warning("[WARNING] EnhancedTourOptimizer 使用不可 - フォールバックモード")

# ===== 簡易気象サービス（既存機能維持） =====

class SimpleWeatherService:
    """簡易気象サービス（既存機能維持）"""
    
    def __init__(self):
        self.ishigaki_coords = {"lat": 24.3336, "lng": 124.1543, "name": "石垣島"}
    
    async def get_weather_data(self, date: str) -> Dict[str, Any]:
        """気象データ取得（簡易版）"""
        return {
            "location": "石垣島",
            "date": date,
            "weather": "晴れ",
            "temperature": 26,
            "wind_speed": 15,
            "humidity": 75,
            "visibility": "良好",
            "tide_level": 150,
            "tide_type": "中潮",
            "sea_conditions": "穏やか",
            "wave_height": 1.0,
            "source": "simple_service",
            "reliability": "basic",
            "last_updated": datetime.now().isoformat()
        }

# グローバル気象サービスインスタンス
weather_service = SimpleWeatherService()

# ===== データモデル =====

class Guest(BaseModel):
    id: Optional[str] = None
    name: str
    hotel_name: str
    pickup_lat: float
    pickup_lng: float
    num_people: int
    preferred_pickup_start: str = "09:00"
    preferred_pickup_end: str = "10:00"

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
    algorithm: Optional[str] = "nearest_neighbor"  # 新機能: アルゴリズム選択

# ===== フォールバック最適化関数 =====

def fallback_optimization(tour_request: TourRequest) -> Dict:
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
            "efficiency_score": 75
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
        "timestamp": datetime.now().isoformat()
    }

# ===== APIエンドポイント =====

@app.get("/")
async def root():
    optimizer_status = "高度AI搭載" if OPTIMIZER_AVAILABLE else "フォールバック"
    available_algorithms = ["genetic", "simulated_annealing", "nearest_neighbor"] if OPTIMIZER_AVAILABLE else ["fallback"]
    
    return {
        "message": f"石垣島ツアー最適化API（{optimizer_status}版）",
        "version": "2.4.0",
        "platform": "Windows対応",
        "optimizer_available": OPTIMIZER_AVAILABLE,
        "available_algorithms": available_algorithms,
        "features": ["遺伝的アルゴリズム", "シミュレーテッドアニーリング", "詳細ログ", "統計機能"],
        "encoding": "UTF-8"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "advanced_tour_optimization",
        "version": "2.4.0",
        "platform": "Windows対応",
        "optimizer_status": "ready" if OPTIMIZER_AVAILABLE else "fallback",
        "optimizer_available": OPTIMIZER_AVAILABLE,
        "ai_algorithms": ["genetic", "simulated_annealing"] if OPTIMIZER_AVAILABLE else [],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/ishigaki/algorithms")
async def get_available_algorithms():
    """
    利用可能なアルゴリズム一覧取得（新機能）
    """
    if OPTIMIZER_AVAILABLE:
        algorithms = [
            {
                "name": "genetic",
                "display_name": "遺伝的アルゴリズム",
                "description": "高精度最適化（効率90%+期待）",
                "processing_time": "1-3秒",
                "recommended_for": "高精度要求時",
                "parameters": {
                    "population_size": 30,
                    "generations": 50,
                    "mutation_rate": 0.1
                }
            },
            {
                "name": "simulated_annealing", 
                "display_name": "シミュレーテッドアニーリング",
                "description": "バランス型最適化（効率80-90%）",
                "processing_time": "0.5-1秒",
                "recommended_for": "中規模問題",
                "parameters": {
                    "initial_temperature": 100,
                    "cooling_rate": 0.95,
                    "max_iterations": 500
                }
            },
            {
                "name": "nearest_neighbor",
                "display_name": "最近傍法",
                "description": "高速基本最適化（効率75-85%）",
                "processing_time": "0.1秒",
                "recommended_for": "基本・緊急時",
                "parameters": {}
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
                "parameters": {}
            }
        ]
    
    return {
        "success": True,
        "algorithms": algorithms,
        "default_algorithm": "nearest_neighbor",
        "optimizer_available": OPTIMIZER_AVAILABLE,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/ishigaki/environmental")
async def get_environmental_data(date: str = Query(None, description="対象日付 (YYYY-MM-DD)")):
    """環境データ取得"""
    try:
        target_date = date or datetime.now().strftime("%Y-%m-%d")
        weather_data = await weather_service.get_weather_data(target_date)
        
        return {
            "success": True,
            "data": weather_data,
            "timestamp": datetime.now().isoformat(),
            "api_version": "2.4.0"
        }
        
    except Exception as e:
        logger.error(f"環境データ取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ishigaki/weather/status")
async def check_weather_api_status():
    """気象API状態確認"""
    return {
        "success": True,
        "api_status": {
            "simple_weather": "online",
            "optimizer": "ready" if OPTIMIZER_AVAILABLE else "fallback"
        },
        "platform": "Windows対応",
        "ai_ready": OPTIMIZER_AVAILABLE,
        "last_checked": datetime.now().isoformat()
    }

@app.post("/api/ishigaki/optimize")
async def optimize_tour_routes(tour_request: TourRequest):
    """
    ツアールート最適化（高度AI版）
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
    
    # リクエストデータのログ
    logger.info(f"[REQUEST] 最適化要求受信: {tour_request.date} - {tour_request.activity_type}")
    logger.info(f"[REQUEST] アルゴリズム: {algorithm}")
    logger.info(f"[REQUEST] ゲスト数: {len(tour_request.guests)}")
    logger.info(f"[REQUEST] 車両数: {len(tour_request.vehicles)}")
    
    try:
        # 入力データ検証
        if not tour_request.guests:
            raise HTTPException(status_code=400, detail="ゲスト情報が必要です")
        
        if not tour_request.vehicles:
            raise HTTPException(status_code=400, detail="車両情報が必要です")
        
        # AI最適化 または フォールバック
        if OPTIMIZER_AVAILABLE and tour_optimizer and algorithm != "fallback":
            logger.info(f"[AI] {algorithm}アルゴリズムで実行")
            
            # アクティビティ地点のデフォルト設定（川平湾）
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
            
            # 最適化実行（選択されたアルゴリズム）
            optimization_result = await tour_optimizer.optimize_multi_vehicle_routes(
                guests=guests_data,
                vehicles=vehicles_data,
                activity_location=activity_location,
                activity_start_time=tour_request.start_time,
                algorithm=algorithm  # ここが新機能！
            )
            
            optimization_end_time = datetime.now()
            optimization_duration = (optimization_end_time - optimization_start_time).total_seconds()
            
            logger.info(f"[SUCCESS] {algorithm}最適化完了: {optimization_duration:.2f}秒")
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
                "generation_logs": optimization_result.get('generation_logs'),
                "timestamp": optimization_end_time.isoformat(),
                "api_version": "2.4.0",
                "optimizer_mode": "AI",
                "platform": "Windows対応"
            }
            
        else:
            # フォールバック最適化
            logger.info("[FALLBACK] フォールバックモードで実行")
            response = fallback_optimization(tour_request)
            response["optimizer_mode"] = "fallback"
            response["platform"] = "Windows対応"
        
        logger.info("[COMPLETE] 最適化レスポンス送信完了")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] 最適化エラー: {e}")
        
        # エラー時もフォールバックを試行
        if OPTIMIZER_AVAILABLE and algorithm != "nearest_neighbor":
            logger.info("[FALLBACK] エラー時 nearest_neighbor で再実行")
            try:
                tour_request.algorithm = "nearest_neighbor"
                return await optimize_tour_routes(tour_request)
            except Exception:
                pass
        
        # 最終フォールバック
        response = fallback_optimization(tour_request)
        response["error_fallback"] = True
        response["original_error"] = str(e)
        response["platform"] = "Windows対応"
        return response

@app.post("/api/ishigaki/compare")
async def compare_algorithms(tour_request: TourRequest):
    """
    複数アルゴリズム比較実行（新機能）
    """
    if not OPTIMIZER_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI最適化エンジンが利用できません")
    
    logger.info("[COMPARE] アルゴリズム比較開始")
    
    algorithms = ["nearest_neighbor", "simulated_annealing", "genetic"]
    results = {}
    
    for algorithm in algorithms:
        try:
            logger.info(f"[COMPARE] {algorithm} 実行中...")
            tour_request.algorithm = algorithm
            
            start_time = datetime.now()
            result = await optimize_tour_routes(tour_request)
            end_time = datetime.now()
            
            results[algorithm] = {
                "efficiency_score": result["efficiency_score"],
                "total_distance": result["total_distance"],
                "total_time": result["total_time"],
                "optimization_time": result["optimization_time"],
                "algorithm_display": {
                    "nearest_neighbor": "最近傍法",
                    "simulated_annealing": "シミュレーテッドアニーリング",
                    "genetic": "遺伝的アルゴリズム"
                }[algorithm]
            }
            
        except Exception as e:
            logger.error(f"[COMPARE] {algorithm} エラー: {e}")
            results[algorithm] = {
                "error": str(e),
                "algorithm_display": {
                    "nearest_neighbor": "最近傍法",
                    "simulated_annealing": "シミュレーテッドアニーリング", 
                    "genetic": "遺伝的アルゴリズム"
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
        "recommendation": f"{best_algorithm}アルゴリズムが最も効率的です",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/ishigaki/statistics")
async def get_statistics():
    """統計データ取得"""
    logger.info("[STATS] 統計データ取得要求")
    
    try:
        if OPTIMIZER_AVAILABLE and tour_optimizer:
            # AI最適化統計
            stats = await tour_optimizer.get_performance_statistics()
        else:
            # フォールバック統計
            stats = {
                'total_optimizations': 0,
                'successful_optimizations': 0,
                'success_rate': 0,
                'average_optimization_time': 0,
                'best_efficiency_score': 0,
                'algorithm_usage': {},
                'version': 'fallback',
                'last_updated': datetime.now().isoformat()
            }
        
        return {
            "success": True,
            "statistics": stats,
            "optimizer_available": OPTIMIZER_AVAILABLE,
            "platform": "Windows対応",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"統計取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ishigaki/optimization/logs")
async def get_optimization_logs(limit: int = Query(50, description="取得ログ数")):
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
            "optimizer_available": OPTIMIZER_AVAILABLE,
            "platform": "Windows対応",
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
        "system_status": {
            "optimizer_available": OPTIMIZER_AVAILABLE,
            "optimizer_type": "EnhancedTourOptimizer" if OPTIMIZER_AVAILABLE else "fallback",
            "ai_algorithms": ["genetic", "simulated_annealing", "nearest_neighbor"] if OPTIMIZER_AVAILABLE else [],
            "log_directory": os.path.exists('logs'),
            "api_version": "2.4.0",
            "platform": "Windows対応",
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}",
            "encoding": "UTF-8",
            "startup_time": datetime.now().isoformat()
        },
        "available_endpoints": [
            "/api/ishigaki/optimize",
            "/api/ishigaki/compare",     # 新機能
            "/api/ishigaki/algorithms",  # 新機能
            "/api/ishigaki/statistics", 
            "/api/ishigaki/optimization/logs",
            "/api/ishigaki/environmental",
            "/api/ishigaki/system/status"
        ]
    }

if __name__ == "__main__":
    # ログディレクトリ確認
    if not os.path.exists('logs'):
        os.makedirs('logs')
        logger.info("[SETUP] ログディレクトリを作成しました")
    
    # 起動ログ
    logger.info("[STARTUP] 石垣島ツアー最適化API 高度版起動中...")
    logger.info(f"[STARTUP] AI最適化: {'有効' if OPTIMIZER_AVAILABLE else '無効（フォールバック）'}")
    logger.info("[STARTUP] プラットフォーム: Windows対応")
    
    if OPTIMIZER_AVAILABLE:
        logger.info("[STARTUP] 利用可能アルゴリズム: genetic, simulated_annealing, nearest_neighbor")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)