import { RemindersService } from "./reminders.service";

describe("RemindersService", () => {
  it("sends one reminder for a bill due at 09:00 Bangkok time", async () => {
    const expense = {
      _id: "expense-1",
      userId: "user-1",
      name: "ค่าเช่าห้อง",
      amount: 8500,
      dueDay: 31,
      reminderTime: "09:00",
      enabled: true,
    };
    const recurringExpenseModel = {
      find: jest.fn().mockResolvedValue([expense]),
      findOneAndUpdate: jest.fn().mockResolvedValue(expense),
      updateOne: jest.fn().mockResolvedValue({}),
    };
    const userModel = {
      findById: jest.fn().mockResolvedValue({ lineUserId: "line-user-1" }),
    };
    const categoryModel = { exists: jest.fn() };
    const notificationsService = {
      sendLineMessage: jest.fn().mockResolvedValue(true),
    };
    const service = new RemindersService(
      recurringExpenseModel as any,
      userModel as any,
      categoryModel as any,
      notificationsService as any,
    );

    const result = await service.runDueReminders(
      new Date("2026-01-31T02:00:00.000Z"),
    );

    expect(result).toEqual({
      timezone: "Asia/Bangkok",
      runTimes: ["09:00"],
      checked: 1,
      sent: 1,
      skipped: false,
    });
    expect(notificationsService.sendLineMessage).toHaveBeenCalledWith(
      "line-user-1",
      [
        expect.objectContaining({
          type: "flex",
          altText: expect.stringContaining("ค่าเช่าห้อง"),
        }),
      ],
    );
    expect(recurringExpenseModel.updateOne).toHaveBeenCalledWith(
      { _id: "expense-1", deliveryClaimKey: "2026-01-31-09:00" },
      expect.objectContaining({
        $set: { lastReminderKey: "2026-01-31-09:00" },
      }),
    );
  });

  it("does not send a reminder before its configured time", async () => {
    const recurringExpenseModel = {
      find: jest.fn().mockResolvedValue([
        {
          _id: "expense-1",
          dueDay: 31,
          reminderTime: "10:00",
          enabled: true,
        },
      ]),
    };
    const service = new RemindersService(
      recurringExpenseModel as any,
      { findById: jest.fn() } as any,
      { sendLineMessage: jest.fn() } as any,
      {} as any,
    );

    const result = await service.runDueReminders(
      new Date("2026-01-31T02:01:00.000Z"),
    );

    expect(result).toEqual({
      timezone: "Asia/Bangkok",
      runTimes: ["09:00"],
      checked: 0,
      sent: 0,
      skipped: false,
    });
    expect(recurringExpenseModel.find).toHaveBeenCalled();
  });
});
