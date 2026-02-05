// time.js -> utility for time-related functions
// Landon Lego
// Last updated 2/4/2026

// data
const units = [
    { label: 'w', value: 1000 * 60 * 60 * 24 * 7 },
    { label: 'd', value: 1000 * 60 * 60 * 24 },
    { label: 'h', value: 1000 * 60 * 60 },
    { label: 'm', value: 1000 * 60 },
    { label: 's', value: 1000 },
    //{ label: 'ms', value: 1 } // too precise
];

// check values
function isMsValue(value) {
    return typeof value === "number";
}
function isDuration(value) {
    return typeof value === "string";
}

// ms -> string format
function msToDuration(ms) {
    // data
    let remaining = ms;
    const parts = [];

    // get units
    for (const u of units) {
        const amount = Math.floor(remaining / u.value);
        if (amount > 0) {
        parts.push(` ${amount}${u.label}`);
        remaining -= amount * u.value;
        }
    }

    // return
    return parts.length ? parts.join('') : '0s';
}

// string -> ms format
function durationToMs(duration) {
    // handle negative
    let isNegative = false;
    if (duration.startsWith("-")) {
        isNegative = true;
        duration = duration.slice(1);
    }
    
    // match all number+unit pairs
    const matches = duration.match(/(\d+)([a-z]+)/gi);
    
    if (!matches) return null;
    
    let totalMs = 0;
    
    // process each segment
    for (const match of matches) {
        const num = parseInt(match, 10);
        const unit = match.replace(/\d+/g, "");
        
        // find matching unit
        let found = false;
        for (const u of units) {
            if (u.label === unit) {
                totalMs += num * u.value;
                found = true;
                break;
            }
        }
        
        // fallback
        if (!found) return null;
    }
    
    return isNegative ? -totalMs : totalMs;
}

// ms -> discord timestamp
function msToDiscordTimestamp(duration, style = 'R') {
    if (isDuration(duration))
        duration = durationToMs(duration);
    const ts = Math.floor((Date.now() + duration) / 1000);
    return `<t:${ts}:${style}>`;
}

// date -> discord timestamp
function dateToDiscordTimestamp(date, style = 'F') {
    if (!(date instanceof Date)) return '[NONE]'
    const ts = Math.floor(date.getTime() / 1000);
    return `<t:${ts}:${style}>`;
}

// exports
module.exports = {isMsValue, isDuration, msToDuration, durationToMs, msToDiscordTimestamp, dateToDiscordTimestamp};