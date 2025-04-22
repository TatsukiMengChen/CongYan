/**
 * 打开一个 URL。
 * 如果用户代理（User Agent）表明是安卓上的 CongYan 应用，则尝试使用原生方法。
 * 否则，使用默认的浏览器行为。
 *
 * @param url 要打开的 URL。
 */
export function openLink(url: string): void {
  const userAgent = navigator.userAgent;
  const isCongYanApp = userAgent.includes('CongYan');
  const isAndroid = userAgent.toLowerCase().includes('android');

  if (isCongYanApp && isAndroid) {
    // 检查 Android 接口和方法是否存在
    if (typeof (window as any).Android?.openUrlInNewActivity === 'function') {
      try {
        // 调用原生 Android 函数
        (window as any).Android.openUrlInNewActivity(url);
      } catch (error) {
        console.error('调用 Android.openUrlInNewActivity 失败:', error);
        // 如果出错，则回退到标准的浏览器行为
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      console.warn('未找到 Android.openUrlInNewActivity 函数。使用默认浏览器行为。');
      // 如果原生函数不可用，则回退
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } else {
    // 对于非 CongYan 环境或非 Android 平台，使用默认的浏览器行为
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}