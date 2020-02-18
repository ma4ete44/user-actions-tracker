# Logging user actions with fingerprint

## Installation

```bash
$ npm i @ma4ete44/user-actions-tracker
# or
$ yarn add @ma4ete44/user-actions-tracker
```

## Usage

First of all, you need to initialize this library.
Note!!! You should initialize it once and globally.

```js
import { init } from '@ma4ete44/user-actions-tracker';

init();
```

You can add extra options, i.e:

```js
import { init } from '@ma4ete44/user-actions-tracker';

init({}, {
  include: [
    'userAgent',
    'language',
    'timezone',
    'plugins',
    'timezoneOffset',
    'screenResolution',
    'platform',
  ],
  userActions: [
      'click',
      'transition',
    ],
  eventName: 'myEvent',
  url: `http://some-url.com`,
});
```
The first options' object is a default options of fingerprintjs2 library. See the
[documentation](https://github.com/Valve/fingerprintjs2).

The second options' object is a custom object where you can set some options such as:

1. include is array of options what you want to include to final object (see above example).
2. userActions is an array of events which you want to log.
3. eventName is a custom event name ('identification_fingerprint' is default name).
4. url - is an address to log your fingerprint object. (logs to the console by default).
 

Also, to catch user click you need to add attribute 'data-fingerprint' to your element,
or add 'data-fingerprint-*' mask to add extra data
#### Example
```html
<button data-fingerprint>My button</button>

or

<button data-fingerprint-my-custom-field="some value">My button</button>
```

and a total object of fingerprint will be:
```bash

{
  ... //some fields
  my-custom-field: 'some value',
  event: 'identification_fingerprint',
  fingerprint_hash: '14776fb615bfcb9c26a121d27895542e',
  ...
}

```

 
## Adding your events
You can import 'log' functions and add your event to log them.
```js
import { addEvent } from '@ma4ete44/user-actions-tracker';

someFunction(){
  
  addEvent({eventName: 'my value'})

}
```

## List of default options
```bash
'userAgent'
'webdriver'
'language'
'colorDepth'
'deviceMemory'
'hardwareConcurrency'
'screenResolution',
'availableScreenResolution',
'timezoneOffset'
'timezone'
'sessionStorage'
'localStorage'
'indexedDb'
'addBehavior'
'openDatabase'
'cpuClass'
'platform',
'plugins'
'canvas'
'webgl'
'webglVendorAndRenderer'
'adBlock'
'hasLiedLanguages'
'hasLiedResolution'
'hasLiedOs'
'hasLiedBrowser'
'touchSupport'
'fonts'
'audio'
```

