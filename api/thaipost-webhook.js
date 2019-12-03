const firestore = require('../service/firestore')

module.exports = async (req, res) => {
	if (typeof req.body === 'object') {
		await firestore.logs.add(req.body)
	}
	res.json({})
}