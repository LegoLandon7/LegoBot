import fs from "fs";
const filePath = "./logging/log-channels.json";

// ensure file exists
if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "{}");

function readData() {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content ? JSON.parse(content) : {};
  } catch (err) {
    console.error("Error reading JSON, resetting file:", err);
    fs.writeFileSync(filePath, "{}");
    return {};
  }
}

// save a guild's log channel
export function setLogChannel(guildId, channelId) {
  const data = readData();
  if (channelId) data[guildId] = channelId;
  else delete data[guildId]; // remove if null
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// get a guild's log channel
export function getLogChannel(guildId) {
  const data = readData();
  return data[guildId] || null;
}