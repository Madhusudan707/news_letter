const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service, e.g., Outlook, Yahoo, etc.
    auth: {
        user: 'your-email@example.com', // Your email address
        pass: 'your-email-password',   // Your email password (or app password if 2FA is enabled)
    },
});

// Email options
const mailOptions = {
    from: 'your-email@example.com', // Sender's email address
    to: 'recipient-email@example.com', // Receiver's email address
    subject: 'Test Email from Node.js',
    text: 'Hello! This is a test email sent from Node.js.',
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log('Error:', error);
    } else {
        console.log('Email sent:', info.response);
    }
});
