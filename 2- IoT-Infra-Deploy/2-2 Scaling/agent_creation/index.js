const kDebug = true;

const fs = require("fs");
const YAML = require("js-yaml");
const mqtt = require("mqtt");
const axios = require("axios");
const server_config = YAML.load(fs.readFileSync("./config.yaml"));

const AGENT_NAME = server_config.agent.agent_name;
const DEVICES_LIST = server_config.devices_list;  
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
  mqttClient.subscribe("test", function (err) {
    if (err) {
      console.log("Mqtt Connection error:", err);
    }
  });
});

async function fetch_data(room_properties) {
  try {
    const device_id_list = room_properties.device_id_list;
    device_id_list.forEach((device_id) => {
      axios
        .get(`http://${room_properties.hostname}:${room_properties.port}/${device_id}`)
        .then(function (response) {
          let data = JSON.stringify(response.data);
          data.hotel_id = server_config.agent.agent_id;
          data.room_name = room_properties.room_name;
          data.floor = room_properties.floor; 
          const topic = `/${AGENT_NAME}/${device_id}`;
          console.log(topic, data);
          mqttClient.publish(topic, data); 
        })
        .catch(function (error) {
          console.error(error); 
        });
    });
  } catch (error) {
    console.error(error); 
  }
}

setInterval(() => {
  DEVICES_LIST.forEach((room_properties) => {
    fetch_data(room_properties);
  });
}, 5000);
