import {
  SMTPServer,
  type SMTPServerSession,
  type SMTPServerAddress,
} from "smtp-server";
import { simpleParser, type ParsedMail } from "mailparser";
import { Readable } from "stream";
import { z } from "zod";

const env = z
  .object({
    MAILSERVER_HOSTNAME: z.string(),
    MAILSERVER_PORT: z.coerce.number(),
  })
  .parse(process.env);

interface EmailData {
  from: SMTPServerAddress;
  to: SMTPServerAddress[];
  subject: string;
  text?: string;
  html?: string;
  timestamp: Date;
}

class EmailReceiver {
  private server: SMTPServer;

  constructor() {
    this.server = new SMTPServer({
      secure: false,
      authOptional: true,
      allowInsecureAuth: true,
      name: env.MAILSERVER_HOSTNAME,
      banner: `220 ${env.MAILSERVER_HOSTNAME} ESMTP Satellite CX Email Server`,
      disabledCommands: ["STARTTLS"],
      socketTimeout: 30000, // 30 seconds
      size: 10485760, // 10MB max message size
      onConnect: this.onConnect.bind(this),
      onAuth: this.onAuth.bind(this),
      onMailFrom: this.onMailFrom.bind(this),
      onRcptTo: this.onRcptTo.bind(this),
      onData: this.onData.bind(this),
    });
  }

  private onConnect(
    session: SMTPServerSession,
    callback: (err?: Error) => void
  ): void {
    console.log(`📧 New connection from ${session.remoteAddress}`);
    console.log(`🔍 Session ID: ${session.id}`);
    callback();
  }

  private onAuth(
    auth: any,
    session: SMTPServerSession,
    callback: (err?: Error | null, response?: any) => void
  ): void {
    console.log(`🔐 Auth attempt from ${session.remoteAddress}`);
    callback(null, { user: auth.username });
  }

  private onMailFrom(
    address: SMTPServerAddress,
    session: SMTPServerSession,
    callback: (err?: Error) => void
  ): void {
    console.log(`📤 Mail from: ${address.address} (Session: ${session.id})`);
    callback();
  }

  private onRcptTo(
    address: SMTPServerAddress,
    session: SMTPServerSession,
    callback: (err?: Error) => void
  ): void {
    console.log(`📥 Mail to: ${address.address} (Session: ${session.id})`);
    callback();
  }

  private async onData(
    stream: Readable,
    session: SMTPServerSession,
    callback: (err?: Error) => void
  ): Promise<void> {
    try {
      console.log(
        `📨 Processing email data from ${session.remoteAddress} (Session: ${session.id})`
      );

      const parsed: ParsedMail = await simpleParser(stream);

      const emailData: EmailData = {
        from: session.envelope.mailFrom as SMTPServerAddress,
        to: session.envelope.rcptTo,
        subject: parsed.subject || "(No Subject)",
        text: parsed.text,
        html: parsed.html ? parsed.html.toString() : undefined,
        timestamp: new Date(),
      };

      this.logEmail(emailData);

      callback();
    } catch (error) {
      console.error("❌ Error processing email:", error);
      callback(error as Error);
    }
  }

  private logEmail(email: EmailData): void {
    console.log("\n" + "=".repeat(80));
    console.log("📧 NEW EMAIL RECEIVED");
    console.log("=".repeat(80));
    console.log(`⏰ Timestamp: ${email.timestamp.toISOString()}`);
    console.log(`📤 From: ${email.from.address}`);
    console.log(`📥 To: ${email.to.map((addr) => addr.address).join(", ")}`);
    console.log(`📋 Subject: ${email.subject}`);
    console.log("📄 Content:");

    if (email.text) {
      console.log("--- TEXT ---");
      console.log(email.text);
    }

    if (email.html) {
      console.log("--- HTML ---");
      console.log(email.html);
    }

    console.log("=".repeat(80) + "\n");
  }

  public start(port: number): void {
    this.server.listen(port, () => {
      console.log(`🚀 SMTP server listening on port ${port}`);
      console.log(`🏠 Server hostname: ${env.MAILSERVER_HOSTNAME}`);
      console.log(
        `🌐 Make sure your DNS MX records points to ${env.MAILSERVER_HOSTNAME}`
      );
    });

    this.server.on("error", (err: Error) => {
      console.error("❌ SMTP server error:", err);
    });

    process.on("SIGTERM", () => {
      console.log("📴 Shutting down SMTP server...");
      this.server.close();
    });

    process.on("SIGINT", () => {
      console.log("📴 Shutting down SMTP server...");
      this.server.close();
    });
  }
}

const emailReceiver = new EmailReceiver();
emailReceiver.start(env.MAILSERVER_PORT);
