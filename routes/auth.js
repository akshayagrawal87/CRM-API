const router = require("express").Router();
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
		res.send(savedUser);
	} catch (err) {
		res.status(400).send(err);
	}
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

	const validPass = await bcrypt.compare(req.body.password, user.password);
	if (!validPass) return res.status(400).send("Invalid Password");

	const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
	// res.header("auth-token", token).send(token);
	res.cookie("AuthToken", token, {
		maxAge: 36000,
		httpOnly: false,
	});

	res.send("Logged in!");
});

module.exports = router;
