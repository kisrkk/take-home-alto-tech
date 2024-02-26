const kDebug = true;
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
// 3rd party dependencies
const YAML = require("js-yaml");
const express = require("express");
const moment = require("moment-timezone");
var cors = require("cors");
// My dependencies
const db = require("./src/database");

const app = express();
app.use(express.json());
app.use(cors());

function authFailReturn(res, message) { 
  res.status(401).send(message);
}

const extractApiKey = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (kDebug) {
    console.log("authorization:", authHeader);
  }
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    req.apiKey = token;
    next();
  } else {
    authFailReturn(res, "Invalid API Key " + authHeader);
  }
};

async function authTokenCheck(token) {
  const existing_token = "HASH256+SALT";
  /*
      Session and token processing
   */
  if (existing_token === token) {
    return { auth_acknowledgement: true, message: "Authentication successful" };
  } else {
    return { auth_acknowledgement: false, message: `Unauthenticated` };
  }
}

app.post("/device_data", cors(), extractApiKey, async (req, res) => {
  try {
    const payload = req.body;
    const apiKey = req.apiKey;
    ///console.log(`/device_data `,req);
    const auth = await authTokenCheck(apiKey);
    if (kDebug) {
      //console.log(`POST `,payload); 
    }
    if (!auth.auth_acknowledgement) {
      res.status(401).send(auth.message);
    } else {
      db.insertIntoDB(db.my_connection, db.tb_device_data, payload);
      res.status(201).send("OK");
    }
  } catch (error) {
    if (kDebug) {
      res.status(500).send(error);
    } else {
      res.status(500);
    }
  }
});

app.use(cors(), (req, res, next) => {
  res.status(404).send(`404 Page not found`);
});

const httpServer = http.createServer(app);
httpServer.listen(8080, () => {
  console.log(`HTTP server listening on port ${8080}`);
});
