const money = (amount: number) =>
  `฿${Number(amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const createRecurringExpenseReminderFlex = (
  expense: {
    name: string;
    amount: number;
    dueDay: number;
    installmentCurrent?: number;
    installmentTotal?: number;
  },
  dateLabel: string,
  reminderTime: string,
) => ({
  type: "flex",
  altText: `ถึงกำหนดชำระ ${expense.name} วันนี้ ${money(expense.amount)}`,
  contents: {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#174F49",
      paddingAll: "20px",
      contents: [
        {
          type: "text",
          text: "REMINDER",
          color: "#B7DDD3",
          size: "xs",
          weight: "bold",
          letterSpacing: "1px",
        },
        {
          type: "text",
          text: "รายการที่ต้องชำระ",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "md",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: expense.name,
          size: "xl",
          weight: "bold",
          wrap: true,
          color: "#1C2837",
        },
        {
          type: "text",
          text: money(expense.amount),
          size: "3xl",
          weight: "bold",
          color: "#14754F",
          margin: "lg",
        },
        { type: "separator", margin: "lg" },
        {
          type: "box",
          layout: "vertical",
          margin: "lg",
          spacing: "sm",
          contents: [
            ...(expense.installmentCurrent && expense.installmentTotal
              ? [
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {
                        type: "text",
                        text: "งวด",
                        color: "#667080",
                        size: "sm",
                        flex: 3,
                      },
                      {
                        type: "text",
                        text: `งวดที่ ${expense.installmentCurrent} จาก ${expense.installmentTotal}`,
                        color: "#1C2837",
                        size: "sm",
                        weight: "bold",
                        flex: 5,
                        align: "end",
                      },
                    ],
                  },
                ]
              : []),
            {
              type: "box",
              layout: "baseline",
              contents: [
                {
                  type: "text",
                  text: "กำหนดชำระ",
                  color: "#667080",
                  size: "sm",
                  flex: 3,
                },
                {
                  type: "text",
                  text: dateLabel,
                  color: "#1C2837",
                  size: "sm",
                  weight: "bold",
                  flex: 5,
                  align: "end",
                },
              ],
            },
            {
              type: "box",
              layout: "baseline",
              contents: [
                {
                  type: "text",
                  text: "เวลาที่แจ้ง",
                  color: "#667080",
                  size: "sm",
                  flex: 3,
                },
                {
                  type: "text",
                  text: `${reminderTime} น.`,
                  color: "#1C2837",
                  size: "sm",
                  weight: "bold",
                  flex: 5,
                  align: "end",
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "18px",
      contents: [
        {
          type: "text",
          text: "บันทึกการจ่ายแล้วใน Fumi Manager เพื่ออัปเดตงบประมาณ",
          size: "xs",
          color: "#667080",
          align: "center",
          wrap: true,
        },
      ],
    },
  },
});
