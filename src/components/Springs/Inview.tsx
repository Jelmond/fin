/**
 * @fileoverview Inview animation component for scroll-based reveal animations
 * 
 * This component provides spring animations triggered by scroll position:
 * 1. Configurable enter/exit animations
 * 2. Multiple animation modes (always, once, forward)
 * 3. Optional mobile device handling
 * 4. Support for external trigger elements
 * 
 * @param {React.ReactNode} children - Child elements to animate
 * @param {boolean} enabled - Whether animations are enabled
 * @param {Object} from - Starting animation values
 * @param {Object} to - Ending animation values
 * @param {'always'|'once'|'forward'} mode - Animation mode:
 *   - always: Always animates when in view
 *   - once: Plays once when first in view
 *   - forward: Only plays forward
 * @param {React.CSSProperties} style - Additional CSS styles
 * @param {Object} config - Spring animation configuration
 * @param {number} delayIn - Delay before enter animation in ms
 * @param {number} delayOut - Delay before exit animation in ms
 * @param {string} innerClassName - Class name for inner animated element
 * @param {Tags} innerTag - HTML tag for inner animated element
 * @param {React.RefObject<HTMLElement>} trigger - Optional external trigger element ref
 * @param {boolean} disableOnMobile - Whether to disable on mobile devices
 * @param {boolean} immediateOut - Whether to skip exit animation
 */


"use client";

import { animated, useSpring } from "@react-spring/web";
import { useAssetsLoader } from "@/layouts/AssetsLoaderLayout/AssetsLoaderLayout";
import {
  CSSProperties,
  ElementType,
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useIsRerouting } from "@/layouts/AnimatedRouterLayout/AnimatedRouterLayout";
import { useDynamicInView } from "@/hooks/useDynamicInView";
import { Tags } from "./Spring";
import { isMobileDisabled, springsConfig } from "./config";
import { useWindowWidth } from "@/hooks/useWindowSize";

type SpringProps = {
  children?: React.ReactNode;
  enabled?: boolean;
  from?: Record<string, any>;
  to?: Record<string, any>;
  mode?: "always" | "once" | "forward";
  style?: React.CSSProperties;
  config?: Record<string, any>;
  delayIn?: number;
  delayOut?: number;
  innerClassName?: string;
  innerTag?: Tags;
  trigger?: React.RefObject<HTMLElement>;
  disableOnMobile?: boolean;
  immediateOut?: boolean;
} & React.HTMLAttributes<HTMLElement>;

export interface VarTextTagProps {
  tag?: Tags;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}
export const AnimatedVarTextTag = forwardRef<HTMLElement, VarTextTagProps>(
  ({ tag = "span", children, className, style, ...props }, outerRef) => {
    const ref = useRef<HTMLElement | null>(null);
    useImperativeHandle(outerRef, () => ref.current as HTMLElement);
    const Tag = animated[tag] as ElementType;

    return (
      <Tag ref={ref} className={className} style={style} {...props}>
        {children}
      </Tag>
    );
  }
);
AnimatedVarTextTag.displayName = "AnimatedVarTextTag";

export const Inview = forwardRef<HTMLElement, SpringProps & { tag?: Tags }>(
  (
    {
      tag: Tag = "div",
      children,
      from = {},
      to = {},
      mode = "always",
      style,
      config = {},
      delayIn = 0,
      delayOut = 0,
      enabled = true,
      innerTag,
      trigger,
      innerClassName,
      disableOnMobile = false,
      immediateOut = true,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLElement>(null);
    const [inViewRef, inView] = useDynamicInView({
      trigger: trigger,
    });
    const { fullyLoaded } = useAssetsLoader();
    const isAnimated = useRef(false);
    const isRerouting = useIsRerouting();
    const scrolledDown = useRef(false);
    const width = useWindowWidth();

    useImperativeHandle(ref, () => innerRef.current as HTMLElement);

    useEffect(() => {
      if (
        isMobileDisabled(
          springsConfig.disableOnMobile.inview || disableOnMobile
        )
      ) {
        return;
      }
      if (mode === "forward") {
        const handleScroll = () => {
          if (innerRef.current) {
            const rect = innerRef.current.getBoundingClientRect();
            if (rect.top > 0) {
              scrolledDown.current = false;
            } else {
              scrolledDown.current = true;
            }
          }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
      }
    }, [mode, disableOnMobile, width]);

    const active = useMemo(() => {
      if (
        isMobileDisabled(
          springsConfig.disableOnMobile.inview || disableOnMobile
        )
      ) {
        return false;
      }

      if (!enabled) {
        return false;
      }

      if (mode === "once" && isAnimated.current) {
        return true;
      }

      if (mode === "forward" && scrolledDown.current) {
        return true;
      }

      if (!isAnimated.current) {
        isAnimated.current = inView && fullyLoaded && !isRerouting;
      }

      return inView && fullyLoaded && !isRerouting;
    }, [
      inView,
      fullyLoaded,
      mode,
      enabled,
      isRerouting,
      disableOnMobile,
      width,
    ]);

    const [springs, api] = useSpring(() => ({
      ...from,
      config,
    }));

    useEffect(() => {
      if (
        isMobileDisabled(
          springsConfig.disableOnMobile.inview || disableOnMobile
        )
      ) {
        return;
      }
      if (active) {
        api.start({ ...to, config, delay: delayIn });
      } else {
        api.start({
          ...from,
          config,
          delay: delayOut,
          immediate: immediateOut,
        });
      }
    }, [active, api, to, from, config, delayIn, delayOut, immediateOut]);

    if (innerTag) {
      return (
        <AnimatedVarTextTag
          tag={Tag}
          ref={(node) => {
            // @ts-expect-error
            innerRef.current = node as HTMLElement;
            // @ts-expect-error
            inViewRef.current = node as HTMLElement;
          }}
          style={{ ...style }}
          {...props}
        >
          <AnimatedVarTextTag
            tag={innerTag}
            className={innerClassName}
            style={{ ...springs }}
          >
            {children}
          </AnimatedVarTextTag>
        </AnimatedVarTextTag>
      );
    }

    return (
      <AnimatedVarTextTag
        tag={Tag}
        ref={(node) => {
          // @ts-expect-error
          innerRef.current = node as HTMLElement;
          // @ts-expect-error
          inViewRef.current = node as HTMLElement;
        }}
        style={{ ...springs, ...style }}
        {...props}
      >
        {children}
      </AnimatedVarTextTag>
    );
  }
);

Inview.displayName = "Inview";
