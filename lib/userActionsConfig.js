"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es7.object.get-own-property-descriptors");

require("core-js/modules/es6.symbol");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.iterator");

require("core-js/modules/es6.object.keys");

require("core-js/modules/es6.promise");

require("core-js/modules/es6.object.to-string");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

require("core-js/modules/es7.array.includes");

require("core-js/modules/es6.string.includes");

var _fingerprintjs = _interopRequireDefault(require("fingerprintjs2"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var isServer = typeof window === 'undefined';
var isProduction = process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'production';
var DELAY = 500;
var EVENT_NAME = 'identification_fingerprint';
var ATTRIBUTE_NAME = 'data-fingerprint';
var FINGERPRINT_SAVED_OPTIONS = '__FINGERPRINT_SAVED_OPTIONS__';
var UserAction = {
  Click: 'userClick',
  Transition: 'userTransition'
};
/**
 * Obtaining a hash based on the main components of fingerprint.
 * @param components List of common components for fingerprint.
 * @returns {string} The resulting hash.
 */

function getHash() {
  var components = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var values = components.map(function (component) {
    return component.value;
  });
  return _fingerprintjs.default.x64hash128(values.join(''), 31);
}
/**
 * Preparation of data for fingerprint.
 * @param {Object[]} components List of common components for fingerprint.
 * @returns {Object} Prepared data.
 */


function prepareFingerprint(components) {
  var _getSavedOptions = getSavedOptions(),
      customOptions = _getSavedOptions.customOptions;

  var eventName = customOptions ? customOptions.eventName || EVENT_NAME : EVENT_NAME;
  var includedComponents = [];

  if (Array.isArray(customOptions && customOptions.include)) {
    includedComponents = components.filter(function (item) {
      return customOptions.include.includes(item.key);
    });
  }

  var reducedComponents = includedComponents.reduce(function (res, item) {
    return _objectSpread({}, res, (0, _defineProperty2.default)({}, item.key, item.value));
  }, {});
  return _objectSpread({}, reducedComponents, {
    event: eventName,
    fingerprint_hash: getHash(components)
  });
}

function getData(options, resolve) {
  _fingerprintjs.default.get(_objectSpread({}, options), function (components) {
    resolve(prepareFingerprint(components));
  });
}
/**
 * Getting fingerprint.
 * @param {Object} options List of options.
 * @returns {Promise<Object>} Object of fingerprint.
 */


function getFingerprint() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return new Promise(function (resolve) {
    if (window.requestIdleCallback) {
      requestIdleCallback(function () {
        getData(options, resolve);
      });
    } else {
      setTimeout(function () {
        getData(options, resolve);
      }, DELAY);
    }
  });
}
/**
 * User action handler.
 * @param {Event} event
 */


function userActionHandle(event) {
  var attributeNames = event.target.getAttributeNames().filter(function (item) {
    return item.includes(ATTRIBUTE_NAME);
  });
  var additionalInfo = {};

  if (attributeNames.length > 0) {
    attributeNames.forEach(function (name) {
      var hasPostfix = name.length > ATTRIBUTE_NAME.length + 1;

      if (hasPostfix) {
        var attribute = event.target.getAttribute(name);
        var hasData = attribute !== 'true' && attribute !== 'false';

        if (hasData) {
          var postfix = name.slice(ATTRIBUTE_NAME.length + 1);
          additionalInfo = _objectSpread({}, additionalInfo, (0, _defineProperty2.default)({}, postfix, attribute));
        }
      }
    });

    var info = _objectSpread({}, additionalInfo, {
      content: event.target.textContent,
      element: event.target.tagName,
      location: window.location.href
    });

    addEvent((0, _defineProperty2.default)({}, UserAction.Click, info));
  }
}
/**
 * Logging of fingerprint.
 * @param {Object} data Summary information for logging.
 * @param {Object} userOptions Custom data object.
 */


function log(data) {
  var userOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  try {
    var convertedData = JSON.stringify(_objectSpread({}, data, {}, userOptions));

    var _getSavedOptions2 = getSavedOptions(),
        customOptions = _getSavedOptions2.customOptions;

    if (isProduction && customOptions && customOptions.url) {
      makeRequest(customOptions.url, convertedData);
    } else {
      // eslint-disable-next-line no-console
      console.log(getLogFormat(convertedData));
    }
  } catch (e) {
    console.error(e);
  }
}
/**
 * Link click handler.
 */


function userTransferHandle() {
  var pushState = window.history.pushState;

  window.history.pushState = function (state) {
    if (typeof window.history.onpushstate === 'function') {
      window.history.onpushstate({
        state: state
      });
    }

    addEvent((0, _defineProperty2.default)({}, UserAction.Transition, state.url));

    for (var _len = arguments.length, rest = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    return pushState.apply(window.history, [state].concat(rest));
  };
}
/**
 * Adding common listeners.
 */


function addEventListeners() {
  var _getSavedOptions3 = getSavedOptions(),
      customOptions = _getSavedOptions3.customOptions;

  if (customOptions && Array.isArray(customOptions.userActions)) {
    customOptions.userActions.forEach(function (action) {
      if (action === 'transition') {
        userTransferHandle();
      }

      document.addEventListener(action, userActionHandle);
    });
  }
}
/**
 * Getting a common format for logging.
 * @param {string} data Summary information for logging.
 * @returns {{level: string, message: string}} Logged format.
 */


function getLogFormat(data) {
  return {
    level: 'info',
    message: data
  };
}
/**
 * Function of request.
 * @param {string} url Address for logging.
 * @param {string} data Summary information for logging.
 * @returns {Promise<void>}
 */


function makeRequest(url, data) {
  try {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(getLogFormat(data))
    });
  } catch (e) {
    console.error(e);
  }
}
/**
 * Initialization of fingerprint.
 * @param {Object} options List of options (look at https://github.com/Valve/fingerprintjs2)
 * @param {Object} customOptions List of custom options. For example, for
 * inclusion of certain attributes you need to pass an object of the following form
 * {
 *   include: [
 *     'userAgent',
 *     'language'
 *   ]
 * }
 */


function init() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var customOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (isServer) {
    return;
  }

  if (!window[FINGERPRINT_SAVED_OPTIONS]) {
    window[FINGERPRINT_SAVED_OPTIONS] = {
      options: options,
      customOptions: customOptions
    };
  }

  var _getSavedOptions4 = getSavedOptions(),
      globalOptions = _getSavedOptions4.options;

  addEventListeners();
  getFingerprint(globalOptions).then(function (data) {
    log(data);
  });
}
/**
 * Adding custom data.
 * @param {Object} userOptions Custom data object.
 */


function addEvent(userOptions) {
  var _getSavedOptions5 = getSavedOptions(),
      options = _getSavedOptions5.options;

  getFingerprint(options).then(function (data) {
    log(data, userOptions);
  });
}
/**
 * Retrieving saved fingerprint options.
 * @returns {Object} Saved options.
 */


function getSavedOptions() {
  return window[FINGERPRINT_SAVED_OPTIONS] || {};
}

var _default = {
  init: init,
  addEvent: addEvent
};
exports.default = _default;