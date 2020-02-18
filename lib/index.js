"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addEvent = exports.init = exports.default = void 0;

var _userActionsConfig = _interopRequireDefault(require("./userActionsConfig"));

var _default = _userActionsConfig.default;
exports.default = _default;
var init = _userActionsConfig.default.init;
exports.init = init;
var addEvent = _userActionsConfig.default.addEvent;
exports.addEvent = addEvent;