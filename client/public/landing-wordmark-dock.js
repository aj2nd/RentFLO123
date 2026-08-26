(function () {
  var touchStartY = 0;

  function getHeader() {
    return document.querySelector('.i18n-header');
  }

  function getWordmark() {
    var header = getHeader();
    return header ? header.querySelector('.logo-left') : null;
  }

  function isLanding() {
    return window.location.pathname === '/' && !!document.querySelector('.rentflo-hero');
  }

  function getScrollTop() {
    return Math.max(
      window.scrollY || 0,
      document.documentElement.scrollTop || 0,
      document.body.scrollTop || 0,
      (document.scrollingElement && document.scrollingElement.scrollTop) || 0
    );
  }

  function clearDock() {
    var header = getHeader();
    var wordmark = getWordmark();
    if (!header || !wordmark) return;

    header.classList.remove('glass');
    wordmark.style.removeProperty('position');
    wordmark.style.removeProperty('top');
    wordmark.style.removeProperty('left');
    wordmark.style.removeProperty('transform');
    wordmark.style.removeProperty('z-index');
    wordmark.style.removeProperty('transition');
  }

  function dockAtTop() {
    var header = getHeader();
    var wordmark = getWordmark();
    if (!header || !wordmark || !isLanding()) return;

    header.classList.add('glass');
    wordmark.style.setProperty('position', 'fixed', 'important');
    wordmark.style.setProperty('top', '0px', 'important');
    wordmark.style.setProperty('left', '50%', 'important');
    wordmark.style.setProperty('transform', 'translateX(-50%)', 'important');
    wordmark.style.setProperty('z-index', '10000', 'important');
    wordmark.style.setProperty('transition', 'none', 'important');
  }

  function syncDock() {
    if (!isLanding()) return;
    if (getScrollTop() > 0) {
      dockAtTop();
    } else {
      clearDock();
    }
  }

  function onTouchStart(event) {
    var touch = event.touches && event.touches[0];
    touchStartY = touch ? touch.clientY : 0;
  }

  function onTouchMove(event) {
    var touch = event.touches && event.touches[0];
    if (touch && touchStartY - touch.clientY > 1) dockAtTop();
  }

  window.addEventListener('scroll', syncDock, { passive: true });
  document.addEventListener('scroll', syncDock, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('pageshow', syncDock, { passive: true });
  window.addEventListener('popstate', syncDock, { passive: true });
  requestAnimationFrame(syncDock);
})();
