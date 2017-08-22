#!/usr/bin/env python3

import os
import asyncio
import logging

from sanic import Sanic
from sanic.response import json

from hbmqtt.client import MQTTClient, ClientException
from hbmqtt.mqtt.constants import QOS_0

# Relies on the following environment vars:
# MQTT_BROKER - A URL pointing at the MQTT broker, e.g. 'mqtt://127.0.0.1/'

MQTT_TOPICS = ["sensor/+/#"]

SENSOR_STATES = {}

log = logging.getLogger("homesense")
logging.basicConfig(level=logging.DEBUG)


app = Sanic(__name__)

app.static("/", "templates/index.html")
app.static("/static", "static")

@app.route("/sensors.json")
async def sensors(request):
    return json(SENSOR_STATES.values())


async def mqtt_loop():
    topics = [(topic, QOS_0) for topic in MQTT_TOPICS]
    ignore_retained = True
    client = MQTTClient()
    await client.connect(os.environ['MQTT_BROKER'])
    log.info("Connected")
    await client.subscribe(topics)
    log.info("Subscribed")
    try:
        while True:
            message = await client.deliver_message()
            packet = message.publish_packet
            if packet.retain_flag and ignore_retained:
                log.debug("Ignoring retained message")
                continue
            topic = packet.variable_header.topic_name
            payload = bytes(packet.payload.data)
            handle_message(topic, payload)
            log.debug(f"{topic}: {payload}")
        await client.unsubscribe(topics)
        await client.disconnect()
        log.info("Disconnected")
    except ClientException:
        log.exception("A client exception occurred.")


def handle_message(topic, payload):
    _, sensor_type, name = topic.split("/")
    SENSOR_STATES[topic] = {
        'topic': topic,
        'type': sensor_type,
        'name': name,
        'value': float(payload),
    }


def main():
    loop = asyncio.get_event_loop()
    server = app.create_server(host="0.0.0.0", port=8000, debug=True)
    loop.create_task(server)
    loop.create_task(mqtt_loop())
    loop.run_forever()


if __name__ == '__main__':
    main()
