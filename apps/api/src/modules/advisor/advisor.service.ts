import { Injectable } from "@nestjs/common";
import { TransactionsService } from "../transactions/transactions.service";
import { BudgetsService } from "../budgets/budgets.service";
import axios from "axios";

@Injectable()
export class AdvisorService {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly budgetsService: BudgetsService,
  ) {}

  async getAdvice(userId: string, userMessage: string): Promise<string> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) return "ขออภัยครับ ระบบ AI ยังไม่พร้อมใช้งานในขณะนี้";

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // 1. Gather Context
    const [summary, budgets, recentTransactions] = await Promise.all([
      this.transactionsService.getSummary(userId, month, year),
      this.budgetsService.findByMonth(userId, month, year),
      this.transactionsService.findAll(userId, { limit: 20 }),
    ]);

    const budgetContext = budgets
      .map(
        (b: any) =>
          `- ${b.categoryId?.name}: ใช้ไป ฿${b.spentAmount} จากงบ ฿${b.limitAmount}`,
      )
      .join("\n");

    const transactionContext = recentTransactions.data
      .map(
        (t: any) =>
          `- ${new Date(t.date).toLocaleDateString("th-TH")}: ${t.note || "ไม่มีชื่อ"} (${t.type}) ฿${t.amount}`,
      )
      .join("\n");

    const systemPrompt = `คุณคือ "MoneyFlow Advisor" ผู้เชี่ยวชาญด้านการเงินส่วนบุคคลที่ใจดีและรอบรู้
ข้อมูลการเงินของผู้ใช้ในเดือนนี้ (${month}/${year}):
- รายรับรวม: ฿${summary.income}
- รายจ่ายรวม: ฿${summary.expense}
- ยอดคงเหลือ: ฿${summary.net}

งบประมาณรายหมวดหมู่:
${budgetContext}

รายการล่าสุด 20 รายการ:
${transactionContext}

คำแนะนำการใช้งาน:
1. ตอบคำถามของผู้ใช้โดยใช้ข้อมูลด้านบนประกอบ
2. ให้คำแนะนำที่สร้างสรรค์ ประหยัด และเป็นกันเอง
3. หากผู้ใช้ถามเรื่องที่ไม่มีในข้อมูล ให้ตอบตามหลักการวางแผนการเงินที่ดี
4. ใช้ภาษาไทยที่สุภาพและน่าอ่าน
5. หากถามถึงยอดสรุป ให้สรุปให้กระชับ`;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\nผู้ใช้ถามว่า: ${userMessage}` },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        },
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      console.error(
        "Gemini Advisor Error:",
        error.response?.data || error.message,
      );
      return "ขออภัยครับ ผมไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้ ลองใหม่อีกครั้งนะครับ";
    }
  }
}
