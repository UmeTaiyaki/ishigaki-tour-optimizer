import sqlite3
import os
from datetime import datetime
from typing import Dict, List, Optional

def init_db():
    """石垣島専用データベースの初期化"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 基本的なピックアップ記録テーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pickup_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tour_date TEXT NOT NULL,
            planned_time TEXT NOT NULL,
            actual_time TEXT NOT NULL,
            guest_name TEXT NOT NULL,
            delay_minutes INTEGER NOT NULL,
            distance_km REAL NOT NULL,
            weather TEXT NOT NULL,
            tide_level REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 石垣島専用拡張テーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ishigaki_pickup_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tour_date TEXT NOT NULL,
            planned_time TEXT NOT NULL,
            actual_time TEXT NOT NULL,
            guest_name TEXT NOT NULL,
            hotel_name TEXT NOT NULL,
            delay_minutes INTEGER NOT NULL,
            distance_km REAL NOT NULL,
            weather TEXT NOT NULL,
            tide_level REAL NOT NULL,
            vehicle_id TEXT NOT NULL,
            driver_name TEXT NOT NULL,
            activity_type TEXT NOT NULL,
            pickup_area TEXT,
            guest_satisfaction INTEGER,
            special_notes TEXT,
            typhoon_alert_level INTEGER DEFAULT 0,
            cruise_ship_day BOOLEAN DEFAULT FALSE,
            tourist_season_level INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 石垣島環境データテーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ishigaki_environmental_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            weather_condition TEXT NOT NULL,
            temperature REAL,
            wind_speed REAL,
            wind_direction TEXT,
            tide_high_time_1 TEXT,
            tide_high_level_1 REAL,
            tide_high_time_2 TEXT,
            tide_high_level_2 REAL,
            tide_low_time_1 TEXT,
            tide_low_level_1 REAL,
            tide_low_time_2 TEXT,
            tide_low_level_2 REAL,
            current_tide_level REAL,
            typhoon_risk REAL DEFAULT 0,
            typhoon_name TEXT,
            cruise_ship_arrivals INTEGER DEFAULT 0,
            tourist_density_level INTEGER DEFAULT 1,
            traffic_congestion_forecast TEXT DEFAULT 'normal',
            special_events TEXT,
            uv_index INTEGER,
            visibility_km REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 車両パフォーマンステーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ishigaki_vehicle_performance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id TEXT NOT NULL,
            vehicle_name TEXT,
            date TEXT NOT NULL,
            total_distance REAL,
            total_time_minutes INTEGER,
            fuel_consumption REAL,
            maintenance_score INTEGER,
            driver_name TEXT,
            driver_rating REAL,
            route_efficiency_score REAL,
            guest_count INTEGER,
            on_time_percentage REAL,
            equipment_usage TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # ホテル・エリア情報テーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ishigaki_hotels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hotel_name TEXT NOT NULL UNIQUE,
            area TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            hotel_type TEXT,
            capacity INTEGER,
            pickup_difficulty_level INTEGER DEFAULT 1,
            parking_availability BOOLEAN DEFAULT TRUE,
            access_road_quality TEXT DEFAULT 'good',
            popular_activities TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 活動地点情報テーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ishigaki_activity_spots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            spot_name TEXT NOT NULL UNIQUE,
            activity_type TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            area TEXT NOT NULL,
            difficulty_level INTEGER DEFAULT 1,
            best_tide_condition TEXT,
            best_weather_condition TEXT,
            capacity INTEGER,
            equipment_rental BOOLEAN DEFAULT FALSE,
            parking_spaces INTEGER,
            access_notes TEXT,
            seasonal_availability TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 交通パターンテーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ishigaki_traffic_patterns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            hour INTEGER NOT NULL,
            route_segment TEXT NOT NULL,
            average_speed REAL,
            congestion_level INTEGER DEFAULT 1,
            incident_count INTEGER DEFAULT 0,
            weather_condition TEXT,
            tourist_density INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 予測精度追跡テーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ishigaki_prediction_accuracy (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prediction_date TEXT NOT NULL,
            actual_date TEXT NOT NULL,
            guest_name TEXT NOT NULL,
            predicted_delay INTEGER,
            actual_delay INTEGER,
            accuracy_score REAL,
            model_version TEXT,
            environmental_factors TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    
    # 初期データの投入
    insert_initial_data(cursor)
    
    conn.commit()
    conn.close()
    
    print("🏝️ 石垣島専用データベースを初期化しました")

def insert_initial_data(cursor):
    """石垣島の基本データを初期投入"""
    
    # 主要ホテルデータ
    hotels_data = [
        ('ANAインターコンチネンタル石垣リゾート', 'fusaki', 24.3892, 124.1256, 'resort', 458, 2, True, 'excellent', 'snorkeling,diving,kayak'),
        ('フサキビーチリゾート ホテル＆ヴィラズ', 'fusaki', 24.3889, 124.1253, 'resort', 600, 2, True, 'excellent', 'beach,snorkeling'),
        ('グランヴィリオ リゾート石垣島', 'city_center', 24.3380, 124.1572, 'hotel', 330, 3, False, 'good', 'sightseeing,diving'),
        ('アートホテル石垣島', 'city_center', 24.3360, 124.1580, 'hotel', 245, 3, False, 'good', 'sightseeing'),
        ('川平湾グラスボート', 'kabira_bay', 24.4219, 124.1542, 'guesthouse', 30, 1, True, 'excellent', 'glass_boat,snorkeling'),
        ('白保ペンション', 'shiraho', 24.3065, 124.2158, 'pension', 20, 1, True, 'good', 'snorkeling,diving'),
        ('米原ビーチハウス', 'yonehara', 24.4542, 124.1628, 'guesthouse', 25, 1, True, 'good', 'snorkeling,beach'),
        ('石垣島ホテルククル', 'city_center', 24.3370, 124.1585, 'hotel', 80, 2, False, 'good', 'sightseeing'),
        ('ザ・ビーチタワー沖縄', 'north_coast', 24.4567, 124.1289, 'resort', 403, 2, True, 'excellent', 'sunset,beach')
    ]
    
    for hotel_data in hotels_data:
        cursor.execute("""
            INSERT OR IGNORE INTO ishigaki_hotels 
            (hotel_name, area, latitude, longitude, hotel_type, capacity, 
             pickup_difficulty_level, parking_availability, access_road_quality, popular_activities)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, hotel_data)
    
    # 主要活動地点データ
    activity_spots_data = [
        ('川平湾', 'glass_boat', 24.4219, 124.1542, 'kabira_bay', 1, 'any', 'sunny', 200, True, 50, '遊歩道完備', '通年'),
        ('白保海岸', 'snorkeling', 24.3065, 124.2158, 'shiraho', 2, 'high_tide', 'sunny', 100, True, 30, 'サンゴ礁注意', '4-10月'),
        ('米原ビーチ', 'snorkeling', 24.4542, 124.1628, 'yonehara', 2, 'mid_tide', 'sunny', 150, True, 40, 'クマノミスポット', '通年'),
        ('サンセットビーチ', 'sunset', 24.4567, 124.1289, 'north_coast', 1, 'any', 'clear', 80, False, 25, '夕日の名所', '通年'),
        ('フサキビーチ', 'beach', 24.3889, 124.1253, 'fusaki', 1, 'any', 'sunny', 200, True, 60, 'ホテル隣接', '通年'),
        ('玉取崎展望台', 'sightseeing', 24.4445, 124.2134, 'north_coast', 1, 'any', 'clear', 50, False, 20, '絶景スポット', '通年'),
        ('底地海岸', 'kayak', 24.4198, 124.1489, 'kabira_bay', 2, 'calm_sea', 'sunny', 80, True, 15, '遠浅のビーチ', '4-10月'),
        ('石垣島鍾乳洞', 'cave', 24.3842, 124.1678, 'other', 1, 'any', 'any', 300, False, 100, '雨天OK', '通年')
    ]
    
    for spot_data in activity_spots_data:
        cursor.execute("""
            INSERT OR IGNORE INTO ishigaki_activity_spots 
            (spot_name, activity_type, latitude, longitude, area, difficulty_level,
             best_tide_condition, best_weather_condition, capacity, equipment_rental, 
             parking_spaces, access_notes, seasonal_availability)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, spot_data)

def get_db_connection():
    """データベース接続を取得"""
    db_path = 'ishigaki_tour_data.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # 辞書形式でアクセス可能
    return conn

def save_pickup_record(record_data: Dict):
    """ピックアップ記録を保存"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO ishigaki_pickup_records 
        (tour_date, planned_time, actual_time, guest_name, hotel_name,
         delay_minutes, distance_km, weather, tide_level, vehicle_id,
         driver_name, activity_type, pickup_area, guest_satisfaction, special_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record_data['tour_date'],
        record_data['planned_time'],
        record_data['actual_time'],
        record_data['guest_name'],
        record_data['hotel_name'],
        record_data['delay_minutes'],
        record_data['distance_km'],
        record_data['weather'],
        record_data['tide_level'],
        record_data['vehicle_id'],
        record_data['driver_name'],
        record_data['activity_type'],
        record_data.get('pickup_area'),
        record_data.get('guest_satisfaction'),
        record_data.get('special_notes')
    ))
    
    conn.commit()
    conn.close()

def get_hotel_info(hotel_name: str) -> Optional[Dict]:
    """ホテル情報を取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM ishigaki_hotels 
        WHERE hotel_name LIKE ? OR hotel_name LIKE ?
    """, (f"%{hotel_name}%", f"{hotel_name}%"))
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return dict(result)
    return None

def get_activity_spot_info(spot_name: str) -> Optional[Dict]:
    """活動地点情報を取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM ishigaki_activity_spots 
        WHERE spot_name LIKE ?
    """, (f"%{spot_name}%",))
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return dict(result)
    return None

def get_environmental_data(date: str) -> Optional[Dict]:
    """環境データを取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM ishigaki_environmental_data 
        WHERE date = ?
    """, (date,))
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return dict(result)
    return None

def save_environmental_data(env_data: Dict):
    """環境データを保存"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT OR REPLACE INTO ishigaki_environmental_data 
        (date, weather_condition, temperature, wind_speed, wind_direction,
         current_tide_level, typhoon_risk, cruise_ship_arrivals, tourist_density_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        env_data['date'],
        env_data.get('weather_condition', 'sunny'),
        env_data.get('temperature', 26),
        env_data.get('wind_speed', 4),
        env_data.get('wind_direction', 'NE'),
        env_data.get('current_tide_level', 150),
        env_data.get('typhoon_risk', 0),
        env_data.get('cruise_ship_arrivals', 0),
        env_data.get('tourist_density_level', 1)
    ))
    
    conn.commit()
    conn.close()

def get_vehicle_performance(vehicle_id: str, start_date: str, end_date: str) -> List[Dict]:
    """車両パフォーマンスデータを取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM ishigaki_vehicle_performance 
        WHERE vehicle_id = ? AND date BETWEEN ? AND ?
        ORDER BY date DESC
    """, (vehicle_id, start_date, end_date))
    
    results = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in results]

def save_vehicle_performance(performance_data: Dict):
    """車両パフォーマンスを保存"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO ishigaki_vehicle_performance 
        (vehicle_id, vehicle_name, date, total_distance, total_time_minutes,
         fuel_consumption, driver_name, driver_rating, route_efficiency_score,
         guest_count, on_time_percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        performance_data['vehicle_id'],
        performance_data['vehicle_name'],
        performance_data['date'],
        performance_data['total_distance'],
        performance_data['total_time_minutes'],
        performance_data.get('fuel_consumption'),
        performance_data['driver_name'],
        performance_data.get('driver_rating'),
        performance_data.get('route_efficiency_score'),
        performance_data['guest_count'],
        performance_data.get('on_time_percentage')
    ))
    
    conn.commit()
    conn.close()

def get_traffic_pattern(date: str, hour: int) -> List[Dict]:
    """交通パターンデータを取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM ishigaki_traffic_patterns 
        WHERE date = ? AND hour = ?
    """, (date, hour))
    
    results = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in results]

def save_prediction_accuracy(prediction_data: Dict):
    """予測精度データを保存"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    accuracy_score = 1.0 - abs(prediction_data['predicted_delay'] - prediction_data['actual_delay']) / max(prediction_data['actual_delay'], 1)
    accuracy_score = max(0, min(1, accuracy_score))  # 0-1の範囲に正規化
    
    cursor.execute("""
        INSERT INTO ishigaki_prediction_accuracy 
        (prediction_date, actual_date, guest_name, predicted_delay, 
         actual_delay, accuracy_score, model_version, environmental_factors)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        prediction_data['prediction_date'],
        prediction_data['actual_date'],
        prediction_data['guest_name'],
        prediction_data['predicted_delay'],
        prediction_data['actual_delay'],
        accuracy_score,
        prediction_data.get('model_version', 'ishigaki_v1.0'),
        prediction_data.get('environmental_factors', '{}')
    ))
    
    conn.commit()
    conn.close()

def get_prediction_accuracy_stats(days: int = 30) -> Dict:
    """予測精度統計を取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            COUNT(*) as total_predictions,
            AVG(accuracy_score) as avg_accuracy,
            MIN(accuracy_score) as min_accuracy,
            MAX(accuracy_score) as max_accuracy,
            COUNT(CASE WHEN accuracy_score >= 0.8 THEN 1 END) as high_accuracy_count
        FROM ishigaki_prediction_accuracy 
        WHERE actual_date >= date('now', '-{} days')
    """.format(days))
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        stats = dict(result)
        stats['high_accuracy_percentage'] = (stats['high_accuracy_count'] / max(stats['total_predictions'], 1)) * 100
        return stats
    
    return {
        'total_predictions': 0,
        'avg_accuracy': 0,
        'min_accuracy': 0,
        'max_accuracy': 0,
        'high_accuracy_count': 0,
        'high_accuracy_percentage': 0
    }

def cleanup_old_data(days_to_keep: int = 365):
    """古いデータのクリーンアップ"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    tables_to_clean = [
        'ishigaki_pickup_records',
        'ishigaki_environmental_data',
        'ishigaki_vehicle_performance',
        'ishigaki_traffic_patterns',
        'ishigaki_prediction_accuracy'
    ]
    
    for table in tables_to_clean:
        cursor.execute(f"""
            DELETE FROM {table} 
            WHERE created_at < date('now', '-{days_to_keep} days')
        """)
    
    conn.commit()
    conn.close()
    
    print(f"🧹 {days_to_keep}日より古いデータをクリーンアップしました")

def backup_database(backup_path: str = None):
    """データベースのバックアップ"""
    if backup_path is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"backup/ishigaki_tour_data_{timestamp}.db"
    
    os.makedirs(os.path.dirname(backup_path) if os.path.dirname(backup_path) else 'backup', exist_ok=True)
    
    source_conn = get_db_connection()
    backup_conn = sqlite3.connect(backup_path)
    
    source_conn.backup(backup_conn)
    
    source_conn.close()
    backup_conn.close()
    
    print(f"💾 データベースをバックアップしました: {backup_path}")

if __name__ == "__main__":
    # テスト実行
    init_db()
    print("石垣島専用データベースの初期化が完了しました")