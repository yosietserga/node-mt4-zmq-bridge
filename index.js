const events = require('events')
const url = require('url')
const zmq = require('zeromq')

// Identificators for internal request operations.
const REQUEST_PING = 1
const REQUEST_TRADE_OPEN = 11
const REQUEST_TRADE_MODIFY = 12
const REQUEST_TRADE_DELETE = 13
const REQUEST_DELETE_ALL_PENDING_ORDERS = 21
const REQUEST_CLOSE_MARKET_ORDER = 22
const REQUEST_CLOSE_ALL_MARKET_ORDERS = 23
const REQUEST_RATES = 31
const REQUEST_ACCOUNT = 41
const REQUEST_ORDERS = 51

// Identificators for internal response operations.
const RESPONSE_OK = 0
const RESPONSE_FAILED = 1

// Identificators for internal unit types.
const UNIT_CONTRACTS = 0
const UNIT_CURRENCY = 1

// See: https://docs.mql4.com/constants/tradingconstants/orderproperties
const OP_BUY = 0
const OP_SELL = 1
const OP_BUYLIMIT = 2
const OP_SELLLIMIT = 3
const OP_BUYSTOP = 4
const OP_SELLSTOP = 5

// See: https://book.mql4.com/appendix/errors
const ERROR_CODES = {
  // Error codes returned from a trade server or client terminal:
  0: [ "No error returned.", "ERR_NO_ERROR" ],
  1: [ "No error returned", "ERR_NO_RESULT" ],
  2: [ "Common error.", "ERR_COMMON_ERROR" ],
  3: [ "Invalid trade parameters.", "ERR_INVALID_TRADE_PARAMETERS" ],
  4: [ "Trade server is busy.", "ERR_SERVER_BUSY" ],
  5: [ "Old version of the client terminal.", "ERR_OLD_VERSION" ],
  6: [ "No connection with trade server.", "ERR_NO_CONNECTION" ],
  7: [ "Not enough rights.", "ERR_NOT_ENOUGH_RIGHTS" ],
  8: [ "Too frequent requests.", "ERR_TOO_FREQUENT_REQUESTS" ],
  9: [ "Malfunctional trade operation.", "ERR_MALFUNCTIONAL_TRADE" ],
  64: [ "Account disabled.", "ERR_ACCOUNT_DISABLED" ],
  65: [ "Invalid account.", "ERR_INVALID_ACCOUNT" ],
  128: [ "Trade timeout.", "ERR_TRADE_TIMEOUT" ],
  129: [ "Invalid price.", "ERR_INVALID_PRICE" ],
  130: [ "Invalid stops.", "ERR_INVALID_STOPS" ],
  131: [ "Invalid trade volume.", "ERR_INVALID_TRADE_VOLUME" ],
  132: [ "Market is closed.", "ERR_MARKET_CLOSED" ],
  133: [ "Trade is disabled.", "ERR_TRADE_DISABLED" ],
  134: [ "Not enough money.", "ERR_NOT_ENOUGH_MONEY" ],
  135: [ "Price changed.", "ERR_PRICE_CHANGED" ],
  136: [ "Off quotes.", "ERR_OFF_QUOTES" ],
  137: [ "Broker is busy.", "ERR_BROKER_BUSY" ],
  138: [ "Requote.", "ERR_REQUOTE" ],
  139: [ "Order is locked.", "ERR_ORDER_LOCKED" ],
  140: [ "Long positions only allowed.", "ERR_LONG_POSITIONS_ONLY_ALLOWED" ],
  141: [ "Too many requests.", "ERR_TOO_MANY_REQUESTS" ],
  145: [ "Modification denied because an order is too close to market.", "ERR_TRADE_MODIFY_DENIED" ],
  146: [ "Trade context is busy.", "ERR_TRADE_CONTEXT_BUSY" ],
  147: [ "Expirations are denied by broker.", "ERR_TRADE_EXPIRATION_DENIED" ],
  148: [ "The amount of opened and pending orders has reached the limit set by a broker.", "ERR_TRADE_TOO_MANY_ORDERS" ],
  // MQL4 run time error codes:
  4000: [ "No error.", "ERR_NO_MQLERROR" ],
  4001: [ "Wrong function pointer.", "ERR_WRONG_FUNCTION_POINTER" ],
  4002: [ "Array index is out of range.", "ERR_ARRAY_INDEX_OUT_OF_RANGE" ],
  4003: [ "No memory for function call stack.", "ERR_NO_MEMORY_FOR_FUNCTION_CALL_STACK" ],
  4004: [ "Recursive stack overflow.", "ERR_RECURSIVE_STACK_OVERFLOW" ],
  4005: [ "Not enough stack for parameter.", "ERR_NOT_ENOUGH_STACK_FOR_PARAMETER" ],
  4006: [ "No memory for parameter string.", "ERR_NO_MEMORY_FOR_PARAMETER_STRING" ],
  4007: [ "No memory for temp string.", "ERR_NO_MEMORY_FOR_TEMP_STRING" ],
  4008: [ "Not initialized string.", "ERR_NOT_INITIALIZED_STRING" ],
  4009: [ "Not initialized string in an array.", "ERR_NOT_INITIALIZED_ARRAYSTRING" ],
  4010: [ "No memory for an array string.", "ERR_NO_MEMORY_FOR_ARRAYSTRING" ],
  4011: [ "Too long string.", "ERR_TOO_LONG_STRING" ],
  4012: [ "Remainder from zero divide.", "ERR_REMAINDER_FROM_ZERO_DIVIDE" ],
  4013: [ "Zero divide.", "ERR_ZERO_DIVIDE" ],
  4014: [ "Unknown command.", "ERR_UNKNOWN_COMMAND" ],
  4015: [ "Wrong jump.", "ERR_WRONG_JUMP" ],
  4016: [ "Not initialized array.", "ERR_NOT_INITIALIZED_ARRAY" ],
  4017: [ "DLL calls are not allowed.", "ERR_DLL_CALLS_NOT_ALLOWED" ],
  4018: [ "Cannot load library.", "ERR_CANNOT_LOAD_LIBRARY" ],
  4019: [ "Cannot call function.", "ERR_CANNOT_CALL_FUNCTION" ],
  4020: [ "EA function calls are not allowed.", "ERR_EXTERNAL_EXPERT_CALLS_NOT_ALLOWED" ],
  4021: [ "Not enough memory for a string returned from a function.", "ERR_NOT_ENOUGH_MEMORY_FOR_RETURNED_STRING" ],
  4022: [ "System is busy.", "ERR_SYSTEM_BUSY" ],
  4050: [ "Invalid function parameters count.", "ERR_INVALID_FUNCTION_PARAMETERS_COUNT" ],
  4051: [ "Invalid function parameter value.", "ERR_INVALID_FUNCTION_PARAMETER_VALUE" ],
  4052: [ "String function internal error.", "ERR_STRING_FUNCTION_INTERNAL_ERROR" ],
  4053: [ "Some array error.", "ERR_SOME_ARRAY_ERROR" ],
  4054: [ "Incorrect series array using.", "ERR_INCORRECT_SERIES_ARRAY_USING" ],
  4055: [ "Custom indicator error.", "ERR_CUSTOM_INDICATOR_ERROR" ],
  4056: [ "Arrays are incompatible.", "ERR_INCOMPATIBLE_ARRAYS" ],
  4057: [ "Global variables processing error.", "ERR_GLOBAL_VARIABLES_PROCESSING_ERROR" ],
  4058: [ "Global variable not found.", "ERR_GLOBAL_VARIABLE_NOT_FOUND" ],
  4059: [ "Function is not allowed in testing mode.", "ERR_FUNCTION_NOT_ALLOWED_IN_TESTING_MODE" ],
  4060: [ "Function is not confirmed.", "ERR_FUNCTION_NOT_CONFIRMED" ],
  4061: [ "Mail sending error.", "ERR_SEND_MAIL_ERROR" ],
  4062: [ "String parameter expected.", "ERR_STRING_PARAMETER_EXPECTED" ],
  4063: [ "Integer parameter expected.", "ERR_INTEGER_PARAMETER_EXPECTED" ],
  4064: [ "Double parameter expected.", "ERR_DOUBLE_PARAMETER_EXPECTED" ],
  4065: [ "Array as parameter expected.", "ERR_ARRAY_AS_PARAMETER_EXPECTED" ],
  4066: [ "Requested history data in updating state.", "ERR_HISTORY_WILL_UPDATED" ],
  4067: [ "Some error in trade operation execution.", "ERR_TRADE_ERROR" ],
  4099: [ "End of a file.", "ERR_END_OF_FILE" ],
  4100: [ "Some file error.", "ERR_SOME_FILE_ERROR" ],
  4101: [ "Wrong file name.", "ERR_WRONG_FILE_NAME" ],
  4102: [ "Too many opened files.", "ERR_TOO_MANY_OPENED_FILES" ],
  4103: [ "Cannot open file.", "ERR_CANNOT_OPEN_FILE" ],
  4104: [ "Incompatible access to a file.", "ERR_INCOMPATIBLE_ACCESS_TO_FILE" ],
  4105: [ "No order selected.", "ERR_NO_ORDER_SELECTED" ],
  4106: [ "Unknown symbol.", "ERR_UNKNOWN_SYMBOL" ],
  4107: [ "Invalid price.", "ERR_INVALID_PRICE_PARAM" ],
  4108: [ "Invalid ticket.", "ERR_INVALID_TICKET" ],
  4109: [ "Trade is not allowed.", "ERR_TRADE_NOT_ALLOWED" ],
  4110: [ "Longs are not allowed.", "ERR_LONGS_NOT_ALLOWED" ],
  4111: [ "Shorts are not allowed.", "ERR_SHORTS_NOT_ALLOWED" ],
  4200: [ "Object already exists.", "ERR_OBJECT_ALREADY_EXISTS" ],
  4201: [ "Unknown object property.", "ERR_UNKNOWN_OBJECT_PROPERTY" ],
  4202: [ "Object does not exist.", "ERR_OBJECT_DOES_NOT_EXIST" ],
  4203: [ "Unknown object type.", "ERR_UNKNOWN_OBJECT_TYPE" ],
  4204: [ "No object name.", "ERR_NO_OBJECT_NAME" ],
  4205: [ "Object coordinates error.", "ERR_OBJECT_COORDINATES_ERROR" ],
  4206: [ "No specified subwindow.", "ERR_NO_SPECIFIED_SUBWINDOW" ],
  4207: [ "Some error in object operation.", "ERR_SOME_OBJECT_ERROR" ]
}

module.exports.connect = (reqUrl, pullUrl) => {
  if (!reqUrl || !url.parse(reqUrl).hostname) {
    throw new Error("reqUrl invalid.")
  } else if (!pullUrl || !url.parse(pullUrl).hostname) {
    throw new Error("pullUrl invalid.")
  }

  let requestId = 1                                // used to identify requests
  const requestQueueValue = 5                      // helps to maintain zmq queue
  const requestTimeoutValue = 15000                // time after which request receives a timeout
  const requestEvents = new events.EventEmitter()  // used to handle data from responses

  // Check whether connections to the servers are established.
  function requestCheckConnections(fn) {
    if (!bridgeObject.reqConnected) {
      fn(new Error("ZMQ REQ connection is closed."))
      return false
    } else if (!bridgeObject.pullConnected) {
      fn(new Error("ZMQ PULL connection is closed."))
      return false
    } else {
      return true
    }
  }

  // Read and return response data for callback or Promise.
  function requestCallback(timeout, callback, resolve, reject, err, res) {
    clearTimeout(timeout)
    if (callback) {
      err ? callback(new Error(ERROR_CODES[err][0]), res) : callback(null, res)
    } else {
      err ? reject(new Error(ERROR_CODES[err][0])) : resolve(res)
    }
  }

  // A request timeout callback.
  function requestTimeoutCallback({ reqId, onceCallback, fn }) {
    requestEvents.removeListener(reqId, onceCallback)
    fn(new Error("ZMQ Request timeout."))
  }
  
  /**
   * Send request to ZMQ server and wait for the response.
   * An number of arguments can be provided. Response can be delivered from Callback or Promise.
   * To use Callback response, provide a function as the last argument. Otherwise, a Promise will be returned.
   */
  function request() {
    const args = Array.prototype.slice.call(arguments)
    const reqId = requestId++
    let timeoutObject, timeout, callback, onceCallback

    if (typeof args[args.length - 1] === "function") {            // Callback Variant
      callback = args.pop()
      if (requestCheckConnections(callback))                      // check status of req/pull connections
      setTimeout(() => {                                          // maintains queueing
        timeoutObject = { reqId, onceCallback, fn: callback }     // to use onceCallback reference at later point
        timeout = setTimeout(requestTimeoutCallback.bind(null, timeoutObject), requestTimeoutValue)
        onceCallback = requestCallback.bind(null, timeout, callback, null, null)
        timeoutObject.onceCallback = onceCallback                 // add reference in case of timeout
        requestEvents.once(reqId, onceCallback)                   // wait for response from pull server
        reqSocket.send(`${reqId}|${args.join("|")}`)              // send request message
      }, requestQueueValue)
    } else {                                                      // Promise Variant
      return new Promise((resolve, reject) => {
        if (requestCheckConnections(reject))                      // check status of req/pull connections
        setTimeout(() => {                                        // maintains queueing
          timeoutObject = { reqId, onceCallback, fn: reject }     // to use onceCallback reference at later point
          timeout = setTimeout(requestTimeoutCallback.bind(null, timeoutObject), requestTimeoutValue)
          onceCallback = requestCallback.bind(null, timeout, null, resolve, reject)
          timeoutObject.onceCallback = onceCallback               // add reference in case of timeout
          requestEvents.once(reqId, onceCallback)                 // wait for response from pull server
          reqSocket.send(`${reqId}|${args.join("|")}`)            // send request message
        }, requestQueueValue)
      })
    }
  }

  /**
   * Message with items separated by pipe | sign.
   * First item is always the id, second is the status, then message data follows.
   * In case of error, there is only one message data item containing error code.
   * 
   * @param {String} message
   * @returns id, err, msg
   */
  function parseMessage(message) {
    const split = message.toString().split('|')
    const id = split.shift()
    const status = +split[0]
    let err, msg
    if (status === RESPONSE_OK) {
      err = null
      msg = split.length === 2 && split[1] === "" ? true : split
      if (msg !== true) {
        msg.shift()
      }
    } else if (status === RESPONSE_FAILED) {
      err = split[1]
      msg = null
    }
    return [ id, err, msg ]
  }

  // Check whether we are waiting for response from pull server for specific id.
  function isWaitingForResponse(id) {
    return requestEvents.listenerCount(id) > 0
  }

  // An empty function.
  function noop() {}

  // Used for the first time when connecting to the server to potentially indicate connection problems.
  function checkConnection(socket, url) {
    let reqDelayedConnects = 0

    function performCheck() {
      reqDelayedConnects++
      if (reqDelayedConnects === 2) {
        socket.removeListener('connect', connectCallback)
        socket.removeListener('connect_delay', performCheck)
        console.warn(`METATRADER4 cannot connect with ${url}.`)
      }
    }

    function connectCallback() {
      socket.removeListener('connect_delay', performCheck)
    }

    socket.once('connect', connectCallback)
    socket.on('connect_delay', performCheck)
  }
  
  // Create socket objects
  const reqSocket = zmq.socket('req')
  const pullSocket = zmq.socket('pull')

  // Listen for message, then parse and broadcast it
  reqSocket.on('message', (msg) => {
    const message = parseMessage(msg)
    bridgeObject.onReqMessage(message[0], message[1], message[2])
  })
  pullSocket.on('message', (msg) => {
    const message = parseMessage(msg)
    bridgeObject.onPullMessage(message[0], message[1], message[2])
    requestEvents.emit(message[0], message[1], message[2])
  })

  // Listen for connect and disconnect events 
  reqSocket.on('connect', () => bridgeObject.reqConnected = true)
  pullSocket.on('connect', () => bridgeObject.pullConnected = true)
  reqSocket.on('disconnect', () => bridgeObject.reqConnected = false)
  pullSocket.on('disconnect', () => bridgeObject.pullConnected = false)

  // Wait for potential connection problems
  checkConnection(reqSocket, reqUrl)
  checkConnection(pullSocket, pullUrl)

  // Try to open the connections to MT4 client and monitor them
  reqSocket.monitor().connect(reqUrl)
  pullSocket.monitor().connect(pullUrl)

  const bridgeObject = {
    request: request,
    onReqMessage: noop,
    onPullMessage: noop,
    isWaitingForResponse: isWaitingForResponse,
    reqConnected: false,
    pullConnected: false,
    reqSocket: reqSocket,
    pullSocket: pullSocket
  }

  return bridgeObject
}

module.exports.REQUEST_PING = REQUEST_PING
module.exports.REQUEST_TRADE_OPEN = REQUEST_TRADE_OPEN
module.exports.REQUEST_TRADE_MODIFY = REQUEST_TRADE_MODIFY
module.exports.REQUEST_TRADE_DELETE = REQUEST_TRADE_DELETE
module.exports.REQUEST_DELETE_ALL_PENDING_ORDERS = REQUEST_DELETE_ALL_PENDING_ORDERS
module.exports.REQUEST_CLOSE_MARKET_ORDER = REQUEST_CLOSE_MARKET_ORDER
module.exports.REQUEST_CLOSE_ALL_MARKET_ORDERS = REQUEST_CLOSE_ALL_MARKET_ORDERS
module.exports.REQUEST_RATES = REQUEST_RATES
module.exports.REQUEST_ACCOUNT = REQUEST_ACCOUNT
module.exports.REQUEST_ORDERS = REQUEST_ORDERS

module.exports.RESPONSE_OK = RESPONSE_OK
module.exports.RESPONSE_FAILED = RESPONSE_FAILED

module.exports.UNIT_CONTRACTS = UNIT_CONTRACTS
module.exports.UNIT_CURRENCY = UNIT_CURRENCY

module.exports.OP_BUY = OP_BUY
module.exports.OP_SELL = OP_SELL
module.exports.OP_BUYLIMIT = OP_BUYLIMIT
module.exports.OP_SELLLIMIT = OP_SELLLIMIT
module.exports.OP_BUYSTOP = OP_BUYSTOP
module.exports.OP_SELLSTOP = OP_SELLSTOP

module.exports.ERROR_CODES = ERROR_CODES
