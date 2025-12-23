import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  Bonus,
  FinanceEntry,
  FinanceHistoryEntry,
  FinanceSnapshot,
  Penalty,
  Task,
  TaskStatus,
} from "@/types/tracker";

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

const missingConfigResult = <T>(fallback: T): ServiceResult<T> => ({
  data: fallback,
  error:
    "Supabase не настроен. Укажите NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.",
});

const FINANCE_STATE_ID = "current";

const upsertFinanceState = async (delta: Partial<FinanceSnapshot>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: "Supabase не настроен" };

  const { data: existing } = await client
    .from("finance_state")
    .select("*")
    .eq("id", FINANCE_STATE_ID)
    .single();

  const base: FinanceSnapshot = existing || {
    id: FINANCE_STATE_ID,
    balance: 0,
    income_total: 0,
    expense_total: 0,
    bonuses_total: 0,
    penalties_total: 0,
  };

  const next: FinanceSnapshot = {
    ...base,
    ...delta,
  };

  const { error } = await client.from("finance_state").upsert(next);
  return { data: next, error: error ? error.message : null };
};

const applyDeltaToState = async (delta: {
  balance?: number;
  income_total?: number;
  expense_total?: number;
  bonuses_total?: number;
  penalties_total?: number;
}) => {
  const client = getSupabaseClient();
  if (!client) return { error: "Supabase не настроен" };

  const { data: existing } = await client
    .from("finance_state")
    .select("*")
    .eq("id", FINANCE_STATE_ID)
    .single();

  const base: FinanceSnapshot = existing || {
    id: FINANCE_STATE_ID,
    balance: 0,
    income_total: 0,
    expense_total: 0,
    bonuses_total: 0,
    penalties_total: 0,
  };

  const next: FinanceSnapshot = {
    ...base,
    balance: (base.balance ?? 0) + (delta.balance ?? 0),
    income_total: (base.income_total ?? 0) + (delta.income_total ?? 0),
    expense_total: (base.expense_total ?? 0) + (delta.expense_total ?? 0),
    bonuses_total: (base.bonuses_total ?? 0) + (delta.bonuses_total ?? 0),
    penalties_total: (base.penalties_total ?? 0) + (delta.penalties_total ?? 0),
    updated_at: new Date().toISOString(),
  };

  const { error } = await client.from("finance_state").upsert(next);
  return { error: error ? error.message : null };
};

const recordHistory = async (entry: Omit<FinanceHistoryEntry, "id" | "created_at">) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: "Supabase не настроен" };

  const { data, error } = await client
    .from("finance_history")
    .insert({
      ...entry,
    })
    .select()
    .single();

  return { data: data as FinanceHistoryEntry | null, error: error ? error.message : null };
};

export const fetchFinanceHistory = async (): Promise<ServiceResult<FinanceHistoryEntry[]>> => {
  const client = getSupabaseClient();
  if (!client) return missingConfigResult<FinanceHistoryEntry[]>([]);

  const { data, error } = await client
    .from("finance_history")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data as FinanceHistoryEntry[], error: null };
};

export const fetchFinanceState = async (): Promise<ServiceResult<FinanceSnapshot | null>> => {
  const client = getSupabaseClient();
  if (!client) return missingConfigResult<FinanceSnapshot | null>(null);

  const { data, error } = await client
    .from("finance_state")
    .select("*")
    .eq("id", FINANCE_STATE_ID)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // row not found; return zero state
      return {
        data: {
          id: FINANCE_STATE_ID,
          balance: 0,
          income_total: 0,
          expense_total: 0,
          bonuses_total: 0,
          penalties_total: 0,
        },
        error: null,
      };
    }
    return { data: null, error: error.message };
  }

  return { data: data as FinanceSnapshot, error: null };
};

const pickRandomBonus = async (): Promise<Bonus | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.from("bonuses").select("*").order("random()").limit(1).single();
  if (error || !data) return null;
  return data as Bonus;
};

const pickRandomPenalty = async (): Promise<Penalty | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.from("penalties").select("*").order("random()").limit(1).single();
  if (error || !data) return null;
  return data as Penalty;
};

export const fetchTasks = async (): Promise<ServiceResult<Task[]>> => {
  const client = getSupabaseClient();
  if (!client) return missingConfigResult<Task[]>([]);

  const { data, error } = await client
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data as Task[], error: null };
};

export const addTask = async (
  payload: Omit<Task, "id" | "created_at" | "status"> & { status?: TaskStatus }
): Promise<ServiceResult<Task | null>> => {
  const client = getSupabaseClient();
  if (!client) return missingConfigResult<Task | null>(null);

  const { data, error } = await client
    .from("tasks")
    .insert({
      title: payload.title,
      due_date: payload.due_date,
      reward: payload.reward ?? null,
      penalty: payload.penalty ?? null,
      status: payload.status ?? "pending",
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Task, error: null };
};

export const updateTaskStatus = async (
  id: string,
  status: TaskStatus
): Promise<ServiceResult<Task | null>> => {
  const client = getSupabaseClient();
  if (!client) return missingConfigResult<Task | null>(null);

  const { data, error } = await client
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Task, error: null };
};

export const markTaskDoneWithAutoReward = async (task: Task) => {
  const now = new Date();
  const due = task.due_date ? new Date(task.due_date) : null;

  const result = await updateTaskStatus(task.id, "done");
  if (result.error || !result.data) return result;

  if (due) {
    if (now <= due) {
      const randomBonus = await pickRandomBonus();
      if (randomBonus) {
        await recordHistory({
          kind: "bonus",
          amount: Number(randomBonus.amount),
          description: randomBonus.reason
            ? `Случайный бонус: ${randomBonus.reason}`
            : "Случайный бонус",
          occurred_on: new Date().toISOString(),
          task_id: task.id,
        });
        await applyDeltaToState({
          balance: Number(randomBonus.amount),
          bonuses_total: Number(randomBonus.amount),
        });
      }
    } else if (now > due) {
      const randomPenalty = await pickRandomPenalty();
      if (randomPenalty) {
        await recordHistory({
          kind: "penalty",
          amount: Number(randomPenalty.amount),
          description: randomPenalty.reason
            ? `Случайный штраф: ${randomPenalty.reason}`
            : "Случайный штраф",
          occurred_on: new Date().toISOString(),
          task_id: task.id,
        });
        await applyDeltaToState({
          balance: -Number(randomPenalty.amount),
          penalties_total: Number(randomPenalty.amount),
        });
      }
    }
  }

  return result;
};

export const fetchFinanceEntries = async (): Promise<ServiceResult<FinanceEntry[]>> => {
  const client = getSupabaseClient();
  if (!client) return missingConfigResult<FinanceEntry[]>([]);

  const { data, error } = await client
    .from("finance_entries")
    .select("*")
    .order("occurred_on", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data as FinanceEntry[], error: null };
};

export const addFinanceEntry = async (
  payload: Omit<FinanceEntry, "id" | "created_at">
): Promise<ServiceResult<FinanceEntry | null>> => {
  const client = getSupabaseClient();
  if (!client) return missingConfigResult<FinanceEntry | null>(null);

  const { data, error } = await client
    .from("finance_entries")
    .insert({
      amount: payload.amount,
      category: payload.category,
      description: payload.description ?? null,
      occurred_on: payload.occurred_on,
      task_id: payload.task_id ?? null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  await recordHistory({
    kind: payload.category,
    amount: payload.amount,
    description: payload.description ?? null,
    occurred_on: payload.occurred_on,
    task_id: payload.task_id ?? null,
  });
  await applyDeltaToState({
    balance: payload.category === "income" ? payload.amount : -payload.amount,
    income_total: payload.category === "income" ? payload.amount : 0,
    expense_total: payload.category === "expense" ? payload.amount : 0,
  });
  return { data: data as FinanceEntry, error: null };
};

export const fetchBonuses = async (): Promise<ServiceResult<Bonus[]>> => {
  const client = getSupabaseClient();
  if (!client) return missingConfigResult<Bonus[]>([]);

  const { data, error } = await client
    .from("bonuses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data as Bonus[], error: null };
};

export const addBonus = async (
  payload: Omit<Bonus, "id" | "created_at">
): Promise<ServiceResult<Bonus | null>> => {
  const client = getSupabaseClient();
  if (!client) return missingConfigResult<Bonus | null>(null);

  const { data, error } = await client
    .from("bonuses")
    .insert({
      amount: payload.amount,
      reason: payload.reason ?? null,
      task_id: payload.task_id ?? null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  await recordHistory({
    kind: "bonus",
    amount: payload.amount,
    description: payload.reason ?? null,
    occurred_on: new Date().toISOString(),
    task_id: payload.task_id ?? null,
  });
  await applyDeltaToState({
    balance: payload.amount,
    bonuses_total: payload.amount,
  });
  return { data: data as Bonus, error: null };
};

export const fetchPenalties = async (): Promise<ServiceResult<Penalty[]>> => {
  const client = getSupabaseClient();
  if (!client) return missingConfigResult<Penalty[]>([]);

  const { data, error } = await client
    .from("penalties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data as Penalty[], error: null };
};

export const addPenalty = async (
  payload: Omit<Penalty, "id" | "created_at">
): Promise<ServiceResult<Penalty | null>> => {
  const client = getSupabaseClient();
  if (!client) return missingConfigResult<Penalty | null>(null);

  const { data, error } = await client
    .from("penalties")
    .insert({
      amount: payload.amount,
      reason: payload.reason ?? null,
      task_id: payload.task_id ?? null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  await recordHistory({
    kind: "penalty",
    amount: payload.amount,
    description: payload.reason ?? null,
    occurred_on: new Date().toISOString(),
    task_id: payload.task_id ?? null,
  });
  await applyDeltaToState({
    balance: -payload.amount,
    penalties_total: payload.amount,
  });
  return { data: data as Penalty, error: null };
};

