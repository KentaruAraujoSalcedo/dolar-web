(function () {
  const KEY = 'pdh_cookie_consent';

  function setBannerVisible(visible) {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    banner.classList.toggle('show', !!visible);
  }

  function updateConsent(status) {
    if (!window.gtag) return;

    if (status === 'accepted') {
      gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
        personalization_storage: 'granted'
      });
    } else {
      gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        personalization_storage: 'denied'
      });
    }
  }

  window.acceptCookies = function () {
    try { localStorage.setItem(KEY, 'accepted'); } catch (e) {}
    updateConsent('accepted');
    setBannerVisible(false);
  };

  window.rejectCookies = function () {
    try { localStorage.setItem(KEY, 'rejected'); } catch (e) {}
    updateConsent('rejected');
    setBannerVisible(false);
  };

  // Para el botón "Cambiar preferencias" en cookies.html (y donde quieras)
  window.resetCookieConsent = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}

    // Vuelve a denied hasta que el usuario decida otra vez
    if (window.gtag) {
      gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        personalization_storage: 'denied'
      });
    }

    setBannerVisible(true);
  };

  document.addEventListener('DOMContentLoaded', function () {
    const saved = (() => {
      try { return localStorage.getItem(KEY); } catch (e) { return null; }
    })();

    if (!saved) {
      setBannerVisible(true);
    } else {
      updateConsent(saved);
      setBannerVisible(false);
    }
  });
})();
