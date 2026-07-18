import { createWorker } from "tesseract.js";

const RECEIPT_KEYWORDS = [
  "transaction",
  "trx",
  "transaksi",
  "id",
  "sent",
  "successful",
  "completed",
  "receipt",
  "easypaisa",
  "jazzcash",
  "amount",
  "rs.",
  "pkr",
  "transfer",
  "hbl",
  "alfalah",
  "ubl",
  "mcb",
  "bank",
  "paid",
  "payment",
];

export async function verifyPaymentReceipt(imageUrl: string): Promise<{
  isProbablyReceipt: boolean;
  confidence: number;
  detectedText: string;
  analysis: string;
}> {
  if (!imageUrl) {
    return {
      isProbablyReceipt: false,
      confidence: 0,
      detectedText: "",
      analysis: "No receipt image provided.",
    };
  }

  let worker;
  try {
    // Create a tesseract worker
    worker = await createWorker("eng");
    const { data } = await worker.recognize(imageUrl);
    const text = (data.text || "").toLowerCase();

    // Check matches
    const matches = RECEIPT_KEYWORDS.filter((kw) => text.includes(kw));
    const score = matches.length;

    let analysis = "";
    let isProbablyReceipt = false;

    if (score >= 3) {
      isProbablyReceipt = true;
      analysis = `✅ Verified: Found transaction indicators (${matches.slice(0, 4).join(", ")}).`;
    } else if (score >= 1) {
      isProbablyReceipt = true;
      analysis = `⚠️ Low Confidence: Only found (${matches.join(", ")}). Please check manually.`;
    } else {
      analysis = "❌ Warning: Text scan did not detect transaction or payment indicators.";
    }

    return {
      isProbablyReceipt,
      confidence: data.confidence || 0,
      detectedText: data.text || "",
      analysis,
    };
  } catch (error: any) {
    console.error("[OCR] Failed to scan image:", error);
    return {
      isProbablyReceipt: false,
      confidence: 0,
      detectedText: "",
      analysis: `⚠️ OCR Scan Failed: ${error?.message || "unknown error"}. Please review manually.`,
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        // ignore
      }
    }
  }
}
