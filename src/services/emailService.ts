import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendInvitationEmail = async (
  email: string,
  senderEmail: string,
  projectName: string,
  inviterName: string,
  invitationToken: string
) => {
  const inviteLink = `${process.env.FRONTEND_URL}/invitations/${invitationToken}`;
  
  const templatePath = path.join(__dirname, '../templates/email/invitation.html');
  let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
  
  htmlTemplate = htmlTemplate
    .replace('{{projectName}}', projectName)
    .replace('{{inviterName}}', inviterName)
    .replace('{{inviteLink}}', inviteLink)
    .replace('{{email}}', email);

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL || senderEmail}>`,
    to: email,
    subject: `Invitation to join ${projectName}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};