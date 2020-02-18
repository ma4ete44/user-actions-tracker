import Fingerprint2 from 'fingerprintjs2';

const isServer = typeof window === 'undefined';
const isProduction = process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'production';
const DELAY = 500;
const EVENT_NAME = 'identification_fingerprint';
const ATTRIBUTE_NAME = 'data-fingerprint';
const FINGERPRINT_SAVED_OPTIONS = '__FINGERPRINT_SAVED_OPTIONS__';

const UserAction = {
  Click: 'userClick',
  Transition: 'userTransition',
};

/**
 * Obtaining a hash based on the main components of fingerprint.
 * @param components List of common components for fingerprint.
 * @returns {string} The resulting hash.
 */
function getHash(components = {}) {
  const values = components.map((component) => { return component.value; });
  return Fingerprint2.x64hash128(values.join(''), 31);
}

/**
 * Preparation of data for fingerprint.
 * @param {Object[]} components List of common components for fingerprint.
 * @returns {Object} Prepared data.
 */
function prepareFingerprint(components) {
  const { customOptions } = getSavedOptions();
  const eventName = customOptions ? customOptions.eventName || EVENT_NAME : EVENT_NAME;
  let includedComponents = [];

  if (Array.isArray(customOptions && customOptions.include)) {
    includedComponents = components.filter((item) => {
      return customOptions.include.includes(item.key);
    });
  }

  const reducedComponents = includedComponents.reduce((res, item) => {
    return {
      ...res,
      [item.key]: item.value,
    };
  }, {});
  return {
    ...reducedComponents,
    event: eventName,
    fingerprint_hash: getHash(components),
  };
}

function getData(options, resolve) {
  Fingerprint2.get({ ...options }, (components) => {
    resolve(prepareFingerprint(components));
  });
}

/**
 * Getting fingerprint.
 * @param {Object} options List of options.
 * @returns {Promise<Object>} Object of fingerprint.
 */
function getFingerprint(options = {}) {
  return new Promise((resolve) => {
    if (window.requestIdleCallback) {
      requestIdleCallback(() => {
        getData(options, resolve);
      });
    } else {
      setTimeout(() => {
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
  const attributeNames = event.target.getAttributeNames()
    .filter((item) => item.includes(ATTRIBUTE_NAME));
  let additionalInfo = {};
  if (attributeNames.length > 0) {
    attributeNames.forEach((name) => {
      const hasPostfix = name.length > ATTRIBUTE_NAME.length + 1;
      if (hasPostfix) {
        const attribute = event.target.getAttribute(name);
        const hasData = attribute !== 'true' && attribute !== 'false';
        if (hasData) {
          const postfix = name.slice(ATTRIBUTE_NAME.length + 1);
          additionalInfo = {
            ...additionalInfo,
            [postfix]: attribute,
          };
        }
      }
    });

    const info = {
      ...additionalInfo,
      content: event.target.textContent,
      element: event.target.tagName,
      location: window.location.href,
    };
    addEvent({
      [UserAction.Click]: info,
    });
  }
}

/**
 * Logging of fingerprint.
 * @param {Object} data Summary information for logging.
 * @param {Object} userOptions Custom data object.
 */
function log(data, userOptions = {}) {
  try {
    const convertedData = JSON.stringify({ ...data, ...userOptions });
    const { customOptions } = getSavedOptions();
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
  const { pushState } = window.history;
  window.history.pushState = (state, ...rest) => {
    if (typeof window.history.onpushstate === 'function') {
      window.history.onpushstate({ state });
    }

    addEvent({
      [UserAction.Transition]: state.url,
    });

    return pushState.apply(window.history, [state, ...rest]);
  };
}

/**
 * Adding common listeners.
 */
function addEventListeners() {
  const { customOptions } = getSavedOptions();

  if (customOptions && Array.isArray(customOptions.userActions)) {
    customOptions.userActions.forEach((action) => {
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
    message: data,
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(getLogFormat(data)),
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
function init(options = {}, customOptions = {}) {
  if (isServer) {
    return;
  }

  if (!window[FINGERPRINT_SAVED_OPTIONS]) {
    window[FINGERPRINT_SAVED_OPTIONS] = {
      options,
      customOptions,
    };
  }

  const { options: globalOptions } = getSavedOptions();

  addEventListeners();

  getFingerprint(globalOptions).then((data) => {
    log(data);
  });
}

/**
 * Adding custom data.
 * @param {Object} userOptions Custom data object.
 */
function addEvent(userOptions) {
  const { options } = getSavedOptions();
  getFingerprint(options).then((data) => {
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


export default {
  init,
  addEvent,
};
