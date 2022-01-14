const addSingleSetHeader = res => {
	if (!res.origSetHeader) {
		res.origSetHeader = res.setHeader;
		const headers = {};
		res.setHeader = function (key, value) {
			if (!headers[key]) {
				this.origSetHeader(key, value);
				headers[key] = value;
			}
		}
	}
}
module.exports = {
	gzip: true,
	port: 5000,
	cors: true,
	cache: 25,
	showDir: false,
	before: [
		(req, res) => {
			const { url } = req;
			if (url.match(/(studies|series|instances|metadata)(\?|$)/)) {
				addSingleSetHeader(res);
				res.setHeader("content-type", "application/json");
			}
			res.emit('next');
		},
	],
};
