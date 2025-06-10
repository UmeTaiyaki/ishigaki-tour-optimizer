// utils/qrCodeUtils.js - 修正版QRコードユーティリティ

// ✅ 正しいQRコードライブラリのインポート
import QRCode from 'qrcode'; // npm install qrcode

// 🎯 QRコード生成関数（修正版）
export const generateQRCodeDataURL = async (data, options = {}) => {
  try {
    const qrOptions = {
      width: options.size || 200,
      margin: 2,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      ...options
    };
    
    const dataURL = await QRCode.toDataURL(data, qrOptions);
    return dataURL;
  } catch (error) {
    console.error('QRコード生成エラー:', error);
    // フォールバック: 外部API使用
    return generateQRCodeAPI(data, options.size || 200);
  }
};

// 🌐 外部API使用のフォールバック関数
export const generateQRCodeAPI = (data, size = 200) => {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
};

// 📱 追跡用QRコード生成
export const generateTrackingQR = async (vehicleId, tourDate) => {
  const trackingUrl = `${window.location.origin}/tracking/${vehicleId}/${tourDate}`;
  return await generateQRCodeDataURL(trackingUrl);
};

// 👥 ゲスト情報QRコード生成
export const generateGuestQR = async (guestName, tourDate, pickupTime) => {
  const guestData = {
    name: guestName,
    date: tourDate,
    pickup_time: pickupTime,
    info_url: `${window.location.origin}/guest/${guestName.replace(/\s+/g, '')}`
  };
  
  return await generateQRCodeDataURL(JSON.stringify(guestData));
};

// 📋 スケジュール全体QRコード生成
export const generateScheduleQR = async (tourDate) => {
  const scheduleUrl = `${window.location.origin}/schedule/${tourDate}`;
  return await generateQRCodeDataURL(scheduleUrl);
};

// 🔗 WhatsApp共有QRコード生成
export const generateWhatsAppQR = async (phoneNumber, message) => {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  return await generateQRCodeDataURL(whatsappUrl);
};

// 📊 QRコードダウンロード機能
export const downloadQRCode = async (data, filename = 'qrcode.png') => {
  try {
    const dataURL = await generateQRCodeDataURL(data);
    
    // Canvas経由でダウンロード
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    };
    
    img.src = dataURL;
  } catch (error) {
    console.error('QRコードダウンロードエラー:', error);
  }
};

export default {
  generateQRCodeDataURL,
  generateQRCodeAPI,
  generateTrackingQR,
  generateGuestQR,
  generateScheduleQR,
  generateWhatsAppQR,
  downloadQRCode
};