import { Injectable } from "@nestjs/common";
import { NotificationsService } from "../notifications/notifications.service";
import { TransactionsService } from "../transactions/transactions.service";
import { AdvisorService } from "../advisor/advisor.service";

type SummaryType = "income" | "expense" | "net";
type SummaryPeriod = "current" | "previous";

const SUMMARY_LABELS: Record<SummaryType, string> = {
  income: "รายรับ",
  expense: "รายจ่าย",
  net: "ยอดคงเหลือ",
};

@Injectable()
export class ChatFlowService {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly notificationsService: NotificationsService,
    private readonly advisorService: AdvisorService,
  ) {}

  async handleMessage(userId: string, lineUserId: string, text: string) {
    if (["สรุป", "เมนู", "เริ่มแชต"].includes(text.trim())) {
      await this.notificationsService.sendLineMessage(lineUserId, [
        this.createSummaryTypeBubble(),
      ]);
      return;
    }

    const reply = await this.advisorService.getAdvice(userId, text);
    await this.notificationsService.sendLineMessage(lineUserId, [
      { type: "text", text: reply },
    ]);
  }

  createSummaryTypeBubble() {
    return {
      type: "flex",
      altText: "เลือกหัวข้อสรุปที่ต้องการ",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: "อยากดูสรุปเรื่องไหนครับ?",
              weight: "bold",
              size: "lg",
              wrap: true,
            },
            {
              type: "text",
              text: "เลือกหัวข้อด้านล่างเพื่อไปขั้นตอนถัดไป",
              size: "sm",
              color: "#687076",
              wrap: true,
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: (["income", "expense", "net"] as SummaryType[]).map(
            (summaryType) => ({
              type: "button",
              style: summaryType === "expense" ? "primary" : "secondary",
              action: {
                type: "postback",
                label: SUMMARY_LABELS[summaryType],
                data: `flow=summary&periodStep=1&type=${summaryType}`,
                displayText: SUMMARY_LABELS[summaryType],
              },
            }),
          ),
        },
      },
    };
  }

  async handlePostback(userId: string, lineUserId: string, rawData: string) {
    const params = new URLSearchParams(rawData);
    if (params.get("flow") !== "summary") return;
    if (params.get("restart") === "1") {
      await this.notificationsService.sendLineMessage(lineUserId, [
        this.createSummaryTypeBubble(),
      ]);
      return;
    }

    const summaryType = params.get("type") as SummaryType;
    if (!(summaryType in SUMMARY_LABELS)) {
      await this.notificationsService.sendLineMessage(lineUserId, [
        {
          type: "text",
          text: "ตัวเลือกนี้ไม่ถูกต้อง ลองเริ่มสรุปใหม่อีกครั้งนะครับ",
        },
        this.createSummaryTypeBubble(),
      ]);
      return;
    }

    if (params.get("periodStep") === "1") {
      await this.notificationsService.sendLineMessage(lineUserId, [
        this.createPeriodBubble(summaryType),
      ]);
      return;
    }

    const period = params.get("period") as SummaryPeriod;
    if (period !== "current" && period !== "previous") {
      await this.notificationsService.sendLineMessage(lineUserId, [
        { type: "text", text: "เลือกระยะเวลาที่ต้องการดูได้เลยครับ" },
        this.createPeriodBubble(summaryType),
      ]);
      return;
    }

    const now = new Date();
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (period === "previous" ? 1 : 0),
      1,
    );
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const summary = await this.transactionsService.getSummary(
      userId,
      month,
      year,
    );
    const amount =
      summaryType === "income"
        ? summary.income
        : summaryType === "expense"
          ? summary.expense
          : summary.net;
    const periodLabel = `${period === "current" ? "เดือนนี้" : "เดือนก่อน"} (${month}/${year})`;

    await this.notificationsService.sendLineMessage(lineUserId, [
      {
        type: "flex",
        altText: `สรุป${SUMMARY_LABELS[summaryType]}${periodLabel}`,
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            backgroundColor: summaryType === "expense" ? "#F97316" : "#16A34A",
            contents: [
              {
                type: "text",
                text: `สรุป${SUMMARY_LABELS[summaryType]}`,
                color: "#FFFFFF",
                weight: "bold",
                size: "lg",
              },
            ],
          },
          body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            contents: [
              { type: "text", text: periodLabel, color: "#687076", size: "sm" },
              {
                type: "text",
                text: `฿${amount.toLocaleString("th-TH")}`,
                weight: "bold",
                size: "xxl",
                wrap: true,
              },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                style: "secondary",
                action: {
                  type: "postback",
                  label: "ดูสรุปหัวข้ออื่น",
                  data: "flow=summary&restart=1",
                  displayText: "ดูสรุปหัวข้ออื่น",
                },
              },
            ],
          },
        },
      },
    ]);
  }

  private createPeriodBubble(summaryType: SummaryType) {
    return {
      type: "flex",
      altText: `เลือกช่วงเวลาสำหรับ${SUMMARY_LABELS[summaryType]}`,
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: `ต้องการดู${SUMMARY_LABELS[summaryType]}ช่วงไหนครับ?`,
              weight: "bold",
              size: "lg",
              wrap: true,
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: (["current", "previous"] as SummaryPeriod[]).map(
            (period) => ({
              type: "button",
              style: period === "current" ? "primary" : "secondary",
              action: {
                type: "postback",
                label: period === "current" ? "เดือนนี้" : "เดือนก่อน",
                data: `flow=summary&type=${summaryType}&period=${period}`,
                displayText: period === "current" ? "เดือนนี้" : "เดือนก่อน",
              },
            }),
          ),
        },
      },
    };
  }
}
