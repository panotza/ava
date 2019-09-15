const line = require('@line/bot-sdk')

module.exports = {
	init: (accessToken, secret) => {
		const config = {
			channelAccessToken: accessToken,
			channelSecret: secret
		};
		
		const client = new line.Client(config)
		line.middleware(config)
	
		return client
	}
}