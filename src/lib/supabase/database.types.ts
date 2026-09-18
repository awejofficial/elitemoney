export type CategoryType = "income" | "expense";
export type AccountType = "bank" | "cash" | "wallet" | "custom";
export type RecurringFrequency = "monthly" | "custom";
export type LendingDirection = "lent" | "borrowed";
export type LendingStatus = "open" | "partially_settled" | "settled";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  starting_balance: number;
  created_at: string;
}

export interface AccountBalance {
  account_id: string;
  user_id: string;
  name: string;
  type: AccountType;
  starting_balance: number;
  balance: number;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: CategoryType;
  amount: number;
  date: string;
  note: string | null;
  recurring_rule_id: string | null;
  created_at: string;
}

export interface RecurringRule {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: CategoryType;
  amount: number;
  frequency: RecurringFrequency;
  day_of_month: number | null;
  note: string | null;
  active: boolean;
  next_run_date: string;
  created_at: string;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface LendingEntry {
  id: string;
  user_id: string;
  person_id: string;
  direction: LendingDirection;
  amount: number;
  date: string;
  due_date: string | null;
  note: string | null;
  created_at: string;
}

export interface LendingEntryOutstanding {
  lending_entry_id: string;
  user_id: string;
  person_id: string;
  direction: LendingDirection;
  amount: number;
  outstanding_amount: number;
  status: LendingStatus;
  date: string;
  due_date: string | null;
  note: string | null;
}

export interface LendingRepayment {
  id: string;
  user_id: string;
  lending_entry_id: string;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
}

export interface PersonBalance {
  person_id: string;
  user_id: string;
  name: string;
  net_balance: number;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}
