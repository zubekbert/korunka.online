(() => {
  'use strict';

  const TIME_ZONE = 'Europe/Prague';
  const LIGHT_START_MINUTES = 8 * 60;
  const LIGHT_END_MINUTES = 17 * 60; // 17:00 včetně, tmavý režim od 17:01
  const REQUEST_TIMEOUT_MS = 4500;
  const RESYNC_INTERVAL_MS = 10 * 60 * 1000;
  const THEME_CHECK_INTERVAL_MS = 15 * 1000;

  const sources = [
    {
      name: 'TimeAPI.io',
      url: 'https://timeapi.io/api/time/current/zone?timeZone=Europe%2FPrague',
      parse(data) {
        const values = [data.year, data.month, data.day, data.hour, data.minute];
        if (!values.every(Number.isFinite)) return null;
        return {
          type: 'prague-pseudo',
          value: Date.UTC(
            data.year,
            data.month - 1,
            data.day,
            data.hour,
            data.minute,
            Number(data.seconds || 0),
            Number(data.milliSeconds || data.milliseconds || 0)
          )
        };
      }
    },
    {
      name: 'WorldTimeAPI',
      url: 'https://worldtimeapi.org/api/timezone/Europe/Prague',
      parse(data) {
        if (Number.isFinite(data.unixtime)) {
          return { type: 'epoch', value: data.unixtime * 1000 };
        }
        if (typeof data.datetime === 'string') {
          const parsed = Date.parse(data.datetime);
          if (Number.isFinite(parsed)) return { type: 'epoch', value: parsed };
        }
        return null;
      }
    }
  ];

  const metaTheme = document.getElementById('themeColorMeta');
  let anchor = null;
  let currentTheme = null;
  let currentSource = 'zařízení';

  const formatter = new Intl.DateTimeFormat('cs-CZ', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  function formattedParts(date) {
    const values = {};
    for (const part of formatter.formatToParts(date)) {
      if (part.type !== 'literal') values[part.type] = Number(part.value);
    }
    return {
      year: values.year,
      month: values.month,
      day: values.day,
      hour: values.hour === 24 ? 0 : values.hour,
      minute: values.minute,
      second: values.second
    };
  }

  function currentPragueParts() {
    if (!anchor) return formattedParts(new Date());

    const elapsed = performance.now() - anchor.performanceAt;
    if (anchor.type === 'epoch') {
      return formattedParts(new Date(anchor.value + elapsed));
    }

    const pseudo = new Date(anchor.value + elapsed);
    return {
      year: pseudo.getUTCFullYear(),
      month: pseudo.getUTCMonth() + 1,
      day: pseudo.getUTCDate(),
      hour: pseudo.getUTCHours(),
      minute: pseudo.getUTCMinutes(),
      second: pseudo.getUTCSeconds()
    };
  }

  function themeFor(parts) {
    const minutes = parts.hour * 60 + parts.minute;
    return minutes >= LIGHT_START_MINUTES && minutes <= LIGHT_END_MINUTES ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    if (theme === currentTheme) return;
    const previous = currentTheme;
    currentTheme = theme;
    document.documentElement.dataset.theme = theme;
    if (metaTheme) metaTheme.content = theme === 'light' ? '#efe2cf' : '#101419';
    window.dispatchEvent(new CustomEvent('pratelsky-theme-change', {
      detail: { theme, previous, source: currentSource }
    }));
  }

  function checkTheme() {
    applyTheme(themeFor(currentPragueParts()));
  }

  async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        mode: 'cors',
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function syncTime() {
    for (const source of sources) {
      try {
        const data = await fetchWithTimeout(source.url);
        const parsed = source.parse(data);
        if (!parsed) continue;
        anchor = { ...parsed, performanceAt: performance.now() };
        currentSource = source.name;
        checkTheme();
        return;
      } catch (_) {
        // Pokračuje se dalším zdrojem a nakonec lokálním časem v Europe/Prague.
      }
    }

    anchor = null;
    currentSource = 'zařízení · Europe/Prague';
    checkTheme();
  }

  checkTheme();
  syncTime();
  window.setInterval(checkTheme, THEME_CHECK_INTERVAL_MS);
  window.setInterval(syncTime, RESYNC_INTERVAL_MS);

  window.PratelskyTheme = {
    getTheme: () => currentTheme,
    getPragueParts: currentPragueParts,
    getSource: () => currentSource,
    sync: syncTime
  };
})();
