const firestore = require('../service/firestore')

module.exports = async (req, res) => {
	await firestore.logs.add(req.body)
	res.json({})
}