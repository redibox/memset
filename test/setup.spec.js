global.HOOK_NAME = 'memset';
import Redibox from 'redibox';
import UserHook from './../src/hook';

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
};

const config = {
  hooks: {},
  memset: {
    sets: [
      {
        key: 'string',
        runs: 'methods.getString',
        refreshInterval: 'every 5 seconds',
      },
      {
        key: 'object',
        runs: 'methods.getObject',
        refreshInterval: 'every 5 seconds',
      },
      {
        key: 'number',
        runs: 'methods.getNumber',
        refreshInterval: 'every 5 seconds',
      },
      {
        key: 'array',
        runs: 'methods.getArray',
        refreshInterval: 'every 5 seconds',
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
