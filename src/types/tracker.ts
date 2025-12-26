export type TaskStatus = "pending" | "in_progress" | "done";

export type Task = {
  id: string;
  title: string;
  due_date: string | null;
  reward?: number | null;
  penalty?: number | null;
  status: TaskStatus;
  notes?: string | null;
  created_at?: string;
};

export type Tag = {
  id: string;
  name: string;
  created_at?: string;
};

export type FinanceEntry = {
  id: string;
  amount: number;
  category: "income" | "expense";
  description?: string | null;
  occurred_on: string;
  task_id?: string | null;
  created_at?: string;
  tags?: Tag[]; // Populated via join
};

export type FinanceHistoryEntry = {
  id: string;
  kind: "income" | "expense" | "bonus" | "penalty";
  amount: number;
  description?: string | null;
  occurred_on: string;
  task_id?: string | null;
  created_at?: string;
};

export type FinanceSnapshot = {
  id: string; // singleton key, используем "current"
  balance: number;
  income_total: number;
  expense_total: number;
  bonuses_total: number;
  penalties_total: number;
  updated_at?: string;
};

export type Bonus = {
  id: string;
  task_id?: string | null;
  reason?: string | null;
  created_at?: string;
};

export type Penalty = {
  id: string;
  task_id?: string | null;
  reason?: string | null;
  created_at?: string;
};

