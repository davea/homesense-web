(function(){

Vue.component('sensor', {
    props: ['id', 'name', 'type', 'value', 'active', 'target'],
    computed: {
        display_name: function() {
            return this.name ? this.name : this.id;
        },
        status: function() {
            if (this.active === undefined || this.active === null) {
                return "";
            }
            if (this.active === "1") {
                return "Heat to " + this.target + "°";
            } else {
                return "Off";
            }
        },
        classObject: function() {
            return {
                'sensor--active': this.active === "1"
            };
        },
    },
    template: `
        <div class="sensor" :class="classObject">
            <span v-if="!isNaN(value)" class="sensor__value" :title="value">{{ Math.round(value) }}&deg;</span>
            <span v-else class="sensor__value" :title="value">--</span>
            <span class="sensor__text sensor__text--name">{{ display_name }}</span>
            <span class="sensor__text sensor__text--status">{{ status }}</span>
        </div>
    `
});

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
    
}

function handleSensorMessage(topic, payload) {
    var parts = topic.split("/").slice(1);
    var type = parts.shift();
    var id = parts.shift();
    var key = parts.shift() || "value";
    var sensor = app.sensors[id] || {
        id: id,
        type: type,
        name: id.charAt(0).toUpperCase() + id.slice(1)
    };
    var value = "" + payload;
    if (key === "value") {
        value = parseFloat(value);
    }
    sensor[key] = value;
    app.$set(app.sensors, id, sensor);
}

var client = mqtt.connect("ws://localhost:9001");
client.subscribe("sensor/temperature/#");
client.subscribe("control/radiator/#");

client.on("message", function (topic, payload) {
    if (topic.split("/")[0] === "sensor") {
        handleSensorMessage(topic, payload);
    } else if (topic.split("/")[0] === "control") {
        handleControlMessage(topic, payload);
    }
});

})();