import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { mailConfig } from '../config/mailConfig.js';
import dotenv from 'dotenv';
dotenv.config();

const connectToImap = async (email, password, host = 'imap.stackmail.com', port = 993) => {
    return await imaps.connect({
        imap: {
            user: email,
            password: password,
            host: host,
            port: port,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 10000
        }
    });
};

const parseEmail = async (item) => {
    const all = item.parts.find((part) => part.which === '');
    const mail = await simpleParser(all.body);

    const senderMatch = mail.from.text.match(/"([^"]*)"/);
    const emailMatch = mail.from.text.match(/<([^>]*)>/);
    const senderName = senderMatch ? senderMatch[1] : mail.from.text.split('<')[0].trim();
    const senderEmail = emailMatch ? emailMatch[1] : mail.from.text;

    return {
        id: item.attributes.uid,
        sender: senderName,
        senderEmail: senderEmail,
        subject: mail.subject,
        preview: mail.textAsHtml ? mail.textAsHtml.slice(0, 100) : '',
        body: mail.html || mail.text,
        date: mail.date,
        unread: !item.attributes.seen,
        flagged: item.attributes.flags && item.attributes.flags.includes('\\Flagged'),
        categoryColor: '#2D62ED',
        category: 'personal',
        attachments: mail.attachments || [],
        avatar: '',
        folder: 'inbox',
        important: false,
    };
};

const fetchInbox = async (email, password) => {
    const connection = await connectToImap(email, password);
    await connection.openBox('INBOX');

    const searchCriteria = ['ALL'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT', ''], struct: true };
    const messages = await connection.search(searchCriteria, fetchOptions);

    const parsedMails = await Promise.all(
        messages.slice(-10).map(parseEmail)
    );

    connection.end();
    const emailUser = email.split('@')[0];
    const userName = emailUser.split('.').map(name => name.charAt(0).toUpperCase() + name.slice(1)).join(' ');

    console.log(`Fetched ${parsedMails.length} emails for ${email}`);
    return {
        userName,
        mails: parsedMails.reverse(),
    };
};

const fetchEmailsByFolder = async (email, password, folder) => {
    const connection = await connectToImap(email, password);
    await connection.openBox(folder);

    const searchCriteria = ['ALL'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT', ''], struct: true };
    const messages = await connection.search(searchCriteria, fetchOptions);

    const parsedMails = await Promise.all(
        messages.slice(-20).map(async (item) => {
            const mail = await parseEmail(item);
            mail.folder = folder;
            return mail;
        })
    );

    connection.end();
    return {
        folder,
        mails: parsedMails.reverse(),
    };
};

const markAsRead = async (email, password, messageId, read) => {
    const connection = await connectToImap(email, password);
    await connection.openBox('INBOX');

    await connection.addFlags(messageId, read ? '\\Seen' : '\\Unseen');
    connection.end();
};

const deleteEmail = async (email, password, messageId) => {
    const connection = await connectToImap(email, password);
    await connection.openBox('INBOX');

    await connection.addFlags(messageId, '\\Deleted');
    await connection.expunge();
    connection.end();
};

const moveEmail = async (email, password, messageId, destinationFolder) => {
    const connection = await connectToImap(email, password);
    await connection.openBox('INBOX');

    await connection.moveMessage(messageId, destinationFolder);
    connection.end();
};

export { fetchInbox, fetchEmailsByFolder, markAsRead, deleteEmail, moveEmail };
