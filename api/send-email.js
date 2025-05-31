import nodemailer from "nodemailer";
import axios from "axios";
import { IncomingMessage } from "http"; // For type reference in JSDoc
import { MongoClient } from "mongodb";

// MongoDB connection URI
const mongoUri = process.env.MONGODB_URI;
const dbName = "StudioFotoAddaFormSubmissions";
const collectionName = "studioFotoAdda";

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

async function checkRateLimit(ip) {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Count submissions from this IP in the last 24 hours
    const count = await collection.countDocuments({
      ip,
      timestamp: { $gte: twentyFourHoursAgo },
    });

    return {
      isLimited: count >= 2,
      count,
    };
  } finally {
    await client.close();
  }
}

/**
 * Records a submission in the database
 * @param {string} ip - The IP address to record
 * @param {Object} formData - The form data submitted
 */
async function recordSubmission(ip, formData) {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.insertOne({
      ip,
      timestamp: new Date(),
      formData,
    });
  } finally {
    await client.close();
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Get client IP address
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    // Handle case where x-forwarded-for may contain multiple IPs
    const clientIp = ip ? ip.split(",")[0].trim() : "unknown";

    // Check rate limit
    const { isLimited, count } = await checkRateLimit(clientIp);
    if (isLimited) {
      return res.status(429).json({
        success: false,
        redirectTo: "../too-many-requests.html", // Relative path to your HTML file
        message: `Ați depășit limita de 2 trimiteri pe zi. Vă rugăm încercați din nou mâine. (${count}/2 utilizate)`,
      });
    }

    // Parse form data manually (since Vercel doesn't parse it automatically)
    const parsedData = await parseFormData(req);

    const {
      name,
      email,
      date,
      location,
      service,
      message,
      phone,
      "cf-turnstile-response-adda": turnstileToken,
    } = parsedData;

    if (!name || !phone || !turnstileToken) {
      return res
        .status(400)
        .json({ message: "Numele și numărul de telefon sunt obligatorii!" });
    }

    // Verify Turnstile token exists
    if (!turnstileToken) {
      return res
        .status(403)
        .json({ message: "Verificarea Turnstile lipsește!" });
    }

    // Verify Turnstile token with Cloudflare
    const verification = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET,
        response: turnstileToken,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    if (!verification.data.success) {
      console.error("Turnstile verification failed:", verification.data);
      return res.status(403).json({
        message:
          "Verificarea de securitate a eșuat. Vă rugăm reîncărcați pagina și încercați din nou.",
      });
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

    // Record the successful submission
    await recordSubmission(clientIp, parsedData);

    // Return success message to the client
    return res
      .status(200)
      .json({ success: true, redirectTo: "../thank_you.html" });
  } catch (error) {
    console.error("Eroare la transmiterea emailului: ", error);
    return res
      .status(500)
      .json({ message: "Eroare la transmiterea emailului." });
  }
}
