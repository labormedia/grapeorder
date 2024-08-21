'use strict'
import { default as OrderBook, Helpers } from '../lib/orderbook.js'
import crypto from 'crypto'

const setup = {
    entrypoint: 'http://127.0.0.1:40001',
    service_port: 1338 + Math.floor(Math.random() * 1000),
    client_port: 1238,
    request_timeout: 10000,
    uptime_since: Date.now(),
}

let orderbook = new OrderBook(crypto.randomBytes(32), setup);

const service = 'dcc7aa8ee295ce813ae7cae134afea50ed50e0a1c15592ef29120a975ac84902:orderbook'

orderbook.push_to_ring(service)

const next_nonce = Helpers.next_nonce;

orderbook.emit('request', Helpers.create_ping_request(orderbook, service, next_nonce()))
orderbook.emit('request', Helpers.create_ping_request(orderbook, service, next_nonce()))
orderbook.emit('request', Helpers.create_ping_request(orderbook, service, next_nonce()))

orderbook.emit('request', Helpers.create_orderbook_request(orderbook, service, next_nonce()))

orderbook.emit('request', Helpers.create_bid_request(orderbook, service, 20, 42, next_nonce()))
orderbook.emit('request', Helpers.create_bid_request(orderbook, service, 21, 43, next_nonce()))
orderbook.emit('request', Helpers.create_bid_request(orderbook, service, 22, 44, next_nonce()))

orderbook.emit('request', Helpers.create_ask_request(orderbook, service, 30, 42, next_nonce()))
orderbook.emit('request', Helpers.create_ask_request(orderbook, service, 31, 43, next_nonce()))
orderbook.emit('request', Helpers.create_ask_request(orderbook, service, 32, 44, next_nonce()))

orderbook.emit('orderbook_update', Helpers.create_orderbook_request(orderbook, service, next_nonce()))

setTimeout( () => { 
    console.log(orderbook.get_orderbook())
}, 5000)


