const moment = require('moment')
const line = require('../service/line')
const thaipost = require('../service/thaipost')
const firestore = require('../service/firestore')

async function handleEvent(event) {
	firestore.logs.add(event)

	switch (event.type) {
	case 'follow':
		await firestore.users.create(event.source.userId)
		return
	case 'message':
		return handleMessage(event)
	default:
		return
	}
}

async function handleMessage(event) {
	if (event.message.type !== 'text') {
		return
	}
	if (!event.message.text) {
		return
	}

	const { userId } = event.source

	const [cmd, ...args] = event.message.text.split(' ')
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
				firestore.logs.add({
					type: 'error',
					message: err.message
				})
				return line.replyText(event, `error checking ems ❗️`)
			}
		case 'b':
			try {
				let amount = +args[0]
				if (!amount) {
					amount = 0
				}
	
				let remark = args[1]
				if (!remark) {
					remark = ''
				}
			
				await firestore.wallet.insertTransaction({
					userId,
					amount: -amount,
					remark
				})

				let msg = `💸 จ่ายเงิน ${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} บาท `
				if (remark) {
					msg += `*${remark}`
				}
				msg = msg.trim()

				const sum = await firestore.users.getWalletAmount(userId)
				msg += `\nคงเหลือ ${sum.toLocaleString('en-US', { maximumFractionDigits: 2 })} บาท`

				return line.replyText(event, msg)
			} catch (err) {
				firestore.logs.add({
					type: 'error',
					message: err.message
				})
				return line.replyText(event, `บันทึกรายจ่ายไม่สำเร็จ ❗️`)
			}
		case 'r':
			try {
				let amount = +args[0]
				if (!amount) {
					amount = 0
				}

				let remark = args[1]
				if (!remark) {
					remark = ''
				}
			
				await firestore.wallet.insertTransaction({
					userId,
					amount,
					remark
				})

				let msg = `💵 รับเงิน ${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} บาท `
				if (remark) {
					msg += `*${remark}`
				}
				msg = msg.trim()

				const sum = await firestore.users.getWalletAmount(userId)
				msg += `\nคงเหลือ ${sum.toLocaleString('en-US', { maximumFractionDigits: 2 })} บาท`

				return line.replyText(event, msg.trim())
			} catch (err) {
				firestore.logs.add({
					type: 'error',
					message: err.message
				})
				return line.replyText(event, `บันทึกรายรับไม่สำเร็จ ❗️`)
			}
	}

	return line.replyText(event, `หนูไม่เข้าใจคำว่า "${event.message.text}" ค่ะ 😰`)
}

module.exports = async (req, res) => {
	const result = await Promise.all(req.body.events.map(handleEvent))
	res.json(result)
}