/**
 * @fileoverview Text animation engine component that provides configurable text animations
 * 
 * @param {boolean} enabled - Whether animations are enabled
 * @param {number|"inherit"} columnGap - Gap between words in em units
 * @param {"once"|"forward"|"always"|"manual"} mode - Animation mode:
 *   - once: Plays once per page load
 *   - forward: Plays only on scroll from top to bottom
 *   - always: Always plays when in view
 *   - manual: Manual control via instance methods
 * @param {string} className - Container class name
 * @param {string} wrapLineClassName - Line wrapper class name  
 * @param {string} lineClassName - Line class name
 * @param {string} wrapWordClassName - Word wrapper class name
 * @param {string} wordClassName - Word class name
 * @param {string} wrapLetterClassName - Letter wrapper class name
 * @param {string} letterClassName - Letter class name
 * @param {boolean} overflow - Whether to crop text during animation
 * @param {Object} wrapLineIn - Line wrapper enter animation props
 * @param {Object} wrapLineOut - Line wrapper exit animation props
 * @param {Object} lineIn - Line enter animation props
 * @param {Object} lineOut - Line exit animation props
 * @param {Object} letterIn - Letter enter animation props
 * @param {Object} letterOut - Letter exit animation props
 * @param {Object} wrapLetterIn - Letter wrapper enter animation props
 * @param {Object} wrapLetterOut - Letter wrapper exit animation props
 * @param {Object} wordIn - Word enter animation props
 * @param {Object} wordOut - Word exit animation props
 * @param {Object} wrapWordIn - Word wrapper enter animation props
 * @param {Object} wrapWordOut - Word wrapper exit animation props
 * @param {SpringConfig} lineConfig - Line spring config
 * @param {SpringConfig} wordConfig - Word spring config
 * @param {SpringConfig} letterConfig - Letter spring config
 * @param {SpringConfig} lineConfigIn - Line enter spring config
 * @param {SpringConfig} wordConfigIn - Word enter spring config
 * @param {SpringConfig} letterConfigIn - Letter enter spring config
 * @param {SpringConfig} lineConfigOut - Line exit spring config
 * @param {SpringConfig} wordConfigOut - Word exit spring config
 * @param {SpringConfig} letterConfigOut - Letter exit spring config
 * @param {number} lineDelayIn - Line enter delay
 * @param {number} letterDelayIn - Letter enter delay
 * @param {number} wordDelayIn - Word enter delay
 * @param {number} lineDelayOut - Line exit delay
 * @param {number} letterDelayOut - Letter exit delay
 * @param {number} wordDelayOut - Word exit delay
 * @param {number} lineStagger - Line stagger delay
 * @param {number} wordStagger - Word stagger delay
 * @param {number} letterStagger - Letter stagger delay
 * @param {number} lineStaggerIn - Line enter stagger delay
 * @param {number} wordStaggerIn - Word enter stagger delay
 * @param {number} letterStaggerIn - Letter enter stagger delay
 * @param {number} lineStaggerOut - Line exit stagger delay
 * @param {number} wordStaggerOut - Word exit stagger delay
 * @param {number} letterStaggerOut - Letter exit stagger delay
 * @param {number} delayIn - Global enter delay
 * @param {number} delayOut - Global exit delay
 * @param {HtmlTags} tag - HTML tag to use for container
 * @param {boolean} immediateOut - Whether to skip exit animation
 * @param {boolean} enableInOutDelayesOnRerender - Whether to apply delays on rerender
 * @param {boolean} seo - Whether to add hidden SEO text
 * @param {boolean} showSeoText - Whether to show SEO text
 * @param {Function} onTextEngine - Callback with engine instance
 * @param {TextEngineHandlerType} onTextStart - Animation start callback
 * @param {TextEngineHandlerType} onTextChange - Animation change callback
 * @param {TextEngineHandlerType} onTextResolve - Animation resolve callback
 * @param {Function} onTextFullyPlayed - Animation complete callback
 */

"use client";

import {
  useEffect,
  memo,
  useRef,
  useMemo,
  RefObject,
  useState,
  useCallback,
  forwardRef,
  ReactNode,
  CSSProperties,
  ElementType,
  useImperativeHandle,
  HTMLAttributes,
  ForwardedRef,
} from "react";
import {
  AnimationResult,
  Controller,
  Lookup,
  SpringConfig,
  SpringValue,
  useInView,
  useSprings,
} from "@react-spring/web";
import { animated } from "@react-spring/web";
import ResizeObserver from "resize-observer-polyfill";
import { Tags } from "../Springs/Spring";

export type TextEngineRenderType =
  | "line"
  | "lineWrap"
  | "word"
  | "wordWrap"
  | "letter"
  | "letterWrap";
export type TextEngineHandlerType = (
  type: TextEngineRenderType,
  result: AnimationResult<SpringValue<Lookup<any>>>,
  ctrl: Controller<Lookup<any>>
) => void;

export interface TextEngineInstance {
  mode?: "once" | "forward" | "always" | "manual";
  enabled?: boolean;
  lines?: { word: HTMLSpanElement; index: number; lineIndex: number }[][];
  words?: string[][];
  letters?: string[];
  // Play in animation
  playIn: () => void;
  // Play out animation
  playOut: () => void;
  // Pause the animation in current state
  togglePause: () => void;
}

export interface EngineProps extends HTMLAttributes<HTMLSpanElement> {
  enabled?: boolean;
  columnGap?: number | "inherit";
  mode?: "once" | "forward" | "always" | "manual";
  className?: string;
  wrapLineClassName?: string;
  lineClassName?: string;
  wrapWordClassName?: string;
  wordClassName?: string;
  wrapLetterClassName?: string;
  letterClassName?: string;
  overflow?: boolean;
  wrapLineIn?: { [key: string]: any };
  wrapLineOut?: { [key: string]: any };
  lineIn?: { [key: string]: any };
  lineOut?: { [key: string]: any };
  letterIn?: { [key: string]: any };
  letterOut?: { [key: string]: any };
  wrapLetterIn?: { [key: string]: any };
  wrapLetterOut?: { [key: string]: any };
  wordIn?: { [key: string]: any };
  wordOut?: { [key: string]: any };
  wrapWordIn?: { [key: string]: any };
  wrapWordOut?: { [key: string]: any };
  lineConfig?: SpringConfig;
  wordConfig?: SpringConfig;
  letterConfig?: SpringConfig;
  lineConfigIn?: SpringConfig;
  wordConfigIn?: SpringConfig;
  letterConfigIn?: SpringConfig;
  lineConfigOut?: SpringConfig;
  wordConfigOut?: SpringConfig;
  letterConfigOut?: SpringConfig;
  lineDelayIn?: number;
  letterDelayIn?: number;
  wordDelayIn?: number;
  lineDelayOut?: number;
  letterDelayOut?: number;
  wordDelayOut?: number;
  lineStagger?: number;
  wordStagger?: number;
  letterStagger?: number;
  lineStaggerIn?: number;
  wordStaggerIn?: number;
  letterStaggerIn?: number;
  lineStaggerOut?: number;
  wordStaggerOut?: number;
  letterStaggerOut?: number;
  delayIn?: number;
  delayOut?: number;
  tag?: HtmlTags;
  immediateOut?: boolean;
  children: string;

  enableInOutDelayesOnRerender?: boolean;
  seo?: boolean;
  showSeoText?: boolean;

  onTextEngine?: (instance: RefObject<TextEngineInstance>) => void;
  onTextStart?: TextEngineHandlerType;
  onTextChange?: TextEngineHandlerType;
  onTextResolve?: TextEngineHandlerType;
  onTextFullyPlayed?: (type: "in" | "out") => void;
}

const TextEngine = memo(
  forwardRef<HTMLElement, EngineProps & { as?: HtmlTags }>(function TextEngine(
    props,
    ref
  ) {
    // Sets props to the cache, so they dont trigger re-rendering of hooks
    return (
      <Engine
        ref={ref}
        columnGap={props.columnGap || 0.3}
        mode={props.mode || "always"}
        enabled={typeof props.enabled === "boolean" ? props.enabled : true}
        className={props.className || ""}
        wrapLineClassName={props.wrapLineClassName || ""}
        lineClassName={props.lineClassName || ""}
        wrapWordClassName={props.wrapWordClassName || ""}
        wordClassName={props.wordClassName || ""}
        wrapLetterClassName={props.wrapLetterClassName || ""}
        letterClassName={props.letterClassName || ""}
        overflow={props.overflow || false}
        wrapLineIn={props.wrapLineIn || {}}
        wrapLineOut={props.wrapLineOut || {}}
        lineIn={props.lineIn || {}}
        lineOut={props.lineOut || {}}
        wrapWordIn={props.wrapWordIn || {}}
        wrapWordOut={props.wrapWordOut || {}}
        wordIn={props.wordIn || {}}
        wordOut={props.wordOut || {}}
        wrapLetterIn={props.wrapLetterIn || {}}
        wrapLetterOut={props.wrapLetterOut || {}}
        letterIn={props.letterIn || {}}
        letterOut={props.letterOut || {}}
        lineConfig={props.lineConfig || {}}
        wordConfig={props.wordConfig || {}}
        letterConfig={props.letterConfig || {}}
        lineConfigIn={props.lineConfigIn || {}}
        wordConfigIn={props.wordConfigIn || {}}
        letterConfigIn={props.letterConfigIn || {}}
        lineConfigOut={props.lineConfigOut || {}}
        wordConfigOut={props.wordConfigOut || {}}
        letterConfigOut={props.letterConfigOut || {}}
        lineDelayIn={props.lineDelayIn || 0}
        letterDelayIn={props.letterDelayIn || 0}
        wordDelayIn={props.wordDelayIn || 0}
        lineDelayOut={props.lineDelayOut || 0}
        letterDelayOut={props.letterDelayOut || 0}
        wordDelayOut={props.wordDelayOut || 0}
        lineStagger={props.lineStagger || 100}
        wordStagger={props.wordStagger || 100}
        letterStagger={props.letterStagger || 100}
        lineStaggerIn={props.lineStaggerIn || 0}
        wordStaggerIn={props.wordStaggerIn || 0}
        letterStaggerIn={props.letterStaggerIn || 0}
        lineStaggerOut={props.lineStaggerOut || 0}
        wordStaggerOut={props.wordStaggerOut || 0}
        letterStaggerOut={props.letterStaggerOut || 0}
        delayIn={props.delayIn || 0}
        delayOut={props.delayOut || 0}
        tag={props.as || props.tag || "span"}
        seo={props.seo || false}
        showSeoText={props.showSeoText || false}
        immediateOut={props.immediateOut || true}
        enableInOutDelayesOnRerender={
          props.enableInOutDelayesOnRerender || false
        }
        onTextEngine={props.onTextEngine || (() => {})}
        onTextStart={props.onTextStart || (() => {})}
        onTextChange={props.onTextChange || (() => {})}
        onTextResolve={props.onTextResolve || (() => {})}
        onTextFullyPlayed={props.onTextFullyPlayed || (() => {})}
        {...props}
      />
    );
  })
);

TextEngine.displayName = "TextEngine";

const Engine = forwardRef(
  (
    {
      // Distance between words in "em"
      columnGap = 0.3,
      // Mode (always=play always, forward=play only on scroll from top to bottom, once=once per page load)
      mode = "always",
      // Animation plays only if true (useful to play animation after page loaded state change)
      enabled = true,

      // ClassNames
      className,
      wrapLineClassName,
      lineClassName,
      wrapWordClassName,
      wordClassName,
      wrapLetterClassName,
      letterClassName,

      // Ability to crop text while animation
      overflow = false,

      // Springs Values for Letters & Words & their wrappers
      wrapLineIn = {},
      wrapLineOut = {},
      lineIn = {},
      lineOut = {},
      wrapWordIn = {},
      wrapWordOut = {},
      wordIn = {},
      wordOut = {},
      wrapLetterIn = {},
      wrapLetterOut = {},
      letterIn = {},
      letterOut = {},

      // Spring Configs for Letters & Words & Lines
      lineConfig = {},
      wordConfig = {},
      letterConfig = {},
      lineConfigIn = {},
      wordConfigIn = {},
      letterConfigIn = {},
      lineConfigOut = {},
      wordConfigOut = {},
      letterConfigOut = {},

      // Delay after which play animation after text is on the screen for Letters & Words & Lines
      lineDelayIn = 0,
      letterDelayIn = 0,
      wordDelayIn = 0,
      lineDelayOut = 0,
      letterDelayOut = 0,
      wordDelayOut = 0,

      // Delay to change delay based on lines' or words' or texts' index, in ms
      lineStagger = 100,
      letterStagger = 100,
      wordStagger = 100,
      lineStaggerIn = 0,
      letterStaggerIn = 0,
      wordStaggerIn = 0,
      lineStaggerOut = 0,
      letterStaggerOut = 0,
      wordStaggerOut = 0,

      // Delay after which set animation to Out/In state after text is Not or On the screen for ALL
      delayIn = 0,
      delayOut = 0,

      // Change the tag is would be used as a parent ("span" by default)
      tag = "span",

      // Change the ability to play animation smoothly on Out
      immediateOut = true,

      // If True, enables delayIn, [letter/word/line]DelayIn on reactive content change
      enableInOutDelayesOnRerender = false,
      // If true, add additional text with the same content but without animation, and use it for SEO and copy
      seo = true,
      showSeoText = false,

      // Callbacks
      onTextEngine = () => {},
      onTextStart = () => {},
      onTextChange = () => {},
      onTextResolve = () => {},
      onTextFullyPlayed = () => {},

      // Text to display
      children,
      style,

      ...props
    }: EngineProps,
    outerRef: ForwardedRef<HTMLElement>
  ) => {
    const [ref, inView] = useInView();
    useImperativeHandle(outerRef, () => ref.current as HTMLElement);

    const scrolledDown = useRef(false);
    const [innerEnabled, setInnerEnabled] = useState(true);

    // New words for reactive smooth animation on children change
    const newWords = useMemo<string[][]>(
      () =>
        children
          .toString()
          .split(" ")
          .map((word: string) => word.split("")),
      [children]
    );
    const [words, setWords] = useState(newWords);
    const rerenderTimeout = useRef<any>(null);
    const rerendering = useRef(false);

    // Handle reactive text change
    useEffect(() => {
      if (JSON.stringify(words) === JSON.stringify(newWords)) {
        return;
      }
      clearTimeout(rerenderTimeout.current);
      rerendering.current = false;

      if (!immediateOut) {
        const { durationOut } = getDurations();
        setInnerEnabled(false);
        rerendering.current = true;
        rerenderTimeout.current = setTimeout(() => {
          setWords(newWords);
          setInnerEnabled(true);
          setTimeout(() => {
            rerendering.current = false;
          }, 50);
        }, durationOut + 50);
        return;
      }
      setInnerEnabled(false);
      rerendering.current = true;
      rerenderTimeout.current = setTimeout(() => {
        setWords(newWords);
        setInnerEnabled(true);
        setTimeout(() => {
          rerendering.current = false;
        }, 50);
      }, 50);
    }, [newWords, immediateOut]);

    const letters = useMemo(() => words.flat(), [words]);
    const [lines, _setLines] = useState<
      { word: HTMLSpanElement; index: number; lineIndex: number }[][]
    >([]);

    const setLines = useCallback(
      () => void _setLines(calcLinesRefs(ref)),
      [_setLines]
    );
    useEffect(() => void setLines(), [letters, setLines, words]);
    useResizeObserver(ref, setLines);

    // Instance for external imperative usage
    const [paused, setPaused] = useState(false);
    const [isIn, setIsIn] = useState(false);
    const instance: RefObject<TextEngineInstance> = useRef({
      mode,
      enabled,
      letters,
      lines,
      words,
      playIn: () => setIsIn(true),
      playOut: () => setIsIn(false),
      togglePause: () => setPaused(!paused),
    });
    function updateInstance() {
      // @ts-expect-error
      instance.current.letters = letters;
      // @ts-expect-error
      instance.current.lines = lines;
      // @ts-expect-error
      instance.current.words = words;
      // @ts-expect-error
      instance.current.mode = mode;
      // Enabled state is not used for manual mode
      // @ts-expect-error
      instance.current.enabled =
        (enabled && innerEnabled && !paused && mode !== "manual") ||
        (innerEnabled && !paused && mode === "manual");
    }
    useEffect(
      () => void updateInstance(),
      [letters, lines, words, mode, enabled, innerEnabled, paused]
    );

    // Only for "FORWARD" mode
    useEffect(() => {
      if (typeof window === "undefined") return;
      if (mode !== "forward") {
        return;
      }
      function handler() {
        if (ref.current) {
          if (ref.current.getBoundingClientRect().top > 0) {
            scrolledDown.current = false;
          } else {
            scrolledDown.current = true;
          }
        }
      }
      window.addEventListener("scroll", handler);
      return () => window.removeEventListener("scroll", handler);
    }, [mode]);

    // Only for "ONCE" mode
    useEffect(() => {
      if (inView && enabled && innerEnabled && mode === "once") {
        scrolledDown.current = true;
      }
    }, [inView, enabled, innerEnabled]);

    const [wrapLineSprings, wrapLineApi] = useSprings(lines.length, () => ({
      ...wrapLineOut,
      onStart: (result, ctrl) => onTextStart("lineWrap", result, ctrl),
      onResolve: (result, ctrl) => onTextResolve("lineWrap", result, ctrl),
      onChange: (result, ctrl) => onTextChange("lineWrap", result, ctrl),
    }));
    const wrapLineStyle = useCallback(
      (wordIndex: number) => {
        const index =
          lines.flat().find((_) => _.index === wordIndex)?.lineIndex || 0;
        return wrapLineSprings[index];
      },
      [wrapLineSprings, lines]
    );
    const [lineSprings, lineApi] = useSprings(lines.length, () => ({
      ...lineOut,
      onStart: (result, ctrl) => onTextStart("line", result, ctrl),
      onResolve: (result, ctrl) => onTextResolve("line", result, ctrl),
      onChange: (result, ctrl) => onTextChange("line", result, ctrl),
    }));
    const lineStyle = useCallback(
      (wordIndex: number) => {
        const index =
          lines.flat().find((_) => _.index === wordIndex)?.lineIndex || 0;
        return lineSprings[index];
      },
      [lineSprings, lines]
    );
    const [wrapWordSprings, wrapWordApi] = useSprings(words.length, () => ({
      ...wrapWordOut,
      onStart: (result, ctrl) => onTextStart("wordWrap", result, ctrl),
      onResolve: (result, ctrl) => onTextResolve("wordWrap", result, ctrl),
      onChange: (result, ctrl) => onTextChange("wordWrap", result, ctrl),
    }));
    const [wordSprings, wordApi] = useSprings(words.length, () => ({
      ...wordOut,
      onStart: (result, ctrl) => onTextStart("word", result, ctrl),
      onResolve: (result, ctrl) => onTextResolve("word", result, ctrl),
      onChange: (result, ctrl) => onTextChange("word", result, ctrl),
    }));
    const [wrapLetterSprings, wrapLetterApi] = useSprings(
      letters.length,
      () => ({
        ...wrapLetterOut,
        onStart: (result, ctrl) => onTextStart("letterWrap", result, ctrl),
        onResolve: (result, ctrl) => onTextResolve("letterWrap", result, ctrl),
        onChange: (result, ctrl) => onTextChange("letterWrap", result, ctrl),
      })
    );
    const [letterSprings, letterApi] = useSprings(letters.length, () => ({
      ...letterOut,
      onStart: (result, ctrl) => onTextStart("letter", result, ctrl),
      onResolve: (result, ctrl) => onTextResolve("letter", result, ctrl),
      onChange: (result, ctrl) => onTextChange("letter", result, ctrl),
    }));

    const fullyPlayedTimeoutIn = useRef<any>(null);
    const fullyPlayedTimeoutOut = useRef<any>(null);
    const [played, setPlayed] = useState(false);

    const getDurations = useCallback(() => {
      const isLine = Object.keys(lineIn).length > 0 ? 1 : 0;
      const isWord = Object.keys(wordIn).length > 0 ? 1 : 0;
      const isLetter = Object.keys(letterIn).length > 0 ? 1 : 0;

      const playingLineDurationIn =
        (lines.length - 1) * (lineStaggerIn || lineStagger) +
        (lineConfigIn?.duration || lineConfig?.duration || 1200);
      const playingWordDurationIn =
        (words.length - 1) * (wordStaggerIn || wordStagger) +
        (wordConfigIn?.duration || wordConfig?.duration || 1200);
      const playingLetterDurationIn =
        (letters.length - 1) * (letterStaggerIn || letterStagger) +
        (letterConfigIn?.duration || letterConfig?.duration || 1200);
      let playingLineDurationOut = 0;
      let playingWordDurationOut = 0;
      let playingLetterDurationOut = 0;

      let delayingLineDurationIn = delayIn + lineDelayIn;
      let delayingWordDurationIn = delayIn + wordDelayIn;
      let delayingLetterDurationIn = delayIn + letterDelayIn;
      let delayingLineDurationOut = delayOut + lineDelayOut;
      let delayingWordDurationOut = delayOut + wordDelayOut;
      let delayingLetterDurationOut = delayOut + letterDelayOut;

      const isNoDelayes =
        (!enableInOutDelayesOnRerender && rerendering.current) ||
        (immediateOut && rerendering.current);
      if (isNoDelayes) {
        delayingLineDurationIn = 0;
        delayingWordDurationIn = 0;
        delayingLetterDurationIn = 0;
        delayingLineDurationOut = 0;
        delayingWordDurationOut = 0;
        delayingLetterDurationOut = 0;
      }

      if (!immediateOut) {
        playingLineDurationOut =
          (lines.length - 1) * (lineStaggerOut || lineStagger) +
          (lineConfigOut?.duration || lineConfig?.duration || 1200);
        playingWordDurationOut =
          (words.length - 1) * (wordStaggerOut || wordStagger) +
          (wordConfigOut?.duration || wordConfig?.duration || 1200);
        playingLetterDurationOut =
          (letters.length - 1) * (letterStaggerOut || letterStagger) +
          (letterConfigOut?.duration || letterConfig?.duration || 1200);
      }

      const lineDurationIn = delayingLineDurationIn + playingLineDurationIn;
      const wordsDurationIn = delayingWordDurationIn + playingWordDurationIn;
      const letterDurationIn =
        delayingLetterDurationIn + playingLetterDurationIn;
      const lineDurationOut = delayingLineDurationOut + playingLineDurationOut;
      const wordsDurationOut = delayingWordDurationOut + playingWordDurationOut;
      const letterDurationOut =
        delayingLetterDurationOut + playingLetterDurationOut;

      const durationIn = Math.max(
        lineDurationIn * isLine,
        Math.max(wordsDurationIn * isWord, letterDurationIn * isLetter)
      );
      const durationOut = Math.max(
        lineDurationOut * isLine,
        Math.max(wordsDurationOut * isWord, letterDurationOut * isLetter)
      );

      return { durationIn, durationOut };
    }, [
      lines.length,
      words.length,
      letters.length,
      lineStaggerIn,
      lineStagger,
      wordStaggerIn,
      wordStagger,
      letterStaggerIn,
      letterStagger,
      lineConfigIn,
      lineConfig,
      wordConfigIn,
      wordConfig,
      letterConfigIn,
      letterConfig,
      delayIn,
      lineDelayIn,
      wordDelayIn,
      letterDelayIn,
      delayOut,
      lineDelayOut,
      wordDelayOut,
      letterDelayOut,
      enableInOutDelayesOnRerender,
      rerendering,
      immediateOut,
      lineStaggerOut,
      wordStaggerOut,
      letterStaggerOut,
      lineConfigOut,
      wordConfigOut,
      letterConfigOut,
    ]);

    const _delayIn = useCallback(
      (enter: number, sEnter: number, stagger: number) => {
        const isNoDelayes =
          !enableInOutDelayesOnRerender && rerendering.current;
        if (isNoDelayes) {
          return stagger;
        }
        return enter + sEnter + stagger;
      },
      [enableInOutDelayesOnRerender, rerendering]
    );

    const _delayOut = useCallback(
      (enter: number, sEnter: number, stagger: number) => {
        if (!immediateOut) {
          const isNoDelayes =
            !enableInOutDelayesOnRerender && rerendering.current;
          if (isNoDelayes) {
            return stagger;
          }
          return enter + sEnter + stagger;
        }
        return 0;
      },
      [immediateOut, enableInOutDelayesOnRerender, rerendering]
    );

    const playOut = useCallback(
      (durationOut: number) => {
        setPlayed(false);
        clearTimeout(fullyPlayedTimeoutOut.current);
        // line
        isNotEmpty(wrapLineOut) &&
          wrapLineApi.start((index: number) => ({
            ...wrapLineOut,
            delay: _delayOut(
              delayOut,
              lineDelayOut,
              index * (lineStaggerOut || lineStagger)
            ),
            config: isNotEmpty(lineConfigOut) ? lineConfigOut : lineConfig,
            immediate: immediateOut,
          }));
        isNotEmpty(lineOut) &&
          lineApi.start((index: number) => ({
            ...lineOut,
            delay: _delayOut(
              delayOut,
              lineDelayOut,
              index * (lineStaggerOut || lineStagger)
            ),
            config: isNotEmpty(lineConfigOut) ? lineConfigOut : lineConfig,
            immediate: immediateOut,
          }));
        // word

        isNotEmpty(wrapWordOut) &&
          wrapWordApi.start((index: number) => ({
            ...wrapWordOut,
            delay: _delayOut(
              delayOut,
              wordDelayOut,
              index * (wordStaggerOut || wordStagger)
            ),
            config: isNotEmpty(wordConfigOut) ? wordConfigOut : wordConfig,
            immediate: immediateOut,
          }));
        isNotEmpty(wordOut) &&
          wordApi.start((index: number) => ({
            ...wordOut,
            delay: _delayOut(
              delayOut,
              wordDelayOut,
              index * (wordStaggerOut || wordStagger)
            ),
            config: isNotEmpty(wordConfigOut) ? wordConfigOut : wordConfig,
            immediate: immediateOut,
          }));
        // letter
        isNotEmpty(wrapLetterOut) &&
          wrapLetterApi.start((index: number) => ({
            ...wrapLetterOut,
            delay: _delayOut(
              delayOut,
              letterDelayOut,
              index * (letterStaggerOut || letterStagger)
            ),
            config: isNotEmpty(letterConfigOut)
              ? letterConfigOut
              : letterConfig,
            immediate: immediateOut,
          }));
        isNotEmpty(letterOut) &&
          letterApi.start((index: number) => ({
            ...letterOut,
            delay: _delayOut(
              delayOut,
              letterDelayOut,
              index * (letterStaggerOut || letterStagger)
            ),
            config: isNotEmpty(letterConfigOut)
              ? letterConfigOut
              : letterConfig,
            immediate: immediateOut,
          }));
        fullyPlayedTimeoutOut.current = setTimeout(
          () => onTextFullyPlayed("out"),
          durationOut
        );
      },
      [
        wrapLineApi,
        lineApi,
        wrapWordApi,
        wordApi,
        wrapLetterApi,
        letterApi,
        wrapLineOut,
        lineOut,
        wrapWordOut,
        wordOut,
        wrapLetterOut,
        letterOut,
        delayOut,
        lineDelayOut,
        wordDelayOut,
        letterDelayOut,
        lineStaggerOut,
        wordStaggerOut,
        letterStaggerOut,
        lineStagger,
        wordStagger,
        letterStagger,
        lineConfigOut,
        wordConfigOut,
        letterConfigOut,
        lineConfig,
        wordConfig,
        letterConfig,
        immediateOut,
        _delayOut,
        onTextFullyPlayed,
        getDurations,
      ]
    );

    const playIn = useCallback(
      (durationIn: number) => {
        setPlayed(true);
        clearTimeout(fullyPlayedTimeoutIn.current);
        // line
        isNotEmpty(wrapLineIn) &&
          wrapLineApi.start((index: number) => ({
            ...wrapLineIn,
            delay: _delayIn(
              delayIn,
              lineDelayIn,
              index * (lineStaggerIn || lineStagger)
            ),
            config: isNotEmpty(lineConfigIn) ? lineConfigIn : lineConfig,
          }));
        isNotEmpty(lineIn) &&
          lineApi.start((index: number) => ({
            ...lineIn,
            delay: _delayIn(
              delayIn,
              lineDelayIn,
              index * (lineStaggerIn || lineStagger)
            ),
            config: isNotEmpty(lineConfigIn) ? lineConfigIn : lineConfig,
          }));
        // word
        isNotEmpty(wrapWordIn) &&
          wrapWordApi.start((index: number) => ({
            ...wrapWordIn,
            delay: _delayIn(
              delayIn,
              wordDelayIn,
              index * (wordStaggerIn || wordStagger)
            ),
            config: isNotEmpty(wordConfigIn) ? wordConfigIn : wordConfig,
          }));
        isNotEmpty(wordIn) &&
          wordApi.start((index: number) => ({
            ...wordIn,
            delay: _delayIn(
              delayIn,
              wordDelayIn,
              index * (wordStaggerIn || wordStagger)
            ),
            config: isNotEmpty(wordConfigIn) ? wordConfigIn : wordConfig,
          }));
        // letter
        isNotEmpty(wrapLetterIn) &&
          wrapLetterApi.start((index: number) => ({
            ...wrapLetterIn,
            delay: _delayIn(
              delayIn,
              letterDelayIn,
              index * (letterStaggerIn || letterStagger)
            ),
            config: isNotEmpty(letterConfigIn) ? letterConfigIn : letterConfig,
          }));
        isNotEmpty(letterIn) &&
          letterApi.start((index: number) => ({
            ...letterIn,
            delay: _delayIn(
              delayIn,
              letterDelayIn,
              index * (letterStaggerIn || letterStagger)
            ),
            config: isNotEmpty(letterConfigIn) ? letterConfigIn : letterConfig,
          }));
        fullyPlayedTimeoutIn.current = setTimeout(
          () => onTextFullyPlayed("in"),
          durationIn
        );
      },
      [
        wrapLineApi,
        lineApi,
        wrapWordApi,
        wordApi,
        wrapLetterApi,
        letterApi,
        wrapLineIn,
        lineIn,
        wrapWordIn,
        wordIn,
        wrapLetterIn,
        letterIn,
        delayIn,
        lineDelayIn,
        wordDelayIn,
        letterDelayIn,
        lineStaggerIn,
        wordStaggerIn,
        letterStaggerIn,
        lineStagger,
        wordStagger,
        letterStagger,
        lineConfigIn,
        wordConfigIn,
        letterConfigIn,
        lineConfig,
        wordConfig,
        letterConfig,
        _delayIn,
        onTextFullyPlayed,
        getDurations,
      ]
    );

    // Only for "ALWAYS" and "FORWARD" and "ONCE" modes
    useEffect(() => {
      if (mode === "manual") {
        return;
      }
      if (paused) return;
      const { durationIn, durationOut } = getDurations();
      if (inView && enabled && innerEnabled && !played) {
        playIn(durationIn);
        return;
      }
      if (
        (!scrolledDown.current && played && !inView) ||
        (played && !scrolledDown.current && (!enabled || !innerEnabled))
      ) {
        playOut(durationOut);
        return;
      }
    }, [
      inView,
      enabled,
      innerEnabled,
      played,
      letterApi,
      wordApi,
      lineApi,
      letterIn,
      letterOut,
      wordIn,
      wordOut,
      lineIn,
      lineOut,
      wordConfig,
      letterConfig,
      lineConfig,
      wordConfigIn,
      letterConfigIn,
      lineConfigIn,
      wordConfigOut,
      letterConfigOut,
      lineConfigOut,
      delayOut,
      delayIn,
      wordDelayIn,
      letterDelayIn,
      lineDelayIn,
      wordStagger,
      letterStagger,
      lineStagger,
      wrapWordOut,
      wrapWordIn,
      wrapLetterOut,
      wrapLetterIn,
      wrapLineIn,
      wrapLineOut,
      wrapLineApi,
      words,
      getDurations,
      mode,
      paused,
      scrolledDown,
      playIn,
      playOut,
    ]);

    // Only for "MANUAL" mode
    useEffect(() => {
      if (mode !== "manual") {
        return;
      }
      if (paused) return;
      const { durationIn, durationOut } = getDurations();
      if (isIn && innerEnabled && !played) {
        playIn(durationIn);
        return;
      }
      if ((!isIn && played) || (!innerEnabled && played)) {
        playOut(durationOut);
        return;
      }
    }, [
      paused,
      isIn,
      lines,
      letters,
      words,
      wrapLineApi,
      wrapWordApi,
      wrapLetterApi,
      lineApi,
      wordApi,
      letterApi,
      lineIn,
      lineOut,
      wordIn,
      wordOut,
      letterIn,
      letterOut,
      lineConfig,
      wordConfig,
      letterConfig,
      lineConfigIn,
      wordConfigIn,
      letterConfigIn,
      lineConfigOut,
      wordConfigOut,
      letterConfigOut,
      delayOut,
      delayIn,
      wordDelayIn,
      letterDelayIn,
      lineDelayIn,
      wordStagger,
      letterStagger,
      lineStagger,
      wrapWordOut,
      wrapWordIn,
      wrapLetterOut,
      wrapLetterIn,
      wrapLineIn,
      wrapLineOut,
    ]);

    const renderText = useMemo(() => {
      const WrapLine = ({
        children,
        wordIndex,
      }: {
        children: ReactNode;
        wordIndex: number;
      }) => {
        return (
          <animated.span
            style={{
              ...wrapLineStyle(wordIndex),
              ...{
                overflow: overflow ? "hidden" : "initial",
                display: "inline-block",
                userSelect: seo ? "none" : "auto",
              },
            }}
            className={
              "line-word" + (wrapLineClassName ? " " + wrapLineClassName : "")
            }
          >
            {children}
          </animated.span>
        );
      };
      const Line = ({
        children,
        wordIndex,
      }: {
        children: ReactNode;
        wordIndex: number;
      }) => {
        return isNotEmpty(lineIn) ? (
          <animated.span
            style={{
              display: "inline-block",
              ...lineStyle(wordIndex),
              userSelect: seo ? "none" : "auto",
            }}
            className={lineClassName}
          >
            {children}
          </animated.span>
        ) : (
          <>{children}</>
        );
      };
      const WrapWord = ({
        children,
        wordIndex,
      }: {
        children: ReactNode;
        wordIndex: number;
      }) => {
        return isNotEmpty(wrapWordIn) ? (
          <animated.span
            style={{
              display: "inline-block",
              ...wrapWordSprings[wordIndex],
              ...{ overflow: overflow ? "hidden" : "initial" },
              userSelect: seo ? "none" : "auto",
            }}
            className={wrapWordClassName}
          >
            {children}
          </animated.span>
        ) : (
          <>{children}</>
        );
      };
      const Word = ({
        children,
        wordIndex,
      }: {
        children: ReactNode;
        wordIndex: number;
      }) => {
        return isNotEmpty(wordIn) ? (
          <animated.span
            style={{
              display: "inline-block",
              userSelect: seo ? "none" : "auto",
              ...wordSprings[wordIndex],
            }}
            className={wordClassName}
          >
            {children}
          </animated.span>
        ) : (
          <>{children}</>
        );
      };
      const WrapLetter = ({
        children,
        letterIndex,
      }: {
        children: ReactNode;
        letterIndex: number;
      }) => {
        return isNotEmpty(wrapLetterIn) ? (
          <animated.span
            style={{
              display: "inline-block",
              userSelect: seo ? "none" : "auto",
              ...wrapLetterSprings[letterIndex],
              ...{ overflow: overflow ? "hidden" : "initial" },
            }}
            className={wrapLetterClassName}
          >
            {children}
          </animated.span>
        ) : (
          <>{children}</>
        );
      };
      const Letter = ({
        children,
        letterIndex,
      }: {
        children: ReactNode;
        letterIndex: number;
      }) => {
        return isNotEmpty(letterIn) ? (
          <animated.span
            style={{
              display: "inline-block",
              userSelect: seo ? "none" : "auto",
              ...letterSprings[letterIndex],
            }}
            className={letterClassName}
          >
            {children}
          </animated.span>
        ) : (
          <>{children}</>
        );
      };

      const WordLetters = ({
        word,
        wordIndex,
      }: {
        word: string[];
        wordIndex: number;
      }) => {
        return isNotEmpty(wrapLetterIn) || isNotEmpty(letterIn) ? (
          word.map((letter: string, letterIndex: number) => {
            const index = words.slice(0, wordIndex).flat().length + letterIndex;
            return (
              <WrapLetter key={letterIndex} letterIndex={index}>
                <Letter letterIndex={index}>{letter}</Letter>
              </WrapLetter>
            );
          })
        ) : (
          <>{word}</>
        );
      };

      return (
        <VarTextTag
          tag={tag}
          ref={ref}
          style={{
            position: "relative",
            columnGap:
              typeof columnGap === "number" ? `${columnGap}em` : columnGap,
            display: "flex",
            flexWrap: "wrap",
            ...style,
          }}
          className={className}
          {...props}
        >
          {seo && (
            <span
              style={{
                userSelect: "auto",
                color: showSeoText ? "red" : "transparent",
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
              }}
            >
              {children}
            </span>
          )}
          {words.map((word: string[], wordIndex: number) => (
            <WrapLine wordIndex={wordIndex} key={wordIndex}>
              <Line wordIndex={wordIndex}>
                <WrapWord wordIndex={wordIndex}>
                  <Word wordIndex={wordIndex}>
                    <WordLetters word={word} wordIndex={wordIndex} />
                  </Word>
                </WrapWord>
              </Line>
            </WrapLine>
          ))}
        </VarTextTag>
      );
    }, [
      words,
      className,
      wrapLetterClassName,
      wrapWordClassName,
      lineClassName,
      wrapLineClassName,
      tag,
      columnGap,
      wrapLineIn,
      lineIn,
      wrapWordIn,
      wordIn,
      wrapLetterIn,
      letterIn,
      wrapLineOut,
      lineOut,
      wrapWordOut,
      wordOut,
      wrapLetterOut,
      letterOut,
    ]);

    return renderText;
  }
);

Engine.displayName = "Engine";

export type HtmlTags = Tags;

export interface VarTextTagProps {
  tag?: HtmlTags;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const VarTextTag = forwardRef<HTMLElement, VarTextTagProps>(
  ({ tag = "span", children, className, style, ...props }, outerRef) => {
    const ref = useRef<HTMLElement | null>(null);
    useImperativeHandle(outerRef, () => ref.current as HTMLElement);
    const Tag = tag as ElementType;

    return (
      <Tag ref={ref} className={className} style={style} {...props}>
        {children}
      </Tag>
    );
  }
);
VarTextTag.displayName = "VarTextTag";

export const useResizeObserver = (
  trigger: RefObject<any>,
  rerender: (newWidth: number, oldWidth: number) => void
) => {
  const width = useRef<number>(0);

  useEffect(() => {
    const divElement = trigger.current;
    if (!divElement) return;

    const handleResize = (entries: any) => {
      for (let entry of entries) {
        if (entry.target === divElement) {
          const oldWidth = width.current;
          const newWidth = entry.contentRect.width;
          width.current = newWidth;
          rerender(newWidth, oldWidth);
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(divElement);

    return () => {
      resizeObserver.unobserve(divElement);
    };
  }, [rerender]);
};

export function calcLinesRefs(containerRef: RefObject<any>) {
  if (!containerRef.current) {
    return [];
  }
  const { top: containerTop } = containerRef.current.getBoundingClientRect();
  const _words = containerRef.current.querySelectorAll(".line-word");
  if (!_words.length) {
    return [];
  }
  const lines: { word: HTMLSpanElement; index: number; lineIndex: number }[][] =
    [];
  // IMPORTANT: Calc lines count based on height, be carefull with adding *row-gap*
  // IMPORTANT: *All words same height*
  const wordHeight = _words[0].getBoundingClientRect().height;

  _words.forEach((w: HTMLSpanElement, index: number) => {
    const { top: wordTop } = w.getBoundingClientRect();
    const lineIndex = Math.floor((wordTop - containerTop) / wordHeight);
    lines[lineIndex] = [
      ...(lines[lineIndex] || []),
      { word: w, index, lineIndex },
    ];
  });

  return lines;
}

export function isNotEmpty(obj: { [key: string]: any }): boolean {
  return Object.keys(obj).length > 0;
}

export default TextEngine;

type TextEngineFactory = {
  [K in HtmlTags]: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<Omit<EngineProps, "as">> &
      React.RefAttributes<HTMLElement>
  >;
};

// Use this function to get a factory for your custom text component
export const getTextFactory = (Component: any): TextEngineFactory => {
  return new Proxy({} as TextEngineFactory, {
    get(_, tag: string) {
      return memo(
        forwardRef((props: Omit<EngineProps, "as">, ref) => (
          <Component as={tag as HtmlTags} ref={ref} {...props} />
        ))
      );
    },
  });
};

export const tengine = getTextFactory(TextEngine);
