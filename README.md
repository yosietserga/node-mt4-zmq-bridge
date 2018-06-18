# node-mt4-zmq-bridge

Node.js and [MetaTrader 4](https://www.metatrader4.com/) communication bridge with [ZeroMQ](http://zeromq.org/).

This modules depends on this [MetaTrader 4 Expert Advisor](https://github.com/bonnevoyager/MetaTrader4-Bridge). Please introduce with it thoroughly before using this module.

## Installation

```
npm install --save mt4-zmq-bridge
```

## Usage

```js
const mt4zmqBridge = require('mt4-zmq-bridge');
```

mt4zmqBridge objects contains multiple enum properties and `connect` function.

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

It accepts any number of arguments.

First argument is always [request type](https://github.com/bonnevoyager/MetaTrader4-Bridge#request). Rest of the arguments must match with used request type (check [API](https://github.com/bonnevoyager/MetaTrader4-Bridge#api)).

Response can be returned either by a Callback or a Promise. To use Callback response, please provide a function as the last argument. Otherwise, a Promise will be returned.

Successfully returned response is an array (e.g. `[ '110.522000', '110.542000', 'USDJPY' ]`). Error response will return error object (e.g. `Error('Invalid price.')`).

###### Examples

Callback type "USDJPY" rates request:

```js
zmqBridge.request(mt4zmqBridge.REQUEST_RATES, "USDJPY", (err, res) => {
  console.log(res);     // [ '110.522000', '110.542000', 'USDJPY' ]
  console.log(res[0]);  // '110.522000' - market bid
  console.log(res[1]);  // '110.542000' - market ask
});
```

Promise type "USDJPY" rates request:

```js
zmqBridge.request(mt4zmqBridge.REQUEST_RATES, "USDJPY")
  .then(res => {
    console.log(res);   // [ '110.522000', '110.542000', 'USDJPY' ]
  })
  .catch(err => {})
```

[Buy limit](https://github.com/bonnevoyager/MetaTrader4-Bridge#trade-operations) order for "USDJPY".

```
zmqBridge.request(
  mt4zmqBridge.REQUEST_TRADE_OPEN,  // request type
  "USDJPY",                         // market symbol
  mt4zmqBridge.OP_BUYLIMIT,         // order type
  1.2,                              // volume
  105.23,                           // price
  0,                                // slippage
  100.10,                           // stop loss
  110.76,                           // take profit
  "evening trade",                  // comment
  0,                                // magic number
  mt4zmqBridge.UNIT_CONTRACTS       // unit type
, (err, res) => {
  console.log(res); // [ '140734412' ]
});
```

[Cancel](https://github.com/bonnevoyager/MetaTrader4-Bridge#api) pending order.

```
zmqBridge.request(mt4zmqBridge.REQUEST_TRADE_DELETE, 140734412).then(res => {
  console.log(res); // [ '140734412' ]
});
```

More examples can be found in index.spec.js.

#### zmqBridge.onReqMessage

A `function` handling messages from REQ server. It is an empty function by default.

#### zmqBridge.onPullMessage

A `function` handling messages from PULL server. It is an empty function by default.

#### zmqBridge.isWaitingForResponse

A `bool` telling us whether a request with specific id is still waiting for the response.

#### zmqBridge.reqConnected

A `bool` telling us whether connection with REQ server is open or not.

#### zmqBridge.pullConnected

A `bool` telling us whether connection with PULL server is open or not.

#### zmqBridge.reqSocket

An `object` containing [ZeroMQ REQ connection object](https://github.com/zeromq/zeromq.js/#examples-using-zeromq). Used mostly internally.

#### zmqBridge.pullSocket

An `object` containing [ZeroMQ PULL connection object](https://github.com/zeromq/zeromq.js/#examples-using-zeromq). Used mostly internally.

## Test

IMPORTANT: Some tests will open market order. Work with tests only on demo accounts!

```
npm run test
```

## License

[MIT](LICENSE)
