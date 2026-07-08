"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

async function sendMail(payload: EmailPayload): Promise<void> {
  // Dynamically import nodemailer so the bundle is only loaded in Node actions
  const nodemailer = await import("nodemailer");

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "465", 10);
  const secure = process.env.SMTP_SECURE !== "false"; // default true
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM ?? "VehicleHire <noreply@vehiclehire.app>";

  if (!host || !user || !pass) {
    console.warn("[email] SMTP not configured — skipping email send");
    return;
  }

  const transporter = nodemailer.default.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
}

// ─── Template helpers ─────────────────────────────────────────────────────────

function baseTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #faf6f0; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: #a64b14; padding: 24px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.75); margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px; color: #231a0e; line-height: 1.6; }
    .body h2 { font-size: 18px; margin-top: 0; color: #231a0e; }
    .highlight { background: #faf0eb; border-left: 3px solid #a64b14; padding: 12px 16px; border-radius: 8px; margin: 16px 0; }
    .highlight strong { color: #a64b14; }
    .label { font-size: 12px; color: #a08060; text-transform: uppercase; letter-spacing: 0.05em; }
    .value { font-size: 16px; font-weight: 600; color: #231a0e; margin: 2px 0 12px; }
    .footer { padding: 16px 32px; background: #faf6f0; border-top: 1px solid #f0e8dc; font-size: 12px; color: #a08060; text-align: center; }
    .btn { display: inline-block; margin-top: 16px; padding: 12px 24px; background: #a64b14; color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🚗 VehicleHire</h1>
      <p>Vehicle Hire & Session Tracking</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      This email was sent by VehicleHire — INSY 492 Senior Project<br/>
      © ${new Date().getFullYear()} Gerison Kimathi Muriungi
    </div>
  </div>
</body>
</html>
`.trim();
}

// ─── Public actions ───────────────────────────────────────────────────────────

export const sendBookingConfirmation = action({
  args: {
    clientEmail: v.string(),
    clientName: v.string(),
    vehicleName: v.string(),
    agentName: v.string(),
    pickupDate: v.string(),
  },
  handler: async (_ctx, args) => {
    const body = `
      <h2>Booking Confirmed</h2>
      <p>Hi ${args.clientName},</p>
      <p>Your hire booking has been received and is awaiting session start.</p>
      <div class="highlight">
        <p class="label">Vehicle</p>
        <p class="value">${args.vehicleName}</p>
        <p class="label">Agent</p>
        <p class="value">${args.agentName}</p>
        <p class="label">Pickup Date</p>
        <p class="value">${args.pickupDate}</p>
      </div>
      <p>The agent will start your session when you arrive to collect the vehicle. You will receive another notification at that time.</p>
    `;
    await sendMail({
      to: args.clientEmail,
      subject: `Booking Confirmed — ${args.vehicleName}`,
      html: baseTemplate("Booking Confirmed", body),
    });
  },
});

export const sendSessionStarted = action({
  args: {
    clientEmail: v.string(),
    clientName: v.string(),
    vehicleName: v.string(),
    rateAmount: v.number(),
    rateUnit: v.string(),
    currency: v.string(),
    sessionId: v.string(),
  },
  handler: async (_ctx, args) => {
    const body = `
      <h2>Your Hire Session Has Started 🟢</h2>
      <p>Hi ${args.clientName},</p>
      <p>The timer is now running on your hire session.</p>
      <div class="highlight">
        <p class="label">Vehicle</p>
        <p class="value">${args.vehicleName}</p>
        <p class="label">Rate</p>
        <p class="value">${args.currency} ${args.rateAmount.toLocaleString()} / ${args.rateUnit}</p>
      </div>
      <p>You can monitor elapsed time and accrued charges on your session screen.</p>
      <p><strong>Your GPS location is being shared with the agent throughout the session.</strong></p>
    `;
    await sendMail({
      to: args.clientEmail,
      subject: `Session Started — ${args.vehicleName}`,
      html: baseTemplate("Session Started", body),
    });
  },
});

export const sendSessionCompleted = action({
  args: {
    clientEmail: v.string(),
    clientName: v.string(),
    vehicleName: v.string(),
    totalCharge: v.number(),
    durationMs: v.number(),
    currency: v.string(),
  },
  handler: async (_ctx, args) => {
    const hours = Math.floor(args.durationMs / 3600000);
    const minutes = Math.floor((args.durationMs % 3600000) / 60000);
    const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const body = `
      <h2>Session Completed</h2>
      <p>Hi ${args.clientName},</p>
      <p>Your hire session has ended. Here is your summary:</p>
      <div class="highlight">
        <p class="label">Vehicle</p>
        <p class="value">${args.vehicleName}</p>
        <p class="label">Duration</p>
        <p class="value">${duration}</p>
        <p class="label">Total Charge</p>
        <p class="value" style="color:#a64b14;font-size:22px">${args.currency} ${args.totalCharge.toLocaleString()}</p>
      </div>
      <p>Please proceed to payment to complete your hire. You can also leave a review for this session.</p>
    `;
    await sendMail({
      to: args.clientEmail,
      subject: `Session Complete — ${args.vehicleName} | ${args.currency} ${args.totalCharge.toLocaleString()}`,
      html: baseTemplate("Session Completed", body),
    });
  },
});

export const sendPaymentReceipt = action({
  args: {
    clientEmail: v.string(),
    clientName: v.string(),
    vehicleName: v.string(),
    amount: v.number(),
    currency: v.string(),
    reference: v.string(),
    paidAt: v.string(),
  },
  handler: async (_ctx, args) => {
    const body = `
      <h2>Payment Receipt 🧾</h2>
      <p>Hi ${args.clientName}, thank you for your payment.</p>
      <div class="highlight">
        <p class="label">Vehicle</p>
        <p class="value">${args.vehicleName}</p>
        <p class="label">Amount Paid</p>
        <p class="value" style="color:#1a6b55;font-size:22px">${args.currency} ${args.amount.toLocaleString()}</p>
        <p class="label">Reference</p>
        <p class="value" style="font-family:monospace;font-size:14px">${args.reference}</p>
        <p class="label">Paid At</p>
        <p class="value">${args.paidAt}</p>
      </div>
      <p>Please keep this receipt for your records. You may now leave a review for your hire experience.</p>
    `;
    await sendMail({
      to: args.clientEmail,
      subject: `Payment Receipt — ${args.currency} ${args.amount.toLocaleString()} | ${args.reference}`,
      html: baseTemplate("Payment Receipt", body),
    });
  },
});

export const sendAgentStatusUpdate = action({
  args: {
    agentEmail: v.string(),
    agentName: v.string(),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (_ctx, args) => {
    const isApproved = args.status === "approved";
    const body = isApproved
      ? `
        <h2>Your Application Was Approved 🎉</h2>
        <p>Hi ${args.agentName},</p>
        <p>Congratulations! Your hire agent account has been approved by the administrator.</p>
        <p>You can now:</p>
        <ul>
          <li>List your vehicles with custom hire rates</li>
          <li>Receive and manage client bookings</li>
          <li>Monitor live hire sessions with GPS tracking</li>
          <li>Accept payments via Paystack</li>
        </ul>
        <p>Log in to your account to get started.</p>
      `
      : `
        <h2>Application Status Update</h2>
        <p>Hi ${args.agentName},</p>
        <p>We have reviewed your agent registration and unfortunately we are unable to approve it at this time.</p>
        <p>Please contact the platform administrator for more information on next steps.</p>
      `;
    await sendMail({
      to: args.agentEmail,
      subject: isApproved
        ? "Agent Account Approved — VehicleHire"
        : "Agent Application Update — VehicleHire",
      html: baseTemplate(
        isApproved ? "Application Approved" : "Application Update",
        body
      ),
    });
  },
});

export const sendNewBookingAlert = action({
  args: {
    agentEmail: v.string(),
    agentName: v.string(),
    clientName: v.string(),
    vehicleName: v.string(),
    pickupDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const body = `
      <h2>New Booking Request</h2>
      <p>Hi ${args.agentName},</p>
      <p>A client has placed a new booking for one of your vehicles.</p>
      <div class="highlight">
        <p class="label">Vehicle</p>
        <p class="value">${args.vehicleName}</p>
        <p class="label">Client</p>
        <p class="value">${args.clientName}</p>
        <p class="label">Requested Pickup</p>
        <p class="value">${args.pickupDate}</p>
        ${args.notes ? `<p class="label">Client Note</p><p class="value">${args.notes}</p>` : ""}
      </div>
      <p>Log in to your agent dashboard to manage this booking and start a session when the client arrives.</p>
    `;
    await sendMail({
      to: args.agentEmail,
      subject: `New Booking — ${args.vehicleName} by ${args.clientName}`,
      html: baseTemplate("New Booking Request", body),
    });
  },
});
