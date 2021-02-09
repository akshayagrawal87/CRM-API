const router = require("express").Router();

const verify = require("./verifyToken");

const checkAccess = require("./checkAccess");

const MongoClient = require("mongodb").MongoClient;

const nodemailer = require("nodemailer");

const dotenv = require("dotenv");
const Service = require("../model/Service");
const lead = require("../model/Lead");

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

	MongoClient.connect(
		process.env.DB_CONNECTION,
		{ useUnifiedTopology: true },
		async function (err, db) {
			let dbo = db.db("akshay");

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
		}
	);
};

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

router.put("/updateService", checkAccess, (req, res) => {});

router.get("/services", async (req, res) => {
	Service.find({}, function (err, services) {
		serviceMap = {};

		services.forEach(function (service) {
			serviceMap[service._id] = user;
		});

		res.send(serviceMap);
	});
});

router.post("/createLead", checkAccess, async (req, res) => {
	const lead = new lead({
		name: req.body.name,
		contact: req.body.contact,
		status: req.body.status,
	});

	try {
		const savedLead = await lead.save();
		sendMail(
			"New Lead Request",
			`A new lead request is created with following details:${savedService}`
		);
		res.send(savedLead);
	} catch (err) {
		console.log(err);
		res.status(404).send(err);
	}
});

router.put("/updateLead", checkAccess, (req, res) => {});

router.get("/leads", (res, req) => {});

router.put("/updateLead/contact", checkAccess, (req, res) => {});

module.exports = router;
