export interface IRecurringExpense {
  _id?: any;
  userId: string;
  categoryId?: string;
  name: string;
  amount: number;
  dueDay: number;
  reminderTime: string;
  enabled: boolean;
  lastReminderKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
