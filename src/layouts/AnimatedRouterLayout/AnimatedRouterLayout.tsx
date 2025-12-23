"use client";

import { NextPage } from "next";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AnchorHTMLAttributes,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { TransitionBg } from "./TransitionBg";
import { scrollTo } from "@/utils/scrollTo";

const AnimatedRouterContext = createContext({});

const AnimatedRouterLayoutInner: NextPage<{ children: any }> = ({
  children,
}) => {
  const changing = useRef(false);
  const router = useRouter();
  const transitionRef = useRef<{
    show: (callback?: () => void) => void;
    hide: () => void;
  }>();
  const [rerouting, setRerouting] = useState(false);
  const lastRoute = useRef<string[]>([]);
  const lastScrollPosition = useRef<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathnameRef = useRef<string>("");
  const searchParamsRef = useRef<URLSearchParams | null>(null);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      pathnameRef.current = window.location.pathname;
      searchParamsRef.current = new URLSearchParams(window.location.search);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isMounted) return;

    routeChangeComplete();
    changing.current = false;
    document.body.style.cursor = "default";
    setRerouting(false);

    const handleRouteChange = () => {
      pathnameRef.current = window.location.pathname;
      searchParamsRef.current = new URLSearchParams(window.location.search);

      routeChangeComplete();
      changing.current = false;
      document.body.style.cursor = "default";
      setRerouting(false);
    };

    handleRouteChange();

    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
    }, [pathname, searchParams, isMounted]);
  // }, [isMounted]);

  // Saves all the time, but could be desibled and then will be saved only on route
  useEffect(() => {
    if (!isMounted) return;
    if (typeof window === "undefined") {
      return;
    }
    const handleScroll = () => {
      lastScrollPosition.current[window.location.pathname] = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMounted]);

  useLayoutEffect(() => {
    if (!isMounted) return;
    // if (typeof window === "undefined") {
    //   return;
    // }
    // const y = lastScrollPosition.current[window.location.pathname];
    const y = lastScrollPosition.current[pathnameRef.current];

    if (y) {
      scrollTo(Number(y));
    }
  }, [isMounted]);

  const routeChangeStart = (href: string, backMode?: boolean) => {
    if (!isMounted) return;
    if (changing.current) return;
    if (typeof window === "undefined") return;
    const currentSearch = searchParamsRef.current?.toString() || "";
    const currentUrl = currentSearch
      ? `${pathnameRef.current}?${currentSearch}`
      : pathnameRef.current;

    // if (href === pathname || href === pathname + "?" + searchParams.toString())
    //   return;
    if (href === currentUrl) return;

    setRerouting(true);
    changing.current = true;
    const route = window.location.pathname;
    const scrollPosition = window.scrollY;
    const lastRouteName = lastRoute.current[lastRoute.current.length - 1];
    document.body.style.cursor = "progress";

    transitionRef.current?.show(() => {
      router.push(backMode && lastRouteName ? lastRouteName : href);
      if (!backMode) {
        lastRoute.current.pop();
      }
    });

    if (!backMode) {
      if (route !== lastRouteName) {
        lastRoute.current.push(route);
      }
      lastScrollPosition.current[route] = scrollPosition;
    }
  };
  const routeChangeComplete = () => {
    if (!isMounted) return;
    transitionRef.current?.hide();
  };

  const value = {
    routeChangeStart,
    routeChangeComplete,
    rerouting,
    lastRoute,
  };

  return (
    <AnimatedRouterContext.Provider value={value}>
      {isMounted && <TransitionBg ref={transitionRef} />}
      {children}
    </AnimatedRouterContext.Provider>
  );
};

export const AnimatedRouterLayout: NextPage<{ children: any }> = ({
  children,
}) => {
  return (
    <Suspense fallback={children}>
      <AnimatedRouterLayoutInner>{children}</AnimatedRouterLayoutInner>
    </Suspense>
  );
};

interface UseAnimatedRouter {
  routeChangeStart: (href: string, backMode?: boolean) => void;
  routeChangeComplete: () => void;
  rerouting: boolean;
}
// export const useAnimatedRouter = (): UseAnimatedRouter => {
//   const context = useContext(AnimatedRouterContext);
//   return context as UseAnimatedRouter;
// };

export const useAnimatedRouter = (): UseAnimatedRouter => {
  const context = useContext(AnimatedRouterContext) as UseAnimatedRouter & {
    isMounted?: boolean;
  };
  // Return a safe version that won't cause errors during SSR
  return {
    routeChangeStart: context.routeChangeStart ,
    routeChangeComplete:  context.routeChangeComplete,
    rerouting: context.rerouting,
  };
};

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: any;
  backMode?: boolean;
}

export const AnimLink = forwardRef<HTMLAnchorElement, Props>(
  ({ onClick, ...props }, outerRef) => {
    const ref = useRef<HTMLAnchorElement | null>(null);
    useImperativeHandle(outerRef, () => ref.current as HTMLAnchorElement);
    const { routeChangeStart } = useAnimatedRouter();
    const handleClick = (e: MouseEvent) => {
      routeChangeStart(props.href, props.backMode);
    };

    return (
      <Link
        ref={ref}
        onClick={(e) => {
          e.preventDefault();
          onClick?.(e as any);
          handleClick(e as any);
        }}
        {...props}
      >
        {props.children}
      </Link>
    );
  }
);
AnimLink.displayName = "AnimLink";

// function ClientOnly({ children }: any) {
//   const [mounted, mount] = useState(false);
//   useEffect(() => void mount(true), []);
//   if (!mounted) return null;
//   return <>{children}</>;
// }

export const useAnimRouter = () => {
  const router = useRouter();
  const { routeChangeStart, rerouting } = useAnimatedRouter();
  return useMemo(
    () => ({
      ...router,
      push: (href: string) => {
        routeChangeStart(href);
      },
      isRerouting: rerouting,
    }),
    [routeChangeStart, router, rerouting]
  );
};

export const useIsRerouting = (delayIn = 500, delayOut = 0) => {
  const { rerouting: _rerouting } = useAnimatedRouter();
  const [rerouting, setRerouting] = useState(_rerouting);
  const tmIn = useRef<any>(null);
  const tmOut = useRef<any>(null);
  useEffect(() => {
    clearTimeout(tmIn.current);
    clearTimeout(tmOut.current);
    if (_rerouting) {
      tmIn.current = setTimeout(() => {
        setRerouting(true);
      }, delayIn);
      return;
    }
    tmOut.current = setTimeout(() => {
      setRerouting(false);
    }, delayOut);
  }, [_rerouting, setRerouting]);
  return rerouting;
};
