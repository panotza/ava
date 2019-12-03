const axios = require('axios')
const moment = require('moment')

const template = require('./template')

const api = axios.create({
	baseURL: 'https://api.aftership.com/v4',
	timeout: 5000,
	headers: {
		'Content-Type': 'application/json',
		'aftership-api-key': process.env.AFTERSHIP_API_TOKEN
	}
})

async function detect (trackingNumber) {
	const { data: { data: { couriers } } } = await api.post('/couriers/detect', {
		tracking: {
			tracking_number: trackingNumber
		}
	})

	return couriers
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function create (trackingNumber) {
	try {
		const body = {
			tracking: {
				tracking_number: trackingNumber
			}
		}
		const { data: { data: { tracking } } } = await api.post('/trackings', body)
		// newly created trackings need some time to process data so we wait
		await sleep(3000)
		return { trackingId: tracking.id }
	} catch (err) {
		const { response } = err
		if (response.status === 400) {
			// exists
			if (response.data.meta.code === 4003) {
				return { trackingId: response.data.data.tracking.id }
			}
			// cannot detect courier
			if (response.data.meta.code === 4012) {
				throw new Error('Cannot detect courier')
			}
		}
		throw err
	}
}

async function getTrack (trackingNumber) {
	try {
		const { trackingId } = await create(trackingNumber)
		const { data: { data: { tracking } } } = await api.get(`/trackings/${trackingId}`)
		const { id, slug, signed_by: signedBy, checkpoints, tracking_number } = tracking
		return transformToReply({ id, slug, trackingNumber: tracking_number, signedBy, checkpoints })
	} catch (err) {
		const { response } = err
		if (response.status === 400) {
			throw new Error('The value of `id` is invalid')
		}
		if (response.status === 404) {
			throw new Error('Not found')
		}
		throw err
	}
}

function transformToReply (result) {
	let msg = ''
	if (!result) {
		return msg
	}

	const body = result.checkpoints.map((cp) => {
		return`${moment(cp.created_at).format('D-M-YYYY hh:mm:ss')} ${cp.message} ${cp.city} ${cp.zip || ''}\n`.trim()
	}).join('\n')
	return template.trackingReply(result.trackingNumber, result.slug, body)
}

async function remove (trackingId) {
	try {
		const { data: { data: { tracking } } } = await api.delete(`/trackings/${trackingId}`)
		return
	} catch (err) {
		const { response } = err
		if (response.status === 400) {
			throw new Error('The value of `id` is invalid')
		}
		if (response.status === 404) {
			throw new Error('Not found')
		}
		throw err
	}
}

module.exports = {
	detect,
	getTrack
}