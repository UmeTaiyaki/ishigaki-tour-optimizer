# PowerShell 複雑問題AI最適化テストスクリプト（修正版）
# Phase 4A: 真のAI性能を証明する

# エラー対応: エンコーディング設定を安全化
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
} catch {
    # エンコーディング設定に失敗した場合は続行
}

Write-Host "🧬 Phase 4A: 複雑問題AI最適化テスト" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Yellow

$API_BASE = "http://localhost:8000"

function Test-Algorithm {
    param(
        [string]$AlgorithmName,
        [hashtable]$TestData,
        [string]$TestCaseName
    )
    
    Write-Host ""
    Write-Host "🔄 $AlgorithmName テスト中..." -ForegroundColor Cyan
    Write-Host "テストケース: $TestCaseName" -ForegroundColor Gray
    
    $testData = $TestData.Clone()
    $testData.algorithm = $AlgorithmName
    
    try {
        $startTime = Get-Date
        
        $jsonBody = $testData | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Uri "$API_BASE/api/ishigaki/optimize" -Method POST -Body $jsonBody -ContentType "application/json"
        
        $endTime = Get-Date
        $actualTime = ($endTime - $startTime).TotalSeconds
        
        if ($response.success) {
            Write-Host "✅ $AlgorithmName 完了" -ForegroundColor Green
            Write-Host "   効率スコア: $($response.efficiency_score)%" -ForegroundColor Yellow
            Write-Host "   総距離: $($response.total_distance)km" -ForegroundColor Yellow  
            Write-Host "   最適化時間: $($response.optimization_time)秒" -ForegroundColor Yellow
            Write-Host "   実測時間: $($actualTime.ToString('F2'))秒" -ForegroundColor Gray
            
            # 安全なオブジェクト作成
            $result = New-Object PSObject -Property @{
                success = $true
                algorithm = $AlgorithmName
                efficiency = $response.efficiency_score
                distance = $response.total_distance
                optimization_time = $response.optimization_time
                actual_time = $actualTime
                routes_count = $response.routes.Count
                total_guests = 0
            }
            
            # ゲスト数計算（安全版）
            if ($response.routes) {
                $guestCount = 0
                foreach ($route in $response.routes) {
                    if ($route.passenger_count) {
                        $guestCount += $route.passenger_count
                    }
                }
                $result.total_guests = $guestCount
            }
            
            return $result
        } else {
            Write-Host "❌ $AlgorithmName 失敗" -ForegroundColor Red
            return New-Object PSObject -Property @{ success = $false; algorithm = $AlgorithmName }
        }
        
    } catch {
        Write-Host "❌ $AlgorithmName エラー: $($_.Exception.Message)" -ForegroundColor Red
        return New-Object PSObject -Property @{ success = $false; algorithm = $AlgorithmName; error = $_.Exception.Message }
    }
}

function Show-ComparisonTable {
    param([array]$Results, [string]$TestCaseName)
    
    Write-Host ""
    Write-Host "📊 $TestCaseName - アルゴリズム比較結果" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Green
    
    $table = @()
    foreach ($result in $Results) {
        if ($result.success) {
            $displayName = switch ($result.algorithm) {
                "nearest_neighbor" { "最近傍法" }
                "simulated_annealing" { "シミュレーテッドアニーリング" }
                "genetic" { "遺伝的アルゴリズム" }
            }
            
            $tableRow = New-Object PSObject -Property @{
                "アルゴリズム" = $displayName
                "効率スコア" = "$($result.efficiency)%"
                "総距離" = "$($result.distance)km"
                "最適化時間" = "$($result.optimization_time)秒"
                "実測時間" = "$($result.actual_time.ToString('F2'))秒"
                "担当ゲスト" = "$($result.total_guests)名"
                "車両数" = "$($result.routes_count)台"
            }
            
            $table += $tableRow
        }
    }
    
    if ($table.Count -gt 0) {
        $table | Format-Table -AutoSize
        
        # 最優秀アルゴリズム特定（安全版）
        $successResults = $Results | Where-Object { $_.success -eq $true }
        
        if ($successResults.Count -gt 0) {
            $bestResult = $successResults | Sort-Object -Property efficiency -Descending | Select-Object -First 1
            
            if ($bestResult) {
                $bestDisplayName = switch ($bestResult.algorithm) {
                    "nearest_neighbor" { "最近傍法" }
                    "simulated_annealing" { "シミュレーテッドアニーリング" }
                    "genetic" { "遺伝的アルゴリズム" }
                }
                Write-Host "🏆 最優秀: $bestDisplayName ($($bestResult.efficiency)%)" -ForegroundColor Green
                
                # 性能差分析
                $worstResult = $successResults | Sort-Object -Property efficiency | Select-Object -First 1
                if ($worstResult) {
                    $performanceGap = $bestResult.efficiency - $worstResult.efficiency
                    
                    Write-Host "📈 最大性能差: $($performanceGap.ToString('F1'))%" -ForegroundColor Yellow
                    
                    if ($performanceGap -gt 10) {
                        Write-Host "🎯 明確な性能差を確認！AIの威力が証明されました" -ForegroundColor Green
                    } elseif ($performanceGap -gt 5) {
                        Write-Host "⚡ 有意な性能差を確認" -ForegroundColor Yellow
                    } else {
                        Write-Host "📝 小さな性能差（さらに複雑な問題が必要かも）" -ForegroundColor Gray
                    }
                }
            }
        }
    }
}

function Test-ComplexCase {
    param(
        [string]$CaseName,
        [hashtable]$TestData
    )
    
    Write-Host ""
    Write-Host "🧪 $CaseName" -ForegroundColor Magenta
    Write-Host ("-" * $CaseName.Length) -ForegroundColor Magenta
    
    $algorithms = @("nearest_neighbor", "simulated_annealing", "genetic")
    $results = @()
    
    foreach ($algorithm in $algorithms) {
        $result = Test-Algorithm -AlgorithmName $algorithm -TestData $TestData -TestCaseName $CaseName
        $results += $result
        Start-Sleep -Seconds 1
    }
    
    Show-ComparisonTable -Results $results -TestCaseName $CaseName
    
    return $results
}

# メイン実行
Write-Host "サーバーが起動していることを確認してください..." -ForegroundColor Yellow
Read-Host "Enterキーを押してPhase 4Aテストを開始"

# システム状態確認
Write-Host ""
Write-Host "🔧 システム状態確認" -ForegroundColor Cyan
try {
    $status = Invoke-RestMethod -Uri "$API_BASE/api/ishigaki/system/status" -Method GET
    if ($status.system_status.optimizer_available) {
        Write-Host "✅ AI最適化エンジン: 稼働中" -ForegroundColor Green
        Write-Host "📋 利用可能アルゴリズム: $($status.system_status.ai_algorithms -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "❌ AI最適化エンジン: 利用不可" -ForegroundColor Red
        Read-Host "エラー: システムを確認してください"
        exit
    }
} catch {
    Write-Host "❌ サーバー接続エラー: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "エラー: サーバーが起動していることを確認してください"
    exit
}

# 複雑問題テストケース1: 6ゲスト・3車両（調整版）
$complexCase1 = @{
    date = "2025-06-11"
    activity_type = "川平湾シュノーケリング"
    start_time = "10:00"
    activity_location = @{
        lat = 24.4167
        lng = 124.1556
        name = "川平湾"
    }
    guests = @(
        @{
            name = "田中ファミリー"
            hotel_name = "ANAインターコンチネンタル石垣リゾート"
            pickup_lat = 24.3214
            pickup_lng = 124.1397
            num_people = 4
            preferred_pickup_start = "08:30"
            preferred_pickup_end = "09:00"
        },
        @{
            name = "佐藤カップル"
            hotel_name = "フサキビーチリゾート"
            pickup_lat = 24.3431
            pickup_lng = 124.1142
            num_people = 2
            preferred_pickup_start = "08:45"
            preferred_pickup_end = "09:15"
        },
        @{
            name = "鈴木グループ"
            hotel_name = "グランヴィリオリゾート石垣島"
            pickup_lat = 24.3394
            pickup_lng = 124.1547
            num_people = 6
            preferred_pickup_start = "08:15"
            preferred_pickup_end = "08:45"
        },
        @{
            name = "高橋さん"
            hotel_name = "アートホテル石垣島"
            pickup_lat = 24.3333
            pickup_lng = 124.1567
            num_people = 1
            preferred_pickup_start = "09:00"
            preferred_pickup_end = "09:30"
        },
        @{
            name = "伊藤ファミリー"
            hotel_name = "石垣島ビーチホテルサンシャイン"
            pickup_lat = 24.3467
            pickup_lng = 124.1533
            num_people = 3
            preferred_pickup_start = "08:30"
            preferred_pickup_end = "09:00"
        },
        @{
            name = "渡辺カップル"
            hotel_name = "ホテル日航八重山"
            pickup_lat = 24.3394
            pickup_lng = 124.1556
            num_people = 2
            preferred_pickup_start = "08:45"
            preferred_pickup_end = "09:15"
        }
    )
    vehicles = @(
        @{
            name = "大型バン1号"
            capacity = 10
            driver = "ベテラン山田ドライバー"
            location = @{
                lat = 24.3336
                lng = 124.1543
            }
        },
        @{
            name = "中型バン2号"
            capacity = 8
            driver = "地元佐藤ドライバー"
            location = @{
                lat = 24.3400
                lng = 124.1520
            }
        },
        @{
            name = "小型バン3号"
            capacity = 6
            driver = "新人田中ドライバー"
            location = @{
                lat = 24.3360
                lng = 124.1580
            }
        }
    )
}

# 複雑問題テストケース2: 4ゲスト・2車両（調整版）
$complexCase2 = @{
    date = "2025-06-11"
    activity_type = "玉取崎展望台ツアー"
    start_time = "09:30"
    activity_location = @{
        lat = 24.4556
        lng = 124.2167
        name = "玉取崎展望台"
    }
    guests = @(
        @{
            name = "松本ファミリー"
            hotel_name = "ANAインターコンチネンタル石垣リゾート"
            pickup_lat = 24.3214
            pickup_lng = 124.1397
            num_people = 4
            preferred_pickup_start = "08:00"
            preferred_pickup_end = "08:30"
        },
        @{
            name = "岡田カップル"
            hotel_name = "アートホテル石垣島"
            pickup_lat = 24.3333
            pickup_lng = 124.1567
            num_people = 2
            preferred_pickup_start = "08:15"
            preferred_pickup_end = "08:45"
        },
        @{
            name = "森グループ"
            hotel_name = "フサキビーチリゾート"
            pickup_lat = 24.3431
            pickup_lng = 124.1142
            num_people = 3
            preferred_pickup_start = "08:30"
            preferred_pickup_end = "09:00"
        },
        @{
            name = "池田さん"
            hotel_name = "ホテル日航八重山"
            pickup_lat = 24.3394
            pickup_lng = 124.1556
            num_people = 1
            preferred_pickup_start = "08:45"
            preferred_pickup_end = "09:15"
        }
    )
    vehicles = @(
        @{
            name = "中型バンA"
            capacity = 8
            driver = "経験者Aドライバー"
            location = @{
                lat = 24.3350
                lng = 124.1550
            }
        },
        @{
            name = "中型バンB"
            capacity = 6
            driver = "経験者Bドライバー"
            location = @{
                lat = 24.3380
                lng = 124.1540
            }
        }
    )
}

# テスト実行
$allResults = @()

Write-Host ""
Write-Host "🎯 Phase 4A: 複雑問題テスト実行開始" -ForegroundColor Green
Write-Host "期待結果: 遺伝的アルゴリズムが最高性能を発揮" -ForegroundColor Yellow

# テストケース1実行
$results1 = Test-ComplexCase -CaseName "ケース1: 川平湾ツアー（6ゲスト・3車両）" -TestData $complexCase1
$allResults += $results1

Write-Host ""
Write-Host "⏳ 次のテストケースまで少し待機..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# テストケース2実行  
$results2 = Test-ComplexCase -CaseName "ケース2: 玉取崎ツアー（4ゲスト・2車両）" -TestData $complexCase2
$allResults += $results2

# 総合分析
Write-Host ""
Write-Host "🎯 Phase 4A 総合分析" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green

$successResults = $allResults | Where-Object { $_.success -eq $true }

if ($successResults.Count -gt 0) {
    # アルゴリズム別平均性能（安全版）
    $algorithmGroups = $successResults | Group-Object algorithm
    
    Write-Host "📊 アルゴリズム別平均性能:" -ForegroundColor Cyan
    
    foreach ($group in $algorithmGroups) {
        $avgEfficiency = ($group.Group | Measure-Object efficiency -Average).Average
        $avgDistance = ($group.Group | Measure-Object distance -Average).Average
        $avgTime = ($group.Group | Measure-Object optimization_time -Average).Average
        
        $displayName = switch ($group.Name) {
            "nearest_neighbor" { "最近傍法" }
            "simulated_annealing" { "シミュレーテッドアニーリング" }
            "genetic" { "遺伝的アルゴリズム" }
        }
        
        Write-Host "- $displayName : 効率 $($avgEfficiency.ToString('F1'))%, 距離 $($avgDistance.ToString('F1'))km, 時間 $($avgTime.ToString('F2'))秒" -ForegroundColor Yellow
    }
    
    # Phase 4A成功判定
    $geneticResults = $successResults | Where-Object { $_.algorithm -eq "genetic" }
    $nearestResults = $successResults | Where-Object { $_.algorithm -eq "nearest_neighbor" }
    
    if ($geneticResults -and $nearestResults) {
        $geneticAvg = ($geneticResults | Measure-Object efficiency -Average).Average
        $nearestAvg = ($nearestResults | Measure-Object efficiency -Average).Average
        $performanceGain = $geneticAvg - $nearestAvg
        
        Write-Host ""
        Write-Host "🏆 Phase 4A 成果サマリー:" -ForegroundColor Green
        Write-Host "- 遺伝的アルゴリズム平均効率: $($geneticAvg.ToString('F1'))%" -ForegroundColor Yellow
        Write-Host "- 最近傍法平均効率: $($nearestAvg.ToString('F1'))%" -ForegroundColor Yellow
        Write-Host "- AI最適化による改善: +$($performanceGain.ToString('F1'))%" -ForegroundColor Green
        
        if ($performanceGain -gt 10) {
            Write-Host ""
            Write-Host "🎉 Phase 4A 大成功！" -ForegroundColor Green
            Write-Host "AIアルゴリズムの優位性が明確に証明されました！" -ForegroundColor Green
        } elseif ($performanceGain -gt 5) {
            Write-Host ""
            Write-Host "✅ Phase 4A 成功！" -ForegroundColor Green
            Write-Host "AIアルゴリズムの効果が確認されました" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "📝 Phase 4A 完了" -ForegroundColor Yellow
            Write-Host "さらに複雑な問題での検証が推奨されます" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "❌ 有効な結果が得られませんでした" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Phase 4A テスト完了" -ForegroundColor Green
Write-Host "次のステップ: フロントエンド統合、実用機能拡張、パフォーマンス分析" -ForegroundColor Yellow

Read-Host "Enterキーを押して終了"