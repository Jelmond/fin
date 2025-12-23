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
  gap: ${rm(32)};
  padding: ${rm(40)} ${rm(18)} ${rm(64)};
  ${minHeightLvh(120)};
  background: radial-gradient(circle at 15% 20%, rgba(63, 124, 255, 0.12), transparent 25%),
    radial-gradient(circle at 80% 0%, rgba(25, 169, 116, 0.12), transparent 30%),
    ${ui.bg};
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
  grid-template-columns: repeat(auto-fit, minmax(${rm(280)}, 1fr));
  gap: ${rm(16)};
`;

const Card = styled.div`
  background: ${ui.card};
  border: 1px solid ${ui.cardBorder};
  border-radius: ${rm(16)};
  padding: ${rm(18)};
  box-shadow: 0 ${rm(12)} ${rm(32)} rgba(52, 63, 91, 0.12);
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

const Message = styled.div<{ $tone?: "info" | "error" }>`
  width: min(1200px, 100%);
  margin: 0 auto;
  background: ${({ $tone }) => ($tone === "error" ? "rgba(214, 69, 69, 0.12)" : ui.card)};
  border: 1px solid ${({ $tone }) => ($tone === "error" ? "rgba(214, 69, 69, 0.3)" : ui.cardBorder)};
  color: ${ui.text};
  border-radius: ${rm(14)};
  padding: ${rm(14)};
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
  top: calc(100% + ${rm(6)});
  left: 0;
  background: #fff;
  border: 1px solid ${ui.cardBorder};
  border-radius: ${rm(16)};
  box-shadow: 0 ${rm(16)} ${rm(36)} rgba(52, 63, 91, 0.16);
  padding: ${rm(12)};
  z-index: 12;
  width: ${rm(280)};
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${rm(10)};
  color: ${ui.text};
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${rm(6)};
`;

const DayCell = styled.button<{ $muted?: boolean; $selected?: boolean }>`
  height: ${rm(34)};
  border-radius: ${rm(10)};
  border: none;
  background: ${({ $selected }) => ($selected ? ui.accent : "transparent")};
  color: ${({ $selected, $muted }) =>
    $selected ? "#fff" : $muted ? ui.muted : ui.text};
  cursor: pointer;
  &:hover {
    background: ${({ $selected }) => ($selected ? ui.accent : ui.accentSoft)};
  }
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [taskForm, setTaskForm] = useState({
    title: "",
    due_date: "",
    notes: "",
  });

  const [financeForm, setFinanceForm] = useState({
    amount: "",
    category: "expense",
    description: "",
    occurred_on: new Date().toISOString().slice(0, 10),
  });

  const supabaseMissing = !hasSupabaseConfig();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
    const [tasksRes, financesRes, penaltiesRes, historyRes, stateRes] = await Promise.all([
        fetchTasks(),
        fetchFinanceEntries(),
        fetchPenalties(),
        fetchFinanceHistory(),
        fetchFinanceState(),
      ]);

      setTasks(tasksRes.data);
      setFinanceEntries(financesRes.data);
      setPenalties(penaltiesRes.data);
      setHistory(historyRes.data);
      setFinanceState(stateRes.data);

      setError(
        tasksRes.error || financesRes.error || penaltiesRes.error || historyRes.error || stateRes.error
      );
      setLoading(false);
    };

    load();
  }, []);

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
    const base = value ? new Date(value) : new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay() || 7; // make Monday = 1..Sunday=7
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = startDay - 2; i >= 0; i--) {
      cells.push({ day: prevDays - i, muted: true, date: new Date(year, month - 1, prevDays - i) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, muted: false, date: new Date(year, month, d) });
    }
    const tail = 42 - cells.length;
    for (let t = 1; t <= tail; t++) {
      cells.push({ day: t, muted: true, date: new Date(year, month + 1, t) });
    }
    return { cells, year, month };
  };

  const formatDate = (date: Date) => date.toISOString().slice(0, 10);

  const handleTaskSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const { data, error: err } = await addTask({
      title: taskForm.title,
      due_date: taskForm.due_date ? new Date(taskForm.due_date).toISOString() : null,
      reward: null,
      penalty: null,
      notes: taskForm.notes || null,
    });

    if (err) return setError(err);
    if (data) {
      setTasks((prev) => [data, ...prev]);
      setTaskForm({ title: "", due_date: "", notes: "" });
      setMessage("Задача сохранена");
    }
  };

  const handleFinanceSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const { data, error: err } = await addFinanceEntry({
      amount: Number(financeForm.amount),
      category: financeForm.category as FinanceEntry["category"],
      description: financeForm.description || null,
      occurred_on: financeForm.occurred_on,
      task_id: null,
    });

    if (err) return setError(err);
    if (data) {
      setFinanceEntries((prev) => [data, ...prev]);
      setFinanceForm({
        amount: "",
        category: financeForm.category,
        description: "",
        occurred_on: financeForm.occurred_on,
      });
      setMessage("Запись сохранена");
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === "done" ? "pending" : "done";
    if (nextStatus === "done") {
      const { data, error: err } = await markTaskDoneWithAutoReward(task);
      if (err) return setError(err);
      if (data) {
        setTasks((prev) => prev.map((t) => (t.id === data.id ? data : t)));
        setMessage("Статус изменён: готово. Бонус выбирается случайно из базы.");
      }
      return;
    }

    const { data, error: err } = await updateTaskStatus(task.id, nextStatus);
    if (err) return setError(err);
    if (data) {
      setTasks((prev) => prev.map((t) => (t.id === data.id ? data : t)));
      setMessage("Статус изменён: в работе");
    }
  };

  return (
    <Page from={{ y: "-20rem" }} to={{ y: "0rem" }} delayIn={200}>
      <Hero>
        <HeroCard>
          <HeroTitle>Финансы и задачи — в одном месте</HeroTitle>
          <HeroText>
            Ведите личные финансы, сроки задач, бонусы и штрафы. Всё хранится в Supabase, работает
            на мобильных и десктопах, интерфейс на русском языке.
          </HeroText>
        </HeroCard>
        <Grid>
            <Card>
              <TitleRow>
                <SectionTitle>Баланс</SectionTitle>
                <Badge>итоги</Badge>
              </TitleRow>
              <List>
                <Row>
                  <strong>Текущее значение</strong>
                  <Tag $tone={totals.net >= 0 ? "success" : "danger"}>
                    {totals.net >= 0 ? "+" : ""}
                    {totals.net.toFixed(2)}
                  </Tag>
                </Row>
              </List>
            </Card>
          <Card>
            <TitleRow>
              <SectionTitle>Скорость</SectionTitle>
              <Badge>лайфхак</Badge>
            </TitleRow>
            <Helper>
              • При закрытии задачи в срок приложение случайно выбирает бонус из таблицы bonuses. <br />
              • При просрочке — случайный штраф из penalties. <br />
              • Через интерфейс бонусы/штрафы не добавляются, заводите их в БД.
            </Helper>
          </Card>
        </Grid>
      </Hero>

      {supabaseMissing && (
        <Message $tone="error">
          Не найдены переменные окружения Supabase. Добавьте `NEXT_PUBLIC_SUPABASE_URL` и
          `NEXT_PUBLIC_SUPABASE_ANON_KEY` в `.env.local`, затем перезапустите dev-сервер.
        </Message>
      )}
      {error && <Message $tone="error">{error}</Message>}
      {message && <Message>{message}</Message>}

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
                  {taskForm.due_date ? new Date(taskForm.due_date).toLocaleDateString() : "Выбрать дату"}
                  <span>📅</span>
                </DateButton>
                {dateTaskOpen && (() => {
                  const { cells, month, year } = buildCalendar(taskForm.due_date || new Date().toISOString());
                  const prev = () => {
                    const d = taskForm.due_date ? new Date(taskForm.due_date) : new Date();
                    d.setMonth(d.getMonth() - 1);
                    setTaskForm((f) => ({ ...f, due_date: formatDate(d) }));
                  };
                  const next = () => {
                    const d = taskForm.due_date ? new Date(taskForm.due_date) : new Date();
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
                    ? new Date(financeForm.occurred_on).toLocaleDateString()
                    : "Выбрать дату"}
                  <span>📅</span>
                </DateButton>
                {dateFinanceOpen && (() => {
                  const { cells, month, year } = buildCalendar(financeForm.occurred_on || new Date().toISOString());
                  const prev = () => {
                    const d = new Date(financeForm.occurred_on || new Date());
                    d.setMonth(d.getMonth() - 1);
                    setFinanceForm((f) => ({ ...f, occurred_on: formatDate(d) }));
                  };
                  const next = () => {
                    const d = new Date(financeForm.occurred_on || new Date());
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
              <Button type="submit" disabled={!financeForm.amount}>
                Сохранить запись
              </Button>
            </Card>

            <Card>
              <TitleRow>
                <SectionTitle>Штрафы</SectionTitle>
                <Badge>только авто / база</Badge>
              </TitleRow>
              <Helper>
                Штрафы начисляются автоматически при просрочке задач с дедлайном и заполненным
                штрафом, либо если вы заносите их вручную в БД (таблица penalties). Через интерфейс
                добавить нельзя.
              </Helper>
            </Card>
          </Grid>

          <Grid>
            <Card>
              <TitleRow>
                <SectionTitle>Задачи</SectionTitle>
                <Badge>{tasks.length} шт.</Badge>
              </TitleRow>
              {tasks.length === 0 ? (
                <Empty>Пока нет задач.</Empty>
              ) : (
                <List>
                  {tasks.map((task) => (
                    <Card key={task.id}>
                      <Row>
                        <strong>{task.title}</strong>
                        <Tag $tone={task.status === "done" ? "success" : "neutral"}>
                          {task.status === "done" ? "готово" : "в работе"}
                        </Tag>
                      </Row>
                      {task.due_date && (
                        <Helper>Дедлайн: {new Date(task.due_date).toLocaleDateString()}</Helper>
                      )}
                      {task.notes && <Helper>{task.notes}</Helper>}
                      <Button type="button" onClick={() => toggleTaskStatus(task)}>
                        {task.status === "done" ? "Вернуть в работу" : "Отметить готово"}
                      </Button>
                    </Card>
                  ))}
                </List>
              )}
            </Card>

            <Card>
              <TitleRow>
                <SectionTitle>Финансовые записи</SectionTitle>
                <Badge>{financeEntries.length} шт.</Badge>
              </TitleRow>
              {financeEntries.length === 0 ? (
                <Empty>Нет доходов или расходов.</Empty>
              ) : (
                <List>
                  {financeEntries.map((entry) => (
                    <Card key={entry.id}>
                      <Row>
                        <strong>{entry.description || "Без описания"}</strong>
                        <Tag $tone={entry.category === "income" ? "success" : "danger"}>
                          {entry.category === "income" ? "+" : "-"}
                          {Number(entry.amount).toFixed(2)}
                        </Tag>
                      </Row>
                      <Helper>{new Date(entry.occurred_on).toLocaleDateString()}</Helper>
                    </Card>
                  ))}
                </List>
              )}
            </Card>

            <Card>
              <TitleRow>
                <SectionTitle>Бонусы (история)</SectionTitle>
                <Badge>{history.filter((h) => h.kind === "bonus").length} шт.</Badge>
              </TitleRow>
              {history.filter((h) => h.kind === "bonus").length === 0 ? (
                <Empty>Бонусов пока нет.</Empty>
              ) : (
                <List>
                  {history
                    .filter((h) => h.kind === "bonus")
                    .map((item) => (
                      <Card key={item.id}>
                        <Row>
                          <strong>Бонус</strong>
                          <Tag $tone="success">+{Number(item.amount).toFixed(2)}</Tag>
                        </Row>
                        {item.description && <Helper>{item.description}</Helper>}
                        {item.occurred_on && <Helper>{new Date(item.occurred_on).toLocaleString()}</Helper>}
                      </Card>
                    ))}
                </List>
              )}
            </Card>

            <Card>
              <TitleRow>
                <SectionTitle>Штрафы (история)</SectionTitle>
                <Badge>{history.filter((h) => h.kind === "penalty").length} шт.</Badge>
              </TitleRow>
              {history.filter((h) => h.kind === "penalty").length === 0 ? (
                <Empty>Штрафов пока нет.</Empty>
              ) : (
                <List>
                  {history
                    .filter((h) => h.kind === "penalty")
                    .map((item) => (
                      <Card key={item.id}>
                        <Row>
                          <strong>Штраф</strong>
                          <Tag $tone="danger">-{Number(item.amount).toFixed(2)}</Tag>
                        </Row>
                        {item.description && <Helper>{item.description}</Helper>}
                        {item.occurred_on && <Helper>{new Date(item.occurred_on).toLocaleString()}</Helper>}
                      </Card>
                    ))}
                </List>
              )}
            </Card>
          </Grid>
        </>
      )}
    </Page>
  );
};
