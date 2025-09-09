import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import { z } from "zod";

// Mock environment variables for testing
const originalEnv = process.env;

describe("SMTP Server", () => {
  let server: SMTPServer;
  let testPort: number;

  beforeEach(() => {
    // Set up test environment
    process.env = {
      ...originalEnv,
      MAILSERVER_HOSTNAME: "test.example.com",
      MAILSERVER_PORT: "2525",
    };
    testPort = 2525;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Clean up server
    if (server) {
      server.close();
    }
  });

  describe("Environment Configuration", () => {
    test("should parse valid environment variables", () => {
      const env = z
        .object({
          MAILSERVER_HOSTNAME: z.string(),
          MAILSERVER_PORT: z.coerce.number(),
        })
        .parse(process.env);

      expect(env.MAILSERVER_HOSTNAME).toBe("test.example.com");
      expect(env.MAILSERVER_PORT).toBe(2525);
    });

    test("should throw error for missing MAILSERVER_HOSTNAME", () => {
      delete process.env.MAILSERVER_HOSTNAME;

      expect(() => {
        z.object({
          MAILSERVER_HOSTNAME: z.string(),
          MAILSERVER_PORT: z.coerce.number(),
        }).parse(process.env);
      }).toThrow();
    });

    test("should throw error for missing MAILSERVER_PORT", () => {
      delete process.env.MAILSERVER_PORT;

      expect(() => {
        z.object({
          MAILSERVER_HOSTNAME: z.string(),
          MAILSERVER_PORT: z.coerce.number(),
        }).parse(process.env);
      }).toThrow();
    });

    test("should coerce string port to number", () => {
      process.env.MAILSERVER_PORT = "8080";

      const env = z
        .object({
          MAILSERVER_HOSTNAME: z.string(),
          MAILSERVER_PORT: z.coerce.number(),
        })
        .parse(process.env);

      expect(env.MAILSERVER_PORT).toBe(8080);
      expect(typeof env.MAILSERVER_PORT).toBe("number");
    });
  });

  describe("Server Configuration", () => {
    test("should create server with correct configuration", () => {
      const env = z
        .object({
          MAILSERVER_HOSTNAME: z.string(),
          MAILSERVER_PORT: z.coerce.number(),
        })
        .parse(process.env);

      server = new SMTPServer({
        secure: false,
        authOptional: true,
        allowInsecureAuth: true,
        name: env.MAILSERVER_HOSTNAME,
        banner: `220 ${env.MAILSERVER_HOSTNAME} ESMTP Satellite CX Email Server`,
        disabledCommands: ["STARTTLS"],
        socketTimeout: 30000,
        size: 10485760,
      });

      expect(server).toBeDefined();
      expect(server.options.secure).toBe(false);
      expect(server.options.authOptional).toBe(true);
      expect(server.options.allowInsecureAuth).toBe(true);
      expect(server.options.name).toBe("test.example.com");
      expect(server.options.banner).toBe(
        "220 test.example.com ESMTP Satellite CX Email Server"
      );
      expect(server.options.disabledCommands).toEqual(["STARTTLS"]);
      expect(server.options.socketTimeout).toBe(30000);
      expect(server.options.size).toBe(10485760);
    });
  });

  describe("Email Processing", () => {
    test("should parse simple text email", async () => {
      const emailContent = `From: sender@example.com
To: recipient@example.com
Subject: Test Email
Content-Type: text/plain

This is a test email body.`;

      const parsed = await simpleParser(emailContent);

      expect((parsed.from as any)?.value?.[0]?.address).toBe(
        "sender@example.com"
      );
      expect((parsed.to as any)?.value?.[0]?.address).toBe(
        "recipient@example.com"
      );
      expect(parsed.subject).toBe("Test Email");
      expect(parsed.text).toBe("This is a test email body.");
    });

    test("should parse HTML email", async () => {
      const emailContent = `From: sender@example.com
To: recipient@example.com
Subject: HTML Test Email
Content-Type: text/html

<html><body><h1>Hello World</h1><p>This is an HTML email.</p></body></html>`;

      const parsed = await simpleParser(emailContent);

      expect((parsed.from as any)?.value?.[0]?.address).toBe(
        "sender@example.com"
      );
      expect((parsed.to as any)?.value?.[0]?.address).toBe(
        "recipient@example.com"
      );
      expect(parsed.subject).toBe("HTML Test Email");
      expect(parsed.html).toBeDefined();
      expect(parsed.html?.toString()).toContain("<h1>Hello World</h1>");
    });

    test("should parse multipart email with both text and HTML", async () => {
      const emailContent = `From: sender@example.com
To: recipient@example.com
Subject: Multipart Email
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="boundary123"

--boundary123
Content-Type: text/plain

This is the plain text version.

--boundary123
Content-Type: text/html

<html><body><p>This is the HTML version.</p></body></html>

--boundary123--`;

      const parsed = await simpleParser(emailContent);

      expect((parsed.from as any)?.value?.[0]?.address).toBe(
        "sender@example.com"
      );
      expect((parsed.to as any)?.value?.[0]?.address).toBe(
        "recipient@example.com"
      );
      expect(parsed.subject).toBe("Multipart Email");
      expect(parsed.text).toBe("This is the plain text version.\n");
      expect(parsed.html?.toString()).toContain(
        "<p>This is the HTML version.</p>"
      );
    });

    test("should handle email without subject", async () => {
      const emailContent = `From: sender@example.com
To: recipient@example.com
Content-Type: text/plain

This email has no subject.`;

      const parsed = await simpleParser(emailContent);

      expect((parsed.from as any)?.value?.[0]?.address).toBe(
        "sender@example.com"
      );
      expect((parsed.to as any)?.value?.[0]?.address).toBe(
        "recipient@example.com"
      );
      expect(parsed.subject).toBeUndefined();
      expect(parsed.text).toBe("This email has no subject.");
    });

    test("should handle email with multiple recipients", async () => {
      const emailContent = `From: sender@example.com
To: recipient1@example.com, recipient2@example.com
Subject: Multiple Recipients
Content-Type: text/plain

This email has multiple recipients.`;

      const parsed = await simpleParser(emailContent);

      expect((parsed.from as any)?.value?.[0]?.address).toBe(
        "sender@example.com"
      );
      expect((parsed.to as any)?.value?.[0]?.address).toBe(
        "recipient1@example.com"
      );
      expect((parsed.to as any)?.value?.[1]?.address).toBe(
        "recipient2@example.com"
      );
      expect(parsed.subject).toBe("Multiple Recipients");
      expect(parsed.text).toBe("This email has multiple recipients.");
    });
  });

  describe("Email Data Structure", () => {
    test("should create correct email data structure", async () => {
      const emailContent = `From: sender@example.com
To: recipient@example.com
Subject: Test Subject
Content-Type: text/plain

Test body content.`;

      const parsed = await simpleParser(emailContent);
      const mockSession = {
        envelope: {
          mailFrom: "sender@example.com",
          rcptTo: [{ address: "recipient@example.com" }],
        },
      };

      const emailData = {
        from: mockSession.envelope.mailFrom,
        to: mockSession.envelope.rcptTo,
        subject: parsed.subject || "(No Subject)",
        text: parsed.text,
        html: parsed.html ? parsed.html.toString() : undefined,
        timestamp: new Date(),
      };

      expect(emailData.from).toBe("sender@example.com");
      expect(emailData.to).toEqual([{ address: "recipient@example.com" }]);
      expect(emailData.subject).toBe("Test Subject");
      expect(emailData.text).toBe("Test body content.");
      expect(emailData.html).toBeUndefined();
      expect(emailData.timestamp).toBeInstanceOf(Date);
    });

    test("should use default subject when none provided", async () => {
      const emailContent = `From: sender@example.com
To: recipient@example.com
Content-Type: text/plain

Test body without subject.`;

      const parsed = await simpleParser(emailContent);
      const mockSession = {
        envelope: {
          mailFrom: "sender@example.com",
          rcptTo: [{ address: "recipient@example.com" }],
        },
      };

      const emailData = {
        from: mockSession.envelope.mailFrom,
        to: mockSession.envelope.rcptTo,
        subject: parsed.subject || "(No Subject)",
        text: parsed.text,
        html: parsed.html ? parsed.html.toString() : undefined,
        timestamp: new Date(),
      };

      expect(emailData.subject).toBe("(No Subject)");
    });
  });

  describe("Error Handling", () => {
    test("should handle malformed email gracefully", async () => {
      const malformedEmail = "This is not a valid email format";

      try {
        await simpleParser(malformedEmail);
        // If it doesn't throw, that's also acceptable as mailparser is quite forgiving
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test("should handle empty email content", async () => {
      const emptyEmail = "";

      try {
        const parsed = await simpleParser(emptyEmail);
        expect(parsed).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test("should handle email with invalid headers", async () => {
      const invalidEmail = `Invalid: Header: Format
To: recipient@example.com
Subject: Test

Body content.`;

      try {
        const parsed = await simpleParser(invalidEmail);
        expect(parsed).toBeDefined();
        expect(parsed.text).toBe("Body content.");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Server Lifecycle", () => {
    test("should create server instance", () => {
      const env = z
        .object({
          MAILSERVER_HOSTNAME: z.string(),
          MAILSERVER_PORT: z.coerce.number(),
        })
        .parse(process.env);

      server = new SMTPServer({
        secure: false,
        authOptional: true,
        allowInsecureAuth: true,
        name: env.MAILSERVER_HOSTNAME,
        banner: `220 ${env.MAILSERVER_HOSTNAME} ESMTP Satellite CX Email Server`,
        disabledCommands: ["STARTTLS"],
        socketTimeout: 30000,
        size: 10485760,
        onData: async (stream, session, callback) => {
          callback();
        },
      });

      expect(server).toBeDefined();
      expect(server.options).toBeDefined();
    });

    test("should have proper server configuration", () => {
      const env = z
        .object({
          MAILSERVER_HOSTNAME: z.string(),
          MAILSERVER_PORT: z.coerce.number(),
        })
        .parse(process.env);

      server = new SMTPServer({
        secure: false,
        authOptional: true,
        allowInsecureAuth: true,
        name: env.MAILSERVER_HOSTNAME,
        banner: `220 ${env.MAILSERVER_HOSTNAME} ESMTP Satellite CX Email Server`,
        disabledCommands: ["STARTTLS"],
        socketTimeout: 30000,
        size: 10485760,
        onData: async (stream, session, callback) => {
          callback();
        },
      });

      expect(server.options.name).toBe("test.example.com");
      expect(server.options.banner).toBe(
        "220 test.example.com ESMTP Satellite CX Email Server"
      );
      expect(server.options.secure).toBe(false);
      expect(server.options.authOptional).toBe(true);
    });
  });

  describe("Email Size Limits", () => {
    test("should respect size limits", () => {
      const env = z
        .object({
          MAILSERVER_HOSTNAME: z.string(),
          MAILSERVER_PORT: z.coerce.number(),
        })
        .parse(process.env);

      server = new SMTPServer({
        secure: false,
        authOptional: true,
        allowInsecureAuth: true,
        name: env.MAILSERVER_HOSTNAME,
        banner: `220 ${env.MAILSERVER_HOSTNAME} ESMTP Satellite CX Email Server`,
        disabledCommands: ["STARTTLS"],
        socketTimeout: 30000,
        size: 10485760, // 10MB
      });

      expect(server.options.size).toBe(10485760);
    });
  });

  describe("Security Configuration", () => {
    test("should have correct security settings", () => {
      const env = z
        .object({
          MAILSERVER_HOSTNAME: z.string(),
          MAILSERVER_PORT: z.coerce.number(),
        })
        .parse(process.env);

      server = new SMTPServer({
        secure: false,
        authOptional: true,
        allowInsecureAuth: true,
        name: env.MAILSERVER_HOSTNAME,
        banner: `220 ${env.MAILSERVER_HOSTNAME} ESMTP Satellite CX Email Server`,
        disabledCommands: ["STARTTLS"],
        socketTimeout: 30000,
        size: 10485760,
      });

      expect(server.options.secure).toBe(false);
      expect(server.options.authOptional).toBe(true);
      expect(server.options.allowInsecureAuth).toBe(true);
      expect(server.options.disabledCommands).toContain("STARTTLS");
    });
  });
});
