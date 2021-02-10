const router = require("express").Router();
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const randomstring = require("randomstring");

const nodemailer = require("nodemailer");

const MongoClient = require("mongodb").MongoClient;

dotenv.config();

const sendUrl = process.env.ENV_URL + "/register/activateUser/";

const Joi = require("joi");

const schemaRegister = Joi.object({
	firstname: Joi.string().min(6).required(),
	lastname: Joi.string().min(6).required(),
	email: Joi.string().min(6).required().email(),
	password: Joi.string().min(6).required(),
	type: Joi.string().required().valid("admin", "manager", "employee"),
});

const schemaLogin = Joi.object({
	email: Joi.string().min(6).required().email(),
	password: Joi.string().min(6).required(),
});

const sendMail = async (email) => {
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

			let data = await dbo
				.collection("users") // Get the user details
				.findOne({
					email: email,
				});
			console.log(data);

			let randomString = randomstring.generate({
				length: 18,
				charset: "alphanumeric",
			});

			dbo.collection("VerifyUser").insertOne(
				{
					createdAt: new Date(),
					username: email,
					string: randomString,
				},
				function (err, res) {
					if (err) throw err;
					console.log("Random string Inserted");
				}
			);

			dbo
				.collection("VerifyUser")
				.createIndex({ createdAt: 1 }, { expireAfterSeconds: 6000 });

			console.log(process.env.gmailUserName);

			let mailOptions = {
				from: process.env.gmailUserName,
				to: email,
				subject: "Verify User.",
				text: "The given link will expire in 1 min: " + sendUrl + randomString,
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

router.post("/register", async (req, res) => {
	try {
		const validation = await schemaRegister.validateAsync(req.body);
	} catch (err) {
		res.status(400).send(err.details[0].message);
	}

	const emailExist = await User.findOne({ email: req.body.email });

	if (emailExist) return res.status(400).send("Email already exists");

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(req.body.password, salt);

	const user = new User({
		firstName: req.body.firstname,
		lastName: req.body.lastname,
		email: req.body.email,
		password: hashedPassword,
		type: req.body.type,
	});

	try {
		const savedUser = await user.save();
		console.log(savedUser);
		sendMail(user.email);
		res.send(savedUser);
	} catch (err) {
		res.status(400).send(err);
	}
});

router.get("/register/activateUser/:randomString", (req, res) => {
	let randomString = req.params.randomString;
	console.log(randomString);

	MongoClient.connect(process.env.DB_CONNECTION, function (err, db) {
		if (err) throw err;
		let dbo = db.db("akshay");
		dbo
			.collection("VerifyUser")
			.findOne({ string: randomString }, function (err, result) {
				if (err) {
					res.status(404).send(err);
					throw err;
				}

				var myquery = { email: result.username };
				var newvalues = { $set: { verified: true } };
				dbo
					.collection("users")
					.updateOne(myquery, newvalues, function (err, response) {
						if (err) {
							res.send(404).send(err);
							throw err;
						}
						console.log("User Verified");
						res.send("User Verifed");
					});

				db.close();
			});
	});
	res.send("User not verifed");
});

router.get(
	"/login",

	(req, res) => {
		const token = req.cookies["AuthToken"];
		console.log(token);
		res.send(token);
	}
);

router.post("/login", async (req, res) => {
	try {
		const validation = await schemaLogin.validateAsync(req.body);
	} catch (err) {
		res.status(400).send(err.details[0].message);
	}

	const user = await User.findOne({ email: req.body.email });

	if (!user) return res.status(400).send("email or password is wrong!!");

	const verified = user.verified;

	if (!verified) res.status(400).send("Account not verified");

	const validPass = await bcrypt.compare(req.body.password, user.password);
	if (!validPass) return res.status(400).send("Invalid Password");

	const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, {
		expiresIn: 60 * 60,
	});
	// res.header("auth-token", token).send(token);
	res.cookie("AuthToken", token, {
		maxAge: 36000,
		httpOnly: true,
		secure: true,
	});
	res.json({ token });
	res.cookie("Authorized", user.authorized);

	res.send("Logged in!");
});

module.exports = router;
