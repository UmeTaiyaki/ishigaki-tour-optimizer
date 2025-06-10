// utils/pdfUtils.js - 🖨️ PDF生成ユーティリティ完全版

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

// 📄 フォント設定（日本語対応）
const setupJapaneseFonts = (doc) => {
  // 日本語フォントの設定（実際の実装時はフォントファイルを追加）
  try {
    // doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
    // doc.setFont('NotoSansJP');
  } catch (error) {
    console.warn('日本語フォントの読み込みに失敗:', error);
    // フォールバック: 標準フォント
    doc.setFont('helvetica');
  }
};

// 🎨 共通スタイル定義
const PDF_STYLES = {
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    text: {
      primary: '#212121',
      secondary: '#757575'
    },
    background: {
      light: '#f5f5f5',
      white: '#ffffff'
    }
  },
  fonts: {
    title: { size: 20, weight: 'bold' },
    heading: { size: 16, weight: 'bold' },
    subheading: { size: 14, weight: 'bold' },
    body: { size: 11, weight: 'normal' },
    caption: { size: 9, weight: 'normal' }
  },
  spacing: {
    margin: 20,
    padding: 10,
    lineHeight: 6
  }
};

// 🎯 総合レポートPDF生成
export const generateComprehensivePDF = async (data) => {
  const { optimizedRoutes, tourData, guests, vehicles, environmentalData, warnings, recommendations } = data;
  
  const doc = new jsPDF('p', 'mm', 'a4');
  setupJapaneseFonts(doc);
  
  let yPos = PDF_STYLES.spacing.margin;
  
  // 🎨 ヘッダー部分
  await addPDFHeader(doc, tourData, yPos);
  yPos += 40;
  
  // 📊 サマリー情報
  yPos = await addSummarySection(doc, optimizedRoutes, guests, yPos);
  yPos += 15;
  
  // 🚨 警告・推奨事項
  if (warnings.length > 0 || recommendations.length > 0) {
    yPos = await addWarningsSection(doc, warnings, recommendations, yPos);
    yPos += 15;
  }
  
  // 🌦️ 環境情報
  if (environmentalData) {
    yPos = await addEnvironmentalSection(doc, environmentalData, yPos);
    yPos += 15;
  }
  
  // 🚗 車両別詳細スケジュール
  for (let i = 0; i < optimizedRoutes.length; i++) {
    if (yPos > 250) {
      doc.addPage();
      yPos = PDF_STYLES.spacing.margin;
    }
    yPos = await addVehicleSchedule(doc, optimizedRoutes[i], vehicles[i], i + 1, yPos);
    yPos += 20;
  }
  
  // 📱 QRコード追加
  if (yPos > 230) {
    doc.addPage();
    yPos = PDF_STYLES.spacing.margin;
  }
  await addQRCodeSection(doc, tourData, yPos);
  
  // 📝 フッター
  addPDFFooter(doc);
  
  return doc;
};

// 🚗 ドライバー用運行指示書PDF生成
export const generateDriverGuidePDF = async (data) => {
  const { optimizedRoutes, tourData, vehicles, environmentalData } = data;
  
  const doc = new jsPDF('p', 'mm', 'a4');
  setupJapaneseFonts(doc);
  
  for (let i = 0; i < optimizedRoutes.length; i++) {
    if (i > 0) doc.addPage();
    
    let yPos = PDF_STYLES.spacing.margin;
    const route = optimizedRoutes[i];
    const vehicle = vehicles[i];
    
    // 🎨 ドライバー専用ヘッダー
    doc.setFillColor(PDF_STYLES.colors.primary);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(PDF_STYLES.fonts.title.size);
    doc.text('🚗 ドライバー運行指示書', PDF_STYLES.spacing.margin, 20);
    
    doc.setFontSize(PDF_STYLES.fonts.body.size);
    doc.text(`車両: ${route.vehicle_name} | ドライバー: ${vehicle?.driver || 'ドライバー'}`, PDF_STYLES.spacing.margin, 30);
    
    yPos = 50;
    
    // 📋 基本情報
    doc.setTextColor(PDF_STYLES.colors.text.primary);
    doc.setFontSize(PDF_STYLES.fonts.heading.size);
    doc.text('📋 基本情報', PDF_STYLES.spacing.margin, yPos);
    yPos += 10;
    
    const basicInfo = [
      ['日付', tourData.date],
      ['アクティビティ', tourData.activityType],
      ['集合時間', tourData.startTime],
      ['総乗客数', `${route.route.reduce((sum, stop) => sum + stop.num_people, 0)}名 / ${vehicle?.capacity || 8}名`],
      ['総移動距離', `${route.total_distance.toFixed(1)}km`],
      ['効率スコア', `${route.efficiency_score}%`]
    ];
    
    doc.autoTable({
      startY: yPos,
      head: [['項目', '内容']],
      body: basicInfo,
      theme: 'grid',
      headStyles: { fillColor: PDF_STYLES.colors.primary },
      styles: { fontSize: PDF_STYLES.fonts.body.size },
      margin: { left: PDF_STYLES.spacing.margin }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // 🗺️ ピックアップスケジュール
    doc.setFontSize(PDF_STYLES.fonts.heading.size);
    doc.text('🗺️ ピックアップスケジュール', PDF_STYLES.spacing.margin, yPos);
    yPos += 10;
    
    const scheduleData = route.route.map((stop, index) => [
      index + 1,
      stop.pickup_time,
      stop.name,
      stop.hotel_name,
      `${stop.num_people}名`,
      stop.time_compliance === 'acceptable' ? '✓' : stop.time_compliance === 'early' ? '早' : '遅'
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['順番', 'ピックアップ時間', 'ゲスト名', 'ホテル名', '人数', '時間適合']],
      body: scheduleData,
      theme: 'striped',
      headStyles: { fillColor: PDF_STYLES.colors.secondary },
      styles: { fontSize: PDF_STYLES.fonts.body.size },
      margin: { left: PDF_STYLES.spacing.margin }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // 🌦️ 環境・注意事項
    if (environmentalData) {
      doc.setFontSize(PDF_STYLES.fonts.heading.size);
      doc.text('🌦️ 環境・注意事項', PDF_STYLES.spacing.margin, yPos);
      yPos += 10;
      
      doc.setFontSize(PDF_STYLES.fonts.body.size);
      doc.text(`天候: ${environmentalData.weather?.condition || 'sunny'} (${environmentalData.weather?.temperature || 26}°C)`, 
               PDF_STYLES.spacing.margin, yPos);
      yPos += 6;
      doc.text(`風速: ${environmentalData.weather?.wind_speed || 4.0}m/s`, 
               PDF_STYLES.spacing.margin, yPos);
      yPos += 6;
      doc.text(`潮位: ${environmentalData.tide?.current_level || 150}cm`, 
               PDF_STYLES.spacing.margin, yPos);
      yPos += 15;
    }
    
    // 📞 緊急連絡先
    doc.setFillColor(PDF_STYLES.colors.error);
    doc.rect(PDF_STYLES.spacing.margin, yPos, 170, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(PDF_STYLES.fonts.subheading.size);
    doc.text('📞 緊急連絡先', PDF_STYLES.spacing.margin + 5, yPos + 10);
    doc.setFontSize(PDF_STYLES.fonts.body.size);
    doc.text('会社: 090-XXXX-XXXX | 管理者: 090-YYYY-YYYY', PDF_STYLES.spacing.margin + 5, yPos + 20);
    
    // QRコード（小サイズ）
    try {
      const qrCodeData = await QRCode.toDataURL(`https://app.ishigaki-tour.com/tracking/${route.vehicle_id}`);
      doc.addImage(qrCodeData, 'PNG', 160, yPos - 30, 25, 25);
      
      doc.setTextColor(PDF_STYLES.colors.text.secondary);
      doc.setFontSize(PDF_STYLES.fonts.caption.size);
      doc.text('リアルタイム追跡', 165, yPos + 5);
    } catch (error) {
      console.error('QRコード生成エラー:', error);
    }
  }
  
  return doc;
};

// 👥 ゲスト用ピックアップ案内PDF生成
export const generateGuestInfoPDF = async (data) => {
  const { optimizedRoutes, tourData, guests, vehicles } = data;
  
  const doc = new jsPDF('p', 'mm', 'a4');
  setupJapaneseFonts(doc);
  
  for (let i = 0; i < guests.length; i++) {
    if (i > 0) doc.addPage();
    
    const guest = guests[i];
    let yPos = PDF_STYLES.spacing.margin;
    
    // 🎨 ゲスト専用ヘッダー
    doc.setFillColor(PDF_STYLES.colors.success);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(PDF_STYLES.fonts.title.size);
    doc.text('🏨 ピックアップ案内', PDF_STYLES.spacing.margin, 20);
    
    doc.setFontSize(PDF_STYLES.fonts.heading.size);
    doc.text(`${guest.name} 様`, PDF_STYLES.spacing.margin, 35);
    
    yPos = 55;
    
    // 📅 基本情報
    doc.setTextColor(PDF_STYLES.colors.text.primary);
    doc.setFontSize(PDF_STYLES.fonts.heading.size);
    doc.text('📅 ツアー情報', PDF_STYLES.spacing.margin, yPos);
    yPos += 15;
    
    const guestInfo = [
      ['日付', tourData.date],
      ['アクティビティ', tourData.activityType],
      ['ホテル', guest.hotel_name],
      ['参加人数', `${guest.people}名`],
      ['希望ピックアップ時間', `${guest.preferred_pickup_start} - ${guest.preferred_pickup_end}`]
    ];
    
    doc.autoTable({
      startY: yPos,
      body: guestInfo,
      theme: 'plain',
      styles: { 
        fontSize: PDF_STYLES.fonts.body.size,
        cellPadding: 8
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 120 }
      },
      margin: { left: PDF_STYLES.spacing.margin }
    });
    
    yPos = doc.lastAutoTable.finalY + 20;
    
    // 🚗 ピックアップ詳細
    const pickupInfo = findGuestPickupInfo(guest, optimizedRoutes, vehicles);
    if (pickupInfo) {
      doc.setFillColor(PDF_STYLES.colors.background.light);
      doc.rect(PDF_STYLES.spacing.margin, yPos, 170, 50, 'F');
      
      doc.setTextColor(PDF_STYLES.colors.text.primary);
      doc.setFontSize(PDF_STYLES.fonts.heading.size);
      doc.text('🚗 ピックアップ詳細', PDF_STYLES.spacing.margin + 5, yPos + 15);
      
      doc.setFontSize(PDF_STYLES.fonts.subheading.size);
      doc.text(`⏰ ピックアップ時間: ${pickupInfo.time}`, PDF_STYLES.spacing.margin + 5, yPos + 25);
      doc.text(`🚐 車両: ${pickupInfo.vehicle}`, PDF_STYLES.spacing.margin + 5, yPos + 35);
      doc.text(`👨‍💼 ドライバー: ${pickupInfo.driver}`, PDF_STYLES.spacing.margin + 5, yPos + 45);
      
      yPos += 65;
    }
    
    // 📍 集合場所情報
    doc.setFontSize(PDF_STYLES.fonts.heading.size);
    doc.text('📍 重要事項', PDF_STYLES.spacing.margin, yPos);
    yPos += 15;
    
    const importantInfo = [
      '• ピックアップ時間の5分前にはロビーでお待ちください',
      '• 当日の天候により時間が変更になる場合があります',
      '• 貴重品の管理はお客様の責任でお願いします',
      '• 酔い止め薬等、必要な方は事前にご準備ください',
      '• 緊急時は下記連絡先までご連絡ください'
    ];
    
    doc.setFontSize(PDF_STYLES.fonts.body.size);
    importantInfo.forEach(info => {
      doc.text(info, PDF_STYLES.spacing.margin, yPos);
      yPos += 8;
    });
    
    yPos += 10;
    
    // 📞 連絡先
    doc.setFillColor(PDF_STYLES.colors.warning);
    doc.rect(PDF_STYLES.spacing.margin, yPos, 170, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(PDF_STYLES.fonts.subheading.size);
    doc.text('📞 当日緊急連絡先: 090-XXXX-XXXX', PDF_STYLES.spacing.margin + 5, yPos + 12);
    
    yPos += 35;
    
    // 📱 QRコード（大サイズ）
    try {
      const qrData = JSON.stringify({
        guest_name: guest.name,
        tour_date: tourData.date,
        pickup_time: pickupInfo?.time,
        vehicle: pickupInfo?.vehicle,
        tracking_url: `https://app.ishigaki-tour.com/guest/${guest.name.replace(/\s+/g, '')}`
      });
      
      const qrCodeData = await QRCode.toDataURL(qrData);
      doc.addImage(qrCodeData, 'PNG', 70, yPos, 70, 70);
      
      doc.setTextColor(PDF_STYLES.colors.text.secondary);
      doc.setFontSize(PDF_STYLES.fonts.body.size);
      doc.text('📱 リアルタイム追跡・情報確認', 85, yPos + 80);
      doc.setFontSize(PDF_STYLES.fonts.caption.size);
      doc.text('QRコードをスマートフォンで読み取ってください', 70, yPos + 90);
    } catch (error) {
      console.error('QRコード生成エラー:', error);
    }
  }
  
  return doc;
};

// 📊 管理者用分析レポートPDF生成
export const generateManagementReportPDF = async (data) => {
  const { optimizedRoutes, tourData, guests, vehicles, environmentalData, warnings, recommendations } = data;
  
  const doc = new jsPDF('p', 'mm', 'a4');
  setupJapaneseFonts(doc);
  
  let yPos = PDF_STYLES.spacing.margin;
  
  // 🎨 管理者レポートヘッダー
  doc.setFillColor(PDF_STYLES.colors.secondary);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(PDF_STYLES.fonts.title.size);
  doc.text('📊 管理者分析レポート', PDF_STYLES.spacing.margin, 20);
  
  doc.setFontSize(PDF_STYLES.fonts.body.size);
  doc.text(`生成日時: ${new Date().toLocaleDateString('ja-JP')} ${new Date().toLocaleTimeString('ja-JP')}`, 
           PDF_STYLES.spacing.margin, 30);
  
  yPos = 50;
  
  // 📈 KPI ダッシュボード
  doc.setTextColor(PDF_STYLES.colors.text.primary);
  doc.setFontSize(PDF_STYLES.fonts.heading.size);
  doc.text('📈 主要指標 (KPI)', PDF_STYLES.spacing.margin, yPos);
  yPos += 15;
  
  const stats = calculateDetailedStatistics(optimizedRoutes, guests, vehicles);
  
  const kpiData = [
    ['総車両数', `${stats.totalVehicles}台`, stats.vehicleUtilization + '%'],
    ['総参加者数', `${stats.totalGuests}名`, '-'],
    ['総移動距離', `${stats.totalDistance}km`, stats.efficiencyRating],
    ['平均効率スコア', `${stats.averageEfficiency}%`, stats.efficiencyGrade],
    ['時間遵守率', `${stats.timeCompliance}%`, stats.complianceGrade],
    ['車両稼働率', `${stats.vehicleUtilization}%`, stats.utilizationGrade]
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [['指標', '値', '評価']],
    body: kpiData,
    theme: 'grid',
    headStyles: { fillColor: PDF_STYLES.colors.secondary },
    styles: { fontSize: PDF_STYLES.fonts.body.size },
    columnStyles: {
      2: { fontStyle: 'bold' }
    },
    margin: { left: PDF_STYLES.spacing.margin }
  });
  
  yPos = doc.lastAutoTable.finalY + 20;
  
  // 🚨 リスク分析
  if (warnings.length > 0) {
    doc.setFontSize(PDF_STYLES.fonts.heading.size);
    doc.text('🚨 リスク分析', PDF_STYLES.spacing.margin, yPos);
    yPos += 15;
    
    const riskData = warnings.map(warning => [
      warning.severity === 'error' ? '高' : warning.severity === 'warning' ? '中' : '低',
      warning.type,
      warning.message,
      warning.suggested_action || '要検討'
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['リスク', 'タイプ', '内容', '推奨アクション']],
      body: riskData,
      theme: 'striped',
      headStyles: { fillColor: PDF_STYLES.colors.error },
      styles: { fontSize: PDF_STYLES.fonts.caption.size },
      margin: { left: PDF_STYLES.spacing.margin }
    });
    
    yPos = doc.lastAutoTable.finalY + 20;
  }
  
  // 💡 改善提案
  if (recommendations.length > 0) {
    doc.setFontSize(PDF_STYLES.fonts.heading.size);
    doc.text('💡 改善提案', PDF_STYLES.spacing.margin, yPos);
    yPos += 15;
    
    const improvementData = recommendations.map(rec => [
      rec.type,
      rec.message,
      rec.suggestion || '要検討',
      rec.priority || '中'
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['カテゴリ', '内容', '提案', '優先度']],
      body: improvementData,
      theme: 'grid',
      headStyles: { fillColor: PDF_STYLES.colors.primary },
      styles: { fontSize: PDF_STYLES.fonts.caption.size },
      margin: { left: PDF_STYLES.spacing.margin }
    });
    
    yPos = doc.lastAutoTable.finalY + 20;
  }
  
  // 📊 車両別詳細分析
  if (yPos > 200) {
    doc.addPage();
    yPos = PDF_STYLES.spacing.margin;
  }
  
  doc.setFontSize(PDF_STYLES.fonts.heading.size);
  doc.text('📊 車両別詳細分析', PDF_STYLES.spacing.margin, yPos);
  yPos += 15;
  
  const vehicleAnalysis = optimizedRoutes.map((route, index) => {
    const vehicle = vehicles[index];
    const utilization = ((route.route.reduce((sum, stop) => sum + stop.num_people, 0) / vehicle?.capacity) * 100).toFixed(1);
    
    return [
      route.vehicle_name,
      vehicle?.driver || 'ドライバー',
      `${route.route.length}箇所`,
      `${route.total_distance.toFixed(1)}km`,
      `${route.efficiency_score}%`,
      `${utilization}%`
    ];
  });
  
  doc.autoTable({
    startY: yPos,
    head: [['車両名', 'ドライバー', 'ピックアップ数', '移動距離', '効率スコア', '稼働率']],
    body: vehicleAnalysis,
    theme: 'striped',
    headStyles: { fillColor: PDF_STYLES.colors.primary },
    styles: { fontSize: PDF_STYLES.fonts.body.size },
    margin: { left: PDF_STYLES.spacing.margin }
  });
  
  return doc;
};

// 🔧 ヘルパー関数群
const addPDFHeader = async (doc, tourData, yPos) => {
  // グラデーション風ヘッダー
  doc.setFillColor(PDF_STYLES.colors.primary);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(PDF_STYLES.fonts.title.size);
  doc.text('🌊 石垣島ツアー送迎スケジュール', PDF_STYLES.spacing.margin, 20);
  
  doc.setFontSize(PDF_STYLES.fonts.body.size);
  doc.text(`${tourData.date} | ${tourData.activityType} | 開始時間: ${tourData.startTime}`, 
           PDF_STYLES.spacing.margin, 30);
};

const addSummarySection = async (doc, optimizedRoutes, guests, yPos) => {
  doc.setTextColor(PDF_STYLES.colors.text.primary);
  doc.setFontSize(PDF_STYLES.fonts.heading.size);
  doc.text('📊 サマリー', PDF_STYLES.spacing.margin, yPos);
  yPos += 10;
  
  const summaryData = [
    ['総車両数', `${optimizedRoutes.length}台`],
    ['総参加者数', `${guests.reduce((sum, guest) => sum + guest.people, 0)}名`],
    ['総移動距離', `${optimizedRoutes.reduce((sum, route) => sum + route.total_distance, 0).toFixed(1)}km`],
    ['平均効率スコア', `${(optimizedRoutes.reduce((sum, route) => sum + route.efficiency_score, 0) / optimizedRoutes.length).toFixed(1)}%`],
    ['総ピックアップ箇所', `${optimizedRoutes.reduce((sum, route) => sum + route.route.length, 0)}箇所`]
  ];
  
  doc.autoTable({
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: { 
      fontSize: PDF_STYLES.fonts.body.size,
      cellPadding: 5
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 50, halign: 'right' }
    },
    margin: { left: PDF_STYLES.spacing.margin }
  });
  
  return doc.lastAutoTable.finalY;
};

const addWarningsSection = async (doc, warnings, recommendations, yPos) => {
  doc.setFontSize(PDF_STYLES.fonts.heading.size);
  doc.text('⚠️ 注意事項・推奨事項', PDF_STYLES.spacing.margin, yPos);
  yPos += 10;
  
  if (warnings.length > 0) {
    doc.setFontSize(PDF_STYLES.fonts.subheading.size);
    doc.setTextColor(PDF_STYLES.colors.error);
    doc.text('注意事項:', PDF_STYLES.spacing.margin, yPos);
    yPos += 8;
    
    doc.setFontSize(PDF_STYLES.fonts.body.size);
    doc.setTextColor(PDF_STYLES.colors.text.primary);
    warnings.slice(0, 5).forEach(warning => {
      doc.text(`• ${warning.message}`, PDF_STYLES.spacing.margin + 5, yPos);
      yPos += 6;
    });
    yPos += 5;
  }
  
  if (recommendations.length > 0) {
    doc.setFontSize(PDF_STYLES.fonts.subheading.size);
    doc.setTextColor(PDF_STYLES.colors.primary);
    doc.text('推奨事項:', PDF_STYLES.spacing.margin, yPos);
    yPos += 8;
    
    doc.setFontSize(PDF_STYLES.fonts.body.size);
    doc.setTextColor(PDF_STYLES.colors.text.primary);
    recommendations.slice(0, 5).forEach(rec => {
      doc.text(`• ${rec.message}`, PDF_STYLES.spacing.margin + 5, yPos);
      yPos += 6;
    });
  }
  
  return yPos;
};

const addEnvironmentalSection = async (doc, environmentalData, yPos) => {
  doc.setFontSize(PDF_STYLES.fonts.heading.size);
  doc.text('🌦️ 環境情報', PDF_STYLES.spacing.margin, yPos);
  yPos += 10;
  
  const envData = [
    ['天候', `${environmentalData.weather?.condition || 'sunny'} (${environmentalData.weather?.temperature || 26}°C)`],
    ['風速', `${environmentalData.weather?.wind_speed || 4.0}m/s`],
    ['潮位', `${environmentalData.tide?.current_level || 150}cm`],
    ['波高', `${environmentalData.sea?.wave_height || 0.5}m`],
    ['視界', environmentalData.sea?.visibility || 'good']
  ];
  
  doc.autoTable({
    startY: yPos,
    body: envData,
    theme: 'plain',
    styles: { 
      fontSize: PDF_STYLES.fonts.body.size,
      cellPadding: 3
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 80 }
    },
    margin: { left: PDF_STYLES.spacing.margin }
  });
  
  return doc.lastAutoTable.finalY;
};

const addVehicleSchedule = async (doc, route, vehicle, vehicleNumber, yPos) => {
  doc.setFontSize(PDF_STYLES.fonts.subheading.size);
  doc.text(`🚗 車両${vehicleNumber}: ${route.vehicle_name}`, PDF_STYLES.spacing.margin, yPos);
  yPos += 8;
  
  doc.setFontSize(PDF_STYLES.fonts.body.size);
  doc.text(`ドライバー: ${vehicle?.driver || 'ドライバー'} | 効率: ${route.efficiency_score}% | 距離: ${route.total_distance.toFixed(1)}km`, 
           PDF_STYLES.spacing.margin, yPos);
  yPos += 10;
  
  const scheduleData = route.route.map((stop, index) => [
    index + 1,
    stop.pickup_time,
    stop.name,
    stop.hotel_name,
    `${stop.num_people}名`,
    stop.time_compliance === 'acceptable' ? '✓' : stop.time_compliance === 'early' ? '早' : '遅'
  ]);
  
  doc.autoTable({
    startY: yPos,
    head: [['順', '時間', 'ゲスト', 'ホテル', '人数', '適合']],
    body: scheduleData,
    theme: 'striped',
    headStyles: { fillColor: PDF_STYLES.colors.primary },
    styles: { fontSize: PDF_STYLES.fonts.caption.size },
    margin: { left: PDF_STYLES.spacing.margin }
  });
  
  return doc.lastAutoTable.finalY;
};

const addQRCodeSection = async (doc, tourData, yPos) => {
  doc.setFontSize(PDF_STYLES.fonts.heading.size);
  doc.text('📱 デジタル連携', PDF_STYLES.spacing.margin, yPos);
  yPos += 15;
  
  try {
    const qrData = `https://app.ishigaki-tour.com/schedule/${tourData.date}`;
    const qrCodeData = await QRCode.toDataURL(qrData);
    
    doc.addImage(qrCodeData, 'PNG', PDF_STYLES.spacing.margin, yPos, 40, 40);
    
    doc.setFontSize(PDF_STYLES.fonts.body.size);
    doc.text('リアルタイム追跡・更新情報', PDF_STYLES.spacing.margin + 50, yPos + 15);
    doc.text('QRコードでアクセス', PDF_STYLES.spacing.margin + 50, yPos + 25);
    doc.setFontSize(PDF_STYLES.fonts.caption.size);
    doc.text(qrData, PDF_STYLES.spacing.margin + 50, yPos + 35);
  } catch (error) {
    console.error('QRコード生成エラー:', error);
    doc.text('QRコード生成中...', PDF_STYLES.spacing.margin, yPos);
  }
};

const addPDFFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    doc.setFontSize(PDF_STYLES.fonts.caption.size);
    doc.setTextColor(PDF_STYLES.colors.text.secondary);
    
    // ページ番号
    doc.text(`ページ ${i} / ${pageCount}`, 190, 285, { align: 'right' });
    
    // 生成情報
    doc.text(`生成: ${new Date().toLocaleString('ja-JP')}`, PDF_STYLES.spacing.margin, 285);
    
    // 会社情報
    doc.text('石垣島ツアー会社 | Tel: 0980-XX-XXXX', PDF_STYLES.spacing.margin, 290);
  }
};

// 📊 詳細統計計算関数
const calculateDetailedStatistics = (optimizedRoutes, guests, vehicles) => {
  const totalVehicles = optimizedRoutes.length;
  const totalGuests = guests.reduce((sum, guest) => sum + guest.people, 0);
  const totalDistance = optimizedRoutes.reduce((sum, route) => sum + route.total_distance, 0);
  const averageEfficiency = totalVehicles > 0 ? 
    optimizedRoutes.reduce((sum, route) => sum + route.efficiency_score, 0) / totalVehicles : 0;
  
  // 車両稼働率計算
  const totalCapacity = vehicles.reduce((sum, vehicle) => sum + (vehicle?.capacity || 8), 0);
  const vehicleUtilization = totalCapacity > 0 ? (totalGuests / totalCapacity * 100) : 0;
  
  // 時間遵守率計算
  let compliantStops = 0;
  let totalStops = 0;
  optimizedRoutes.forEach(route => {
    route.route.forEach(stop => {
      totalStops++;
      if (stop.time_compliance === 'acceptable') compliantStops++;
    });
  });
  const timeCompliance = totalStops > 0 ? (compliantStops / totalStops * 100) : 0;
  
  // グレード計算
  const getGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };
  
  return {
    totalVehicles,
    totalGuests,
    totalDistance: totalDistance.toFixed(1),
    averageEfficiency: averageEfficiency.toFixed(1),
    vehicleUtilization: vehicleUtilization.toFixed(1),
    timeCompliance: timeCompliance.toFixed(1),
    efficiencyGrade: getGrade(averageEfficiency),
    utilizationGrade: getGrade(vehicleUtilization),
    complianceGrade: getGrade(timeCompliance),
    efficiencyRating: averageEfficiency >= 80 ? '優秀' : averageEfficiency >= 60 ? '良好' : '要改善'
  };
};

// ゲストのピックアップ情報検索
const findGuestPickupInfo = (guest, optimizedRoutes, vehicles) => {
  for (const [index, route] of optimizedRoutes.entries()) {
    const stop = route.route.find(s => s.name === guest.name);
    if (stop) {
      return {
        time: stop.pickup_time,
        vehicle: route.vehicle_name,
        driver: vehicles[index]?.driver || 'ドライバー'
      };
    }
  }
  return null;
};

// 🎯 メイン生成関数
export const generatePDF = async (format, data) => {
  try {
    let doc;
    
    switch (format) {
      case 'comprehensive':
        doc = await generateComprehensivePDF(data);
        break;
      case 'driver_guide':
        doc = await generateDriverGuidePDF(data);
        break;
      case 'guest_info':
        doc = await generateGuestInfoPDF(data);
        break;
      case 'management_report':
        doc = await generateManagementReportPDF(data);
        break;
      default:
        doc = await generateComprehensivePDF(data);
    }
    
    const filename = `ishigaki_tour_${format}_${data.tourData.date}_${Date.now()}.pdf`;
    doc.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('PDF生成エラー:', error);
    return { success: false, error: error.message };
  }
};

export default {
  generatePDF,
  generateComprehensivePDF,
  generateDriverGuidePDF,
  generateGuestInfoPDF,
  generateManagementReportPDF
};