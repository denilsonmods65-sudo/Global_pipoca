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

  // Spatial navigation heuristic (closest element in direction)
  const findNextFocusElement = useCallback(
    (current: HTMLElement, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): HTMLElement | null => {
      const candidates = getFocusableElements().filter((el) => el !== current);
      if (candidates.length === 0) return null;

      const currentRect = current.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      let bestCandidate: HTMLElement | null = null;
      let minDistance = Infinity;

      for (const target of candidates) {
        const targetRect = target.getBoundingClientRect();
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        const deltaX = targetCenterX - currentCenterX;
        const deltaY = targetCenterY - currentCenterY;

        let isValidDirection = false;
        let primaryDistance = 0;
        let secondaryDistance = 0;

        if (direction === 'RIGHT') {
          isValidDirection = deltaX > 8; // target is to the right
          primaryDistance = deltaX;
          secondaryDistance = Math.abs(deltaY);
        } else if (direction === 'LEFT') {
          isValidDirection = deltaX < -8; // target is to the left
          primaryDistance = Math.abs(deltaX);
          secondaryDistance = Math.abs(deltaY);
        } else if (direction === 'DOWN') {
          isValidDirection = deltaY > 8; // target is below
          primaryDistance = deltaY;
          secondaryDistance = Math.abs(deltaX);
        } else if (direction === 'UP') {
          isValidDirection = deltaY < -8; // target is above
          primaryDistance = Math.abs(deltaY);
          secondaryDistance = Math.abs(deltaX);
        }

        if (isValidDirection) {
          // Weight horizontal/vertical alignment to prefer straight movement along the same row/column
          const score = primaryDistance + secondaryDistance * 2.2;
          if (score < minDistance) {
            minDistance = score;
            bestCandidate = target;
          }
        }
      }

      return bestCandidate;
    },
    [getFocusableElements]
  );

  const focusElement = useCallback((element: HTMLElement) => {
    lastFocusedRef.current = element;
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
