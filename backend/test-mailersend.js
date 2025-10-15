import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import dotenv from "dotenv";

dotenv.config();

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

async function testEmail() {
  try {
    console.log("Testing MailerSend...");
    console.log("From:", process.env.MAILERSEND_FROM_EMAIL);
    
    const sentFrom = new Sender(
      process.env.MAILERSEND_FROM_EMAIL,
      process.env.MAILERSEND_FROM_NAME
    );

    const recipients = [
      new Recipient("keshav39353@gmail.com", "Keshav")
    ];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("Test Email from VectorEdge")
      .setHtml("<h1>Hello!</h1><p>This is a test email from MailerSend.</p>");

    const response = await mailerSend.email.send(emailParams);
    
    console.log("✅ Email sent successfully!");
    console.log("Response:", response);
  } catch (error) {
    console.error("❌ Error:", error.body || error.message);
  }
}

testEmail();