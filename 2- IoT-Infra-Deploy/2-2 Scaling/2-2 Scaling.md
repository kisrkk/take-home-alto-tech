---
runme:
  id: 01HPG7FS2J2R89PSTAAS8E46ZM
  version: v2.2
---

# Scaling

To scale the project can be done by config in agent_creation/config.yaml

#### To add floor and room in agent configuration

For every hotel, you may set the hotel_name and hotel_id and add room details under device_list.

```yaml {"id":"01HPG8753R0X5TPAZ3AQDSAE16"}
agent:
  agent_name: "hotel_1"
  agent_id: 990000001
devices_list:
  - room_name: "101"
    hostname: "localhost"
    port: 21000
    floor: "1"
    device_id_list: ["life_being", "iaq_sensor"]
  - room_name: "102"
    hostname: "localhost"
    port: 22000
    floor: "1"
    device_id_list: ["life_being_102", "iaq_sensor_102"]

```

#### To initialize data logger each hotel can be done by config in data_logger/config.yaml

Add only device_id in array under hotel

```yaml {"id":"01HPG8753TC2EZSH6XBEBA253C"}
hotel:
  hotel_name: "hotel_1"
  device_list: ["life_being", "iaq_sensor"]

```