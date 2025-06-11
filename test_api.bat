@echo off
chcp 65001 >nul
echo 🧬 石垣島ツアー高度AI最適化テスト開始 (バッチ版)
echo ================================================

set API_BASE=http://localhost:8000

echo.
echo サーバーが起動していることを確認してください...
pause

echo.
echo 1. ヘルスチェック（高度版）
echo ------------------------
curl -s "%API_BASE%/health"
echo.

echo.
echo 2. 利用可能アルゴリズム確認
echo -------------------------
curl -s "%API_BASE%/api/ishigaki/algorithms"
echo.

echo.
echo 3. システム状態確認（高度版）
echo ---------------------------
curl -s "%API_BASE%/api/ishigaki/system/status"
echo.

echo.
echo 4. 最近傍法テスト
echo ----------------
curl -s -X POST "%API_BASE%/api/ishigaki/optimize" ^
  -H "Content-Type: application/json" ^
  -d "{\"date\": \"2025-06-11\",\"activity_type\": \"シュノーケリング\",\"start_time\": \"10:00\",\"algorithm\": \"nearest_neighbor\",\"guests\": [{\"name\": \"田中さん\",\"hotel_name\": \"ANAインターコンチネンタル石垣リゾート\",\"pickup_lat\": 24.3214,\"pickup_lng\": 124.1397,\"num_people\": 2,\"preferred_pickup_start\": \"09:00\",\"preferred_pickup_end\": \"09:30\"},{\"name\": \"佐藤さん\",\"hotel_name\": \"フサキビーチリゾート\",\"pickup_lat\": 24.3431,\"pickup_lng\": 124.1142,\"num_people\": 3,\"preferred_pickup_start\": \"09:15\",\"preferred_pickup_end\": \"09:45\"}],\"vehicles\": [{\"name\": \"車両1\",\"capacity\": 8,\"driver\": \"山田ドライバー\",\"location\": {\"lat\": 24.3336, \"lng\": 124.1543}}]}"
echo.

echo.
echo 5. シミュレーテッドアニーリングテスト
echo ----------------------------------
curl -s -X POST "%API_BASE%/api/ishigaki/optimize" ^
  -H "Content-Type: application/json" ^
  -d "{\"date\": \"2025-06-11\",\"activity_type\": \"シュノーケリング\",\"start_time\": \"10:00\",\"algorithm\": \"simulated_annealing\",\"guests\": [{\"name\": \"田中さん\",\"hotel_name\": \"ANAインターコンチネンタル石垣リゾート\",\"pickup_lat\": 24.3214,\"pickup_lng\": 124.1397,\"num_people\": 2,\"preferred_pickup_start\": \"09:00\",\"preferred_pickup_end\": \"09:30\"},{\"name\": \"佐藤さん\",\"hotel_name\": \"フサキビーチリゾート\",\"pickup_lat\": 24.3431,\"pickup_lng\": 124.1142,\"num_people\": 3,\"preferred_pickup_start\": \"09:15\",\"preferred_pickup_end\": \"09:45\"}],\"vehicles\": [{\"name\": \"車両1\",\"capacity\": 8,\"driver\": \"山田ドライバー\",\"location\": {\"lat\": 24.3336, \"lng\": 124.1543}}]}"
echo.

echo.
echo ⏳ 少し待ってから遺伝的アルゴリズムテストを実行します...
timeout /t 3 /nobreak >nul

echo.
echo 6. 遺伝的アルゴリズムテスト
echo -------------------------
curl -s -X POST "%API_BASE%/api/ishigaki/optimize" ^
  -H "Content-Type: application/json" ^
  -d "{\"date\": \"2025-06-11\",\"activity_type\": \"シュノーケリング\",\"start_time\": \"10:00\",\"algorithm\": \"genetic\",\"guests\": [{\"name\": \"田中さん\",\"hotel_name\": \"ANAインターコンチネンタル石垣リゾート\",\"pickup_lat\": 24.3214,\"pickup_lng\": 124.1397,\"num_people\": 2,\"preferred_pickup_start\": \"09:00\",\"preferred_pickup_end\": \"09:30\"},{\"name\": \"佐藤さん\",\"hotel_name\": \"フサキビーチリゾート\",\"pickup_lat\": 24.3431,\"pickup_lng\": 124.1142,\"num_people\": 3,\"preferred_pickup_start\": \"09:15\",\"preferred_pickup_end\": \"09:45\"}],\"vehicles\": [{\"name\": \"車両1\",\"capacity\": 8,\"driver\": \"山田ドライバー\",\"location\": {\"lat\": 24.3336, \"lng\": 124.1543}}]}"
echo.

echo.
echo 7. アルゴリズム比較テスト
echo -----------------------
curl -s -X POST "%API_BASE%/api/ishigaki/compare" ^
  -H "Content-Type: application/json" ^
  -d "{\"date\": \"2025-06-11\",\"activity_type\": \"シュノーケリング\",\"start_time\": \"10:00\",\"guests\": [{\"name\": \"田中さん\",\"hotel_name\": \"ANAインターコンチネンタル石垣リゾート\",\"pickup_lat\": 24.3214,\"pickup_lng\": 124.1397,\"num_people\": 2,\"preferred_pickup_start\": \"09:00\",\"preferred_pickup_end\": \"09:30\"},{\"name\": \"佐藤さん\",\"hotel_name\": \"フサキビーチリゾート\",\"pickup_lat\": 24.3431,\"pickup_lng\": 124.1142,\"num_people\": 3,\"preferred_pickup_start\": \"09:15\",\"preferred_pickup_end\": \"09:45\"}],\"vehicles\": [{\"name\": \"車両1\",\"capacity\": 8,\"driver\": \"山田ドライバー\",\"location\": {\"lat\": 24.3336, \"lng\": 124.1543}}]}"
echo.

echo.
echo 8. 統計データ確認
echo ----------------
curl -s "%API_BASE%/api/ishigaki/statistics"
echo.

echo.
echo 9. 最適化ログ確認
echo ----------------
curl -s "%API_BASE%/api/ishigaki/optimization/logs?limit=3"
echo.

echo.
echo ✅ 高度AI機能テスト完了
echo ======================

echo.
echo 📊 期待される結果:
echo - 遺伝的アルゴリズムが最も高い効率スコア
echo - 処理時間: 最近傍法 ^< シミュレーテッドアニーリング ^< 遺伝的アルゴリズム
echo - optimizer_available: true
echo - ai_algorithms: genetic, simulated_annealing, nearest_neighbor
echo.

pause