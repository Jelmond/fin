"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import { minHeightLvh } from "@/styles/utils";
import { rm } from "@/styles";
import { colors } from "@/styles/colors";
import { Inview } from "@/components/Springs/Inview";
import {
  addFinanceEntry,
  addTask,
  fetchAllTags,
  fetchFinanceEntries,
  fetchFinanceHistory,
  fetchFinanceState,
  fetchPenalties,
  fetchTasks,
  markTaskDoneWithAutoReward,
  updateTaskStatus,
} from "@/services/tracker";
import {
  FinanceEntry,
  FinanceHistoryEntry,
  FinanceSnapshot,
  Penalty,
  Task,
  TaskStatus,
  type Tag,
} from "@/types/tracker";
import { hasSupabaseConfig } from "@/lib/supabaseClient";

const ui = {
  bg: "#edf1f7",
  card: "rgba(255,255,255,0.82)",
  cardBorder: "rgba(0,0,0,0.06)",
  text: "#1a1c23",
  muted: "#5b6070",
  accent: "#3f7cff",
  accentSoft: "#e7edff",
  success: "#19a974",
  danger: "#d64545",
};

const Page = styled(Inview)`
  display: flex;
  flex-direction: column;
  gap: ${rm(24)};
  padding: ${rm(32)} ${rm(20)} ${rm(48)};
  ${minHeightLvh(120)};
  background: radial-gradient(circle at 15% 20%, rgba(63, 124, 255, 0.12), transparent 25%),
    radial-gradient(circle at 80% 0%, rgba(25, 169, 116, 0.12), transparent 30%),
    ${ui.bg};
  
  @media (max-width: 768px) {
    padding: ${rm(24)} ${rm(16)} ${rm(40)};
    gap: ${rm(20)};
  }
`;

const Hero = styled.div`
  width: min(1200px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: ${rm(24)};
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const HeroCard = styled.div`
  background: linear-gradient(135deg, #ffffff, #f3f6ff);
  border: 1px solid ${ui.cardBorder};
  border-radius: ${rm(20)};
  padding: ${rm(24)};
  box-shadow: 0 ${rm(16)} ${rm(48)} rgba(52, 63, 91, 0.18);
`;

const HeroTitle = styled.h1`
  margin: 0 0 ${rm(12)} 0;
  font-size: clamp(${rm(28)}, 5vw, ${rm(46)});
  color: ${ui.text};
  line-height: 1.1;
`;

const HeroText = styled.p`
  margin: 0;
  color: ${ui.muted};
  font-size: ${rm(16)};
  line-height: 1.5;
`;

const Grid = styled.div`
  width: min(1200px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${rm(300)}, 1fr));
  gap: ${rm(20)};
  
  @media (max-width: 768px) {
    gap: ${rm(16)};
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${ui.card};
  border: 1px solid ${ui.cardBorder};
  border-radius: ${rm(18)};
  padding: ${rm(24)};
  box-shadow: 0 ${rm(12)} ${rm(32)} rgba(52, 63, 91, 0.12);
  
  @media (max-width: 768px) {
    padding: ${rm(20)};
    border-radius: ${rm(16)};
  }
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${rm(12)};
  margin-bottom: ${rm(10)};
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${rm(18)};
  color: ${ui.text};
`;

const Badge = styled.span`
  padding: ${rm(6)} ${rm(10)};
  border-radius: ${rm(12)};
  background: ${ui.accentSoft};
  color: ${ui.accent};
  font-size: ${rm(12)};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Label = styled.label`
  display: block;
  font-size: ${rm(13)};
  color: ${ui.muted};
  margin-bottom: ${rm(6)};
`;

const Input = styled.input`
  width: 100%;
  background: #fff;
  border: 1px solid ${ui.cardBorder};
  border-radius: ${rm(12)};
  padding: ${rm(12)} ${rm(12)};
  color: ${ui.text};
  margin-bottom: ${rm(12)};
  transition: border 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    outline: none;
    border: 1px solid ${ui.accent};
    box-shadow: 0 0 ${rm(14)} rgba(63, 124, 255, 0.2);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: ${rm(90)};
  background: #fff;
  border: 1px solid ${ui.cardBorder};
  border-radius: ${rm(12)};
  padding: ${rm(12)};
  color: ${ui.text};
  margin-bottom: ${rm(12)};
  resize: vertical;
  transition: border 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    outline: none;
    border: 1px solid ${ui.accent};
    box-shadow: 0 0 ${rm(14)} rgba(63, 124, 255, 0.2);
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, ${ui.accent}, #4f8dff);
  color: #ffffff;
  border: none;
  border-radius: ${rm(12)};
  padding: ${rm(12)} ${rm(14)};
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  transition: transform 0.12s ease, box-shadow 0.2s ease;
  box-shadow: 0 ${rm(12)} ${rm(28)} rgba(63, 124, 255, 0.25);
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 ${rm(14)} ${rm(36)} rgba(63, 124, 255, 0.3);
  }
  &:active {
    transform: translateY(0);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${rm(10)};
`;

const Tag = styled.span<{ $tone?: "neutral" | "success" | "danger" }>`
  padding: ${rm(6)} ${rm(10)};
  border-radius: ${rm(10)};
  background: ${({ $tone }) =>
    $tone === "success" ? ui.success : $tone === "danger" ? ui.danger : ui.muted};
  color: #fff;
  font-size: ${rm(12)};
  font-weight: 700;
  text-transform: capitalize;
`;

const Helper = styled.p`
  margin: 0 0 ${rm(10)} 0;
  color: ${ui.muted};
  font-size: ${rm(14)};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rm(10)};
`;

const ScrollableList = styled(List)`
  max-height: ${rm(400)};
  overflow-y: auto;
  padding-right: ${rm(4)};
  overscroll-behavior: contain;
  
  &::-webkit-scrollbar {
    width: ${rm(6)};
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${ui.cardBorder};
    border-radius: ${rm(3)};
    
    &:hover {
      background: ${ui.muted};
    }
  }
  
  ${Card} {
    padding: ${rm(14)} ${rm(16)};
    margin-bottom: ${rm(8)};
    border-radius: ${rm(12)};
    box-shadow: 0 ${rm(2)} ${rm(8)} rgba(52, 63, 91, 0.06);
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const BalanceText = styled.div<{ $positive: boolean }>`
  font-size: ${rm(32)};
  font-weight: 700;
  color: ${({ $positive }) => ($positive ? ui.success : ui.danger)};
  line-height: 1.2;
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${rm(6)};
  padding: ${rm(6)} ${rm(10)};
  border-radius: ${rm(999)};
  background: ${ui.accentSoft};
  color: ${ui.text};
  font-size: ${rm(12)};
`;

const Empty = styled.div`
  color: ${ui.muted};
  font-size: ${rm(14)};
`;

const TagsContainer = styled.div`
  margin-bottom: ${rm(12)};
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${rm(8)};
  margin-bottom: ${rm(8)};
`;

const TagChip = styled.button<{ $selected?: boolean }>`
  padding: ${rm(6)} ${rm(12)};
  border-radius: ${rm(16)};
  border: 1px solid ${({ $selected }) => ($selected ? ui.accent : ui.cardBorder)};
  background: ${({ $selected }) => ($selected ? ui.accent : ui.card)};
  color: ${({ $selected }) => ($selected ? "#fff" : ui.text)};
  font-size: ${rm(12)};
  font-weight: ${({ $selected }) => ($selected ? 600 : 500)};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${ui.accent};
    transform: translateY(-1px);
    box-shadow: 0 ${rm(2)} ${rm(8)} rgba(63, 124, 255, 0.2);
  }
`;

const TagInputWrapper = styled.div`
  position: relative;
  margin-bottom: ${rm(8)};
`;

const PieChartContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: ${rm(32)};
  width: 100%;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: ${rm(24)};
  }
`;

const PieChartWrapper = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const PieChartSvg = styled.svg`
  width: ${rm(400)};
  height: ${rm(400)};
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: ${rm(300)};
    height: ${rm(300)};
  }
`;

const PieChartLegend = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${rm(8)};
  min-width: 0;
  max-height: ${rm(400)};
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: ${rm(6)};
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${ui.cardBorder};
    border-radius: ${rm(3)};
    
    &:hover {
      background: ${ui.muted};
    }
  }
`;

const Tooltip = styled.div<{ $x: number; $y: number; $visible: boolean }>`
  position: absolute;
  left: ${({ $x }) => $x}px;
  top: ${({ $y }) => $y}px;
  background: ${ui.text};
  color: #fff;
  padding: ${rm(8)} ${rm(12)};
  border-radius: ${rm(8)};
  font-size: ${rm(13)};
  font-weight: 600;
  pointer-events: none;
  z-index: 1000;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translate(-50%, -100%) translateY(${({ $visible }) => ($visible ? rm(-8) : 0)});
  transition: opacity 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 ${rm(4)} ${rm(12)} rgba(0, 0, 0, 0.2);
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: ${rm(6)} solid transparent;
    border-top-color: ${ui.text};
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${rm(10)};
  padding: ${rm(8)} ${rm(12)};
  border-radius: ${rm(8)};
  background: ${ui.card};
  border: 1px solid ${ui.cardBorder};
`;

const LegendColor = styled.div<{ $color: string }>`
  width: ${rm(16)};
  height: ${rm(16)};
  border-radius: ${rm(4)};
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const LegendText = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${rm(8)};
  font-size: ${rm(13)};
  color: ${ui.text};
`;

const LegendName = styled.span`
  font-weight: 500;
`;

const LegendValue = styled.span`
  font-weight: 700;
  color: ${ui.accent};
`;

const TagInput = styled.input`
  width: 100%;
  background: #fff;
  border: 1px solid ${ui.cardBorder};
  border-radius: ${rm(12)};
  padding: ${rm(10)} ${rm(12)};
  color: ${ui.text};
  font-size: ${rm(13)};
  transition: border 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border: 1px solid ${ui.accent};
    box-shadow: 0 0 ${rm(14)} rgba(63, 124, 255, 0.2);
  }
`;

const AutocompleteDropdown = styled.div`
  position: absolute;
  top: calc(100% + ${rm(4)});
  left: 0;
  right: 0;
  background: ${ui.card};
  border: 1px solid ${ui.cardBorder};
  border-radius: ${rm(12)};
  box-shadow: 0 ${rm(8)} ${rm(24)} rgba(52, 63, 91, 0.15);
  max-height: ${rm(200)};
  overflow-y: auto;
  z-index: 10;
  animation: slideDown 0.2s ease-out;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-${rm(10)});
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const AutocompleteItem = styled.button`
  width: 100%;
  padding: ${rm(10)} ${rm(12)};
  text-align: left;
  background: transparent;
  border: none;
  color: ${ui.text};
  font-size: ${rm(13)};
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: ${ui.accentSoft};
  }
  
  &:first-child {
    border-radius: ${rm(12)} ${rm(12)} 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 ${rm(12)} ${rm(12)};
  }
`;

const Message = styled.div<{ $tone?: "info" | "error" }>`
  width: min(1200px, 100%);
  margin: 0 auto;
  background: ${({ $tone }) => ($tone === "error" ? "rgba(214, 69, 69, 0.12)" : ui.card)};
  border: 1px solid ${({ $tone }) => ($tone === "error" ? "rgba(214, 69, 69, 0.3)" : ui.cardBorder)};
  color: ${ui.text};
  border-radius: ${rm(14)};
  padding: ${rm(14)};
`;

const ToastContainer = styled.div`
  position: fixed;
  top: ${rm(20)};
  right: ${rm(20)};
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: ${rm(12)};
  pointer-events: none;
  
  @media (max-width: 768px) {
    top: ${rm(16)};
    right: ${rm(16)};
    left: ${rm(16)};
  }
`;

const Toast = styled.div<{ $type?: "success" | "error" | "info" }>`
  background: ${({ $type }) => 
    $type === "error" 
      ? `linear-gradient(135deg, ${ui.danger}, #e55a5a)`
      : $type === "success"
      ? `linear-gradient(135deg, ${ui.success}, #1fb87a)`
      : `linear-gradient(135deg, ${ui.accent}, #5a8eff)`};
  color: #fff;
  padding: ${rm(14)} ${rm(18)};
  border-radius: ${rm(14)};
  box-shadow: 0 ${rm(8)} ${rm(24)} rgba(52, 63, 91, 0.3),
    0 ${rm(4)} ${rm(12)} rgba(0, 0, 0, 0.15);
  font-size: ${rm(14)};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${rm(10)};
  pointer-events: auto;
  animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards;
  min-width: ${rm(280)};
  max-width: ${rm(400)};
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
  
  @media (max-width: 768px) {
    min-width: auto;
    max-width: 100%;
    width: 100%;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${rm(20)};
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContent = styled.div<{ $type?: "bonus" | "penalty" }>`
  background: ${ui.card};
  border: 2px solid ${({ $type }) => 
    $type === "bonus" ? ui.success : $type === "penalty" ? ui.danger : ui.cardBorder};
  border-radius: ${rm(20)};
  padding: ${rm(32)};
  max-width: ${rm(400)};
  width: 100%;
  box-shadow: 0 ${rm(24)} ${rm(48)} rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  
  @keyframes slideUp {
    from {
      transform: translateY(${rm(20)});
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalTitle = styled.h2<{ $type?: "bonus" | "penalty" }>`
  margin: 0 0 ${rm(16)} 0;
  font-size: ${rm(24)};
  color: ${({ $type }) => 
    $type === "bonus" ? ui.success : $type === "penalty" ? ui.danger : ui.text};
  text-align: center;
`;

const ModalAmount = styled.div<{ $type?: "bonus" | "penalty" }>`
  font-size: ${rm(48)};
  font-weight: 700;
  color: ${({ $type }) => 
    $type === "bonus" ? ui.success : $type === "penalty" ? ui.danger : ui.text};
  text-align: center;
  margin: ${rm(16)} 0;
`;

const ModalReason = styled.p`
  color: ${ui.muted};
  font-size: ${rm(16)};
  text-align: center;
  margin: ${rm(16)} 0 0 0;
`;

const ModalButton = styled(Button)`
  margin-top: ${rm(24)};
`;

const FieldShell = styled.div`
  position: relative;
  margin-bottom: ${rm(12)};
`;

const Dropdown = styled.div`
  position: relative;
`;

const DropdownButton = styled.button`
  width: 100%;
  background: #fff;
  border: 1px solid ${ui.cardBorder};
  border-radius: ${rm(12)};
  padding: ${rm(12)};
  color: ${ui.text};
  text-align: left;
  cursor: pointer;
  transition: border 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    border-color: ${ui.accent};
  }
  &:focus {
    outline: none;
    border-color: ${ui.accent};
    box-shadow: 0 0 ${rm(14)} rgba(63, 124, 255, 0.2);
  }
`;

const DropdownList = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + ${rm(6)});
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid ${ui.cardBorder};
  border-radius: ${rm(12)};
  box-shadow: 0 ${rm(16)} ${rm(36)} rgba(52, 63, 91, 0.16);
  max-height: ${({ $open }) => ($open ? rm(220) : 0)};
  overflow: hidden;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition: max-height 0.18s ease, opacity 0.18s ease;
  z-index: 10;
`;

const DropdownOption = styled.button`
  width: 100%;
  padding: ${rm(12)};
  background: transparent;
  border: none;
  text-align: left;
  color: ${ui.text};
  cursor: pointer;
  &:hover {
    background: ${ui.accentSoft};
  }
`;

const Calendar = styled.div`
  position: absolute;
  top: calc(100% + ${rm(8)});
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #ffffff, #f8f9ff);
  border: 1px solid ${ui.cardBorder};
  border-radius: ${rm(20)};
  box-shadow: 0 ${rm(20)} ${rm(60)} rgba(52, 63, 91, 0.25),
    0 ${rm(8)} ${rm(24)} rgba(63, 124, 255, 0.08);
  padding: ${rm(16)};
  z-index: 12;
  width: 100%;
  max-width: ${rm(320)};
  animation: slideDown 0.2s ease-out;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-${rm(10)});
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100vw - ${rm(32)});
  }
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${rm(12)};
  padding-bottom: ${rm(10)};
  border-bottom: 2px solid ${ui.accentSoft};
  
  button {
    width: ${rm(28)};
    height: ${rm(28)};
    border-radius: ${rm(8)};
    border: 1px solid ${ui.cardBorder};
    background: ${ui.card};
    color: ${ui.text};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${rm(14)};
    font-weight: 600;
    transition: all 0.2s ease;
    flex-shrink: 0;
    
    &:hover {
      background: ${ui.accent};
      color: #fff;
      border-color: ${ui.accent};
      transform: scale(1.05);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  strong {
    font-size: ${rm(16)};
    font-weight: 700;
    color: ${ui.text};
    letter-spacing: 0.02em;
    flex: 1;
    text-align: center;
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${rm(4)};
  margin-bottom: ${rm(6)};
  
  &:first-of-type {
    margin-bottom: ${rm(4)};
    
    ${Helper} {
      font-weight: 700;
      color: ${ui.accent};
      font-size: ${rm(11)};
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
`;

const DayCell = styled.button<{ $muted?: boolean; $selected?: boolean }>`
  aspect-ratio: 1;
  min-height: ${rm(32)};
  border-radius: ${rm(10)};
  border: 2px solid ${({ $selected }) => ($selected ? ui.accent : "transparent")};
  background: ${({ $selected }) => 
    $selected 
      ? `linear-gradient(135deg, ${ui.accent}, #5a8eff)` 
      : "transparent"};
  color: ${({ $selected, $muted }) =>
    $selected ? "#fff" : $muted ? ui.muted : ui.text};
  cursor: pointer;
  font-weight: ${({ $selected }) => ($selected ? 700 : 500)};
  font-size: ${rm(13)};
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  
  &:hover {
    background: ${({ $selected }) => 
      $selected 
        ? `linear-gradient(135deg, ${ui.accent}, #5a8eff)` 
        : ui.accentSoft};
    border-color: ${({ $selected }) => ($selected ? ui.accent : ui.accent)};
    transform: ${({ $selected }) => ($selected ? "scale(1.05)" : "scale(1.08)")};
    box-shadow: ${({ $selected }) => 
      $selected 
        ? `0 ${rm(6)} ${rm(12)} rgba(63, 124, 255, 0.3)`
        : `0 ${rm(3)} ${rm(8)} rgba(63, 124, 255, 0.15)`};
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  ${({ $muted, $selected }) => 
    $muted && !$selected
      ? `
        opacity: 0.4;
        &:hover {
          opacity: 0.7;
        }
      `
      : ""}
`;

const DateButton = styled(DropdownButton)`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const HomeView = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [history, setHistory] = useState<FinanceHistoryEntry[]>([]);
  const [financeState, setFinanceState] = useState<FinanceSnapshot | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dateTaskOpen, setDateTaskOpen] = useState(false);
  const [dateFinanceOpen, setDateFinanceOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);
  const [modalReward, setModalReward] = useState<{
    type: "bonus" | "penalty";
    reason: string | null;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const [taskForm, setTaskForm] = useState({
    title: "",
    due_date: "",
    notes: "",
  });

  const [financeForm, setFinanceForm] = useState({
    amount: "",
    category: "expense",
    description: "",
    tags: [] as string[],
    occurred_on: new Date().toISOString().slice(0, 10),
  });

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string; visible: boolean }>({
    x: 0,
    y: 0,
    text: "",
    visible: false,
  });

  const supabaseMissing = !hasSupabaseConfig();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
    const [tasksRes, financesRes, penaltiesRes, historyRes, stateRes, tagsRes] = await Promise.all([
      fetchTasks(),
      fetchFinanceEntries(),
      fetchPenalties(),
      fetchFinanceHistory(),
      fetchFinanceState(),
      fetchAllTags(),
    ]);

      setTasks(tasksRes.data);
      setFinanceEntries(financesRes.data);
      setPenalties(penaltiesRes.data);
      setHistory(historyRes.data);
      setFinanceState(stateRes.data);
      setAvailableTags(tagsRes.data);

      const loadError = tasksRes.error || financesRes.error || penaltiesRes.error || historyRes.error || stateRes.error || tagsRes.error;
      if (loadError) {
        showToast(loadError, "error");
      }
      setLoading(false);
    };

    load();
  }, []);

  // Calculate expenses by tags
  const tagExpenses = useMemo(() => {
    const tagMap = new Map<string, number>();
    
    financeEntries
      .filter((entry) => entry.category === "expense" && entry.tags && entry.tags.length > 0)
      .forEach((entry) => {
        entry.tags!.forEach((tag) => {
          const current = tagMap.get(tag.name) || 0;
          tagMap.set(tag.name, current + Math.abs(entry.amount));
        });
      });
    
    const total = Array.from(tagMap.values()).reduce((sum, val) => sum + val, 0);
    
    return Array.from(tagMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [financeEntries]);

  const totals = useMemo(() => {
    if (financeState) {
      return {
        income: Number(financeState.income_total ?? 0),
        expenses: Number(financeState.expense_total ?? 0),
        bonuses: Number(financeState.bonuses_total ?? 0),
        penalties: Number(financeState.penalties_total ?? 0),
        net: Number(financeState.balance ?? 0),
      };
    }

    // fallback если не получили снапшот
    const income = financeEntries
      .filter((f) => f.category === "income")
      .reduce((acc, f) => acc + Number(f.amount), 0);
    const expenses = financeEntries
      .filter((f) => f.category === "expense")
      .reduce((acc, f) => acc + Number(f.amount), 0);
    return {
      income,
      expenses,
      bonuses: 0,
      penalties: 0,
      net: income - expenses,
    };
  }, [financeEntries, financeState]);

  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];

  const buildCalendar = (value: string) => {
    let base: Date;
    if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Парсим дату в локальном времени
      const parts = value.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        base = new Date(parts[0], parts[1] - 1, parts[2]);
        // Проверяем, что дата валидна
        if (isNaN(base.getTime())) {
          base = new Date();
        }
      } else {
        base = new Date();
      }
    } else {
      base = new Date();
    }
    
    const year = base.getFullYear();
    const month = base.getMonth(); // 0-11
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay() || 7; // make Monday = 1..Sunday=7
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const cells = [];
    // Дни предыдущего месяца
    for (let i = startDay - 2; i >= 0; i--) {
      const day = prevDays - i;
      cells.push({ day, muted: true, date: new Date(year, month - 1, day) });
    }
    // Дни текущего месяца
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, muted: false, date: new Date(year, month, d) });
    }
    // Дни следующего месяца
    const tail = 42 - cells.length;
    for (let t = 1; t <= tail; t++) {
      cells.push({ day: t, muted: true, date: new Date(year, month + 1, t) });
    }
    return { cells, year, month };
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generate colors for pie chart
  const generateColors = (count: number): string[] => {
    const colors = [
      ui.accent,
      ui.success,
      "#ff6b6b",
      "#4ecdc4",
      "#ffe66d",
      "#a8e6cf",
      "#ff8b94",
      "#95e1d3",
      "#f38181",
      "#aa96da",
    ];
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  };

  // Calculate pie chart paths with colors
  const pieChartData = useMemo(() => {
    if (tagExpenses.length === 0) return [];
    
    const colors = generateColors(tagExpenses.length);
    const centerX = 150;
    const centerY = 150;
    const radius = 110;
    let currentAngle = -90; // Start from top
    
    return tagExpenses.map((item, index) => {
      const angle = (item.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      
      currentAngle += angle;
      
      return {
        path,
        color: colors[index],
        ...item,
      };
    });
  }, [tagExpenses]);

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    // Handle ISO string or YYYY-MM-DD format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Try parsing as YYYY-MM-DD
      const [year, month, day] = dateString.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const d = new Date(year, month - 1, day);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}.${mm}.${yyyy}`;
      }
      return dateString;
    }
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const handleTaskSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { data, error: err } = await addTask({
      title: taskForm.title,
      due_date: taskForm.due_date ? new Date(taskForm.due_date).toISOString() : null,
      reward: null,
      penalty: null,
      notes: taskForm.notes || null,
    });

    if (err) return showToast(err, "error");
    if (data) {
      setTasks((prev) => [data, ...prev]);
      setTaskForm({ title: "", due_date: "", notes: "" });
      showToast("Задача сохранена", "success");
    }
  };

  const handleFinanceSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { data, error: err } = await addFinanceEntry({
      amount: Number(financeForm.amount),
      category: financeForm.category as FinanceEntry["category"],
      description: financeForm.description || null,
      tagNames: financeForm.tags.length > 0 ? financeForm.tags : undefined,
      occurred_on: financeForm.occurred_on,
      task_id: null,
    });

    if (err) return showToast(err, "error");
    if (data) {
      setFinanceEntries((prev) => [data, ...prev]);
      // Обновляем список тегов после добавления записи
      const tagsRes = await fetchAllTags();
      if (tagsRes.data) {
        setAvailableTags(tagsRes.data);
      }
      setFinanceForm({
        amount: "",
        category: financeForm.category,
        description: "",
        tags: [],
        occurred_on: financeForm.occurred_on,
      });
      setNewTagInput("");
      
      // Обновляем баланс и историю после добавления записи
      const [historyRes, stateRes] = await Promise.all([
        fetchFinanceHistory(),
        fetchFinanceState(),
      ]);
      setHistory(historyRes.data);
      setFinanceState(stateRes.data);
      
      showToast("Запись сохранена", "success");
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const result = await markTaskDoneWithAutoReward(task);
    if (result.error) return showToast(result.error, "error");
    if (result.data) {
      // Удаляем задачу из списка (не показываем выполненные)
      setTasks((prev) => prev.filter((t) => t.id !== result.data!.id));
      
      // Обновляем баланс и историю после закрытия задачи (мог начислиться бонус/штраф)
      const [historyRes, stateRes] = await Promise.all([
        fetchFinanceHistory(),
        fetchFinanceState(),
      ]);
      setHistory(historyRes.data);
      setFinanceState(stateRes.data);
      
      // Показываем модальное окно, если есть бонус/штраф
      if (result.reward) {
        setModalReward(result.reward);
      } else if (task.due_date) {
        const now = new Date();
        const due = new Date(task.due_date);
        if (now > due) {
          showToast("Задача просрочена, но в базе нет доступных штрафов. Добавьте штрафы в таблицу penalties.", "error");
        } else {
          showToast("Задача выполнена в срок, но в базе нет доступных бонусов. Добавьте бонусы в таблицу bonuses.", "error");
        }
      } else {
        showToast("Задача отмечена как выполненная", "success");
      }
    }
  };

  return (
    <Page from={{ y: "-20rem" }} to={{ y: "0rem" }} delayIn={200}>
      <Card style={{ marginBottom: rm(24) }}>
        <BalanceText $positive={totals.net >= 0}>
          Баланс: {totals.net >= 0 ? "+" : ""}
          {totals.net.toFixed(2)} Br
        </BalanceText>
      </Card>

      {supabaseMissing && (
        <Message $tone="error">
          Не найдены переменные окружения Supabase. Добавьте `NEXT_PUBLIC_SUPABASE_URL` и
          `NEXT_PUBLIC_SUPABASE_ANON_KEY` в `.env.local`, затем перезапустите dev-сервер.
        </Message>
      )}

      {loading ? (
        <Message>Загрузка данных...</Message>
      ) : (
        <>
          <Grid>
            <Card as="form" onSubmit={handleTaskSubmit}>
              <TitleRow>
                <SectionTitle>Новая задача</SectionTitle>
                <Badge>сроки</Badge>
              </TitleRow>
              <Label>Название *</Label>
              <Input
                required
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Например: еженедельный бюджет"
              />
              <Label>Дедлайн (опционально)</Label>
              <FieldShell>
                <DateButton type="button" onClick={() => {
                  setDateTaskOpen((v) => !v);
                  setDateFinanceOpen(false);
                }}>
                  {taskForm.due_date ? (() => {
                    const [year, month, day] = taskForm.due_date.split('-').map(Number);
                    const d = new Date(year, month - 1, day);
                    return d.toLocaleDateString('ru-RU');
                  })() : "Выбрать дату"}
                  <span>📅</span>
                </DateButton>
                {dateTaskOpen && (() => {
                  const { cells, month, year } = buildCalendar(taskForm.due_date || formatDate(new Date()));
                  const prev = () => {
                    let d: Date;
                    if (taskForm.due_date) {
                      const [year, month, day] = taskForm.due_date.split('-').map(Number);
                      d = new Date(year, month - 1, day);
                    } else {
                      d = new Date();
                    }
                    d.setMonth(d.getMonth() - 1);
                    setTaskForm((f) => ({ ...f, due_date: formatDate(d) }));
                  };
                  const next = () => {
                    let d: Date;
                    if (taskForm.due_date) {
                      const [year, month, day] = taskForm.due_date.split('-').map(Number);
                      d = new Date(year, month - 1, day);
                    } else {
                      d = new Date();
                    }
                    d.setMonth(d.getMonth() + 1);
                    setTaskForm((f) => ({ ...f, due_date: formatDate(d) }));
                  };
                  return (
                    <Calendar>
                      <CalendarHeader>
                        <button onClick={prev} aria-label="prev">←</button>
                        <strong>{monthNames[month]} {year}</strong>
                        <button onClick={next} aria-label="next">→</button>
                      </CalendarHeader>
                      <CalendarGrid>
                        {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((d) => (
                          <Helper key={d} style={{ textAlign: "center", margin: 0 }}>{d}</Helper>
                        ))}
                        {cells.map((cell, idx) => (
                          <DayCell
                            key={idx}
                            $muted={cell.muted}
                            $selected={taskForm.due_date === formatDate(cell.date)}
                            onClick={() => {
                              setTaskForm((f) => ({ ...f, due_date: formatDate(cell.date) }));
                              setDateTaskOpen(false);
                            }}
                          >
                            {cell.day}
                          </DayCell>
                        ))}
                      </CalendarGrid>
                    </Calendar>
                  );
                })()}
              </FieldShell>
              <Label>Заметки</Label>
              <Textarea
                value={taskForm.notes}
                onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                placeholder="Правила, ссылки, чек-лист"
              />
              <Button type="submit" disabled={!taskForm.title}>
                Сохранить задачу
              </Button>
            </Card>

            <Card as="form" onSubmit={handleFinanceSubmit}>
              <TitleRow>
                <SectionTitle>Доход / расход</SectionTitle>
                <Badge>финансы</Badge>
              </TitleRow>
              <Label>Сумма *</Label>
              <Input
                required
                type="number"
                inputMode="decimal"
                value={financeForm.amount}
                onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                placeholder="125.40"
              />
              <Label>Категория</Label>
              <Dropdown>
                <DropdownButton type="button" onClick={() => setCategoryOpen((v) => !v)}>
                  {financeForm.category === "expense" ? "Расход" : "Доход"}
                </DropdownButton>
                <DropdownList $open={categoryOpen}>
                  <DropdownOption
                    type="button"
                    onClick={() => {
                      setFinanceForm((f) => ({ ...f, category: "expense" }));
                      setCategoryOpen(false);
                    }}
                  >
                    Расход
                  </DropdownOption>
                  <DropdownOption
                    type="button"
                    onClick={() => {
                      setFinanceForm((f) => ({ ...f, category: "income" }));
                      setCategoryOpen(false);
                    }}
                  >
                    Доход
                  </DropdownOption>
                </DropdownList>
              </Dropdown>
              <Label>Дата</Label>
              <FieldShell>
                <DateButton
                  type="button"
                  onClick={() => {
                    setDateFinanceOpen((v) => !v);
                    setDateTaskOpen(false);
                  }}
                >
                  {financeForm.occurred_on
                    ? (() => {
                        const [year, month, day] = financeForm.occurred_on.split('-').map(Number);
                        const d = new Date(year, month - 1, day);
                        return d.toLocaleDateString('ru-RU');
                      })()
                    : "Выбрать дату"}
                  <span>📅</span>
                </DateButton>
                {dateFinanceOpen && (() => {
                  const { cells, month, year } = buildCalendar(financeForm.occurred_on || formatDate(new Date()));
                  const prev = () => {
                    let d: Date;
                    if (financeForm.occurred_on) {
                      const [year, month, day] = financeForm.occurred_on.split('-').map(Number);
                      d = new Date(year, month - 1, day);
                    } else {
                      d = new Date();
                    }
                    d.setMonth(d.getMonth() - 1);
                    setFinanceForm((f) => ({ ...f, occurred_on: formatDate(d) }));
                  };
                  const next = () => {
                    let d: Date;
                    if (financeForm.occurred_on) {
                      const [year, month, day] = financeForm.occurred_on.split('-').map(Number);
                      d = new Date(year, month - 1, day);
                    } else {
                      d = new Date();
                    }
                    d.setMonth(d.getMonth() + 1);
                    setFinanceForm((f) => ({ ...f, occurred_on: formatDate(d) }));
                  };
                  return (
                    <Calendar>
                      <CalendarHeader>
                        <button onClick={prev} aria-label="prev">←</button>
                        <strong>{monthNames[month]} {year}</strong>
                        <button onClick={next} aria-label="next">→</button>
                      </CalendarHeader>
                      <CalendarGrid>
                        {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((d) => (
                          <Helper key={d} style={{ textAlign: "center", margin: 0 }}>{d}</Helper>
                        ))}
                        {cells.map((cell, idx) => (
                          <DayCell
                            key={idx}
                            $muted={cell.muted}
                            $selected={financeForm.occurred_on === formatDate(cell.date)}
                            onClick={() => {
                              setFinanceForm((f) => ({ ...f, occurred_on: formatDate(cell.date) }));
                              setDateFinanceOpen(false);
                            }}
                          >
                            {cell.day}
                          </DayCell>
                        ))}
                      </CalendarGrid>
                    </Calendar>
                  );
                })()}
              </FieldShell>
              <Label>Описание</Label>
              <Textarea
                value={financeForm.description}
                onChange={(e) => setFinanceForm({ ...financeForm, description: e.target.value })}
                placeholder="Пример: зарплата, еда, подписки"
              />
              <Label>Теги</Label>
              <TagsContainer>
                <TagInputWrapper>
                  <TagInput
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTagInput.trim()) {
                        e.preventDefault();
                        const tagName = newTagInput.trim();
                        if (!financeForm.tags.includes(tagName)) {
                          setFinanceForm({ ...financeForm, tags: [...financeForm.tags, tagName] });
                        }
                        setNewTagInput("");
                      }
                    }}
                    placeholder="Введите тег или выберите из списка"
                  />
                  {newTagInput.trim() && (
                    <AutocompleteDropdown>
                      {availableTags
                        .filter((tag) => 
                          tag.name.toLowerCase().includes(newTagInput.toLowerCase()) &&
                          !financeForm.tags.includes(tag.name)
                        )
                        .slice(0, 5)
                        .map((tag) => (
                          <AutocompleteItem
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              if (!financeForm.tags.includes(tag.name)) {
                                setFinanceForm({ ...financeForm, tags: [...financeForm.tags, tag.name] });
                              }
                              setNewTagInput("");
                            }}
                          >
                            {tag.name}
                          </AutocompleteItem>
                        ))}
                      {!availableTags.some((tag) => 
                        tag.name.toLowerCase() === newTagInput.toLowerCase()
                      ) && newTagInput.trim() && (
                        <AutocompleteItem
                          type="button"
                          onClick={() => {
                            const tagName = newTagInput.trim();
                            if (!financeForm.tags.includes(tagName)) {
                              setFinanceForm({ ...financeForm, tags: [...financeForm.tags, tagName] });
                            }
                            setNewTagInput("");
                          }}
                          style={{ fontWeight: 600, color: ui.accent }}
                        >
                          + Создать "{newTagInput.trim()}"
                        </AutocompleteItem>
                      )}
                    </AutocompleteDropdown>
                  )}
                </TagInputWrapper>
                {availableTags.length > 0 && (
                  <>
                    <Helper style={{ marginBottom: rm(8), fontSize: rm(12), color: ui.muted }}>
                      Доступные теги (кликните для выбора):
                    </Helper>
                    <TagsList>
                      {availableTags
                        .filter((tag) => !financeForm.tags.includes(tag.name))
                        .map((tag) => (
                          <TagChip
                            key={tag.id}
                            type="button"
                            $selected={false}
                            onClick={() => {
                              setFinanceForm({
                                ...financeForm,
                                tags: [...financeForm.tags, tag.name],
                              });
                            }}
                          >
                            {tag.name}
                          </TagChip>
                        ))}
                    </TagsList>
                  </>
                )}
                {financeForm.tags.length > 0 && (
                  <>
                    <Helper style={{ marginTop: rm(12), marginBottom: rm(8), fontSize: rm(12), color: ui.muted }}>
                      Выбранные теги:
                    </Helper>
                    <TagsList>
                      {financeForm.tags.map((tag) => (
                        <TagChip
                          key={tag}
                          type="button"
                          $selected={true}
                          onClick={() => {
                            setFinanceForm({
                              ...financeForm,
                              tags: financeForm.tags.filter((t) => t !== tag),
                            });
                          }}
                        >
                          {tag} ×
                        </TagChip>
                      ))}
                    </TagsList>
                  </>
                )}
              </TagsContainer>
              <Button type="submit" disabled={!financeForm.amount}>
                Сохранить запись
              </Button>
            </Card>
          </Grid>

          <Grid>
            <Card>
              <TitleRow>
                <SectionTitle>Задачи</SectionTitle>
                <Badge>{tasks.filter((t) => t.status !== "done").length} ШТ.</Badge>
              </TitleRow>
              {tasks.filter((t) => t.status !== "done").length === 0 ? (
                <Empty>Пока нет задач.</Empty>
              ) : (
                <ScrollableList
                  onWheel={(e) => {
                    const el = e.currentTarget;
                    const { scrollTop, scrollHeight, clientHeight } = el;
                    const isAtTop = scrollTop === 0;
                    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
                    
                    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                      // На границе, позволяем скроллить страницу
                      return;
                    }
                    
                    // Внутри контейнера, останавливаем всплытие
                    e.stopPropagation();
                  }}
                >
                  {tasks
                    .filter((t) => t.status !== "done")
                    .map((task) => (
                      <Card key={task.id}>
                        <Row>
                          <strong>{task.title}</strong>
                        </Row>
                        {task.due_date && (
                          <Helper>Дедлайн: {formatDateDisplay(task.due_date)}</Helper>
                        )}
                        {task.notes && <Helper>{task.notes}</Helper>}
                        <Button type="button" onClick={() => toggleTaskStatus(task)}>
                          Отметить готово
                        </Button>
                      </Card>
                    ))}
                </ScrollableList>
              )}
            </Card>

            <Card>
              <TitleRow>
                <SectionTitle>Финансовые записи</SectionTitle>
                <Badge>{financeEntries.length} ШТ.</Badge>
              </TitleRow>
              {financeEntries.length === 0 ? (
                <Empty>Нет доходов или расходов.</Empty>
              ) : (
                <ScrollableList
                  onWheel={(e) => {
                    const el = e.currentTarget;
                    const { scrollTop, scrollHeight, clientHeight } = el;
                    const isAtTop = scrollTop === 0;
                    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
                    
                    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                      // На границе, позволяем скроллить страницу
                      return;
                    }
                    
                    // Внутри контейнера, останавливаем всплытие
                    e.stopPropagation();
                  }}
                >
                  {financeEntries.map((entry) => (
                    <Card key={entry.id}>
                      <Row>
                        <strong>{entry.description || "Без описания"}</strong>
                        <Tag $tone={entry.category === "income" ? "success" : "danger"}>
                          {entry.category === "income" ? "+" : "-"}
                          {Math.abs(Number(entry.amount)).toFixed(2)} Br
                        </Tag>
                      </Row>
                      {entry.tags && entry.tags.length > 0 && (
                        <TagsList style={{ marginTop: rm(8), marginBottom: rm(4) }}>
                          {entry.tags.map((tag) => (
                            <TagChip key={tag.id} $selected={false} style={{ cursor: "default", pointerEvents: "none" }}>
                              {tag.name}
                            </TagChip>
                          ))}
                        </TagsList>
                      )}
                      <Helper>{formatDateDisplay(entry.occurred_on)}</Helper>
                    </Card>
                  ))}
                </ScrollableList>
              )}
            </Card>
          </Grid>

          {tagExpenses.length > 0 && (
            <Card>
              <TitleRow>
                <SectionTitle>Расходы по тегам</SectionTitle>
                <Badge>{tagExpenses.length} ТЕГ.</Badge>
              </TitleRow>
              <PieChartContainer>
                <PieChartWrapper
                  data-pie-wrapper
                  onMouseLeave={() => {
                    setTooltip({ ...tooltip, visible: false });
                  }}
                >
                  <PieChartSvg viewBox="0 0 300 300">
                    {pieChartData.map((item, index) => (
                      <path
                        key={index}
                        d={item.path}
                        fill={item.color}
                        stroke="#fff"
                        strokeWidth="2"
                        style={{
                          transition: "opacity 0.3s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.8";
                          const wrapper = e.currentTarget.closest('[data-pie-wrapper]') as HTMLElement;
                          if (wrapper) {
                            const rect = wrapper.getBoundingClientRect();
                            setTooltip({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                              text: `${item.name}: ${item.percentage.toFixed(1)}% (${item.amount.toFixed(2)} Br)`,
                              visible: true,
                            });
                          }
                        }}
                        onMouseMove={(e) => {
                          const wrapper = e.currentTarget.closest('[data-pie-wrapper]') as HTMLElement;
                          if (wrapper) {
                            const rect = wrapper.getBoundingClientRect();
                            setTooltip({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                              text: `${item.name}: ${item.percentage.toFixed(1)}% (${item.amount.toFixed(2)} Br)`,
                              visible: true,
                            });
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                          setTooltip({ ...tooltip, visible: false });
                        }}
                      />
                    ))}
                  </PieChartSvg>
                  <Tooltip $x={tooltip.x} $y={tooltip.y} $visible={tooltip.visible}>
                    {tooltip.text}
                  </Tooltip>
                </PieChartWrapper>
                <PieChartLegend>
                  {pieChartData.map((item, index) => (
                    <LegendItem key={index}>
                      <LegendColor $color={item.color} />
                      <LegendText>
                        <LegendName>{item.name}</LegendName>
                        <LegendValue>
                          {item.percentage.toFixed(1)}% ({item.amount.toFixed(2)} Br)
                        </LegendValue>
                      </LegendText>
                    </LegendItem>
                  ))}
                </PieChartLegend>
              </PieChartContainer>
            </Card>
          )}

          <Grid>
            <Card>
              <TitleRow>
                <SectionTitle>Бонусы (история)</SectionTitle>
                <Badge>{history.filter((h) => h.kind === "bonus").length} ШТ.</Badge>
              </TitleRow>
              {history.filter((h) => h.kind === "bonus").length === 0 ? (
                <Empty>Бонусов пока нет.</Empty>
              ) : (
                <ScrollableList
                  onWheel={(e) => {
                    const el = e.currentTarget;
                    const { scrollTop, scrollHeight, clientHeight } = el;
                    const isAtTop = scrollTop === 0;
                    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
                    
                    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                      // На границе, позволяем скроллить страницу
                      return;
                    }
                    
                    // Внутри контейнера, останавливаем всплытие
                    e.stopPropagation();
                  }}
                >
                  {history
                    .filter((h) => h.kind === "bonus")
                    .map((item) => (
                      <Card key={item.id}>
                        <Row>
                          <strong>Бонус</strong>
                        </Row>
                        {item.description && <Helper>{item.description}</Helper>}
                        {item.occurred_on && <Helper>{formatDateDisplay(item.occurred_on.split('T')[0])}</Helper>}
                      </Card>
                    ))}
                </ScrollableList>
              )}
            </Card>

            <Card>
              <TitleRow>
                <SectionTitle>Штрафы (история)</SectionTitle>
                <Badge>{history.filter((h) => h.kind === "penalty").length} ШТ.</Badge>
              </TitleRow>
              {history.filter((h) => h.kind === "penalty").length === 0 ? (
                <Empty>Штрафов пока нет.</Empty>
              ) : (
                <ScrollableList
                  onWheel={(e) => {
                    const el = e.currentTarget;
                    const { scrollTop, scrollHeight, clientHeight } = el;
                    const isAtTop = scrollTop === 0;
                    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
                    
                    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                      // На границе, позволяем скроллить страницу
                      return;
                    }
                    
                    // Внутри контейнера, останавливаем всплытие
                    e.stopPropagation();
                  }}
                >
                  {history
                    .filter((h) => h.kind === "penalty")
                    .map((item) => (
                      <Card key={item.id}>
                        <Row>
                          <strong>Штраф</strong>
                        </Row>
                        {item.description && <Helper>{item.description}</Helper>}
                        {item.occurred_on && <Helper>{formatDateDisplay(item.occurred_on.split('T')[0])}</Helper>}
                      </Card>
                    ))}
                </ScrollableList>
              )}
            </Card>
          </Grid>
        </>
      )}
      
      {modalReward && (
        <ModalOverlay onClick={() => setModalReward(null)}>
          <ModalContent
            $type={modalReward.type}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalTitle $type={modalReward.type}>
              {modalReward.type === "bonus" ? "🎉 Бонус начислен!" : "⚠️ Штраф начислен"}
            </ModalTitle>
            {modalReward.reason && (
              <ModalReason>{modalReward.reason}</ModalReason>
            )}
            <ModalButton onClick={() => setModalReward(null)}>
              Понятно
            </ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}

      <ToastContainer>
        {toasts.map((toast) => (
          <Toast key={toast.id} $type={toast.type}>
            {toast.type === "success" && "✓ "}
            {toast.type === "error" && "✕ "}
            {toast.message}
          </Toast>
        ))}
      </ToastContainer>
    </Page>
  );
};
