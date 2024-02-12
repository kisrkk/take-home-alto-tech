const kDebug = true;
const project_name = "alto_agent_test";
const fs = require("fs");
const YAML = require("js-yaml");
const mqtt = require("mqtt");
const axios = require("axios");
const server_config = YAML.load(fs.readFileSync("./config.yaml"));

const DEVICE_HOSTNAME = server_config.device.hostname;
const DEVICE_PORT = server_config.device.port;
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

async function fetch_data(device_id) { 
    try{
        axios
        .get(`http://${DEVICE_HOSTNAME}:${DEVICE_PORT}/${device_id}`)
        .then(function (response) {
          const data = JSON.stringify(response.data);
          const topic = `/${project_name}/${device_id}`;
          console.log(topic, data);
          mqttClient.publish(topic, data);
          return(response.data);
        })
        .catch(function (error) {
          console.error(error);
          return(error);
        });
    }catch(error){
        console.error(error);
        return(error);
    } 
}

setInterval(() => {
  fetch_data("life_being");
  fetch_data("iaq_sensor");
}, 5000);
