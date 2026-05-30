// FreeTube Redirect - Content Script

(function () {
  'use strict';

  let lastUrl = location.href;
  let buttonInjected = false;

  // Extract video ID from YouTube URL
  function getVideoId() {
    const url = new URL(location.href);
    return url.searchParams.get('v');
  }

  // Build the FreeTube deep-link URI
  function buildFreeTubeUrl(videoId) {
    return `freetube://https://www.youtube.com/watch?v=${videoId}`;
  }

  // Remove any existing button
  function removeButton() {
    const existing = document.getElementById('freetube-redirect-btn-wrapper');
    if (existing) existing.remove();
    buttonInjected = false;
  }

  // Create and inject the button
  function injectButton() {
    const videoId = getVideoId();
    if (!videoId) return;

    // Avoid duplicate injections
    if (document.getElementById('freetube-redirect-btn-wrapper')) return;

    // Wait for the actions bar to be available
    const actionsBar =
      document.querySelector('#actions-inner #menu') ||
      document.querySelector('#menu-container') ||
      document.querySelector('ytd-menu-renderer.ytd-watch-metadata') ||
      document.querySelector('#actions');

    if (!actionsBar) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'freetube-redirect-btn-wrapper';

    const btn = document.createElement('button');
    btn.id = 'freetube-redirect-btn';
    btn.setAttribute('aria-label', 'Open in FreeTube');
    btn.title = 'Open in FreeTube';

    // SVG icon (FreeTube-style play icon)
    btn.innerHTML = `
      <span class="ft-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
          <path d="M4 4C4 2.34315 5.34315 1 7 1H17C18.6569 1 20 2.34315 20 4V8.5L22 10V14L20 15.5V20C20 21.6569 18.6569 23 17 23H7C5.34315 23 4 21.6569 4 20V4Z" fill="currentColor" opacity="0.15"/>
          <path d="M7 1H17C18.6569 1 20 2.34315 20 4V20C20 21.6569 18.6569 23 17 23H7C5.34315 23 4 21.6569 4 20V4C4 2.34315 5.34315 1 7 1Z" stroke="currentColor" stroke-width="1.5"/>
          <path d="M9.5 8L16 12L9.5 16V8Z" fill="currentColor"/>
        </svg>
      </span>
      <span class="ft-label">Open in FreeTube</span>
    `;

    btn.addEventListener('click', () => {
      const freshVideoId = getVideoId();
      if (!freshVideoId) {
        showToast('No videos detected on this page.');
        return;
      }
      const ftUrl = buildFreeTubeUrl(freshVideoId);
      window.location.href = ftUrl;

      // Fallback message after short delay
      setTimeout(() => {
        showToast('If FreeTube didn t open, make sure it is installed on your system.');
      }, 1500);
    });

    wrapper.appendChild(btn);

    // Insert after the actions bar
    actionsBar.parentNode.insertBefore(wrapper, actionsBar.nextSibling);
    buttonInjected = true;
  }

  // Toast notification
  function showToast(message) {
    const existing = document.getElementById('ft-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ft-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('ft-toast-visible'), 10);
    setTimeout(() => {
      toast.classList.remove('ft-toast-visible');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // Observe DOM changes (YouTube is a SPA)
  function observeAndInject() {
    const observer = new MutationObserver(() => {
      const currentUrl = location.href;

      // URL changed → navigation happened
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        removeButton();
      }

      // Try to inject if we're on a watch page and button not yet injected
      if (location.pathname === '/watch' && !buttonInjected) {
        injectButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Initial injection attempt
  if (location.pathname === '/watch') {
    // Retry a few times while the page loads
    let attempts = 0;
    const interval = setInterval(() => {
      injectButton();
      attempts++;
      if (buttonInjected || attempts >= 20) clearInterval(interval);
    }, 500);
  }

  observeAndInject();
})();
