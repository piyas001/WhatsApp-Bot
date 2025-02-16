const makeWASocket = require("@whiskeysockets/baileys").default;
const { usePairingCode } = require("@whiskeysockets/baileys");
const fs = require("fs");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Session ফাইল সংরক্ষণের জন্য ফোল্ডার তৈরি
const sessionPath = "./session/";
if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath);
}

let pairCode = null;

// WhatsApp Bot শুরু করার ফাংশন
async function startBot() {
    const sock = makeWASocket({
        printQRInTerminal: false, // QR কোড অফ রাখা
        auth: undefined // Pair Code ব্যবহার করা হবে
    });

    // Pairing Code জেনারেট করা
    pairCode = await usePairingCode(sock);
    console.log("✅ Pair Code:", pairCode);
    console.log("🔗 Open WhatsApp → Linked Devices → Enter Code");

    // নতুন মেসেজ এলে চেক করা
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];

        if (!msg.message || msg.key.fromMe) return;

        // যদি স্ট্যাটাস চেক করা হয়
        if (msg.key.remoteJid === "status@broadcast") {
            console.log(`📌 Status seen: ${msg.pushName}`);
        }
    });
}

// API Route (ওয়েবসাইট থেকে Pair Code দেখানোর জন্য)
app.get("/pair-code", (req, res) => {
    if (pairCode) {
        res.json({ status: "success", pairCode });
    } else {
        res.json({ status: "waiting", message: "Generating Pair Code..." });
    }
});

// সার্ভার চালু করা
app.listen(PORT, () => {
    console.log(`🌐 Server running at http://localhost:${PORT}`);
    startBot();
});
