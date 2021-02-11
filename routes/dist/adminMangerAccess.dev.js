"use strict";

var MongoClient = require("mongodb").MongoClient;

module.exports = function (req, res, next) {
  var role = req.cookies["Role"];
  if (!role) return res.status(401).send("Access Denied");

  try {
    if (role === "manager" || role === "admin") {
      req.user = "authorized";
      next();
    } else {
      res.status(401).send("Employees dont have access to this feature.");
    }
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
};