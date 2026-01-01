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
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Email</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            width: 100%;
            margin: 0;
            padding: 0;
        }
        .responsive-image {
            width: 100%;
            height: auto;
            display: block;
            border-radius: 10px;
            -webkit-border-radius: 10px;
            -moz-border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <img src="https://res.cloudinary.com/dtwumvj5i/image/upload/v1767200085/Mail_Image_iwjmp1.jpg" 
             alt="Mail Image" 
             class="responsive-image">
    </div>
</body>
</html>
        `;

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
        console.log('Welcome email sent to', emails);
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
        console.log('Welcome email sent to', emails);
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
