const mongoose = require("mongoose");

const serviceStatus = require("./serviceStatus");

const serviceSchema = new mongoose.Schema({
	subject: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
		min: 10,
	},
	status: {
		type: serviceStatus,
		required: true,
	},
});

module.exports = mongoose.model("Service", serviceSchema);
