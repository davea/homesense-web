(function() {
    var protocol = location.protocol === "https:" ? "wss://" : "ws://";
    var mqtt_broker = protocol + location.host + "/";
    var config = {
        topics: [
            "sensor/temperature/#",
            "control/radiator/+/active",
            "control/centralheating/active",
        ],
        name_overrides: {
            'livingroom': "Living Room",
            'spareroom': "Spare Room"
        },
        fixed_rooms: ["office"],
        // mqtt_broker: "ws://127.0.0.1:8080/",
        mqtt_broker: mqtt_broker,
    };

    window.homesense = {config: config};

})();