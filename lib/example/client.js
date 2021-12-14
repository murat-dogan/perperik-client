"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = require("../main");
var client = new main_1.PerperikClient('wss://localhost:8080');
client.on('open', function () {
    client.sendPeerMessage('9j51tidinx-hpjcwm5jcj', { a: 12345 });
});
