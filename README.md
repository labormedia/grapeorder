 # GrapesOrder
Distributed p2p orderbook implementation example based on Grenache.

 ## Install and start two interconnected grapes

```
$ npm i -g grenache-grape
$ grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
$ grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
```

## Install dependencies
```
npm i
```

## Run orderbook server
```
npm run server

> grenache-nodejs-example-fib-server@1.0.0 server
> node server.js

service_id 36375bf5ce7986db12edd3c0b1b1187e3fe9044cd446d4bcd1f3510feb91c0e2:orderbook <-------- service to use in examples/client.js
```

## Edit client service bootstrap in examples/client.js line 15

```
14: ...
15: const service = '36375bf5ce7986db12edd3c0b1b1187e3fe9044cd446d4bcd1f3510feb91c0e2:orderbook'
16: ...
```

## Run multiple client examples instances
```
npm run client

> grenache-nodejs-example-fib-server@1.0.0 client
> node examples/client.js

service_id fe5c0d8a8756169d4a3129f4161c800b4dfbe86c822de2e4e6d33df8415d4ec5:orderbook
result { code: '200', data: { nonce: 2 } }
result { code: '200', data: { orderbook: { bids: [], asks: [] } } }
result { code: '200', level: { side: 'bid', price: 20, amount: 42 } }
result { code: '200', level: { side: 'bid', price: 21, amount: 43 } }
result { code: '200', level: { side: 'ask', price: 30, amount: 42 } }
result { code: '200', level: { side: 'ask', price: 32, amount: 44 } }
result { code: '200', data: { nonce: 2 } }
result { code: '200', data: { nonce: 4 } }
result { code: '200', level: { side: 'bid', price: 22, amount: 44 } }
result { code: '200', data: { nonce: 3 } }
result { code: '200', level: { side: 'ask', price: 31, amount: 43 } }
{
  bids: [ { side: 'bid', price: 22, amount: 44 } ],
  asks: [
    { side: 'ask', price: 32, amount: 44 },
    { side: 'ask', price: 30, amount: 42 }
  ]
}
```

## Issues
There is currently a race condition which tries to upgrade the remote peer beforehand, and this produces concurrency which is dropped by the service. The result of this are levels orders being dropped. The solution to this would be to update the local incoming first, then subsequently manage the timing of the remote update with async calls that can be awaited.

## TODOS
The match_orderbook() is not implemented, which is now just moving the incoming orders to the orderbook directly without matching orders.\
This example doesn't consider a symbol variant, it is made for only one symbol. Levels with symbol variants can be further implemented.\
The functionality for pushing the updated states to the app_ring property of the orderbook can be further implemented.