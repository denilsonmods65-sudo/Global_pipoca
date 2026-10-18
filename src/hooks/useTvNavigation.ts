import { useEffect, useRef, useCallback } from 'react';

// Android TV / Remote Keycode Constants
export const TV_KEYS = {
  UP: ['ArrowUp', 'Up', '19'],
  DOWN: ['ArrowDown', 'Down', '20'],
  LEFT: ['ArrowLeft', 'Left', '21'],
  RIGHT: ['ArrowRight', 'Right', '22'],
  ENTER: ['Enter', 'Select', '13', '23', '66'],
  BACK: ['Escape', 'Backspace', 'BrowserBack', '4', '27', '8'],
  PLAY_PAUSE: ['MediaPlayPause', 'Play', 'Pause', '85'],
  CHANNEL_UP: ['ChannelUp', '166', 'PageUp'],
  CHANNEL_DOWN: ['ChannelDown', '167', 'PageDown'],
};

export function isKeyMatch(event: KeyboardEvent, keyGroup: string[]): boolean {
  return (
    keyGroup.includes(event.key) ||
    keyGroup.includes(event.code) ||
    keyGroup.includes(String(event.keyCode))
  );
}

export function useTvSpatialNavigation(options?: {
  enabled?: boolean;
  onBack?: () => void;
  onEnter?: (element: HTMLElement) => void;
}) {
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const lastEnterTimeRef = useRef<number>(0);

  // Find candidate focusable elements within current context
  const getFocusableElements = useCallback((): HTMLElement[] => {
    // If a modal or details dialog is open (excluding PlayerView which has its own controller)
    const modal = document.querySelector<HTMLElement>('[data-tv-modal="true"]:not([data-tv-player="true"])');
    const container = modal || document;

    const selector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      '[tabindex="0"]',
      '.tv-focusable',
      '[data-tv-focusable="true"]',
    ].join(', ');

    const nodes = Array.from(container.querySelectorAll<HTMLElement>(selector));
    return nodes.filter((el) => {
      // Must be visible and interactive
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        style.opacity !== '0'
      );
    });
  }, []);

  // Spatial navigation heuristic respecting layout zones and row bounds
  const findNextFocusElement = useCallback(
    (current: HTMLElement, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): HTMLElement | null => {
      const candidates = getFocusableElements().filter((el) => el !== current);
      if (candidates.length === 0) return null;

      const currentRect = current.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      const isInsideSidebar = Boolean(current.closest('[data-tv-section="sidebar"]'));

      // ZONE 1: CURRENT FOCUS IS IN SIDEBAR
      if (isInsideSidebar) {
        const sidebarCandidates = candidates.filter((el) =>
          Boolean(el.closest('[data-tv-section="sidebar"]'))
        );

        if (direction === 'DOWN') {
          const below = sidebarCandidates
            .filter((el) => el.getBoundingClientRect().top >= currentRect.bottom - 4)
            .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
          return below[0] || null;
        }

        if (direction === 'UP') {
          const above = sidebarCandidates
            .filter((el) => el.getBoundingClientRect().bottom <= currentRect.top + 4)
            .sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom);
          return above[0] || null;
        }

        if (direction === 'RIGHT') {
          // Navigate from sidebar to main content
          const heroPlay = document.getElementById('hero-play-btn');
          if (heroPlay && heroPlay.offsetParent !== null) return heroPlay;

          const mainCandidates = candidates.filter(
            (el) => !el.closest('[data-tv-section="sidebar"]')
          );
          return mainCandidates[0] || null;
        }

        if (direction === 'LEFT') {
          // Stay in sidebar
          return null;
        }
      }

      // ZONE 2: CURRENT FOCUS IS IN MAIN CONTENT AREA
      const mainCandidates = candidates.filter(
        (el) => !el.closest('[data-tv-section="sidebar"]')
      );

      if (direction === 'RIGHT') {
        // Find next card to the right in the same carousel row (vertical tolerance 55px)
        const inSameRowRight = mainCandidates.filter((target) => {
          const targetRect = target.getBoundingClientRect();
          const targetCenterY = targetRect.top + targetRect.height / 2;
          const sameRow = Math.abs(targetCenterY - currentCenterY) < 55;
          const isRight = targetRect.left >= currentRect.right - 10;
          return sameRow && isRight;
        });

        if (inSameRowRight.length > 0) {
          inSameRowRight.sort(
            (a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left
          );
          return inSameRowRight[0];
        }

        // Rule 3: End of row - do NOT jump to distant or unexpected elements
        return null;
      }

      if (direction === 'LEFT') {
        // Find previous card to the left in the same carousel row
        const inSameRowLeft = mainCandidates.filter((target) => {
          const targetRect = target.getBoundingClientRect();
          const targetCenterY = targetRect.top + targetRect.height / 2;
          const sameRow = Math.abs(targetCenterY - currentCenterY) < 55;
          const isLeft = targetRect.right <= currentRect.left + 10;
          return sameRow && isLeft;
        });

        if (inSameRowLeft.length > 0) {
          inSameRowLeft.sort(
            (a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right
          );
          return inSameRowLeft[0];
        }

        // If at the leftmost card of the row or banner, jump cleanly to the active sidebar item
        const activeSidebarItem =
          document.querySelector<HTMLElement>('[data-tv-section="sidebar"] [data-tv-active="true"]') ||
          document.querySelector<HTMLElement>('[data-tv-section="sidebar"] button.tv-focusable');
        return activeSidebarItem || null;
      }

      if (direction === 'DOWN') {
        // Find candidates below current in the main content area (never jump to sidebar)
        const downCandidates = mainCandidates.filter((target) => {
          const targetRect = target.getBoundingClientRect();
          const targetCenterY = targetRect.top + targetRect.height / 2;
          return targetRect.top >= currentRect.bottom - 12 || targetCenterY > currentCenterY + 18;
        });

        if (downCandidates.length === 0) return null;

        const withDistances = downCandidates.map((target) => {
          const targetRect = target.getBoundingClientRect();
          const vDist = Math.max(0, targetRect.top - currentRect.bottom);
          return { target, targetRect, vDist };
        });

        const minVDist = Math.min(...withDistances.map((c) => c.vDist));
        // Group into the immediate next row (vertical tolerance 45px)
        const nextRowCandidates = withDistances.filter((c) => c.vDist <= minVDist + 45);

        // Pick element with closest horizontal alignment
        let bestTarget: HTMLElement | null = null;
        let minHDist = Infinity;
        for (const item of nextRowCandidates) {
          const targetCenterX = item.targetRect.left + item.targetRect.width / 2;
          const hDist = Math.abs(targetCenterX - currentCenterX);
          if (hDist < minHDist) {
            minHDist = hDist;
            bestTarget = item.target;
          }
        }
        return bestTarget;
      }

      if (direction === 'UP') {
        // Find candidates above current in the main content area (never jump to sidebar)
        const upCandidates = mainCandidates.filter((target) => {
          const targetRect = target.getBoundingClientRect();
          const targetCenterY = targetRect.top + targetRect.height / 2;
          return targetRect.bottom <= currentRect.top + 12 || targetCenterY < currentCenterY - 18;
        });

        if (upCandidates.length === 0) return null;

        const withDistances = upCandidates.map((target) => {
          const targetRect = target.getBoundingClientRect();
          const vDist = Math.max(0, currentRect.top - targetRect.bottom);
          return { target, targetRect, vDist };
        });

        const minVDist = Math.min(...withDistances.map((c) => c.vDist));
        // Group into the immediate row above
        const prevRowCandidates = withDistances.filter((c) => c.vDist <= minVDist + 45);

        // Pick element with closest horizontal alignment
        let bestTarget: HTMLElement | null = null;
        let minHDist = Infinity;
        for (const item of prevRowCandidates) {
          const targetCenterX = item.targetRect.left + item.targetRect.width / 2;
          const hDist = Math.abs(targetCenterX - currentCenterX);
          if (hDist < minHDist) {
            minHDist = hDist;
            bestTarget = item.target;
          }
        }
        return bestTarget;
      }

      return null;
    },
    [getFocusableElements]
  );

  const focusElement = useCallback((element: HTMLElement) => {
    if (lastFocusedRef.current && lastFocusedRef.current !== element) {
      lastFocusedRef.current.removeAttribute('data-focused');
    }
    lastFocusedRef.current = element;
    element.setAttribute('data-focused', 'true');
    element.focus();
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, []);

  // Global Keydown Handler for Remote Control
  useEffect(() => {
    if (options?.enabled === false) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If Video Player is active, let PlayerView handle all remote keys exclusively
      if (document.querySelector('[data-tv-player="true"]')) {
        return;
      }

      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      // Handle Backspace / Delete / KEYCODE_DEL inside input fields
      if (isInput) {
        const isDeleteKey =
          e.key === 'Backspace' ||
          e.key === 'Delete' ||
          e.code === 'Backspace' ||
          e.code === 'Delete' ||
          e.keyCode === 8 ||
          e.keyCode === 46 ||
          e.keyCode === 67;

        if (isDeleteKey) {
          if (e.keyCode === 67) {
            const input = document.activeElement as HTMLInputElement;
            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? input.value.length;
            if (start > 0 || start !== end) {
              e.preventDefault();
              const delStart = start === end ? start - 1 : start;
              const newVal = input.value.slice(0, delStart) + input.value.slice(end);
              input.value = newVal;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.setSelectionRange(delStart, delStart);
            }
          }
          return;
        }

        // TV BACK from input
        if (e.key === 'Escape' || e.keyCode === 27 || (e.keyCode === 4 && e.key !== 'Backspace')) {
          e.preventDefault();
          (document.activeElement as HTMLElement)?.blur();
          return;
        }
      }

      // Back key outside inputs
      if (isKeyMatch(e, TV_KEYS.BACK)) {
        e.preventDefault();
        if (options?.onBack) {
          options.onBack();
        }
        return;
      }

      // Enter / OK key (single execution with debounce & repeat filtering)
      if (isKeyMatch(e, TV_KEYS.ENTER)) {
        if (e.repeat) {
          e.preventDefault();
          return;
        }

        const now = Date.now();
        if (now - lastEnterTimeRef.current < 250) {
          e.preventDefault();
          return;
        }
        lastEnterTimeRef.current = now;

        if (document.activeElement instanceof HTMLElement) {
          if (!isInput) {
            e.preventDefault();
            e.stopPropagation();
            const el = document.activeElement;
            el.click();
            options?.onEnter?.(el);
          }
        }
        return;
      }

      // Cursor movement inside inputs
      if (isInput && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        return;
      }

      let direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null = null;
      if (isKeyMatch(e, TV_KEYS.UP)) direction = 'UP';
      else if (isKeyMatch(e, TV_KEYS.DOWN)) direction = 'DOWN';
      else if (isKeyMatch(e, TV_KEYS.LEFT)) direction = 'LEFT';
      else if (isKeyMatch(e, TV_KEYS.RIGHT)) direction = 'RIGHT';

      if (!direction) return;

      e.preventDefault();

      let current = document.activeElement as HTMLElement | null;
      const elements = getFocusableElements();

      // If nothing focused, focus the first available element
      if (!current || !elements.includes(current)) {
        const first = elements[0];
        if (first) focusElement(first);
        return;
      }

      // Check explicit direction target attribute first
      const explicitAttr = current.getAttribute(`data-tv-next-${direction.toLowerCase()}`);
      if (explicitAttr) {
        const explicitTarget =
          document.getElementById(explicitAttr) ||
          document.querySelector<HTMLElement>(explicitAttr);
        if (explicitTarget && explicitTarget.offsetParent !== null) {
          focusElement(explicitTarget);
          return;
        }
      }

      const next = findNextFocusElement(current, direction);
      if (next) {
        focusElement(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [options, getFocusableElements, findNextFocusElement, focusElement]);

  return {
    getFocusableElements,
    focusElement,
    restoreLastFocus: () => {
      if (lastFocusedRef.current && document.body.contains(lastFocusedRef.current)) {
        lastFocusedRef.current.focus();
        lastFocusedRef.current.setAttribute('data-focused', 'true');
      }
    },
  };
}
