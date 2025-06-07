from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import sqlite3
import json
import os
from dotenv import load_dotenv

from optimizer import TourOptimizer
from ml_model import MLPredictor
from database import init_db, get_db_connection

# 環境変数の読み込み
load_dotenv()

app = FastAPI(title="石垣島ツアー送迎API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Reactの開発サーバー
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データモデル
class Guest(BaseModel):
    name: str
    hotel_name: str
    pickup_lat: float
    pickup_lng: float
    num_people: int
    preferred_pickup_start: str
    preferred_pickup_end: str

class TourRequest(BaseModel):
    date: str
    activity_type: str
    activity_lat: float
    activity_lng: float
    planned_start_time: str
    guests: List[Guest]

class PickupRecord(BaseModel):
    tour_date: str
    planned_time: str
    actual_time: str
    guest_name: str
    delay_minutes: int
    distance_km: float
    weather: str
    tide_level: float

# グローバル変数
optimizer = TourOptimizer()
ml_predictor = MLPredictor()

@app.on_event("startup")
async def startup_event():
    """アプリケーション起動時の処理"""
    init_db()
    # 既存のモデルがあれば読み込む
    ml_predictor.load_model()
    print("サーバー起動完了")

@app.get("/")
async def root():
    return {"message": "石垣島ツアー送迎API", "version": "1.0.0"}

@app.post("/api/optimize")
async def optimize_tour(tour: TourRequest):
    """ツアーの最適化エンドポイント"""
    try:
        # ゲストデータを辞書形式に変換
        guests_data = []
        for guest in tour.guests:
            guests_data.append({
                'name': guest.name,
                'hotel_name': guest.hotel_name,
                'pickup_lat': guest.pickup_lat,
                'pickup_lng': guest.pickup_lng,
                'num_people': guest.num_people,
                'preferred_pickup_start': guest.preferred_pickup_start,
                'preferred_pickup_end': guest.preferred_pickup_end
            })
        
        activity_location = {
            'lat': tour.activity_lat,
            'lng': tour.activity_lng
        }
        
        # ルート最適化
        optimized_route = optimizer.optimize_route(
            guests_data, 
            activity_location,
            tour.planned_start_time
        )
        
        # ML予測
        prediction = ml_predictor.predict_tour_performance(
            tour.date,
            tour.activity_type,
            guests_data,
            activity_location
        )
        
        # レスポンスの構築
        response = {
            "success": True,
            "route": optimized_route['route'],
            "total_distance": optimized_route['total_distance'],
            "estimated_duration": optimized_route['estimated_duration'],
            "activity_start_time": tour.planned_start_time,
            "prediction": {
                "accuracy": prediction['confidence_score'],
                "expected_delays": prediction['expected_delays'],
                "recommendations": prediction['recommendations']
            }
        }
        
        return response
        
    except Exception as e:
        print(f"最適化エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/save_record")
async def save_pickup_record(record: PickupRecord):
    """実績データの保存"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO pickup_records 
            (tour_date, planned_time, actual_time, guest_name, 
             delay_minutes, distance_km, weather, tide_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record.tour_date,
            record.planned_time,
            record.actual_time,
            record.guest_name,
            record.delay_minutes,
            record.distance_km,
            record.weather,
            record.tide_level
        ))
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "記録を保存しました"}
    
    except Exception as e:
        print(f"保存エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/train_model")
async def train_model():
    """モデルの再学習"""
    try:
        result = ml_predictor.train_from_records()
        return {
            "success": True, 
            "message": "モデル学習が完了しました",
            "metrics": result
        }
    except Exception as e:
        print(f"学習エラー: {str(e)}")
        return {"success": False, "error": str(e)}

@app.get("/api/environmental_data/{date}")
async def get_environmental_data(date: str):
    """環境データの取得"""
    try:
        # 実際にはAPIや外部ソースから取得
        # ここではモックデータを返す
        return {
            "date": date,
            "tide": {
                "high": [{"time": "06:23", "level": 198}, {"time": "18:45", "level": 205}],
                "low": [{"time": "00:15", "level": 45}, {"time": "12:30", "level": 38}],
                "current_level": 150,
                "state": "rising"
            },
            "weather": {
                "condition": "sunny",
                "temp": 28,
                "windSpeed": 3.5,
                "windDirection": "NE",
                "precipitation": 0
            }
        }
    except Exception as e:
        print(f"環境データ取得エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_statistics():
    """統計情報の取得"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 総レコード数
        cursor.execute("SELECT COUNT(*) FROM pickup_records")
        total_records = cursor.fetchone()[0]
        
        # 平均遅延時間
        cursor.execute("SELECT AVG(delay_minutes) FROM pickup_records WHERE delay_minutes IS NOT NULL")
        avg_delay = cursor.fetchone()[0] or 0
        
        # 予測精度（仮の計算）
        accuracy = 85 + min(total_records / 100 * 5, 10)  # レコードが増えると精度向上
        
        conn.close()
        
        return {
            "total_records": total_records,
            "average_delay": round(avg_delay, 1),
            "prediction_accuracy": round(accuracy, 1),
            "model_last_trained": ml_predictor.last_trained
        }
    
    except Exception as e:
        print(f"統計取得エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)