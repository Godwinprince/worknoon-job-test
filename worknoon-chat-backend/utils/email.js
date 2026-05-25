const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or use SendGrid, Outlook, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendNewMessageEmail = async (to, fromName, messagePreview) => {
  try {
    await transporter.sendMail({
      from: `"Chat System" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'New Message Received',
      html: `
        <h3>You have a new message from ${fromName}</h3>
        <p><strong>Preview:</strong> ${messagePreview.substring(0, 100)}...</p>
        <a href="${process.env.FRONTEND_URL}/chat">Click here to reply</a>
      `
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email error:', error);
  }
};

module.exports = { sendNewMessageEmail };