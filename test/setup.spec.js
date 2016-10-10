global.HOOK_NAME = 'memset';
const Redibox = require('redibox').default;
const UserHook = require('./../src/hook');

global.methods = {
  getString() {
    return 'foo';
  },
  getObject() {
    return { foo: 'bar' };
  },
  getNumber() {
    return 1337;
  },
  getArray() {
    return ['foo', 'bar', () => 'baz'];
  },
  getUnixTimestamp() {
    return Math.floor(Date.now() / 1000);
  },
  getPromise() {
    return Promise.resolve({
      foo: 'bar',
    });
  },
};

const config = {
  hooks: {},
  memset: {
    sets: [
      {
        key: 'string',
        runs: 'methods.getString',
        refreshInterval: 'every 1 seconds',
      },
      {
        key: 'object',
        runs: 'methods.getObject',
        refreshInterval: 'every 1 seconds',
      },
      {
        key: 'number',
        runs: 'methods.getNumber',
        interval: 'every 1 seconds',
      },
      {
        key: 'array',
        runs: 'methods.getArray',
        refreshInterval: 'every 1 seconds',
      },
      {
        key: 'promise',
        runs: 'methods.getPromise',
        refreshInterval: 'every 1 seconds',
      },
      {
        key: 'function',
        runs() {
          return 'fooFunction';
        },
        refreshInterval: 'every 1 seconds',
      },
      {
        key: 'unixTimestamp',
        runs: 'methods.getUnixTimestamp',
        refreshInterval: 'every 1 seconds',
      },
    ],
  },
  log: { level: 'verbose' },
};

config.hooks[global.HOOK_NAME] = UserHook;

before(done => {
  global.RediBox = new Redibox(config, () => {
    global.Hook = RediBox.hooks[global.HOOK_NAME];
    RediBox.client.flushall().then(() => done());
  });
});


after(() => {
  RediBox.disconnect();
});
