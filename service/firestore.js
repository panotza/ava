const admin = require('firebase-admin')
const moment = require('moment')

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

const users = {
	async create (userId) {
		return db.collection('users').doc(userId).set({ createdAt: moment().format() })
	},
	async getBalance (userId) {
		const user = await db.collection('users').doc(userId).get()
		if (!user.exists) {
			throw 'user does not exist'
		}
		return user.data().balance || 0
	}
}

const wallet = {
	async insertTransaction ({ userId, amount, remark }) {
		const userRef = db.collection('users').doc(userId)
		const transactionRef = db.collection('wallet').doc(userId).collection('transactions').doc()

		return db.runTransaction((tx) => {
			return tx.get(userRef).then((user) => {
				if (!user.exists) {
					throw 'user does not exist'
				}

				let balance = user.data().balance || 0
				balance += amount

				tx.update(userRef, { balance })
				tx.create(transactionRef, {
					amount,
					remark,
					createdAt: moment().format()
				})
			})
		})
	}
}

module.exports = {
	users,
	logs: db.collection('logs'),
	wallet
}