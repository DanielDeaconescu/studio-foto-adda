import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { name, email, date, location, service, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_RECEIVER,
    subject: `Cerere de la ${name}`,
    html: `
      <h3>Detalii contact:</h3>
      <p><strong>Nume:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Data estimativă:</strong> ${date}</p>
      <p><strong>Locație:</strong> ${location}</p>
      <p><strong>Serviciu dorit:</strong> ${service}</p>
      <p><strong>Mesaj:</strong> ${message}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email trimis cu succes" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Eroare la trimiterea emailului" });
  }
}
