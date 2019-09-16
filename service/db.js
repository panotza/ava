const MongoClient = require('mongodb').MongoClient

module.exports = async function insertLog (item) {
	const client = new MongoClient(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
	await client.connect()
	await client.db('ava').collection('logs').insertOne(item)
	client.close()
}
