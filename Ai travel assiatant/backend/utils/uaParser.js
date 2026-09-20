/**
 * Enhanced User-Agent Parser — detects device type, OS, browser, and device name.
 */
function parseUserAgent(userAgentString) {
  const ua = userAgentString || '';
  let device_type = 'desktop';
  let device_name = 'Desktop Computer';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  // ─── 1. Device Type Detection ───
  if (/ipad|tablet|playbook|silk/i.test(ua) && !/mobile/i.test(ua)) {
    device_type = 'tablet';
    device_name = 'Tablet';
  } else if (/mobile|android|iphone|ipod|phone|blackberry|opera mini|iemobile|webos|fennec/i.test(ua)) {
    device_type = 'mobile';
    device_name = 'Mobile Phone';
  }

  // ─── 2. OS Detection ───
  if (/windows nt 10/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/windows nt 6\.3/i.test(ua)) {
    os = 'Windows 8.1';
  } else if (/windows nt 6\.2/i.test(ua)) {
    os = 'Windows 8';
  } else if (/windows nt 6\.1/i.test(ua)) {
    os = 'Windows 7';
  } else if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/iphone/i.test(ua)) {
    os = 'iOS';
    device_name = 'iPhone';
    const match = ua.match(/iPhone OS (\d+)/);
    if (match) os = `iOS ${match[1]}`;
  } else if (/ipad/i.test(ua)) {
    os = 'iPadOS';
    device_name = 'iPad';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
    device_name = 'Mac';
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    if (match) os = `macOS ${match[1].replace('_', '.')}`;
  } else if (/android/i.test(ua)) {
    os = 'Android';
    const match = ua.match(/Android (\d+(\.\d+)?)/);
    if (match) os = `Android ${match[1]}`;
    // Try to extract device model
    const modelMatch = ua.match(/;\s*([^;)]+)\s*Build/i);
    if (modelMatch) {
      device_name = modelMatch[1].trim();
    } else {
      device_name = 'Android Device';
    }
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
    device_name = 'Linux PC';
  } else if (/crkey/i.test(ua)) {
    os = 'Chromecast';
    device_name = 'Chromecast';
  } else if (/cros/i.test(ua)) {
    os = 'Chrome OS';
    device_name = 'Chromebook';
  }

  // ─── 3. Browser Detection (order matters) ───
  if (/edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
    const match = ua.match(/Edg\/(\d+)/);
    if (match) browser = `Edge ${match[1]}`;
  } else if (/opr\//i.test(ua)) {
    browser = 'Opera';
    const match = ua.match(/OPR\/(\d+)/);
    if (match) browser = `Opera ${match[1]}`;
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
    const match = ua.match(/(?:Firefox|FxiOS)\/(\d+)/);
    if (match) browser = `Firefox ${match[1]}`;
  } else if (/crios/i.test(ua)) {
    browser = 'Chrome';
    const match = ua.match(/CriOS\/(\d+)/);
    if (match) browser = `Chrome ${match[1]}`;
  } else if (/chrome/i.test(ua) && !/edg/i.test(ua)) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    if (match) browser = `Chrome ${match[1]}`;
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    if (match) browser = `Safari ${match[1]}`;
  } else if (/msie|trident/i.test(ua)) {
    browser = 'Internet Explorer';
  } else if (/postman/i.test(ua)) {
    browser = 'Postman';
    device_name = 'API Client';
  } else if (/insomnia/i.test(ua)) {
    browser = 'Insomnia';
    device_name = 'API Client';
  } else if (/curl/i.test(ua)) {
    browser = 'cURL';
    device_name = 'CLI Client';
  }

  return { device_type, device_name, os, browser };
}

module.exports = { parseUserAgent };
