const line = require('../service/line')
const insertLog = require('../service/db')
const thaipost = require('../service/thaipost')

async function handleEvent(event) {
	await insertLog(event)

	const { type, message } = event
	if (type !== 'message' || message.type !== 'text') {
		return
	}
	if (!message.text) {
		return
	}

	const [cmd, ...args] = message.text.split(' ')
	switch (cmd) {
		case 'ems':
			try {
				const items = await thaipost.getItems(args)
				let msg = ''
				Object.entries(items).forEach(([code, trackingStatus]) => {
					msg += `✨ EMS number: ${code}\n`
					if (trackingStatus.length > 0) {
						trackingStatus.forEach((status) => {
							const { status_date, status_description, location, postcode } = status
							msg += `${thaipost.formatTimestamp(status_date)} ${status_description} ${location} ${postcode}\n`
						})
					} else {
						msg += 'ไม่มีข้อมูลสถานะ ณ ตอนนี้\n'
					}
				})
				return line.replyText(event, msg.trim())
			} catch (err) {
				await insertLog({ type: 'error', message: err.message })
				return line.replyText(event, `error checking ems ❗️`)
			}
	}

	return line.replyText(event, `หนูไม่เข้าใจคำว่า "${message.text}" ค่ะ 😰`)
}

module.exports = async (req, res) => {
	const result = await Promise.all(req.body.events.map(handleEvent))
	res.json(result)
}