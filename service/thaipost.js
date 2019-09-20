const https = require('https')
const axios = require('axios')

const api = axios.create({
	baseURL: 'https://trackapi.thailandpost.co.th/post/api/v1',
	timeout: 5000,
	headers: {'Content-Type': 'application/json'},
	httpsAgent: new https.Agent({  
		rejectUnauthorized: false // thaipost api has certificate problem at the moment, remove when not needed
	})
})

const getToken = async () => {
	const { data } = await api.post('/authenticate/token', {}, {
		headers: {'Authorization': `Token ${process.env.THAIPOST_API_TOKEN}`}
	})
	return data.token
}

const getItems = async (barcodes) => {
	const token = await getToken()
	const { data: { response } } = await api.post('/track', {
		status: 'all',
		language: 'TH',
		barcode: barcodes
	}, { headers: {'Authorization': `Token ${token}`} })
	return response.items
}

const formatTimestamp = (ts) => {
	// 14/09/2562 11:38:21+07:00
	// we don't need timezone
	return ts.substring(0, 19);
}

module.exports = {
	getItems,
	formatTimestamp
}