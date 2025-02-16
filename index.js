require("dotenv").config(); // .env ফাইল থেকে ভেরিয়েবল লোড করা হবে

const PORT = process.env.PORT || 3000; // Render Port
const PHONE_NUMBER = process.env.WHATSAPP_PHONE_NUMBER || "919083366564";

const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const app = express();

// Express Keep-Alive Server (Render বন্ধ হওয়া ঠেকাবে)
app.get("/", (req, res) => {
    res.send("✅ WhatsApp Status Seen Bot Running...");
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // QR Code টার্মিনালে দেখাবে
        logger: pino({ level: "silent" }),
        browser: ["WhatsApp-Status-Bot", "Chrome", "3.0"],
    });

    // Pairing Code নেওয়ার জন্য
    if (!sock.authState.creds.registered && PHONE_NUMBER !== "919083366564") {
        try {
            let pairingCode = await sock.requestPairingCode(PHONE_NUMBER);
            console.log(`🔗 Pairing Code: ${pairingCode}`);
        } catch (error) {
            console.error("❌ Pairing Code Error:", error.message);
        }
    }

    // ** কানেকশন পরিবর্তন হলে **
    sock.ev.on("connection_update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("✅ WhatsApp Connected!");
        } else if (connection === "close") {
            console.log("❌ Connection Closed! Retrying...");
            connectWhatsApp();
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // **Automatic Status Seen Function**
    sock.ev.on("messages.upsert", async ({ messages }) => {
        for (const msg of messages) {
            if (msg.key.fromMe) continue;

            // যদি স্ট্যাটাস ব্রডকাস্ট থেকে আসে
            if (msg.key.remoteJid === "status@broadcast") {
                console.log(`👀 Status Seen: ${msg.pushName || "Unknown"}`);
                await sock.readMessages([msg.key]); // Status Seen করে দেবে
            }
        }
    });

    return sock;
}

// বট চালু করো
connectWhatsApp();
