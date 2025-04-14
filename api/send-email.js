import nodemailer from "nodemailer";
import axios from "axios";
import { IncomingMessage } from "http"; // For type reference in JSDoc

/**
 * Parses URL-encoded form data from a raw request stream.
 * @param {IncomingMessage} req - The incoming request object.
 * @returns {Promise<Object>} - The parsed form data.
 */
function parseFormData(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const parsedData = new URLSearchParams(body);
      resolve(Object.fromEntries(parsedData.entries())); // Convert to object
    });

    req.on("error", (err) => {
      reject(err);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Parse form data manually (since Vercel doesn't parse it automatically)
    const parsedData = await parseFormData(req);

    const { name, email, date, location, service, message } = parsedData;

    if (!name || !email || !date || !location || !service || !message) {
      return res
        .status(400)
        .json({ message: "Toate câmpurile sunt obligatorii!" });
    }

    // Create transporter for nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.SMTP_USER, // Sender's email
      to: process.env.RECEIVER_EMAIL, // Recipient's email
      subject: `Cerere de la ${name}`, // Subject
      html: `
        <h3>Detalii contact:</h3>
        <p><strong>Nume:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Data estimativă:</strong> ${date}</p>
        <p><strong>Locație:</strong> ${location}</p>
        <p><strong>Serviciu dorit:</strong> ${service}</p>
        <p><strong>Mesaj:</strong> ${message}</p>
      `, // HTML body content
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return success message to the client
    return res.status(200).json({ message: "Email trimis cu succes" });
  } catch (error) {
    console.error("Eroare la transmiterea emailului: ", error);
    return res
      .status(500)
      .json({ message: "Eroare la transmiterea emailului." });
  }
}
