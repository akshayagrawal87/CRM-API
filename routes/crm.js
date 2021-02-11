const router = require("express").Router();

const verify = require("./verifyToken");

const checkAccess = require("./checkAccess");

const MongoClient = require("mongodb").MongoClient;

const nodemailer = require("nodemailer");

const dotenv = require("dotenv");
const Service = require("../model/Service");
const Lead = require("../model/Lead");
const leadStatus = require("../model/leadStatus");

const adminMangerAccess = require("./adminMangerAccess");

dotenv.config();

router.use(verify);

const sendMail = async (subject, description) => {
	let transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.gmailUserName,
			pass: process.env.gmailPassword,
		},
	});

	console.log("Inside sendMail");

	let mailOptions = {
		from: process.env.gmailUserName,
		to: process.env.admin,
		subject: subject,
		text: description,
	};

	transporter.sendMail(mailOptions, (err, data) => {
		if (err) {
			console.log({ message: "Error Occurs", linkSent: false });
		} else {
			console.log({ message: "Link Sent", linkSent: true });
		}
	});
};

router.get("/dashboard", async (req, res) => {});

router.put("/provideAccess", adminMangerAccess, async (req, res) => {});

router.post("/createService", checkAccess, async (req, res) => {
	const service = new Service({
		subject: req.body.subject,
		description: req.body.subject,
		status: req.body.status,
	});

	try {
		const savedService = await service.save();
		sendMail(
			"New Service Request",
			`A new service request is created with following details:${savedService}`
		);
		res.send(savedService);
	} catch (err) {
		console.log(err);
		res.status(404).send(err);
	}
});

router.put("/updateService", checkAccess, async (req, res) => {
	MongoClient.connect(process.env.DB_CONNECTION, function (err, db) {
		if (err) throw err;
		let dbo = db.db("akshay");

		let ObjectId = require("mongodb").ObjectId;
		let id = req.body.id;
		let o_id = new ObjectId(id);

		const filter = { _id: o_id };

		const update = { $set: { status: req.body.status } };

		dbo
			.collection("services")
			.updateOne(filter, update, function (err, response) {
				if (err) {
					res.send(404).send(err);
					throw err;
				}
				console.log("Service Status Updated");
				res.send("Service Status Updated");
			});
	});
});

router.get("/services", async (req, res) => {
	let response = await Service.find({});
	res.send(response);
});

router.post("/createLead", checkAccess, async (req, res) => {
	const lead = new Lead({
		name: req.body.name,
		contact: req.body.contact,
		status: req.body.status,
	});

	try {
		const savedLead = await lead.save();
		sendMail(
			"New Lead Request",
			`A new lead request is created with following details:${savedLead}`
		);
		res.send(savedLead);
	} catch (err) {
		console.log(err);
		res.status(404).send(err);
	}
});

router.put("/updateLead", checkAccess, (req, res) => {
	MongoClient.connect(process.env.DB_CONNECTION, function (err, db) {
		if (err) throw err;
		let dbo = db.db("akshay");

		let ObjectId = require("mongodb").ObjectId;
		let id = req.body.id;
		let o_id = new ObjectId(id);

		const filter = { _id: o_id };

		const update = { $set: { status: req.body.status } };

		dbo.collection("leads").updateOne(filter, update, function (err, response) {
			if (err) {
				res.send(404).send(err);
				throw err;
			}
			console.log("Lead Status Updated");

			res.send("Lead Status Updated");
		});
	});
});

router.get("/leads", async (res, req) => {
	let response = await Lead.find({});
	res.send(response);
});

router.put("/updateLead/contact", checkAccess, (req, res) => {});

module.exports = router;
