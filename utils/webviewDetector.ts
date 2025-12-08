// Detect if the app is running in a WebView (e.g., WeChat, Line, Facebook, etc.)
export const isWebView = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  
  // Common WebView indicators
  const webViewPatterns = [
    'micromessenger',      // WeChat
    'line',                // Line
    'fbav',                // Facebook App
    'fban',                // Facebook App
    'instagram',           // Instagram
    'twitter',             // Twitter App
    'snapchat',            // Snapchat
    'whatsapp',            // WhatsApp
    'telegram',            // Telegram
    'kakaotalk',           // KakaoTalk
    'wv',                  // Generic WebView
  ];
  
  // Check if any pattern matches
  const isInWebView = webViewPatterns.some(pattern => ua.includes(pattern));
  
  // Additional check for iOS WebView
  const isIOSWebView = /(iphone|ipod|ipad).*applewebkit(?!.*safari)/i.test(ua);
  
  // Additional check for Android WebView
  const isAndroidWebView = ua.includes('android') && ua.includes('wv');
  
  return isInWebView || isIOSWebView || isAndroidWebView;
};

// Get the specific WebView type for better messaging
export const getWebViewType = (): string | null => {
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes('micromessenger')) return 'WeChat';
  if (ua.includes('line')) return 'Line';
  if (ua.includes('fbav') || ua.includes('fban')) return 'Facebook';
  if (ua.includes('instagram')) return 'Instagram';
  if (ua.includes('twitter')) return 'Twitter';
  if (ua.includes('snapchat')) return 'Snapchat';
  if (ua.includes('whatsapp')) return 'WhatsApp';
  if (ua.includes('telegram')) return 'Telegram';
  if (ua.includes('kakaotalk')) return 'KakaoTalk';
  
  return null;
};

