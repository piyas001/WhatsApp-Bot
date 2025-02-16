const fs = require("fs");
const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session"); 
    const sock = makeWASocket({ auth: state });

    sock.ev.on("creds.update", saveCreds);

    console.log("✅ Session Created!");
}

startBot();
