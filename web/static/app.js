(function(){

Vue.component('sensor', {
    props: ['id', 'name', 'type', 'value', 'active', 'target', 'heating'],
    computed: {
        status: function() {
            if (this.active === undefined || this.active === null) {
                return "";
            }
            if (this.heating) {
                return "Heating to " + this.target + "°";
            } else if (this.active) {
                return "Heat to " + this.target + "°";
            } else {
                return "Off";
            }
        },
        classObject: function() {
            return {
                'sensor--active': this.active,
                'sensor--heating': this.heating
            };
        },
    },
    methods: {
        clicked: function () {
            console.log(this);
        }
    },
    template: `
        <div class="sensor" :class="classObject" v-on:click="clicked">
            <span v-if="!isNaN(value)" class="sensor__value">{{ Math.round(value) }}&deg;</span>
            <span v-else class="sensor__value">--</span>
            <span class="sensor__text sensor__text--name">{{ name }}</span>
            <span class="sensor__text sensor__text--status">{{ status }}</span>
        </div>
    `
});

Vue.component('thermostat', {
    props: ['sensor'],
    template: `
        <div class="thermostat">
            <h1>{{ sensor.name }}</h1>
            <span class="thermostat__value">{{ Math.round(sensor.value) }}&deg;</span>
            <span class="thermostat__text thermostat__text--status">{{ sensor.status }}</span>
        </div>
    `
})

var app = new Vue({
    el: '#app',
    data: function() {
        return {
            sensors: {}
        };
    },
    computed: {
        sorted_sensors: function() {
            var sensors = Object.values(this.sensors);
            sensors.sort(function(a, b) {
                a = a.name || a.id || "a";
                b = b.name || b.id || "b";
                return a.localeCompare(b);
            });
            return sensors;
        }
    }
});

function handleControlMessage(topic, payload) {
    var id = topic.split("/")[2];
    var heating = ("" + payload) === "1";
    updateSensor(id, {heating: heating});
}

function handleSensorMessage(topic, payload) {
    var parts = topic.split("/").slice(1);
    var type = parts.shift();
    var id = parts.shift();
    var key = parts.shift() || "value";
    var value = "" + payload; // Convert from Bytes
    if (key === "value" || key === "target") {
        value = parseFloat(value);
    } else if (key === "active") {
        value = ("" + payload) === "1";
    }

    var sensor = {
        id: id,
        type: type,
        name: sensorName(id)
    };
    sensor[key] = value;

    updateSensor(id, sensor);
}

function updateSensor(id, values) {
    var sensor = app.sensors[id] || {};
    app.$set(app.sensors, id, Object.assign({}, sensor, values));
}

function handleCentralHeatingMessage(topic, payload) {
    var active = ("" + payload) === "1";
    homesense.config.fixed_rooms.forEach(id => {
        updateSensor(id, {heating: active});
    });
}

function sensorName(id) {
    return homesense.config.name_overrides[id] || id.charAt(0).toUpperCase() + id.slice(1);
}

var client = mqtt.connect(homesense.config.mqtt_broker, homesense.config.auth);
homesense.config.topics.forEach(topic => {
    client.subscribe(topic);
});

client.on("message", function (topic, payload) {
    if (topic === "control/centralheating/active") {
        handleCentralHeatingMessage(topic, payload);
    } else if (topic.split("/")[0] === "sensor") {
        handleSensorMessage(topic, payload);
    } else if (topic.split("/")[0] === "control") {
        handleControlMessage(topic, payload);
    }
});

})();