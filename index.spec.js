const mt4zmqBridge = require('./')
const chai = require('chai')
const expect = chai.expect

chai.should()

const SPEC_PAIR = 'USDJPY'

describe('MetaTrader4', () => {

  let zmqBridge

  const REQ_URL = 'tcp://127.0.0.1:5555'
  const PULL_URL = 'tcp://127.0.0.1:5556'

  before((done) => {
    function checkDone() {
      if (zmqBridge.reqConnected && zmqBridge.pullConnected) {
        zmqBridge.reqSocket.off('connect', checkDone)
        zmqBridge.pullSocket.off('connect', checkDone)
        done()
      }
    }

    zmqBridge = mt4zmqBridge.connect(REQ_URL, PULL_URL)
    zmqBridge.reqSocket.on('connect', checkDone)
    zmqBridge.pullSocket.on('connect', checkDone)
  })

  after(() => {
    zmqBridge.reqSocket.close()
    zmqBridge.pullSocket.close()
  })

  function openTestOrder(volume, property, price, stoploss, takeprofit, testOrderTickets) {
    return zmqBridge.request(mt4zmqBridge.REQUEST_TRADE_OPEN, SPEC_PAIR, property, volume, price, 0, stoploss, takeprofit, "test", 0, mt4zmqBridge.UNIT_CONTRACTS)
      .then((res) => {
        expect(Array.isArray(res)).to.be.true
        res.length.should.equal(1)
        expect(isNaN(Number(res[0]))).to.be.false
        if (Array.isArray(testOrderTickets)) {
          testOrderTickets.push(res[0])
        }
        return res
      })
  }

  const usdjpyTicker = {}
  let testTicket

  describe('communication with MT4', () => {

    it('should ping MT4 client', (done) => {
      zmqBridge.request(mt4zmqBridge.REQUEST_PING, (err, res) => {
        expect(err).to.be.null
        expect(Array.isArray(res)).to.be.true
        res.length.should.equal(1)
        done()
      })
    })

    it('should return current rates', (done) => {
      zmqBridge.request(mt4zmqBridge.REQUEST_RATES, SPEC_PAIR, (err, res) => {
        expect(err).to.be.null
        expect(Array.isArray(res)).to.be.true
        res.length.should.equal(3)
        usdjpyTicker.bid = Number(res[0])
        usdjpyTicker.ask = Number(res[1])
        usdjpyTicker.bid.should.not.equal(0)
        usdjpyTicker.ask.should.not.equal(0)

        zmqBridge.request(mt4zmqBridge.REQUEST_RATES, SPEC_PAIR)
          .then((res) => {
            done()
          })
      })
    })

    it('should return current account details', (done) => {
      zmqBridge.request(mt4zmqBridge.REQUEST_ACCOUNT, (err, res) => {
        expect(err).to.be.null
        expect(Array.isArray(res)).to.be.true
        res.length.should.equal(9)
        if (res[1] < 500) {
          console.error("Tested account balance is below 500. Please use an account with greater balance.")
        }
        expect(res[1] > 500).to.be.true
        done()
      })
    })

    it('should not open test pending order', (done) => {
      zmqBridge.request(mt4zmqBridge.REQUEST_TRADE_OPEN, SPEC_PAIR, mt4zmqBridge.OP_BUY, 122.000001, "%-10", 0, 0, 0, "test", 0, mt4zmqBridge.UNIT_CONTRACTS, (err, res) => {
        expect(err).not.to.be.null
        done()
      })
    })

    it('should open test pending order', (done) => {
      zmqBridge.request(mt4zmqBridge.REQUEST_TRADE_OPEN, SPEC_PAIR, mt4zmqBridge.OP_BUYLIMIT, 0.01, "%-15", 0, "-20", "+20", "test", 0, mt4zmqBridge.UNIT_CONTRACTS, (err, res) => {
        expect(err).to.be.null
        expect(Array.isArray(res)).to.be.true
        res.length.should.equal(1)
        expect(isNaN(Number(res[0]))).to.be.false
        testTicket = res[0]
        done()
      })
    })

    it('should not open test order with wrong symbol', (done) => {
      zmqBridge.request(mt4zmqBridge.REQUEST_TRADE_OPEN, "WRONGSYMBOL", mt4zmqBridge.OP_BUYLIMIT, 0.01, "%-15", 0, 0, 0, "test", 0, mt4zmqBridge.UNIT_CONTRACTS)
        .catch((err) => {
          done()
        })
    })

    it('should modify test pending order', (done) => {
      zmqBridge.request(mt4zmqBridge.REQUEST_TRADE_MODIFY, testTicket, "%-10", "%-20", "%10", (err, res) => {
        expect(Array.isArray(res)).to.be.true
        res.length.should.equal(1)
        expect(isNaN(Number(res[0]))).to.be.false
        done()
      })
    })

    it('should find test pending order', (done) => {
      zmqBridge.request(mt4zmqBridge.REQUEST_ORDERS, (err, res) => {
        expect(Array.isArray(res)).to.be.true
        const orders = res.map(item => item.split(","))
        const testOrder = orders.find(order => order[0] == testTicket)
        done()
      })
    })

    it('should delete test pending order', (done) => {
      zmqBridge.request(mt4zmqBridge.REQUEST_TRADE_DELETE, testTicket, (err, res) => {
        expect(Array.isArray(res)).to.be.true
        res.length.should.equal(1)
        expect(isNaN(Number(res[0]))).to.be.false
        res[0].should.equal(testTicket)
        done()
      })
    }).timeout(5000)

    it('should delete all test pending orders in batch', (done) => {
      const testOrderTickets = []

      Promise.all([
        openTestOrder(0.011, mt4zmqBridge.OP_SELLLIMIT, "%20", usdjpyTicker.ask * 1.3, usdjpyTicker.ask * 1.1, testOrderTickets),
        openTestOrder(0.012, mt4zmqBridge.OP_BUYSTOP, "%20", usdjpyTicker.bid * 1.1, usdjpyTicker.bid * 1.3, testOrderTickets),
        openTestOrder(0.013, mt4zmqBridge.OP_SELLSTOP, "%-20", usdjpyTicker.ask * 0.9, usdjpyTicker.ask * 0.7, testOrderTickets)
      ]).then(() => {
        zmqBridge.request(mt4zmqBridge.REQUEST_ORDERS)
          .then((res) => {
            expect(Array.isArray(res)).to.be.true
            testOrderTickets.length.should.equal(3)
            const orders = res.map(item => item.split(","))

            expect(orders.find(order => order[0] == testOrderTickets[0])).not.to.be.undefined
            expect(orders.find(order => order[0] == testOrderTickets[1])).not.to.be.undefined
            expect(orders.find(order => order[0] == testOrderTickets[2])).not.to.be.undefined

            zmqBridge.request(mt4zmqBridge.REQUEST_DELETE_ALL_PENDING_ORDERS, SPEC_PAIR).then(() => {
              zmqBridge.request(mt4zmqBridge.REQUEST_ORDERS)
                .then((res) => {
                  if (Array.isArray(res)) {
                    res.length.should.equal(orders.length - 3)
                  }
                  done()
                })
            })
          })
      })
    }).timeout(45000)

    it('should open test market orders', (done) => {
      openTestOrder(0.01, mt4zmqBridge.OP_BUY, 0, 0, 0)
        .then((res) => {
          expect(Array.isArray(res)).to.be.true
          res.length.should.equal(1)
          expect(isNaN(Number(res[0]))).to.be.false
          testTicket = res[0]
          done()
        })
    }).timeout(4000)

    it('should modify test market order', (done) => {
      zmqBridge.request(mt4zmqBridge.REQUEST_TRADE_MODIFY, testTicket, 0, "-20", "+20", (err, res) => {
        expect(err).to.be.null
        expect(Array.isArray(res)).to.be.true
        res.length.should.equal(1)
        expect(isNaN(Number(res[0]))).to.be.false
        done()
      })
    }).timeout(4000)

    it('should close all market orders', (done) => {
      zmqBridge.request(mt4zmqBridge.REQUEST_CLOSE_ALL_MARKET_ORDERS, SPEC_PAIR)
        .then(zmqBridge.request(mt4zmqBridge.REQUEST_ORDERS)
          .then((res) => {
            if (Array.isArray(res)) {
              const orders = res.map(item => item.split(","))
              expect(orders.find(item => item[4] === SPEC_PAIR)).to.be.undefined
            } else {
              expect(Array.isArray(res)).to.be.false
              expect(res).to.be.true
            }
            done()
          })
        )
    }).timeout(45000)

  })

})
