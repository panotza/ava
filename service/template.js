function trackingReply(code, courier, body) {
	return `📦 Tracking number: ${code}
🚚 บริษัทขนส่ง: ${courier}
📍 Route check points
${body}`
}

module.exports = {
	trackingReply
}