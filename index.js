const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // টার্মিনালে QR দেখাবে
        logger: pino({ level: "silent" }),
        browser: ["WhatsApp-Status-Bot", "Chrome", "3.0"]
    });

    // **QR কোড পরিবর্তন হলে**
    sock.ev.on("connection.update", async (update) => {
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

            // **যদি মেসেজটি Status থেকে আসে**
            if (msg.key.remoteJid === "status@broadcast") {
                console.log(`👀 Status Seen: ${msg.pushName || "Unknown"}`);
                await sock.readMessages([msg.key]); // Status Seen করে দিচ্ছে
            }
        }
    });
}

// বট চালু করো
connectWhatsApp();
