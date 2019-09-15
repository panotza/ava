const line = require('../service/line')
const insertLog = require('../service/db')
const puppeteer = require('../service/puppeteer')

async function handleEvent(event) {
	await insertLog(event)

	const { type, message } = event

	if (type !== 'message' || message.type !== 'text') {
		return Promise.resolve(null)
	}

	if (!message.text) {
		return Promise.resolve(null)
	}

	const args = message.text.split(' ')
	switch (args[0]) {
		case 'ems':
			try {
				const status = await puppeteer.resolveEms(args[1])
				return line.replyText(event, `ems number: ${args[1]}\n${status.join('\n')}`)
			} catch (err) {
				await insertLog({ type: 'error', message: err.message })
				return line.replyText(event, `error checking ems: ${err.message}`)
			}
	}

	return line.replyText(event, event.message.text)
}

module.exports = async (req, res) => {
	const result = await Promise.all(req.body.events.map(handleEvent))
	res.json(result)
}