"use client";

/**
 * @fileoverview Sets full device screen height to html tag for CSS use
 * Handles window resizing with debouncing to prevent excessive updates
 * Only updates when width changes to avoid unnecessary recalculations
 * Used to fix shaking in IOS mobile browsers, while using vh units
 */

import { useEffect, useRef } from "react";

const useLvh = () => {
  const prevWidth = useRef(
    typeof window === "undefined" ? 0 : window.innerWidth
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const render = () => {
      if (typeof window === "undefined") return;
      const bottomMenuOffset = 0; //px
      const vh = (window.outerHeight + bottomMenuOffset) * 0.01;

      if (window.innerWidth > 576) {
        document.documentElement.style.removeProperty("--vh");
      } else if (
        document.documentElement.style.getPropertyValue("--vh") !== `${vh}px`
      ) {
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      }
    };

    const handleResize = () => {
      if (typeof window === "undefined") return;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (prevWidth.current !== window.innerWidth) {
          prevWidth.current = window.innerWidth;
          render();
        }
      }, 300);
    };

    render(); // Initial render
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);
};

export const Lvh = () => {
  useLvh();
  return null;
};
