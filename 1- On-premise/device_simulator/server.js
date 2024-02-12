//** IoT Device Simulator */
const kDebug = true;
const fs = require("fs");
const csv = require("csv-parser");
const http = require("http");
const express = require("express");
const moment = require("moment-timezone");
var cors = require("cors");
let csv_data = null;
let csv_data_count = null;
let count = 0;

function loadCSVIntoObject(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    const stream = fs
      .createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });

    stream.on("error", (error) => {
      reject(error);
    });
  });
}

async function initData() {
  const filePath = "./room_iot_data/room_iot_data.csv";
  try {
    if (!csv_data) {
      csv_data = await loadCSVIntoObject(filePath);
    }
    csv_data_count = csv_data.length;
  } catch (error) {
    console.error("Error loading CSV:", error);
  }
}

function random_IAQ_data() {
  const data_point = [
    "noise",
    "co2",
    "pm25",
    "humidity",
    "temperature",
    "illuminance",
    "online_status",
    "device_status",
  ];
  const index = Math.floor(Math.random() * data_point.length);

  const data_to_send = {
    datetime: moment().tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm:ss.SSS"),
    device_id: "iaq_sensor",
    datapoint: data_point[index],
  };

  switch (data_point[index]) {
    case "noise":
      data_to_send.value = (Math.floor(Math.random() * (120 - 25 + 1)) + 25).toString();
      break;
    case "co2":
      data_to_send.value = (Math.floor(Math.random() * (2000 - 400 + 1)) + 400).toString();
      break;
    case "pm25":
      data_to_send.value = (Math.floor(Math.random() * (140 - 60 + 1)) + 60).toString();
      break;
    case "humidity":
      data_to_send.value = (Math.floor(Math.random() * (60 - 20 + 1)) + 20).toString();
      break;
    case "temperature":
      data_to_send.value = (Math.floor(Math.random() * (28 - 20 + 1)) + 20).toString();
      break;
    case "illuminance":
      data_to_send.value = (Math.floor(Math.random() * (300 - 4 + 1)) + 4).toString();
      break;
    case "online_status":
      data_to_send.value = "online";
      break;
    case "device_status":
      data_to_send.value = "good";
      break;
    default:
      break;
  }
  return data_to_send;
}

initData();

const app = express();
app.use(cors());

app.get("/life_being", cors(), (req, res) => {
  try {
    const query = req.query;
    if (kDebug) {
      console.log(`GET `);
      console.log(query);
    }
    count++;
    if (count > csv_data_count) {
      count = 0;
    }
    res.send(csv_data[count]);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/iaq_sensor", cors(), (req, res) => {
  try {
    const query = req.query;
    if (kDebug) {
      console.log(`GET `);
      console.log(query);
    }
    res.send(random_IAQ_data());
  } catch (error) {
    res.status(500).send(error);
  }
});

app.use(cors(), (req, res, next) => {
  res.status(404).send(`404`);
});

const httpServer = http.createServer(app);
httpServer.listen(21000, () => {
  console.log(`HTTP server listening on port ${21000}`);
});
