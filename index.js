const PORT = process.env.PORT || 3000; // Render Port

const { makeWASocket, useMultiFileAuthState, makeWALegacySocket } = require("@whiskeysockets/baileys");
const pino = require("pino");

// Express Server Keep Alive (Render বন্ধ হওয়া ঠেকাবে)
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("WhatsApp Status Seen Bot Running...");
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // QR Code অফ থাকবে
        logger: pino({ level: "silent" }),
        browser: ["WhatsApp-Status-Bot", "Chrome", "3.0"],
    });

    // Pairing Code নেওয়ার জন্য
    if (!sock.authState.creds.registered) {
        let pairingCode = await sock.requestPairingCode("YOUR_PHONE_NUMBER"); 
        console.log(`🔗 Pairing Code: ${pairingCode}`);
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
}

// বট চালু করো
connectWhatsApp();
