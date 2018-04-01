(function() {
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
        mqtt_broker: "ws://localhost:9001",
    };

    window.homesense = {config: config};

})();