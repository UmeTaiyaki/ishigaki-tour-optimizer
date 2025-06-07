import sqlite3
import os
from datetime import datetime

def get_db_connection():
    """データベース接続を取得"""
    conn = sqlite3.connect('tour_data.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """データベースの初期化"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # テーブルの作成
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        activity_lat REAL,
        activity_lng REAL,
        planned_start_time TEXT,
        actual_start_time TEXT,
        status TEXT DEFAULT 'planned',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS guests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tour_id INTEGER REFERENCES tours(id),
        name TEXT NOT NULL,
        hotel_name TEXT,
        pickup_lat REAL,
        pickup_lng REAL,
        num_people INTEGER NOT NULL,
        preferred_pickup_start TEXT,
        preferred_pickup_end TEXT,
        planned_pickup_time TEXT,
        actual_pickup_time TEXT,
        satisfaction_score INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pickup_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tour_date TEXT NOT NULL,
        planned_time TEXT,
        actual_time TEXT,
        guest_name TEXT,
        delay_minutes INTEGER,
        distance_km REAL,
        weather TEXT,
        tide_level REAL,
        wind_speed REAL,
        temperature REAL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS environmental_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        hour INTEGER NOT NULL,
        tide_level REAL,
        tide_state TEXT,
        weather_condition TEXT,
        temperature REAL,
        wind_speed REAL,
        wind_direction TEXT,
        precipitation REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, hour)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS optimization_parameters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parameter_type TEXT NOT NULL,
        activity_type TEXT,
        conditions TEXT,
        value REAL,
        confidence_score REAL,
        sample_size INTEGER,
        valid_from TEXT,
        valid_until TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # インデックスの作成
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tours_date ON tours(date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_date ON pickup_records(tour_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_environmental_date ON environmental_data(date)")
    
    conn.commit()
    
    # サンプルデータの挿入（初回のみ）
    cursor.execute("SELECT COUNT(*) FROM pickup_records")
    if cursor.fetchone()[0] == 0:
        insert_sample_data(conn)
    
    conn.close()
    print("データベース初期化完了")

def insert_sample_data(conn):
    """サンプルデータの挿入"""
    cursor = conn.cursor()
    
    # サンプルの実績データ
    sample_records = [
        ('2024-01-15', '2024-01-15 07:30:00', '2024-01-15 07:35:00', '田中様', 5, 15.2, 'sunny', 160, 3.5, 25),
        ('2024-01-15', '2024-01-15 08:15:00', '2024-01-15 08:18:00', '山田様', 3, 12.8, 'sunny', 165, 3.5, 25),
        ('2024-01-16', '2024-01-16 07:45:00', '2024-01-16 07:50:00', '佐藤様', 5, 18.5, 'cloudy', 140, 5.2, 23),
        ('2024-01-17', '2024-01-17 08:00:00', '2024-01-17 08:12:00', '鈴木様', 12, 20.1, 'rainy', 130, 8.5, 22),
        ('2024-01-18', '2024-01-18 07:30:00', '2024-01-18 07:32:00', '高橋様', 2, 10.5, 'sunny', 170, 2.1, 26),
    ]
    
    for record in sample_records:
        cursor.execute("""
            INSERT INTO pickup_records 
            (tour_date, planned_time, actual_time, guest_name, delay_minutes, 
             distance_km, weather, tide_level, wind_speed, temperature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, record)
    
    conn.commit()
    print("サンプルデータを挿入しました")