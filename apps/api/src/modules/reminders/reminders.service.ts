import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { RecurringExpense } from "../../schemas/recurring-expense.schema";
import { User } from "../../schemas/user.schema";
import { Category } from "../../schemas/category.schema";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateRecurringExpenseDto } from "./dto/create-recurring-expense.dto";
import { UpdateRecurringExpenseDto } from "./dto/update-recurring-expense.dto";
import { createRecurringExpenseReminderFlex } from "./flex-messages/recurring-expense-reminder";

type BangkokDateParts = {
  year: number;
  month: number;
  day: number;
};

@Injectable()
export class RemindersService {
  private readonly timezone = process.env.REMINDER_TIMEZONE || "Asia/Bangkok";
  private readonly reminderTime = "09:00";

  constructor(
    @InjectModel(RecurringExpense.name)
    private recurringExpenseModel: Model<RecurringExpense>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(userId: string) {
    return this.recurringExpenseModel
      .find({ userId })
      .populate("categoryId", "name icon")
      .sort({ dueDay: 1, reminderTime: 1 });
  }

  private async assertOwnedCategory(userId: string, categoryId?: string) {
    if (!categoryId) return;
    const category = await this.categoryModel.exists({
      _id: categoryId,
      userId,
      type: "expense",
      isActive: true,
    });
    if (!category)
      throw new BadRequestException("ไม่พบหมวดหมู่รายจ่ายที่เลือก");
  }

  async create(userId: string, dto: CreateRecurringExpenseDto) {
    await this.assertOwnedCategory(userId, dto.categoryId);
    return this.recurringExpenseModel.create({
      userId,
      ...dto,
      reminderTime: this.reminderTime,
      enabled: dto.enabled ?? true,
    });
  }

  async update(userId: string, id: string, dto: UpdateRecurringExpenseDto) {
    await this.assertOwnedCategory(userId, dto.categoryId);
    return this.recurringExpenseModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { ...dto, reminderTime: this.reminderTime } },
      { new: true },
    );
  }

  private bangkokParts(date: Date): BangkokDateParts {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: this.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = Object.fromEntries(
      formatter
        .formatToParts(date)
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
    };
  }

  private dueDayInMonth(dueDay: number, year: number, month: number) {
    return Math.min(dueDay, new Date(Date.UTC(year, month, 0)).getUTCDate());
  }

  async runDueReminders(now = new Date()) {
    const current = this.bangkokParts(now);
    const reminderKey = `${current.year}-${String(current.month).padStart(2, "0")}-${String(current.day).padStart(2, "0")}`;
    const candidates = await this.recurringExpenseModel.find({ enabled: true });
    const dueExpenses = candidates.filter(
      (expense) =>
        this.dueDayInMonth(expense.dueDay, current.year, current.month) ===
          current.day,
    );
    let sent = 0;

    for (const expense of dueExpenses) {
      const claimed = await this.recurringExpenseModel.findOneAndUpdate(
        {
          _id: expense._id,
          lastReminderKey: { $ne: reminderKey },
          deliveryClaimKey: { $ne: reminderKey },
        },
        { $set: { deliveryClaimKey: reminderKey } },
        { new: true },
      );
      if (!claimed) continue;

      const user = await this.userModel.findById(claimed.userId);
      if (!user?.lineUserId) {
        await this.recurringExpenseModel.updateOne(
          { _id: claimed._id, deliveryClaimKey: reminderKey },
          { $unset: { deliveryClaimKey: 1 } },
        );
        continue;
      }

      const dateLabel = `${current.day} ${new Intl.DateTimeFormat("th-TH", { timeZone: this.timezone, month: "long" }).format(now)} ${current.year + 543}`;
      const delivered = await this.notificationsService.sendLineMessage(
        user.lineUserId,
        [createRecurringExpenseReminderFlex(claimed, dateLabel, this.reminderTime)],
      );

      if (delivered) {
        await this.recurringExpenseModel.updateOne(
          { _id: claimed._id, deliveryClaimKey: reminderKey },
          {
            $set: { lastReminderKey: reminderKey },
            $unset: { deliveryClaimKey: 1 },
          },
        );
        sent += 1;
      } else {
        await this.recurringExpenseModel.updateOne(
          { _id: claimed._id, deliveryClaimKey: reminderKey },
          { $unset: { deliveryClaimKey: 1 } },
        );
      }
    }
    return {
      timezone: this.timezone,
      runTime: this.reminderTime,
      checked: dueExpenses.length,
      sent,
      skipped: false,
    };
  }
}
