const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const app = express();

const authRoute = require("./routes/auth");
const crm = require("./routes/crm");

dotenv.config();

mongoose.connect(
	process.env.DB_CONNECTION,

	{ dbName: "akshay", useNewUrlParser: true, useUnifiedTopology: true },
	() => {
		console.log("Connected to db!");
	}
);

app.use(express.json());

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/user", authRoute);
app.use("/api/crm",crm);

app.listen(4000, () => {
	"Server up and running!!";
});
