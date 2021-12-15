"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = require("../main");
var client = new main_1.PerperikClient('123456', 'wss://localhost:8080');
client.on('open', function () {
    setInterval(function () {
        client.isPeerOnline('123456', function (error, result) {
            console.log(error, result);
        });
    }, 1000);
});
