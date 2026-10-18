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

  // Find candidate focusable elements within current context
  const getFocusableElements = useCallback((): HTMLElement[] => {
    // If a modal or player is open, restrict focus to inside it
    const modal = document.querySelector<HTMLElement>('[data-tv-modal="true"]');
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
      // Must be visible
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

  // Spatial navigation heuristic (closest element in direction, strictly row-by-row)
  const findNextFocusElement = useCallback(
    (current: HTMLElement, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): HTMLElement | null => {
      const candidates = getFocusableElements().filter((el) => el !== current);
      if (candidates.length === 0) return null;

      const currentRect = current.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      if (direction === 'DOWN') {
        // Find all candidates below current element
        const downCandidates = candidates.filter((target) => {
          const targetRect = target.getBoundingClientRect();
          const targetCenterY = targetRect.top + targetRect.height / 2;
          return targetRect.top >= currentRect.bottom - 10 || targetCenterY > currentCenterY + 14;
        });

        if (downCandidates.length === 0) return null;

        // Calculate vertical gap for each candidate
        const withDistances = downCandidates.map((target) => {
          const targetRect = target.getBoundingClientRect();
          const vDist = Math.max(0, targetRect.top - currentRect.bottom);
          return { target, targetRect, vDist };
        });

        // Find the closest vertical level (the immediately next row)
        const minVDist = Math.min(...withDistances.map((c) => c.vDist));

        // Group into the immediate next row (allow 65px tolerance for minor row variance)
        const nextRowCandidates = withDistances.filter((c) => c.vDist <= minVDist + 65);

        // Within this closest row, pick the one with closest horizontal alignment
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
        // Find all candidates above current element
        const upCandidates = candidates.filter((target) => {
          const targetRect = target.getBoundingClientRect();
          const targetCenterY = targetRect.top + targetRect.height / 2;
          return targetRect.bottom <= currentRect.top + 10 || targetCenterY < currentCenterY - 14;
        });

        if (upCandidates.length === 0) return null;

        // Calculate vertical gap for each candidate
        const withDistances = upCandidates.map((target) => {
          const targetRect = target.getBoundingClientRect();
          const vDist = Math.max(0, currentRect.top - targetRect.bottom);
          return { target, targetRect, vDist };
        });

        // Find the closest vertical level above
        const minVDist = Math.min(...withDistances.map((c) => c.vDist));

        // Group into the immediate row above
        const prevRowCandidates = withDistances.filter((c) => c.vDist <= minVDist + 65);

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

      if (direction === 'RIGHT') {
        // Candidates strictly to the right in the same visual row/band
        const rightCandidates = candidates.filter((target) => {
          const targetRect = target.getBoundingClientRect();
          const targetCenterY = targetRect.top + targetRect.height / 2;
          const targetCenterX = targetRect.left + targetRect.width / 2;
          const inSameRow =
            Math.abs(targetCenterY - currentCenterY) < 95 ||
            !(targetRect.bottom < currentRect.top || targetRect.top > currentRect.bottom);
          const isRight = targetRect.left >= currentRect.right - 8 || targetCenterX > currentCenterX + 8;
          return inSameRow && isRight;
        });

        if (rightCandidates.length > 0) {
          let bestTarget: HTMLElement | null = null;
          let minDistance = Infinity;
          for (const target of rightCandidates) {
            const targetRect = target.getBoundingClientRect();
            const dist = targetRect.left - currentRect.right;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = target;
            }
          }
          return bestTarget;
        }

        // If inside sidebar and pressing RIGHT, jump to hero play button or first main element
        const isInsideSidebar = current.closest('[data-tv-section="sidebar"]');
        if (isInsideSidebar) {
          const heroPlay = document.getElementById('hero-play-btn');
          if (heroPlay && heroPlay.offsetParent !== null) return heroPlay;

          const mainFocusable = candidates.find(
            (el) => !el.closest('[data-tv-section="sidebar"]') && el.offsetParent !== null
          );
          if (mainFocusable) return mainFocusable;
        }

        return null;
      }

      if (direction === 'LEFT') {
        // Candidates strictly to the left in the same visual row/band
        const leftCandidates = candidates.filter((target) => {
          const targetRect = target.getBoundingClientRect();
          const targetCenterY = targetRect.top + targetRect.height / 2;
          const targetCenterX = targetRect.left + targetRect.width / 2;
          const inSameRow =
            Math.abs(targetCenterY - currentCenterY) < 95 ||
            !(targetRect.bottom < currentRect.top || targetRect.top > currentRect.bottom);
          const isLeft = targetRect.right <= currentRect.left + 8 || targetCenterX < currentCenterX - 8;
          return inSameRow && isLeft;
        });

        if (leftCandidates.length > 0) {
          let bestTarget: HTMLElement | null = null;
          let minDistance = Infinity;
          for (const target of leftCandidates) {
            const targetRect = target.getBoundingClientRect();
            const dist = currentRect.left - targetRect.right;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = target;
            }
          }
          return bestTarget;
        }

        // If in main content and reached the leftmost element, jump to active sidebar item
        const isInsideSidebar = current.closest('[data-tv-section="sidebar"]');
        if (!isInsideSidebar) {
          const activeSidebar =
            document.querySelector<HTMLElement>('[data-tv-section="sidebar"] [data-tv-active="true"]') ||
            document.querySelector<HTMLElement>('[data-tv-section="sidebar"] .tv-focusable');
          if (activeSidebar) return activeSidebar;
        }

        return null;
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
          // If remote sends Android TV KEYCODE_DEL (67) without browser default behavior
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
          // Do not treat as navigation BACK key
          return;
        }

        // Only true TV BACK (Escape, Android Back key 4) blurs or navigates back from an input
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

      // Enter key
      if (isKeyMatch(e, TV_KEYS.ENTER)) {
        if (document.activeElement instanceof HTMLElement) {
          if (!isInput) {
            e.preventDefault();
            document.activeElement.click();
            options?.onEnter?.(document.activeElement);
          }
        }
        return;
      }

      // If typing in input, let normal left/right cursor work inside input
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
        if (explicitTarget) {
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
      }
    },
  };
}
