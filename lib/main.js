"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerperikClient = void 0;
var events_1 = require("events");
var ws = require("ws");
var PerperikClient = /** @class */ (function (_super) {
    __extends(PerperikClient, _super);
    function PerperikClient(serverAddress, options) {
        var _this = _super.call(this) || this;
        _this.name = '__UNKNOWN__';
        _this.wsClient = new ws(serverAddress, options);
        _this.wsClient.on('open', function () {
            console.log('open');
            _this.emit('open');
        });
        _this.wsClient.on('close', function (code, reason) {
            console.log('close');
            _this.emit('close', code, reason);
        });
        _this.wsClient.on('error', function (err) {
            console.log(err);
            _this.emit('error', err);
        });
        _this.wsClient.on('message', function (data) {
            console.log(data.toString());
            try {
                var msg = JSON.parse(data.toString());
                if (!msg || !msg.type) {
                    _this.emit('error', "Wrong message format. Received: ".concat(JSON.stringify(msg || {})));
                    return;
                }
                switch (msg.type) {
                    case 'welcome':
                        _this.name = msg.clientName;
                        break;
                    case 'server-error':
                        _this.emit('server-error', msg.errMsg, msg.info);
                        break;
                    case 'peer-msg':
                        _this.emit('peer-msg', msg.peerName, msg.payload);
                        break;
                    default:
                        _this.emit('error', "Unknown message type. Received: ".concat(JSON.stringify(msg)));
                        return;
                }
            }
            catch (err) {
                _this.emit('error', err);
            }
        });
        return _this;
    }
    PerperikClient.prototype.getName = function () {
        return this.name;
    };
    PerperikClient.prototype.isOpen = function () {
        return this.wsClient.readyState == ws.WebSocket.OPEN;
    };
    PerperikClient.prototype.sendPeerMessage = function (peerName, payload) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.wsClient.readyState !== ws.WebSocket.OPEN) {
                return reject(new Error('Socket does not seem open'));
            }
            var msg = { type: 'peer-msg', peerName: peerName, payload: payload };
            _this.wsClient.send(JSON.stringify(msg), function (err) {
                if (err)
                    return reject(err);
                return resolve(true);
            });
        });
    };
    return PerperikClient;
}(events_1.EventEmitter));
exports.PerperikClient = PerperikClient;
