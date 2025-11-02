import fs from "fs";
import path from "path";
import https from "https";

// file uploader
export async function uploadToTransferSh(filePath) {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath);
        const req = https.request({
            method: "PUT",
            hostname: "transfer.sh",
            path: `/${fileName}`,
            headers: {
                "Content-Type": "application/octet-stream"
            }
        }, res => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(body.trim());
                } else {
                    reject(new Error(`Transfer.sh upload failed: ${res.statusCode} ${body}`));
                }
            });
        });

        req.on("error", reject);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(req);
        fileStream.on("error", reject);
    });
}

// convert duration strings
export function parseDuration(duration) {
    if (!duration || typeof duration !== "string") return null;
	const match = duration.match(/^(\d+)(s|m|h|d)$/);
	if (!match) return null;
	const amount = parseInt(match[1]);
	switch (match[2]) {
		case "s": return amount * 1000;
		case "m": return amount * 60 * 1000;
		case "h": return amount * 60 * 60 * 1000;
		case "d": return amount * 24 * 60 * 60 * 1000;
		default: return null;
	}
}

// fetch user
export async function fetchUser(msg, input) {
    if (!input) return null;

    // Remove mention formatting
    input = input.replace(/^<@!?(\d+)>$/, "$1");

    let user = null;

    // 1. Try fetching as guild member
    try {
        const member = await msg.guild.members.fetch(input).catch(() => null);
        if (member) return member.user;
    } catch {}

    // 2. Try fetching from banned users
    try {
        const bans = await msg.guild.bans.fetch();
        const banned = bans.find(b => 
            b.user.id === input || 
            b.user.tag.toLowerCase() === input.toLowerCase()
        );
        if (banned) return banned.user;
    } catch {}

    // 3. Try fetching from global users by ID
    try {
        user = await msg.client.users.fetch(input);
        if (user) return user;
    } catch {}

    return null;
}

// fetch member
export async function fetchMember(msg, input) {
    // default to author if no input
    if (!input) return msg.member;

    // 1. check mention
    const mention = msg.mentions.members.first();
    if (mention) return mention;

    // 2. check ID
    if (/^\d+$/.test(input)) {
        const memberById = await msg.guild.members.fetch(input).catch(() => null);
        if (memberById) return memberById;
    }

    // 3. search members by username or nickname
    const fetched = await msg.guild.members.fetch({ query: input, limit: 50 }).catch(() => null);
    if (!fetched || fetched.size === 0) return null;

    // 3a. exact username match
    const exactUsername = fetched.find(m => m.user.username.toLowerCase() === input.toLowerCase());
    if (exactUsername) return exactUsername;

    // 3b. exact nickname match
    const exactNickname = fetched.find(m => m.nickname?.toLowerCase() === input.toLowerCase());
    if (exactNickname) return exactNickname;

    // 3c. partial match 
    const partial = fetched.find(m => 
        m.user.username.toLowerCase().includes(input.toLowerCase()) || 
        m.nickname?.toLowerCase().includes(input.toLowerCase())
    );
    if (partial) return partial;

    // nothing found
    return null;
}

// folder size
export function getFolderSize(folderPath) {
    let total = 0;

    function walk(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                walk(fullPath);
            } else {
                total += stats.size;
            }
        }
    }

    walk(folderPath);
    return formatBytes(total); // bytes
}

// format bytes
function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// format time difference
export function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}