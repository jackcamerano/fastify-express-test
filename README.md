# fastify-express-test

Clone the repo and launch

```shell
npm install
```

Reproducing the bug:

Start the service in one terminal:

```shell
node --watch ./src/index.js
```

Make a curl request to the route in another:

```shell
curl localhost:3001/foo
```
