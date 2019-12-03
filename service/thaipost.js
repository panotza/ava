const https = require('https')
const axios = require('axios')

const template = require('./template')

const api = axios.create({
	baseURL: 'https://trackapi.thailandpost.co.th/post/api/v1',
	timeout: 5000,
	headers: {'Content-Type': 'application/json'},
	httpsAgent: new https.Agent({  
		rejectUnauthorized: false // thaipost api has certificate problem at the moment, remove when not needed
	})
})

const getToken = async () => {
	const header = {
		headers: {'Authorization': `Token ${process.env.THAIPOST_API_TOKEN}`}
	}
	const { data } = await api.post('/authenticate/token', {}, header)
	return data.token
}

const getTracks = async (barcodes) => {
	const token = await getToken()
	const header = {
		headers: {'Authorization': `Token ${token}`}
	}
	const body = {
		status: 'all',
		language: 'TH',
		barcode: barcodes
	}
	const { data: { response } } = await api.post('/track', body, header)

	const replies = []
	Object.entries(response.items).forEach(([code, checkpoints]) => {
		let text = checkpoints.map((cp) => {
			const { status_date, status_description, location, postcode } = cp
			return `${formatTimestamp(status_date)} ${status_description} ${location} ${postcode}`
		}).join('\n')

		if (!text) {
			text = 'ไม่มีข้อมูลสถานะ ณ ตอนนี้'
		}

		replies.push(template.trackingReply(code, 'ไปรษณีย์ไทย', text))
	})
	return replies.join('\n\n')
}

const formatTimestamp = (ts) => {
	// 14/09/2562 11:38:21+07:00
	// we don't need timezone
	return ts.substring(0, 19);
}

module.exports = {
	getTracks
}