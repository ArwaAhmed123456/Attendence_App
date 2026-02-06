const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Generate 6-digit verification code
const generateResetToken = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send password reset email
const sendPasswordResetEmail = async (email, projectName, resetToken) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Attendance Pro" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Password Reset - ${projectName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .container {
                        background: #ffffff;
                        border-radius: 12px;
                        padding: 40px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
                        color: white;
                        width: 60px;
                        height: 60px;
                        border-radius: 12px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 20px;
                    }
                    h1 {
                        color: #0891b2;
                        margin: 0;
                        font-size: 24px;
                    }
                    .token-box {
                        background: #f0f9ff;
                        border: 2px solid #0891b2;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .token {
                        font-size: 36px;
                        font-weight: bold;
                        color: #0891b2;
                        letter-spacing: 8px;
                        font-family: 'Courier New', monospace;
                    }
                    .info {
                        background: #fff7ed;
                        border-left: 4px solid #f59e0b;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                        color: #6b7280;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">AP</div>
                        <h1>Password Reset Request</h1>
                    </div>
                    
                    <p>Hello,</p>
                    <p>You requested to reset the password for project <strong>${projectName}</strong>.</p>
                    
                    <div class="token-box">
                        <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">Your verification code is:</p>
                        <div class="token">${resetToken}</div>
                    </div>
                    
                    <div class="info">
                        <strong>⏰ Important:</strong> This code will expire in 15 minutes for security reasons.
                    </div>
                    
                    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                    
                    <div class="footer">
                        <p>This is an automated message from Attendance Pro</p>
                        <p>© ${new Date().getFullYear()} Attendance Pro. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

// Send contact form email (User -> Admin)
const sendContactEmail = async (userEmail, query) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Attendance Pro" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Send TO the admin
        replyTo: userEmail, // Allow admin to reply directly to user
        subject: `New Query from Attendance App User`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #0891b2;">New User Query</h2>
                <p><strong>From:</strong> ${userEmail}</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0891b2; margin: 20px 0;">
                    <p style="white-space: pre-wrap;">${query}</p>
                </div>
                <p style="font-size: 0.9em; color: #666;">You can reply directly to this email to respond to the user.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Contact email sending error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateResetToken,
    sendPasswordResetEmail,
    sendContactEmail
};
