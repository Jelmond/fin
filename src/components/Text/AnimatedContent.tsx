"use client";

import React, { Children, useMemo, useLayoutEffect, useState, useRef, useEffect } from "react";
import { animated, useInView } from "@react-spring/web";
import styled from "styled-components";
import { Spring } from "../Springs/Spring";

interface AnimationSettings {
  from?: Record<string, any>;
  to?: Record<string, any>;
  config?: Record<string, any>;
  delayStep?: number;
}

interface CellConfig {
  style?: React.CSSProperties;
  animation?: AnimationSettings;
  animationElement?: AnimationSettings;
  className?: string;
}

interface AnimatedGridProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  containerWrapperWordClassName?: string;
  styleRow?: React.CSSProperties;
  rowClassName?: string;
  style?: React.CSSProperties;
  debug?: boolean;
  cellConfigs?: { [key: string]: CellConfig };
  type?: "words" | "rows";
  animation?: AnimationSettings;
  animationElement?: AnimationSettings;
  once?: boolean;
  containerStyle?: React.CSSProperties;
  gap?: { horizontal?: string; vertical?: string };
  overflow?: boolean;
}

const MainContainer = styled.div`
  width: 100%;
  box-sizing: border-box;
`;

const MeasureContainer = styled.div<{ $gapH: string; $gapV: string }>`
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: ${(p) => p.$gapV} ${(p) => p.$gapH};
  align-items: flex-start;
  visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: -1;
  height: 0;
`;

const GridRow = styled.div<{ $debug?: boolean; $gapH: string; $gapV: string }>`
  display: flex;
  flex-wrap: nowrap;
  width: 100%;
  gap: ${(p) => p.$gapV} ${(p) => p.$gapH};
  align-items: flex-start;
  position: relative;
  ${(p) =>
    p.$debug &&
    `
    border: 2px solid rgba(0,255,0,0.5);
    background: rgba(0,255,0,0.1);
    padding: 0.25em;
  `}
`;

const WordContainer = styled.div`
  display: inline-flex;
  position: relative;
  flex-shrink: 0;
  white-space: nowrap;
`;

const WordInnerContainer = styled.div<{ $overflow?: string }>`
  display: inline-flex;
  overflow: ${(p) => p.$overflow || "hidden"};
  position: relative;
  flex-shrink: 0;
  white-space: nowrap;
`;

const AnimatedContent = styled(animated.div)`
  display: inline-block;
  white-space: nowrap;
  position: relative;
`;

const SAFETY_MARGIN = 15;

const AnimatedGrid: React.FC<AnimatedGridProps> = ({
  children,
  className = "",
  containerClassName = "",
  containerWrapperWordClassName = '',
  styleRow = {},
  rowClassName = '',
  style = {},
  debug = false,
  cellConfigs = {},
  once = false,
  type = "words",
  overflow = true,
  animation = { from: { opacity: 1}, to: { opacity: 1}},
  animationElement,
  gap = { horizontal: "0.5em", vertical: "0.25em" },
}) => {
  const [ref, inView] = useInView({ once, amount: 0.3 });
  const measureRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [elementRows, setElementRows] = useState<number[][]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [elementWidths, setElementWidths] = useState<number[]>([]);

  const parseChildren = (isAnimated = false) => {
    let globalIndex = 0;
    const elementIdMap: { [index: number]: string | undefined } = {};

    const createAnimatedElement = (
      content: React.ReactNode,
      index: number,
      config: CellConfig = {},
      elementId?: string
    ) => {
      if (elementId) elementIdMap[index] = elementId;
      return (
        <WordContainer
          key={`${isAnimated ? "animated" : "measure"}-${index}`}
          style={config.style}
          className={config.className}
          data-element-id={elementId}
        >
          <WordInnerContainer className={containerWrapperWordClassName}>
            {isAnimated ? <AnimatedContent>{content}</AnimatedContent> : content}
          </WordInnerContainer>
        </WordContainer>
      );
    };

    const processText = (text: string, config: CellConfig = {}, elementId?: string) =>
      text
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
          const index = globalIndex++;
          return createAnimatedElement(word, index, config, elementId);
        });

const processNode = (node: React.ReactNode): React.ReactNode[] => {
    if (typeof node === "string") return processText(node);
    if (!React.isValidElement(node)) return [];
  
    const { id, children: nodeChildren, style: nodeStyle, className: nodeClassName, ...elementProps } = node.props;
    const config = id ? cellConfigs[id] || {} : {};
  
    const combinedStyle = {
      ...nodeStyle,
      ...config.style
    };
  
    const combinedClassName = [nodeClassName, config.className].filter(Boolean).join(' ');
  
    const combinedConfig = {
      ...config,
      style: combinedStyle,
      className: combinedClassName
    };
  
    if (React.isValidElement(node) && node.type === "br") {
      return [
        <div
          key={`br-${Math.random()}`}
          data-br
          style={{ width: "100%", display: "block", height: 0, padding: 0, margin: 0 }}
        />,
      ];
    }
  
    if (node.type === "a" || node.type === "img") {
      const index = globalIndex++;
      const content = React.cloneElement(node as React.ReactElement, {
        ...elementProps,
      });
      return [createAnimatedElement(content, index, combinedConfig, id)];
    }
  
    if (nodeChildren) {
      if (typeof nodeChildren === "string") return processText(nodeChildren, combinedConfig, id);
      return Children.toArray(nodeChildren).flatMap((child) => processNode(child));
    }
  
    const index = globalIndex++;
    const content = React.cloneElement(node as React.ReactElement, {
      ...elementProps,
    });
    return [createAnimatedElement(content, index, combinedConfig, id)];
  };
  
    const elements = Children.toArray(children).flatMap((child) => processNode(child));
    return isAnimated ? { elements, elementIdMap } : elements;
  };

  const rawElements = useMemo(() => parseChildren(false), [children, containerWrapperWordClassName, cellConfigs]) as React.ReactNode[];
  const animatedElements = useMemo(
    () => parseChildren(true),
    [children, containerWrapperWordClassName, cellConfigs]
  ) as { elements: React.ReactNode[]; elementIdMap: { [index: number]: string | undefined } };

  useLayoutEffect(() => {
    if (!measureRef.current || !containerRef.current) return;
    setContainerWidth(containerRef.current.getBoundingClientRect().width);
    setElementWidths(Array.from(measureRef.current.children).map((el) => (el as HTMLElement).getBoundingClientRect().width));
  }, [rawElements.length, children, gap.horizontal, gap.vertical]);

  useEffect(() => {
    if (!containerWidth || elementWidths.length === 0) {
      setElementRows([]);
      return;
    }
    const rows: number[][] = [];
    let currentRow: number[] = [];
    let currentWidth = 0;
    const gapH = parseFloat(gap.horizontal || "0.5");
    const gapPx = isNaN(gapH) ? 8 : gapH * 16;

    elementWidths.forEach((width, idx) => {
      const addGap = currentRow.length > 0 ? gapPx : 0;
      if (currentWidth + width + addGap > containerWidth - SAFETY_MARGIN) {
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [idx];
        currentWidth = width;
      } else {
        currentRow.push(idx);
        currentWidth += width + addGap;
      }
    });
    if (currentRow.length > 0) rows.push(currentRow);
    setElementRows(rows);
  }, [containerWidth, elementWidths, gap.horizontal]);

  const animatedRows = useMemo(() => {
    if (elementRows.length === 0) return [];
    return elementRows.map((rowElementIndices, rowIndex) => (
      <GridRow
        key={`row-${rowIndex}`}
        $debug={debug}
        $gapH={gap.horizontal || "0.5em"}
        $gapV={gap.vertical || "0.25em"}
        className={rowClassName}
        style={styleRow}
      >
        {rowElementIndices.map((elementIndex) => {
          const element = animatedElements.elements[elementIndex];
          const elementId = animatedElements.elementIdMap[elementIndex];
          const config = elementId ? cellConfigs[elementId] : {};
          
          const wrapperAnimation = config?.animation || animation;
          const elementAnimation = config?.animationElement || animationElement;
          
          const delay =
            config?.animation?.delayStep ??
            (type === "rows" ? rowIndex * (animation.delayStep || 0) : elementIndex * (animation.delayStep || 0));

          return (
            <div key={`row-${rowIndex}-element-${elementIndex}-wrapper`}
                style={{
                  overflow: overflow ? 'hidden' : 'visible',
                }}
            >
            <Spring
              key={`row-${rowIndex}-element-${elementIndex}-wrapper`}
              from={wrapperAnimation.from}
              to={wrapperAnimation.to}
              config={wrapperAnimation.config}
              delayIn={delay}
              enabled={inView}
              mode={once ? "once" : "always"}
              immediateOut={true}
            >
              <Spring
                from={elementAnimation?.from}
                to={elementAnimation?.to}
                config={elementAnimation?.config}
                delayIn={delay}
                enabled={inView}
                mode={once ? "once" : "always"}
                immediateOut={true}
              >
                {element}
              </Spring>
            </Spring>
          </div>
          );
        })}
      </GridRow>
    ));
  }, [elementRows, animatedElements, animation, animationElement, cellConfigs, inView, once, debug, type, gap]);
  return (
    <div ref={ref} style={{ position: "relative", width: "100%", boxSizing: "border-box" }}>
      <MainContainer
        ref={containerRef}
        className={containerClassName}
        style={{ ...style, counterReset: debug ? "row-counter" : undefined }}
      >
        <MeasureContainer className={className} ref={measureRef} $gapH={gap.horizontal || "0.5em"} $gapV={gap.vertical || "0.25em"}>
          {rawElements}
        </MeasureContainer>
        {animatedRows}
      </MainContainer>
    </div>
  );
};

export default AnimatedGrid;