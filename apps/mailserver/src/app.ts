import { simpleParser, type ParsedMail } from "mailparser";
import { SMTPServer } from "smtp-server";
import { z } from "zod";

const env = z
  .object({
    MAILSERVER_HOSTNAME: z.string(),
    MAILSERVER_PORT: z.coerce.number(),
  })
  .parse(process.env);

const server = new SMTPServer({
  secure: false,
  authOptional: true,
  allowInsecureAuth: true,
  name: env.MAILSERVER_HOSTNAME,
  banner: `220 ${env.MAILSERVER_HOSTNAME} ESMTP Satellite CX Email Server`,
  disabledCommands: ["STARTTLS"],
  socketTimeout: 30000, // 30 seconds
  size: 10485760, // 10MB max message size
  onData: async (stream, session, callback) => {
    try {
      const parsed: ParsedMail = await simpleParser(stream);

      const emailData = {
        from: session.envelope.mailFrom,
        to: session.envelope.rcptTo,
        subject: parsed.subject || "(No Subject)",
        text: parsed.text,
        html: parsed.html ? parsed.html.toString() : undefined,
        timestamp: new Date(),
      };
      console.log("\n" + "=".repeat(80));
      console.log("📧 NEW EMAIL RECEIVED");
      console.log("=".repeat(80));
      console.log(`⏰ Timestamp: ${emailData.timestamp.toISOString()}`);
      console.log(`📤 From: ${emailData.from}`);
      console.log(
        `📥 To: ${emailData.to.map((addr) => addr.address).join(", ")}`
      );
      console.log(`📋 Subject: ${emailData.subject}`);
      console.log("📄 Content:");

      if (emailData.text) {
        console.log("--- TEXT ---");
        console.log(emailData.text);
      }

      if (emailData.html) {
        console.log("--- HTML ---");
        console.log(emailData.html);
      }

      console.log("=".repeat(80) + "\n");
    } catch (error) {
      console.error("❌ Error processing email:", error);
      callback(error as Error);
    }
  },
});

server.listen(env.MAILSERVER_PORT, () => {
  console.log(`🚀 SMTP server listening on port ${env.MAILSERVER_PORT}`);
  console.log(`🏠 Server hostname: ${env.MAILSERVER_HOSTNAME}`);
  console.log(
    `🌐 Make sure your DNS MX records points to ${env.MAILSERVER_HOSTNAME}`
  );
});

server.on("error", (err: Error) => {
  console.error("❌ SMTP server error:", err);
});
