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
var nanoid_1 = require("nanoid");
var PerperikClient = /** @class */ (function (_super) {
    __extends(PerperikClient, _super);
    function PerperikClient(id, serverAddress, options, wsOptions) {
        var _this = _super.call(this) || this;
        _this.id = '';
        _this.timeoutInMS = 5000;
        // is-peer-online query cbs
        _this.queryIsOnlineCBList = {};
        // Options
        if (options) {
            if (options.timeoutInMS)
                _this.timeoutInMS = options.timeoutInMS;
        }
        // construct server url
        var serverUrl = serverAddress;
        if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://'))
            serverUrl = 'ws://' + serverUrl;
        if (id)
            serverUrl += "?id=".concat(id);
        // create ws
        console.log(serverUrl);
        _this.wsClient = new ws(serverUrl, wsOptions);
        _this.wsClient.on('open', function () {
            _this.emit('open');
        });
        _this.wsClient.on('close', function (code, reason) {
            _this.emit('close', code, reason);
        });
        _this.wsClient.on('error', function (err) {
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
                        _this.handleWelcomeMessage(msg);
                        break;
                    case 'server-error':
                        _this.handleServerErrorMessage(msg);
                        break;
                    case 'peer-msg':
                        _this.handlePeerMessage(msg);
                        break;
                    case 'server-query':
                        _this.handleQueryMessage(msg);
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
    PerperikClient.prototype.getId = function () {
        return this.id;
    };
    PerperikClient.prototype.isOpen = function () {
        return this.wsClient.readyState == ws.WebSocket.OPEN;
    };
    PerperikClient.prototype.isPeerOnline = function (peerID, cb) {
        var _this = this;
        if (this.wsClient.readyState !== ws.WebSocket.OPEN) {
            return cb(new Error('Socket does not seem open'));
        }
        var msg = {
            type: 'server-query',
            query: 'is-peer-online',
            queryRef: (0, nanoid_1.nanoid)(),
            peerID: peerID,
        };
        this.wsClient.send(JSON.stringify(msg), function (err) {
            if (err)
                return cb(err);
            // save cb for future call
            _this.queryIsOnlineCBList[msg.queryRef] = cb;
            // start timeout counter
            setTimeout(function () {
                // if cb not called, call it with error
                if (_this.queryIsOnlineCBList[msg.queryRef]) {
                    cb(new Error('Timeout'));
                    delete _this.queryIsOnlineCBList[msg.queryRef];
                }
            }, _this.timeoutInMS);
        });
    };
    PerperikClient.prototype.sendPeerMessage = function (peerID, payload) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.wsClient.readyState !== ws.WebSocket.OPEN) {
                return reject(new Error('Socket does not seem open'));
            }
            var msg = { type: 'peer-msg', peerID: peerID, payload: payload };
            _this.wsClient.send(JSON.stringify(msg), function (err) {
                if (err)
                    return reject(err);
                return resolve(true);
            });
        });
    };
    PerperikClient.prototype.handleWelcomeMessage = function (msg) {
        this.id = msg.id;
    };
    PerperikClient.prototype.handleServerErrorMessage = function (msg) {
        this.emit('server-error', msg.errMsg, msg.info);
    };
    PerperikClient.prototype.handlePeerMessage = function (msg) {
        this.emit('peer-msg', msg.peerID, msg.payload);
    };
    PerperikClient.prototype.handleQueryMessage = function (msg) {
        if (!msg.query) {
            this.emit('error', "Invalid server-query type. Received: ".concat(JSON.stringify(msg)));
            return;
        }
        switch (msg.query) {
            case 'is-peer-online':
                if (msg.queryRef && this.queryIsOnlineCBList[msg.queryRef]) {
                    this.queryIsOnlineCBList[msg.queryRef](null, msg.result);
                    delete this.queryIsOnlineCBList[msg.queryRef];
                }
                break;
            default:
                this.emit('error', "Unknown server-query type. Received: ".concat(JSON.stringify(msg)));
                return;
        }
    };
    return PerperikClient;
}(events_1.EventEmitter));
exports.PerperikClient = PerperikClient;
