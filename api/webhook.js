const line = require('../service/line')
const insertLog = require('../service/db')
const client = line.init(process.env.CHANNEL_ACCESS_TOKEN, process.env.CHANNEL_SECRET)

async function handleEvent(event) {
	await insertLog(event)

	if (event.type !== 'message' || event.message.type !== 'text') {
		return Promise.resolve(null)
	}

	return client.replyMessage(event.replyToken, {
		type: 'text',
		text: event.message.text
	})
}

module.exports = (req, res) => {
	Promise
		.all(req.body.events.map(handleEvent))
		.then((result) => res.json(result))
}

