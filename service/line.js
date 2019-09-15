const line = require('@line/bot-sdk')

function init () {
	const config = {
		channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
		channelSecret: process.env.CHANNEL_SECRET
	};
	
	const client = new line.Client(config)
	line.middleware(config)

	return {
		replyText: async (event, text) => {
			return client.replyMessage(event.replyToken, {
				type: 'text',
				text
			})
		}
	}
}

module.exports = init()