const chrome = require('chrome-aws-lambda')

module.exports = {
	resolveEms: async (trackingNumber) => {
		const browser = await chrome.puppeteer.launch({
			args: chrome.args,
			executablePath: await chrome.executablePath,
			headless: chrome.headless,
		})
		const page = await browser.newPage()
		await page.goto(`http://track.thailandpost.co.th/tracking/default.aspx?lang=th`, { waitUntil: 'networkidle0' })
		await Promise.all([page.waitForSelector('#TextBarcode', { visible: true }), page.waitForSelector('.bgSlider', { visible: true })])

		await page.type('#TextBarcode', trackingNumber)
		const e = await page.$('.bgSlider')
		const box = await e.boundingBox()
		await page.mouse.move(box.x + 5, box.y + 5)
		await page.mouse.down()
		await page.mouse.move(box.x + box.width, box.y + 5)
		await page.mouse.up()

		await page.waitForNavigation()
		const data = await page.evaluate(() => {
			const tds = Array.from(document.querySelectorAll("table:nth-child(3)"))
			return tds.map(td => {
				var txt = td.innerText.replace(/<a [^>]+>[^<]*<\/a>/g, '').trim()
				return txt
			})
		})
	
		data[1] = data[1].replace(/\t/g, ' ')
		var tracking = data[1].split('\n')
		tracking.shift()
		var status = []
		for (var i = 0; i + 1 <= tracking.length; i += 2) {
			temp = tracking[i + 1].split(' ')
			temp[3] = '=> ' + temp[3].trim()
			tracking[i + 1] = temp.join(' ')
			status.push(tracking[i] + tracking[i + 1])
		}

		await page.close()
		await browser.close()

		return status
	}
}