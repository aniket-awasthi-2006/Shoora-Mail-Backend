import express from 'express';
import { fetchInbox, fetchEmailsByFolder, markAsRead, deleteEmail, moveEmail } from '../services/imapService.js';
import { sendEmail, replyEmail, forwardEmail } from '../services/smtpService.js';

const router = express.Router();

// Login and Fetch Initial Emails
router.post('/login-fetch', async (req, res) => {
    const { email, password } = req.body;

    try {
        const emails = await fetchInbox(email, password);

        // Send Welcome Mail (Fire and forget)
        const welcomeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: #4A90E2; color: #ffffff; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            .features { background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .features ul { padding-left: 20px; }
            .features li { margin-bottom: 10px; }
            .footer { background-color: #f4f4f4; padding: 20px; text-align: center; color: #888888; font-size: 12px; }
        </style>
        </head>
        <body>
            <div class="container">
            <div class="header">
                <h1>Welcome to Shoora Mail!</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>We are thrilled to have you on board. You have successfully logged into your <strong>Shoora Mail</strong> dashboard.</p>
                <div class="features">
                <h3>Here is what you can do now:</h3>
                <ul>
                    <li><strong>Stay Connected:</strong> Access your inbox instantly and never miss a beat.</li>
                    <li><strong>Compose with Ease:</strong> Send emails effortlessly to your contacts.</li>
                    <li><strong>Secure & Fast:</strong> Enjoy a seamless and secure email experience.</li>
                </ul>
                </div>
                <p>Best Regards,<br>The Shoora Mail Team</p>
            </div>
            <div class="footer">&copy; ${new Date().getFullYear()} Shoora Mail. All rights reserved.</div>
            </div>
        </body>
        </html>`;

        sendEmail(
            null,
            {
                from: `Shoora Mail <${process.env.SITE_EMAIL}>`,
                to: email,
                subject: 'Welcome to Shoora Mail! 🚀',
                html: welcomeHtml,
                text: 'Welcome to Shoora Mail! You have successfully logged in.',
            }
        ).catch(err => console.log("Welcome mail error:", err.message));

        res.status(200).json({ success: true, data: emails });
    } catch (error) {
        console.error("Login/Fetch Error:", error);
        res.status(401).json({ success: false, message: "Invalid Credentials or Connection Failed" });
    }
});

// Fetch Inbox Emails
router.post('/inbox-fetch', async (req, res) => {
    const { email, password } = req.body;

    try {
        const emails = await fetchInbox(email, password);
        res.status(200).json({ success: true, data: emails });
    } catch (error) {
        console.error("Inbox Fetch Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch inbox" });
    }
});

// Fetch Emails by Folder
router.post('/folder-fetch', async (req, res) => {
    const { email, password, folder } = req.body;

    try {
        const emails = await fetchEmailsByFolder(email, password, folder);
        res.status(200).json({ success: true, data: emails });
    } catch (error) {
        console.error("Folder Fetch Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch folder emails" });
    }
});

// Send Email
router.post('/send-mail', async (req, res) => {
    const { email, password, to, subject, body, attachments } = req.body;
    try {
        await sendEmail(
            { user: email, pass: password },
            { from: email, to, subject, text: body, attachments }
        );
        res.status(200).json({ success: true, message: "Email Sent Successfully" });
    } catch (error) {
        console.error("Send Mail Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reply to Email
router.post('/reply-mail', async (req, res) => {
    const { email, password, to, subject, body, originalMessageId } = req.body;
    try {
        await replyEmail(
            { user: email, pass: password },
            { from: email, to, subject, text: body, inReplyTo: originalMessageId }
        );
        res.status(200).json({ success: true, message: "Reply Sent Successfully" });
    } catch (error) {
        console.error("Reply Mail Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Forward Email
router.post('/forward-mail', async (req, res) => {
    const { email, password, to, subject, body } = req.body;
    try {
        await forwardEmail(
            { user: email, pass: password },
            { from: email, to, subject, text: body }
        );
        res.status(200).json({ success: true, message: "Email Forwarded Successfully" });
    } catch (error) {
        console.error("Forward Mail Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark Email as Read/Unread
router.post('/mark-read', async (req, res) => {
    const { email, password, messageId, read } = req.body;
    try {
        await markAsRead(email, password, messageId, read);
        res.status(200).json({ success: true, message: `Email marked as ${read ? 'read' : 'unread'}` });
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ success: false, message: "Failed to mark email" });
    }
});

// Delete Email
router.post('/delete-mail', async (req, res) => {
    const { email, password, messageId } = req.body;
    try {
        await deleteEmail(email, password, messageId);
        res.status(200).json({ success: true, message: "Email deleted successfully" });
    } catch (error) {
        console.error("Delete Mail Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete email" });
    }
});

// Move Email to Folder
router.post('/move-mail', async (req, res) => {
    const { email, password, messageId, destinationFolder } = req.body;
    try {
        await moveEmail(email, password, messageId, destinationFolder);
        res.status(200).json({ success: true, message: "Email moved successfully" });
    } catch (error) {
        console.error("Move Mail Error:", error);
        res.status(500).json({ success: false, message: "Failed to move email" });
    }
});

export default router;
