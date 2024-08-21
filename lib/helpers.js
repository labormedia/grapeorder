
let nonce = 0;

export function next_nonce() {
    nonce += 1
    return nonce
}

export function create_orderbook_request(orderbook, service, nonce) {
    return { 
        version: orderbook.version, 
        sender_id: orderbook.sender_id, 
        service, 
        intent: 'orderbook',
        data: { 
            nonce
        }
    }
}

export function create_bid_request(orderbook, service, price, amount, nonce) {
    return { 
        version: orderbook.version, 
        sender_id: orderbook.sender_id, 
        service, 
        intent: 'insert',
        data: { 
            nonce,
            level: {
                side: 'bid',
                price,
                amount
            } 
        }
    }
}

export function create_ask_request(orderbook, service, price, amount, nonce) {
    return { 
        version: orderbook.version, 
        sender_id: orderbook.sender_id, 
        service, 
        intent: 'insert',
        data: { 
            nonce,
            level: {
                side: 'ask',
                price,
                amount
            } 
        }
    }
}

export function create_ping_request(orderbook, service, nonce) {
    return { 
        version: orderbook.version, 
        sender_id: orderbook.sender_id, 
        service, 
        intent: 'ping',
        data: { nonce }
    }
}