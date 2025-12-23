/**
 * @fileoverview Text animation component that animates text based on scroll progress
 * 
 * This component extends TextEngine to provide scroll-based text animations:
 * 1. Animates text elements based on scroll position
 * 2. Supports configurable trigger points and progress ranges
 * 3. Uses spring animations for smooth transitions
 * 
 * @param {boolean} enabled - Whether animations are enabled
 * @param {number} columnGap - Gap between words in em units
 * @param {string} className - Container class name
 * @param {string} wrapLineClassName - Line wrapper class name
 * @param {string} lineClassName - Line class name
 * @param {string} wrapWordClassName - Word wrapper class name
 * @param {string} wordClassName - Word class name
 * @param {string} wrapLetterClassName - Letter wrapper class name
 * @param {string} letterClassName - Letter class name
 * @param {boolean} overflow - Whether to crop text during animation
 * @param {SpringConfig} config - Spring animation configuration
 * @param {TriggerPos} triggerStart - Start position for scroll trigger
 * @param {TriggerPos} triggerEnd - End position for scroll trigger
 * @param {HtmlTags} tag - HTML tag to use for container
 * @param {boolean} seo - Whether to add hidden SEO text
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
  useImperativeHandle,
  HTMLAttributes,
  ForwardedRef,
} from "react";
import {
  AnimationResult,
  Controller,
  Lookup,
  SpringConfig,
  SpringRef,
  SpringValue,
  useSprings,
} from "@react-spring/web";
import { animated } from "@react-spring/web";
import { useLoopInView } from "@/hooks/useLoopInView";
import {
  calcLinesRefs,
  HtmlTags,
  isNotEmpty,
  useResizeObserver,
  VarTextTag,
} from "./TextEngine";
import { TriggerPos, ProgressTrigger } from "../Springs/ProgressTrigger";
import { config } from "@react-spring/web";
import { lerp, transformRange } from "@/utils/math";

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

export interface EngineProps extends HTMLAttributes<HTMLSpanElement> {
  enabled?: boolean;
  columnGap?: number | "inherit";
  mode?: "once" | "always" | "manual";
  type?: "toggle" | "interpolate";
  interpolationStaggerCoefficient?: number;
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
  tag?: HtmlTags;
  children: string;
  seo?: boolean;
  showSeoText?: boolean;
  trigger?: RefObject<HTMLElement | null> | null;
  start?: TriggerPos;
  end?: TriggerPos;
  onTextStart?: TextEngineHandlerType;
  onTextChange?: TextEngineHandlerType;
  onTextResolve?: TextEngineHandlerType;
  onTextFullyPlayed?: (type: "in" | "out") => void;
}

const TextProgress = memo(
  forwardRef<{ progress: RefObject<number> }, EngineProps & { as?: HtmlTags }>(
    function TextEngine(props, ref) {
      // Sets props to the cache, so they dont trigger re-rendering of hooks
      return (
        <Engine
          ref={ref}
          columnGap={props.columnGap || 0.3}
          mode={props.mode || "always"}
          type={props.type || "toggle"}
          enabled={typeof props.enabled === "boolean" ? props.enabled : true}
          interpolationStaggerCoefficient={
            props.interpolationStaggerCoefficient || 0.3
          }
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
          tag={props.as || props.tag || "span"}
          seo={props.seo || false}
          showSeoText={props.showSeoText || false}
          trigger={props.trigger || null}
          start={props.start || "top bottom"}
          end={props.end || "bottom top"}
          onTextStart={props.onTextStart || (() => {})}
          onTextChange={props.onTextChange || (() => {})}
          onTextResolve={props.onTextResolve || (() => {})}
          onTextFullyPlayed={props.onTextFullyPlayed || (() => {})}
          {...props}
        />
      );
    }
  )
);

TextProgress.displayName = "TextProgress";

export default TextProgress;

const Engine = forwardRef(
  (
    {
      // Distance between words in "em"
      columnGap = 0.3,
      // Mode (always=play always, forward=play only on scroll from top to bottom, once=once per page load)
      mode = "always",
      // Change animation type (toggle=switch between in/out, interpolate=interpolate between in/out)
      type = "toggle",
      // Stagger coefficient for interpolation (0-1)
      interpolationStaggerCoefficient = 0.3,
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

      lineConfig = {},
      wordConfig = {},
      letterConfig = {},

      // Change the tag is would be used as a parent ("span" by default)
      tag = "span",

      // If true, add additional text with the same content but without animation, and use it for SEO and copy
      seo = true,
      showSeoText = false,

      onTextStart = () => {},
      onTextChange = () => {},
      onTextResolve = () => {},
      onTextFullyPlayed = () => {},

      // Change container to trigger
      trigger,
      start,
      end,

      // Text to display
      children,
      style,

      ...props
    }: EngineProps,
    outerRef: ForwardedRef<{ progress: RefObject<number> }>
  ) => {
    const ref = useRef<HTMLElement>(null);
    useImperativeHandle(outerRef, () => ({
      progress: progress,
    }));
    const scrolledDown = useRef(false);

    // New words for reactive smooth animation on children change
    const words = useMemo<string[][]>(
      () =>
        children
          .toString()
          .split(" ")
          .map((word: string) => word.split("")),
      [children]
    );
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

    function play(
      array: {
        api: SpringRef<any>;
        in: any;
        out: any;
        length: number;
        config?: SpringConfig;
      }[],
      progress: number
    ) {
      _progress.current = progress;

      if (mode === "once" && scrolledDown.current) {
        return;
      }

      if (progress === 1) {
        scrolledDown.current = true;
      }

      array.forEach((item) => {
        isNotEmpty(item.in) &&
          item.api.start((index: number) => {
            const p = index / item.length;

            if (type === "toggle") {
              if (_progress.current > p) {
                return {
                  ...item.in,
                  config: item.config || config.default,
                };
              }
              return {
                ...item.out,
                config: item.config || config.default,
              };
            }

            const itemProgress = transformRange(
              _progress.current,
              p - interpolationStaggerCoefficient,
              p,
              1,
              0
            );
            const interpolatedValue = interpolate(
              item.in,
              item.out,
              itemProgress
            );

            return {
              ...interpolatedValue,
              config: item.config || config.default,
            };
          });
      });
    }

    const progress = useRef(0);
    const _progress = useRef(0);
    useLoopInView(
      ref as RefObject<HTMLDivElement>,
      () => {
        if (mode !== "manual") return;
        if (_progress.current === progress.current) return;
        play(
          [
            {
              api: wrapLineApi,
              in: wrapLineIn,
              out: wrapLineOut,
              length: lines.length,
              config: lineConfig,
            },
            {
              api: lineApi,
              in: lineIn,
              out: lineOut,
              length: lines.length,
              config: lineConfig,
            },
            {
              api: wrapWordApi,
              in: wrapWordIn,
              out: wrapWordOut,
              length: words.length,
              config: wordConfig,
            },
            {
              api: wordApi,
              in: wordIn,
              out: wordOut,
              length: words.length,
              config: wordConfig,
            },
            {
              api: wrapLetterApi,
              in: wrapLetterIn,
              out: wrapLetterOut,
              length: letters.length,
              config: letterConfig,
            },
            {
              api: letterApi,
              in: letterIn,
              out: letterOut,
              length: letters.length,
              config: letterConfig,
            },
          ],
          progress.current
        );
      },
      { framerate: 10 }
    );

    const renderText = useMemo(() => {
      const Wrapper = ({ children }: { children: ReactNode }) => {
        if (mode === "manual") {
          return (
            <VarTextTag
              tag={tag}
              ref={ref as any}
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
              {children}
            </VarTextTag>
          );
        }

        return (
          <ProgressTrigger
            tag={tag}
            trigger={trigger as any}
            ref={ref as any}
            start={start}
            end={end}
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
            onChange={(values) => {
              play(
                [
                  {
                    api: wrapLineApi,
                    in: wrapLineIn,
                    out: wrapLineOut,
                    length: lines.length,
                    config: lineConfig,
                  },
                  {
                    api: lineApi,
                    in: lineIn,
                    out: lineOut,
                    length: lines.length,
                    config: lineConfig,
                  },
                  {
                    api: wrapWordApi,
                    in: wrapWordIn,
                    out: wrapWordOut,
                    length: words.length,
                    config: wordConfig,
                  },
                  {
                    api: wordApi,
                    in: wordIn,
                    out: wordOut,
                    length: words.length,
                    config: wordConfig,
                  },
                  {
                    api: wrapLetterApi,
                    in: wrapLetterIn,
                    out: wrapLetterOut,
                    length: letters.length,
                    config: letterConfig,
                  },
                  {
                    api: letterApi,
                    in: letterIn,
                    out: letterOut,
                    length: letters.length,
                    config: letterConfig,
                  },
                ],
                values.progress
              );
            }}
          >
            {children}
          </ProgressTrigger>
        );
      };

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
        <Wrapper>
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
        </Wrapper>
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
      props,
    ]);

    return renderText;
  }
);

// TODO: test this
function interpolate(
  start: { [key: string]: any },
  end: { [key: string]: any },
  progress: number
) {
  const result: { [key: string]: any } = {};

  // Helper to extract number from string with units
  const extractNumber = (
    value: any
  ): { number: number; unit: string | null } => {
    if (typeof value === "number") return { number: value, unit: null };
    if (typeof value === "string") {
      // Handle CSS transform functions like translate(10px) or rotate(45deg)
      const functionMatch = value.match(/^([a-zA-Z]+)\(([-0-9.]+)([^)]*)\)$/);
      if (functionMatch) {
        return {
          number: parseFloat(functionMatch[2]),
          unit: `${functionMatch[1]}(${functionMatch[3]})`,
        };
      }
      // Handle regular values with units like 45deg or 100px
      const match = value.match(/([-0-9.]+)([^0-9.]+)/);
      if (match) {
        return {
          number: parseFloat(match[1]),
          unit: match[2],
        };
      }
    }
    return { number: 0, unit: null };
  };

  // Interpolate each property in the objects
  for (const key in start) {
    const startVal = extractNumber(start[key]);
    const endVal = extractNumber(end[key]);

    if (startVal.unit !== null || endVal.unit !== null) {
      const unit = startVal.unit || endVal.unit;
      if (unit?.includes("(")) {
        // Check if it's any CSS transform function
        result[key] = `${unit.split("(")[0]}(${lerp(
          startVal.number,
          endVal.number,
          progress
        )}${unit.split(")")[0].slice(unit.split("(")[0].length)})`;
      } else {
        result[key] = `${lerp(
          startVal.number,
          endVal.number,
          progress
        )}${unit}`;
      }
    } else {
      result[key] = lerp(startVal.number, endVal.number, progress);
    }
  }

  return result;
}

Engine.displayName = "Engine";
