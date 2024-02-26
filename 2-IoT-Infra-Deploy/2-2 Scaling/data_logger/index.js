const fs = require("fs");
const YAML = require("js-yaml");
const mqtt = require("mqtt");
const { MongoClient } = require("mongodb");
const moment = require("moment-timezone");
const { createClient } = require("redis");
const { default: axios } = require("axios");

const server_config = YAML.load(fs.readFileSync("./config.yaml"));

const hotel_name = server_config.hotel.hotel_name;
const device_list = server_config.hotel.device_list;

const redis_client = createClient();
async function redis_connect() {
  redis_client.on("error", (err) => console.log("Redis Client Error", err));
  await redis_client.connect();
  console.log("Redis Connect");
}
redis_connect();

async function redis_set(key, value, expired = 14400) {
  try {
    await redis_client.set(key, JSON.stringify(value));
    await redis_client.EXPIRE(key, expired);
  } catch (err) {
    console.log("Redis Set data fail:", err.message);
  }
}

async function redis_get(key) {
  return new Promise((resolve, reject) => {
    try {
      const result = redis_client.get(key);
      resolve(result);
    } catch (err) {
      console.log("Redis Set data fail:", err.message);
      reject(err);
    }
  });
}

const MQTT_SERVER = server_config.mqtt.hostname;
const MQTT_PORT = server_config.mqtt.port;
const MQTT_USER = server_config.mqtt.username;
const MQTT_PASSWORD = server_config.mqtt.password;
var mqttClient = mqtt.connect({
  host: MQTT_SERVER,
  port: MQTT_PORT,
  username: MQTT_USER,
  password: MQTT_PASSWORD,
});

mqttClient.on("connect", function () {
  console.log("MQTT Connect");
  device_list.forEach((device_id) => {
    const subscriber_topic = `/${hotel_name}/${device_id}`;
    console.log(`subscribe on `,subscriber_topic);
    mqttClient.subscribe(subscriber_topic, function (err) {
      if (err) {
        console.log("Mqtt Connection error:", err);
      }
    });
  });
});

const dbName = server_config.mongodb.dbName;
const collection_device_sensor_value = "device_sensor_value";
const mongodb_client = new MongoClient(
  `mongodb://${server_config.mongodb.hostname}:${server_config.mongodb.port}`
);
console.log("Server Start");

async function insertDocument(collectionName, document) {
  try {
    await mongodb_client.connect();
    const db = mongodb_client.db(dbName);
    const collection = db.collection(collectionName);
    document.systime = moment()
      .tz("Asia/Bangkok")
      .format("YYYY-MM-DDTHH:mm:ss.SSSZZ");

    const dbRes = await collection.insertOne(document);
    let result = {
      httpStatus: 200,
      payload: `Inserted document with _id ${dbRes.insertedId} into collection was created successfully`,
    };
    return { statusCode: 201, body: result };
  } catch (err) {
    const result = {
      httpStatus: 500,
      payload: err.message,
    };
    return { statusCode: 500, body: result };
  } finally {
    await mongodb_client.close();
  }
}

/* APP */

/*

{ 
    device_id: "VARCHAR(30) NOT NULL", 
    hotel_id: "VARCHAR(12) NOT NULL", 
    room_name: "VARCHAR(50) NOT NULL", 
    floor: "VARCHAR(50) NOT NULL", 
    datapoint: "VARCHAR(30) NOT NULL",
    value: "VARCHAR(30) NOT NULL",  
  }
*/

const apiKey = 'HASH256+SALT';

async function send_data(data,apiKey) {
  const url = `http://${server_config.server.hostname}:${server_config.server.port}/device_data`
  console.log(`url `,url);
  try { 
     const res =  await axios.post(url, data,{
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });  
      console.log(res);
   
  } catch (error) {
    //console.log(error.message);
  }
}

mqttClient.on("message", (topic, message) => {
  try{ 
  device_list.forEach((device_id) => {
    if (topic == `/${hotel_name}/${device_id}`) {
      const thismessage = Buffer.from(message, "base64").toString("utf-8");
      let messageJson = JSON.parse(thismessage);
      const presence_state = messageJson.datapoint;
      console.log(topic, thismessage);
      if (presence_state.replace('"', "") == "presence_state") {
        const last_occupancy = redis_get(`${device_id}_last_occupancy_status`);
        const occupancy = messageJson.value.replace('"', "");
        if (last_occupancy != occupancy) {
          redis_set(`${device_id}_last_occupancy_status`, occupancy);
          /* Post To server occupancy was change*/
          send_data(messageJson,apiKey);
        }
      }else if(presence_state.replace('"', "") == "temperature"){
        const last_temperature = redis_get(`${device_id}_last_temperature_status`);
        const temperature = messageJson.value.replace('"', "");
        if (last_temperature != temperature) {
          redis_set(`${device_id}_last_temperature_status`, temperature);
          /* Post To server temperature was change*/
          send_data(messageJson,apiKey);
        }
      }
      /*
        Another parameter send only when value are changed 
      */
      insertDocument(collection_device_sensor_value, messageJson);
    }
  });}
  catch(err){
    //console.log(err.message);
  }
});
