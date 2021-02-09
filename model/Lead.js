const mongoose = require("mongoose");

const leadStatus = require("./leadStatus");

const leadSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	contact: {
		type: String,
		required: true,
		max: 13,
	},
	status: {
		type: leadStatus,
		required: true,
	},
});

module.exports = mongoose.model("Lead", leadSchema);
