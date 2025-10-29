// convert duration strings
export function parseDuration(duration) {
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