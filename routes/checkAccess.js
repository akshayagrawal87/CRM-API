const MongoClient = require("mongodb").MongoClient;

module.exports = function (req, res, next) {
	const role = req.cookies["Role"];
	if (!role) return res.status(401).send("Access Denied");

	try {
		if (role === "manager" || role === "admin") {
			req.user = "authorized";
			next();
		} else if (role === "employee") {
			const Authorized = req.cookies["Authorized"];
			if (Authorized) req.user = "authorized";
			next();
		} else {
			res.status(401).send("Employees dont have access to this feature.");
		}
	} catch (err) {
		res.status(400).send("Invalid Token");
	}
};
