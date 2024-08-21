'use strict'

import Events from 'events'
import { PeerRPCServer, PeerRPCClient } from 'grenache-nodejs-ws'
import Link from 'grenache-nodejs-link'
import { entrypoint, service_port, request_timeout } from './bootstrap.js'
import { errors } from './errors.js'
import crypto from 'crypto'
import * as Helpers from './helpers.js'

const VERSION = '0.0.1'

class OrderBook extends Events {
    constructor(id = crypto.randomBytes(32), setup = { entrypoint, service_port, request_timeout, uptime_since: Date.now() }) {
        super()
        this.version = VERSION
        this.sender_id = id.toString('hex'),
        this.uptime_since = setup.uptime_since
        this.app_ring = []
        this.orderbook = { bids: [], asks: [] }
        this.incoming = []
        this.nonce = 0

        this.link = new Link(
            {
                grape: setup.entrypoint,
                requestTimeout : setup.request_timeout,
            }
        )
        this.link.start()
        
        this.peer_server = new PeerRPCServer(this.link, {})
        this.peer_server.init()

        this.peer_client = new PeerRPCClient(this.link, {})
        this.peer_client.init()
        
        this.service = this.peer_server.transport('server')
        this.service.listen(setup.service_port)

        this.service_id = this.sender_id+':orderbook';
        console.log('service_id', this.service_id)
        
        setInterval(() => {
            this.link.announce(this.service_id, this.service.port, {})
        }, 1000)
        
        // Receives requests
        this.service.on('request', (rid, key, payload, handler) => {  // validate payload
            //console.log('request (rid, key, payload)', rid, key, payload)
            if (this.validate_request(payload)) {
                handler.reply(null, this.parse_request(payload))
            } else {
                handler.reply(null, { 
                    code: 400,
                    payload
                })
            }
            
        })

        // Sends requests
        this.on('request', (payload) => {
            if (this.validate_request(payload)) {
                this.peer_client.request(payload.service, payload, { timeout: 10000 }, (err, result) => {
                    if (err) throw err
                    console.log('result', result)
                })
            } else {
                throw new Error(errors.invalid_request)
            }
        })

        this.on('orderbook_update', async (payload) => {
            this.match_orderbook()
            this.peer_client.request(payload.service, payload, { timeout: 10000 }, (err, result) => {
                if (err) throw err
                if (result.code == 200 && result.data && this.validate_orderbook(result.data.orderbook)) {
                    this.orderbook = result.data.orderbook
                } else {
                    throw new Error(errors.invalid_orderbook)
                }
            })
        })
    }
    
    validate_request(payload) {
        if (payload && payload.version && payload.sender_id && payload.service && payload.intent && payload.data) {
            return true
        } else {
            return false
        }
    }

    parse_request(payload) {
        if (this.validate_request(payload)) {
            if (this.version == payload.version) {
                if (payload.intent == 'orderbook') {
                        return { 
                            code: '200',
                            data: { orderbook: this.match_orderbook() }
                        }
                    }
                if (payload.intent == 'insert') {
                        const level = payload.data.level
                        if (level && this.validate_level(level)) {
                            if (!level.side) {
                                return { 
                                    code: '400',
                                    description: errors.invalid_side,
                                    payload
                                }
                            } else {
                                this.incoming.push(level)
                                return { 
                                    code: '200',
                                    level
                                }
                            }
                        } else {
                            return { 
                                code: '400',
                                description: errors.invalid_level,
                                level
                            }
                        }
                } else if (payload.intent == 'ring') {
                        return { 
                            code: '200',
                            data: { ring: this.app_ring }
                        }
                } else if (payload.intent == 'ping') {
                        return { 
                            code: '200',
                            data: { nonce: payload.data.nonce + 1 }
                        }
                } else {
                        return { 
                            code: '400',
                            description: errors.invalid_intent,
                            payload
                        }
                }
            } else {
                return {
                    code: 400,
                    description: errors.invalid_version,
                    payload,
                }
            }
        } else {
            return { 
                code: '400',
                description: errors.invalid_request,
                payload
            }
        }
    }

    validate_orderbook(orderbook) {
        if (orderbook.bids && orderbook.asks) {
            return true
        } else {
            return false
        }
    }

    validate_level(level) {
        if (level && level.side && level.price && level.amount) {
            return true
        } else {
            return false
        }
    }

    match_orderbook() {
        for (let i = 0; i < this.incoming.length; i++) {
            const level = this.incoming.pop()
            if (level.side == 'bid') {
                    this.orderbook.bids.push(level)

            } else if (level.side == 'ask') {
                    this.orderbook.asks.push(level)
            } else {
                throw new Error(errors.invalid_side)
            }
        }
        /*this.orderbook.bids.sort((level_a, level_b) => {
            level_a.price - level_b.price
        })
        this.orderbook.asks.sort((level_a, level_b) => {
            level_b.price - level_a.price
        })*/
        return this.orderbook
    }

    push_to_ring(service) {
        try {
            this.emit('request', Helpers.create_ping_request(this, service, this.next_nonce()))
        } catch (e) {

        } finally {
            this.app_ring.push(service)
        }
    }

    next_nonce() {
        this.nonce += 1
        return this.nonce
    }

    get_orderbook() {
        return this.orderbook
    }
}

export default OrderBook;

export * as Helpers from './helpers.js'