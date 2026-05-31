(() => {
  "use strict";

  const HIDE_DELAY = 2500; // ms before hiding controls
  const POLL_INTERVAL = 1500; // ms between checks for new video elements
  const HIDDEN_CLASS = "uphide-controls-hidden";
  const BODY_IDLE_CLASS = "uphide-idle";
  const TARGET_CLASS = "udemy-autohide-target";

  let enabled = true;
  let hideTimer = null;
  let activeVideo = null;
  let playerContainer = null;
  let observer = null;

  // ── Helpers ──────────────────────────────────────────────────────

  /**
   * Walk up from <video> to find the outermost player container.
   * Prefer [data-purpose] attributes which are more stable than class names.
   */
  function findPlayerContainer(video) {
    // First, look for known stable data-purpose containers
    const purposeContainer =
      video.closest('[data-purpose="shaka-video-player"]') ||
      video.closest('[data-purpose="video-player-container"]') ||
      video.closest('[data-purpose="curriculum-item-viewer"]');
    if (purposeContainer) return purposeContainer;

    // Fallback: walk up and find the largest ancestor that still contains
    // only the video player (stop before we hit the whole page layout).
    let container = video.parentElement;
    while (container && container !== document.body) {
      // If this ancestor has a sibling-heavy parent, it's likely the player wrapper
      const parent = container.parentElement;
      if (parent && parent.children.length > 3) break;
      container = parent;
    }
    return container || video.parentElement;
  }

  /**
   * Find control-bar elements near the video. Tags them with our marker class
   * so CSS can target them without relying on Udemy's hashed class names.
   */
  function tagControlBarElements(container) {
    if (!container) return;

    // Clear old tags
    container.querySelectorAll("." + TARGET_CLASS).forEach((el) => {
      el.classList.remove(TARGET_CLASS);
    });

    // Primary target: the single control-bar element wrapping progress + controls
    const controlBar = container.querySelector(
      '[data-purpose="video-control-bar"]'
    );
    if (controlBar) {
      controlBar.classList.add(TARGET_CLASS);
      return;
    }

    // Fallback heuristics — only run inside the shaka player to avoid over-matching
    const scope =
      container.closest('[data-purpose="shaka-video-player"]') ||
      container.querySelector('[data-purpose="shaka-video-player"]') ||
      container;
    const candidates = scope.querySelectorAll("div, section, nav, footer");
    const scopeRect = scope.getBoundingClientRect();
    const bottomThreshold = scopeRect.bottom - 80;

    candidates.forEach((el) => {
      if (el === scope || el === document.body) return;
      if (el.contains(scope.querySelector("video"))) return;
      if (el.classList.contains(TARGET_CLASS)) return;

      const style = getComputedStyle(el);
      if (style.position !== "absolute" && style.position !== "fixed") return;

      const rect = el.getBoundingClientRect();
      if (
        rect.bottom >= bottomThreshold &&
        rect.width > scopeRect.width * 0.5
      ) {
        el.classList.add(TARGET_CLASS);
      }
    });

    scope
      .querySelectorAll('[class*="control-bar"]')
      .forEach((el) => {
        if (!el.contains(scope.querySelector("video"))) {
          el.classList.add(TARGET_CLASS);
        }
      });
  }

  /**
   * Find prev/next lecture arrow buttons and tag their container for auto-hide.
   * These sit outside the player container, so we query from document and
   * drive them via body.uphide-idle instead.
   */
  function tagNavArrows() {
    const buttons = document.querySelectorAll(
      '[data-purpose="go-to-next"], [data-purpose="go-to-previous"], ' +
        '[aria-label="Go to Next lecture"], [aria-label="Go to Previous lecture"]'
    );
    buttons.forEach((btn) => {
      const wrapper =
        btn.closest('[class*="next-and-previous--container"]') || btn;
      if (!wrapper.classList.contains(TARGET_CLASS)) {
        wrapper.classList.add(TARGET_CLASS);
      }
    });
  }

  /**
   * Find the video title overlay and its gradient, and tag their shared
   * wrapper for auto-hide. The wrapper uses a [class*="user-activity--
   * hide-when-user-inactive"] class that Udemy's own auto-hide targets
   * (but fails to drive for the control bar).
   */
  function tagTitleOverlay() {
    const titles = document.querySelectorAll(
      '[class*="video-viewer--title-overlay"]'
    );
    titles.forEach((el) => {
      const wrapper =
        el.closest('[class*="user-activity--hide-when-user-inactive"]');
      if (wrapper) {
        if (!wrapper.classList.contains(TARGET_CLASS)) {
          wrapper.classList.add(TARGET_CLASS);
        }
      } else {
        // Fallback: tag title and gradient directly
        if (!el.classList.contains(TARGET_CLASS)) {
          el.classList.add(TARGET_CLASS);
        }
        const gradient = el.parentElement?.querySelector(
          '[class*="video-viewer--header-gradient"]'
        );
        if (gradient && !gradient.classList.contains(TARGET_CLASS)) {
          gradient.classList.add(TARGET_CLASS);
        }
      }
    });
  }

  // ── Core logic ───────────────────────────────────────────────────

  function showControls() {
    if (playerContainer) {
      playerContainer.classList.remove(HIDDEN_CLASS);
    }
    document.body.classList.remove(BODY_IDLE_CLASS);
  }

  function hideControls() {
    if (!enabled || !playerContainer || !activeVideo) return;
    if (activeVideo.paused || activeVideo.ended) return;
    playerContainer.classList.add(HIDDEN_CLASS);
    document.body.classList.add(BODY_IDLE_CLASS);
  }

  function resetTimer() {
    showControls();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideControls, HIDE_DELAY);
  }

  function onMouseMove() {
    if (!enabled) return;
    resetTimer();
  }

  function onVideoPlay() {
    if (!enabled) return;
    // Re-tag controls in case DOM changed since last bind
    tagControlBarElements(playerContainer);
    tagNavArrows();
    tagTitleOverlay();
    resetTimer();
  }

  function onVideoPause() {
    clearTimeout(hideTimer);
    showControls();
  }

  // ── Binding / Unbinding ──────────────────────────────────────────

  function unbind() {
    clearTimeout(hideTimer);
    document.removeEventListener("mousemove", onMouseMove);
    document.body.classList.remove(BODY_IDLE_CLASS);
    if (playerContainer) {
      playerContainer.removeEventListener("mousemove", onMouseMove);
      playerContainer.classList.remove(HIDDEN_CLASS);
    }
    if (activeVideo) {
      activeVideo.removeEventListener("play", onVideoPlay);
      activeVideo.removeEventListener("playing", onVideoPlay);
      activeVideo.removeEventListener("pause", onVideoPause);
      activeVideo.removeEventListener("ended", onVideoPause);
    }
    activeVideo = null;
    playerContainer = null;
  }

  function bind(video) {
    if (video === activeVideo) return; // already bound
    unbind();

    activeVideo = video;
    playerContainer = findPlayerContainer(video);
    if (!playerContainer) return;

    tagControlBarElements(playerContainer);
    tagNavArrows();
    tagTitleOverlay();

    playerContainer.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mousemove", onMouseMove, { passive: true });
    video.addEventListener("play", onVideoPlay);
    video.addEventListener("playing", onVideoPlay);
    video.addEventListener("pause", onVideoPause);
    video.addEventListener("ended", onVideoPause);

    // If video is already playing, start the timer
    if (!video.paused && !video.ended) {
      resetTimer();
    }
  }

  // ── Video discovery ──────────────────────────────────────────────

  function findAndBind() {
    if (!enabled) return;

    // Look for the primary lecture video
    const video =
      document.querySelector('[data-purpose="shaka-video-player"] video') ||
      document.querySelector('[data-purpose="video-player"] video') ||
      document.querySelector('[data-purpose="curriculum-item-viewer"] video') ||
      document.querySelector("video");

    if (video && video !== activeVideo) {
      bind(video);
    }
  }

  // ── SPA navigation handling ──────────────────────────────────────

  function onNavigation() {
    // Small delay to let React render the new view
    setTimeout(findAndBind, 800);
  }

  function patchHistory() {
    const origPush = history.pushState;
    const origReplace = history.replaceState;

    history.pushState = function (...args) {
      origPush.apply(this, args);
      onNavigation();
    };
    history.replaceState = function (...args) {
      origReplace.apply(this, args);
      onNavigation();
    };
    window.addEventListener("popstate", onNavigation);
  }

  /**
   * MutationObserver watches for new <video> elements appearing in the DOM
   * (covers both SPA navigation and lazy-loaded players).
   */
  function startObserver() {
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.tagName === "VIDEO" || node.querySelector?.("video")) {
            findAndBind();
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Enable / Disable ────────────────────────────────────────────

  function enable() {
    enabled = true;
    findAndBind();
  }

  function disable() {
    enabled = false;
    unbind();
  }

  // ── Storage sync ─────────────────────────────────────────────────

  function loadState() {
    chrome.storage.local.get({ uphideEnabled: true }, (result) => {
      enabled = result.uphideEnabled;
      if (enabled) findAndBind();
    });
  }

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.uphideEnabled) {
      if (changes.uphideEnabled.newValue) {
        enable();
      } else {
        disable();
      }
    }
  });

  // ── Init ─────────────────────────────────────────────────────────

  patchHistory();
  loadState();
  startObserver();

  // Periodic fallback in case MutationObserver misses a swap
  setInterval(findAndBind, POLL_INTERVAL);
})();
