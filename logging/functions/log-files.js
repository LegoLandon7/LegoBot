import fs from "fs";
import path from "path";
import archiver from "archiver";
import { fileURLToPath } from "url";
import { uploadToTransferSh } from "../../functions/utilities.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// base logs folder: logging/logs/
const logsBase = path.join(__dirname, "..", "logs");
fs.mkdirSync(logsBase, { recursive: true });

// ensure server log folder
export function ensureServerFolder(guildId) {
    const serverFolder = path.join(logsBase, guildId);
    fs.mkdirSync(serverFolder, { recursive: true });
    return serverFolder;
}

// ensure log file, including optional subfolder
function ensureLogFile(guildId, fileName, subFolder = null) {
    let serverFolder = ensureServerFolder(guildId);
    if (subFolder) {
        serverFolder = path.join(serverFolder, subFolder);
        fs.mkdirSync(serverFolder, { recursive: true });
    }

    const filePath = path.join(serverFolder, fileName);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "", "utf8"); // create empty file if missing
    }
    return filePath;
}

// append a log
export function appendLog(guildId, fileName, content, subFolder = null) {
    const filePath = ensureLogFile(guildId, fileName, subFolder);
    const lines = Array.isArray(content) ? content : [content];
    const timestamp = new Date().toLocaleString();
    const textToWrite = lines.map(line => `[${timestamp}] ${line}`).join("\n") + "\n";
    fs.appendFileSync(filePath, textToWrite, "utf8");
}

// read a log
export function readLog(guildId, fileName, subFolder = null) {
    const filePath = ensureLogFile(guildId, fileName, subFolder);
    return fs.readFileSync(filePath, "utf8");
}

// get all logs for a server
export function getAllLogs(guildId) {
    const serverFolder = path.join(logsBase, guildId);
    if (!fs.existsSync(serverFolder)) return [];

    const result = [];

    function readDirRecursive(dir) {
        for (const file of fs.readdirSync(dir)) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                readDirRecursive(fullPath);
            } else {
                result.push(fullPath);
            }
        }
    }

    readDirRecursive(serverFolder);
    return result;
}

// zip all logs for a guild
export async function zipGuildLogs(guildId, channel = null) {
    try {
        const serverFolder = ensureServerFolder(guildId);
        const zipPath = path.join(logsBase, `logs-${guildId}.zip`);

        // remove old zip if it exists
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

        // create zip stream
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.pipe(output);
        archive.directory(serverFolder, `${guildId}`);
        await archive.finalize();

        // wait for stream to finish
        await new Promise((resolve, reject) => {
            output.on("close", resolve);
            archive.on("error", reject);
        });

        // send to channel if provided
        if (channel) {
            try {
                await channel.send({ files: [zipPath] });
            } catch (err) {
                // fallback if too large
                if (err.code === 50035 || err.message.includes("File cannot be larger")) {
                    if (typeof uploadToTransferSh === "function") {
                        const link = await uploadToTransferSh(zipPath);
                        await channel.send(`📦 Log file too large to attach. Download it here:\n${link}`);
                    } else {
                        await channel.send("❌ Log file too large and no upload service is available.");
                    }
                } else {
                    console.error("zipGuildLogs send error:", err);
                    await channel.send("❌ Failed to send log zip file.");
                }
            }
        }

        // auto-delete zip after 10s
        setTimeout(() => {
            if (fs.existsSync(zipPath)) fs.unlink(zipPath, () => {});
        }, 10000);

        return zipPath;
    } catch (err) {
        console.error("zipGuildLogs error:", err);
    }
}