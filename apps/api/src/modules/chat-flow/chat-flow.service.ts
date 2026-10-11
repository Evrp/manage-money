import { Injectable } from "@nestjs/common";
import { NotificationsService } from "../notifications/notifications.service";
import { TransactionsService } from "../transactions/transactions.service";
import { AdvisorService } from "../advisor/advisor.service";
import { CategoriesService } from "../categories/categories.service";
import { SlipsService } from "../slips/slips.service";

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
    private readonly categoriesService: CategoriesService,
    private readonly slipsService: SlipsService,
  ) {}

  async handleImage(userId: string, lineUserId: string, messageId: string) {
    try {
      const { buffer, mimeType } =
        await this.notificationsService.getLineMessageContent(messageId);
      if (!mimeType.startsWith("image/")) {
        await this.notificationsService.sendLineMessage(lineUserId, [
          {
            type: "text",
            text: "ส่งเป็นรูปภาพสลิปได้เลยครับ รองรับ JPEG, PNG และ WebP",
          },
        ]);
        return;
      }

      const upload = await this.slipsService.processLineImage(
        userId,
        messageId,
        {
          buffer,
          mimetype: mimeType,
          originalname: `line_${messageId}`,
          encoding: "7bit",
          size: buffer.length,
          fieldname: "file",
        } as Express.Multer.File,
      );

      if (!upload.extractedData) {
        await this.notificationsService.sendLineMessage(lineUserId, [
          {
            type: "text",
            text: "รับรูปแล้ว แต่ยังอ่านข้อมูลสลิปไม่สำเร็จ ลองส่งรูปที่ชัดและเห็นยอดเงินครบอีกครั้งนะครับ",
          },
        ]);
        return;
      }

      await this.notificationsService.sendLineMessage(lineUserId, [
        {
          type: "text",
          text: upload.extractedData.amount
            ? `อ่านยอดจากสลิปได้ ฿${Number(upload.extractedData.amount).toLocaleString("th-TH")} แล้วครับ`
            : "รับรูปแล้วครับ แต่ไม่พบยอดเงินที่อ่านได้",
        },
        this.createSlipTypeBubble(upload.id.toString()),
      ]);
    } catch (error) {
      console.error("LINE slip processing failed:", error);
      await this.notificationsService.sendLineMessage(lineUserId, [
        {
          type: "text",
          text: "ขออภัยครับ ตอนนี้ยังประมวลผลรูปสลิปไม่ได้ ลองส่งใหม่อีกครั้งนะครับ",
        },
      ]);
    }
  }

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
    if (params.get("flow") === "slip") {
      await this.handleSlipPostback(userId, lineUserId, params);
      return;
    }
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

  private async handleSlipPostback(
    userId: string,
    lineUserId: string,
    params: URLSearchParams,
  ) {
    const slipId = params.get("slipId") || "";
    const type = params.get("type");
    if (!slipId) return;

    if (type !== "income" && type !== "expense") {
      await this.notificationsService.sendLineMessage(lineUserId, [
        { type: "text", text: "เลือกประเภทรายการจากปุ่มในข้อความได้เลยครับ" },
        this.createSlipTypeBubble(slipId),
      ]);
      return;
    }

    const requestedPage = Number(params.get("page") || 0);
    const page = Number.isFinite(requestedPage)
      ? Math.max(0, requestedPage)
      : 0;
    const categories = (await this.categoriesService.findAll(userId)).filter(
      (category: any) => category.type === type,
    );
    if (params.has("categoryId")) {
      const categoryId = params.get("categoryId") || "";
      if (
        !categories.some(
          (category: any) => category._id.toString() === categoryId,
        )
      ) {
        await this.notificationsService.sendLineMessage(lineUserId, [
          { type: "text", text: "หมวดหมู่นี้ใช้ไม่ได้แล้ว กรุณาเลือกใหม่ครับ" },
          this.createSlipCategoryBubble(slipId, type, categories, page),
        ]);
        return;
      }

      try {
        const saved = await this.slipsService.confirmFromLine(
          userId,
          slipId,
          categoryId,
          type,
        );
        await this.notificationsService.sendLineMessage(lineUserId, [
          {
            type: "text",
            text: `บันทึกเป็น${type === "expense" ? "รายจ่าย" : "รายรับ"}เรียบร้อยครับ\nหมวดหมู่: ${categories.find((category: any) => category._id.toString() === categoryId)?.name}\nยอด: ฿${saved.amount.toLocaleString("th-TH")}\nวันที่: ${saved.date.toLocaleDateString("th-TH")}`,
          },
        ]);
      } catch (error: any) {
        await this.notificationsService.sendLineMessage(lineUserId, [
          { type: "text", text: error.message || "บันทึกรายการไม่สำเร็จครับ" },
        ]);
      }
      return;
    }

    await this.notificationsService.sendLineMessage(lineUserId, [
      this.createSlipCategoryBubble(slipId, type, categories, page),
    ]);
  }

  private createSlipTypeBubble(slipId: string) {
    return {
      type: "flex",
      altText: "เลือกประเภทรายการจากสลิป",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: "สลิปนี้เป็นรายการแบบไหนครับ?",
              weight: "bold",
              size: "lg",
              wrap: true,
            },
            {
              type: "text",
              text: "เลือกประเภทรายการเพื่อไปเลือกหมวดหมู่",
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
          contents: (["expense", "income"] as const).map((type) => ({
            type: "button",
            style: type === "expense" ? "primary" : "secondary",
            action: {
              type: "postback",
              label: type === "expense" ? "รายจ่าย" : "รายรับ",
              data: `flow=slip&slipId=${slipId}&type=${type}`,
              displayText: type === "expense" ? "รายจ่าย" : "รายรับ",
            },
          })),
        },
      },
    };
  }

  private createSlipCategoryBubble(
    slipId: string,
    type: "income" | "expense",
    categories: any[],
    page: number,
  ) {
    const pageSize = 4;
    const pages = Math.max(1, Math.ceil(categories.length / pageSize));
    const activePage = Math.min(page, pages - 1);
    const categoryButtons = categories
      .slice(activePage * pageSize, (activePage + 1) * pageSize)
      .map((category) => ({
        type: "button",
        style: "secondary",
        action: {
          type: "postback",
          label: String(category.name).slice(0, 20),
          data: `flow=slip&slipId=${slipId}&type=${type}&categoryId=${category._id}`,
          displayText: category.name,
        },
      }));
    const navigation = [];
    if (pages > 1) {
      navigation.push({
        type: "button",
        style: "link",
        action: {
          type: "postback",
          label: `${activePage + 1}/${pages} · หน้าถัดไป`,
          data: `flow=slip&slipId=${slipId}&type=${type}&page=${(activePage + 1) % pages}`,
          displayText: "ดูหมวดหมู่เพิ่มเติม",
        },
      });
    }
    const contents = categoryButtons.length
      ? [...categoryButtons, ...navigation]
      : [
          {
            type: "text",
            text: "ยังไม่มีหมวดหมู่ประเภทนี้ในบัญชี",
            wrap: true,
          },
        ];

    return {
      type: "flex",
      altText: `เลือกหมวดหมู่${type === "expense" ? "รายจ่าย" : "รายรับ"}`,
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: `เลือกหมวดหมู่${type === "expense" ? "รายจ่าย" : "รายรับ"}`,
              weight: "bold",
              size: "lg",
              wrap: true,
            },
            {
              type: "text",
              text: `เลือกได้ ${categories.length} หมวดหมู่`,
              size: "sm",
              color: "#687076",
            },
          ],
        },
        footer: { type: "box", layout: "vertical", spacing: "sm", contents },
      },
    };
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
