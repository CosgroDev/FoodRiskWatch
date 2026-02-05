import { Resend } from "resend";

// Lazy-initialize Resend client to avoid build errors when API key is not set
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "");
  }
  return _resend;
}

// Email sending configuration
const FROM_EMAIL = process.env.FROM_EMAIL || "FoodRisk Watch <alerts@foodriskwatch.com>";

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export type SendEmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Email send failed:", message);
    return { success: false, error: message };
  }
}

/**
 * Send a batch of emails (Resend supports up to 100 per batch)
 */
export async function sendEmailBatch(
  emails: SendEmailOptions[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (!process.env.RESEND_API_KEY) {
    return { sent: 0, failed: emails.length, errors: ["RESEND_API_KEY not configured"] };
  }

  const results = { sent: 0, failed: 0, errors: [] as string[] };
  const resend = getResend();

  // Resend batch API supports up to 100 emails
  const batchSize = 100;

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    try {
      const { data, error } = await resend.batch.send(
        batch.map((email) => ({
          from: FROM_EMAIL,
          to: email.to,
          subject: email.subject,
          html: email.html,
          replyTo: email.replyTo,
        }))
      );

      if (error) {
        console.error("Batch send error:", error);
        results.failed += batch.length;
        results.errors.push(error.message);
      } else {
        results.sent += data?.data?.length || batch.length;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Batch send failed:", message);
      results.failed += batch.length;
      results.errors.push(message);
    }
  }

  return results;
}
