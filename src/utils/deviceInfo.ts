export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
}

export const getDeviceInfo = (): DeviceInfo => {
  const ua = navigator.userAgent;

  const getBrowser = (): { name: string; version: string } => {
    if (ua.includes('Firefox/')) {
      const version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
      return { name: 'Firefox', version };
    }
    if (ua.includes('Edg/')) {
      const version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || '';
      return { name: 'Edge', version };
    }
    if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
      const version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
      return { name: 'Chrome', version };
    }
    if (ua.includes('Safari/') && !ua.includes('Chrome')) {
      const version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || '';
      return { name: 'Safari', version };
    }
    if (ua.includes('Opera/') || ua.includes('OPR/')) {
      const version = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || '';
      return { name: 'Opera', version };
    }
    return { name: 'Unknown', version: '' };
  };

  const getOS = (): string => {
    if (ua.includes('Windows NT')) return 'Windows';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
  };

  const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  };

  const browser = getBrowser();

  return {
    browser: browser.name,
    browserVersion: browser.version,
    os: getOS(),
    deviceType: getDeviceType(),
    userAgent: ua
  };
};
