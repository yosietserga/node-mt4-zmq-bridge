# node-mt4-zmq-bridge

Node.js and [MetaTrader 4](https://www.metatrader4.com/) communication bridge with [ZeroMQ](http://zeromq.org/).

This module depends on this [MetaTrader 4 Expert Advisor](https://github.com/bonnevoyager/MetaTrader4-Bridge). Please introduce with it thoroughly before using this module.

## Installation

```
npm install --save yosietserga/mt4-zmq-bridge
```

## Usage

```js
const mt4zmqBridge = require('mt4-zmq-bridge');
```

mt4zmqBridge objects contain multiple enum properties and `connect` function.

Please refer to mentioned [MetaTrader 4 Expert Advisor](https://github.com/bonnevoyager/MetaTrader4-Bridge#request) for enum types.

### mt4zmqBridge.connect

A `function` accepting two arguments:  
&nbsp;&nbsp;&nbsp;&nbsp;`reqUrl` URL to REQ server  
&nbsp;&nbsp;&nbsp;&nbsp;`pullUrl` URL to PULL server

###### Example

```js
const zmqBridge = mt4zmqBridge.connect('tcp://127.0.0.1:5555', 'tcp://127.0.0.1:5556');
```

It returns connection bridge object.

#### zmqBridge.request

A `function` used to send [requests](https://github.com/bonnevoyager/MetaTrader4-Bridge#request) to [MetaTrader 4 Expert Advisor]((https://github.com/bonnevoyager/MetaTrader4-Bridge)).

It accepts any number of arguments. Request messages will be queued and have a timeout of 15 seconds by default. Timeout value can be set with `zmqBridge.setRequestTimeoutValue`.

The first argument is always [request type](https://github.com/bonnevoyager/MetaTrader4-Bridge#request). The rest of the arguments must match with used request type (check [API](https://github.com/bonnevoyager/MetaTrader4-Bridge#api)).

A response can be returned either by a Callback or a Promise. To use Callback response, please provide a function as the last argument. Otherwise, a Promise will be returned.

Successfully returned response is an array (e.g. `[ '110.522000', '110.542000', 'USDJPY' ]`). Error response will return error object (e.g. `Error('Invalid price.')`).

###### Examples

Callback type "USDJPY" rates request:

```js
zmqBridge.request(mt4zmqBridge.REQUEST_RATES, 'USDJPY', (err, res) => {
  console.log(res);     // [ '110.522000', '110.542000', 'USDJPY' ]
  console.log(res[0]);  // '110.522000' - market bid
  console.log(res[1]);  // '110.542000' - market ask
});
```

Promise type "USDJPY" rates request:

```js
zmqBridge.request(mt4zmqBridge.REQUEST_RATES, 'USDJPY')
  .then(res => {
    console.log(res);   // [ '110.522000', '110.542000', 'USDJPY' ]
  })
  .catch(err => {})
```

More examples can be found in index.spec.js.

#### zmqBridge.onReqMessage

A `function` handling messages from REQ server. It is an empty function by default.

#### zmqBridge.onPullMessage

A `function` handling messages from PULL server. It is an empty function by default.

#### zmqBridge.isWaitingForResponse

A `bool` telling us whether a request with a specific id is still waiting for the response.

#### zmqBridge.reqConnected

A `bool` telling us whether a connection with REQ server is open or not.

#### zmqBridge.pullConnected

A `bool` telling us whether a connection with PULL server is open or not.

#### zmqBridge.reqSocket

An `object` containing [ZeroMQ REQ connection object](https://github.com/zeromq/zeromq.js/#examples-using-zeromq). Used mostly internally.

#### zmqBridge.pullSocket

An `object` containing [ZeroMQ PULL connection object](https://github.com/zeromq/zeromq.js/#examples-using-zeromq). Used mostly internally.

#### zmqBridge.setRequestTimeoutValue

`function` allowing to set a request timeout in miliseconds. The default request timeout is 15 seconds.

```
zmqBridge.setRequestTimeoutValue(30000);
```

## Test

IMPORTANT: Some tests will open real market orders. Work with tests only on demo accounts!

```
npm run test
```

## Changelog

[CHANGELOG.md](https://github.com/BonneVoyager/node-mt4-zmq-bridge/blob/master/CHANGELOG.md)

## License

[MIT](LICENSE)
