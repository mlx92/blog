// Email link fallback for in-app browsers (WeChat, etc.).
//
// Desktop browsers handle `mailto:` natively, but some in-app browsers
// silently swallow the navigation, making the icon look broken.
// Here we keep the real `mailto:` link and only add a fallback: when the
// browser is an in-app one (or the navigation did not happen), copy the
// address to the clipboard and show a toast with the full address.

(function () {
  'use strict';

  var IN_APP_RE = /MicroMessenger|QQ\/|Weibo|DingTalk|Alipay/i;

  // Evaluated at click time (not load time): some browsers mutate the UA
  // after the document is parsed, and we want the most current value.
  function isInApp() {
    return IN_APP_RE.test(navigator.userAgent || '');
  }

  function showToast(text) {
    var existing = document.getElementById('email-copy-toast');
    if (existing) {
      existing.remove();
    }
    var toast = document.createElement('div');
    toast.id = 'email-copy-toast';
    toast.textContent = text;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = [
      'position:fixed',
      'left:50%',
      'bottom:12%',
      'transform:translateX(-50%)',
      'z-index:2000',
      'max-width:82vw',
      'padding:0.6rem 1rem',
      'border-radius:0.5rem',
      'background:rgba(0,0,0,0.82)',
      'color:#fff',
      'font-size:0.9rem',
      'line-height:1.4',
      'text-align:center',
      'word-break:break-all',
      'box-shadow:0 4px 16px rgba(0,0,0,0.25)'
    ].join(';');
    document.body.appendChild(toast);
    window.setTimeout(function () {
      toast.remove();
    }, 4000);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      try {
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('copy failed'));
      } catch (err) {
        document.body.removeChild(ta);
        reject(err);
      }
    });
  }

  document.addEventListener('click', function (event) {
    var anchor = event.target && event.target.closest
      ? event.target.closest('a[href^="mailto:"]')
      : null;
    if (!anchor) return;

    var address = anchor.getAttribute('href').replace(/^mailto:/i, '').split('?')[0].trim();
    if (!address) return;

    // Only step in for in-app browsers; desktop keeps the native mail client.
    if (!isInApp()) return;

    // NOTE: we deliberately do NOT preventDefault here. If the in-app browser
    // can still hand the address to a mail client, that keeps working; we
    // only add a copy + toast as a fallback so the address is never lost.
    copyText(address).then(
      function () {
        showToast('邮箱已复制：' + address);
      },
      function () {
        showToast('邮箱：' + address);
      }
    );
  }, true);
})();
