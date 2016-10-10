const later = require('later');
const Promise = require('bluebird');
const defaults = require('./defaults');
const { BaseHook, deepGet, isFunction, isObject, tryJSONStringify, tryJSONParse } = require('redibox');
const { fromJS } = require('immutable');

class MemSet extends BaseHook {
  constructor() {
    super('memset');
    this.data = {};
    this.timestamp = {};

    // proxy to this.data
    return new Proxy(this, {
      get(target, name) {
        if (name in target) {
          return target[name];
        }

        if (name in target.data) {
          return target.data[name];
        }

        return undefined;
      },
    });
  }

  /**
   *
   * @returns {Promise.<T>}
   */
  initialize() {
    if (!this.options.sets || !this.options.sets.length) {
      return Promise.resolve();
    }

    for (let i = 0, len = this.options.sets.length; i < len; i++) {
      const set = this.options.sets[i];
      this.options.laterSchedules[i] = later.parse.text(set.refreshInterval || set.interval);
      if (this.options.laterSchedules[i].error !== -1) {
        return Promise.reject(`Interval "${set.refreshInterval || set.interval}" is invalid (error code ${this.options.laterSchedules[i].error}). See Later.js docs for valid formats: https://bunkat.github.io/later/parsers.html#text`);
      }
      this.options.sets[i].cacheLifeTime = MemSet.getCacheSeconds(this.options.laterSchedules[i]);
      this.options.laterTimers[i] = later.setInterval(
        this.updateSet.bind(this, i),
        this.options.laterSchedules[i]
      );
    }

    return this.refreshSets();
  }

  /**
   * Get the cache lifetime in seconds of a schedule
   * @param schedule
   * @returns {number}
   */
  static getCacheSeconds(schedule) {
    const _schedule = later.schedule(schedule);
    const seconds = Math.round((_schedule.next() - _schedule.prev()) / 1000 / 2);
    return seconds <= 0 ? 1 : seconds;
  }

  /**
   *
   * @param i
   * @returns {Promise}
   */
  updateSet(i) {
    const set = this.options.sets[i];
    // console.log(set);
    // do not change, needs to stay as new Prom => {}
    return this.cacheWrapPromise(`hooks:memset:${set.key}:${i}`, new Promise((resolve, reject) => {
      const handler = typeof set.runs === 'string' ? deepGet(global, set.runs) : set.runs;
      if (!isFunction(handler)) {
        throw new Error(`The 'runs' property for set '${set.key}' is invalid or global function was not found!`);
      }

      const possiblePromise = handler(set, this.data, this.core);

      if (!possiblePromise.then) {
        this.setData(set.key, possiblePromise, set.immutable);
        return resolve(possiblePromise);
      }

      return possiblePromise.then((data) => {
        this.setData(set.key, data, set.immutable);
        return resolve(data);
      }).catch(reject);
    }), set.cacheLifeTime).catch(err => this.log.error(err));
  }

  /**
   *
   * @param key
   * @param data
   * @param immutable
   */
  setData(key, data, immutable) {
    this.data[key] = immutable ? fromJS(data) : data;
    this.timestamp[key] = new Date();
  }

  /**
   *
   */
  refreshSets() {
    return Promise.each(this.options.sets, (item, i) => this.updateSet(i));
  }

  // noinspection JSUnusedGlobalSymbols,JSMethodCanBeStatic
  /**
   * Default config for scheduler
   * @returns {{someDefaultThing: string}}
   */
  defaults() {
    return defaults;
  }

  /**
   * Wraps a promise for the purposes of caching a successful result.
   * @param key
   * @param promise
   * @param ttl
   * @param skipCache
   * @returns {Promise}
   */
  cacheWrapPromise(key, promise, ttl, skipCache) {
    if (!key || typeof key !== 'string') {
      return Promise.reject(new Error('wrapPromise requires a valid key name (string).'));
    }

    if (skipCache || !this.options.enabled) {
      return promise.then ? promise : promise();
    }

    if (!this.core.isClientConnected(this.client)) {
      this.log.warn(
        'Redis server not connected or is not in a ready state, temporarily bypassing cache...'
      );
      return promise.then ? promise : promise();
    }

    let foundCache = false;
    return this.get(key).then(value => {
      if (value) {
        foundCache = true;
        return value;
      }
      return promise.then ? promise : promise();
    }).then(value => {
        return Promise.all([
          Promise.resolve(value),
          !foundCache && value ? this.set(key, value, ttl) : Promise.resolve(),
        ])
    }).then(results => results[0]);
  }

  /**
   * Gets a cached item from redis.
   * @param {String} key Key
   * @return {*} No Returns
   */
  get(key) {
    if (!this.core.isClientConnected(this.client)) {
      return Promise.reject(new Error('Redis not connected or ready.'));
    }

    return this
      .client
      .get(key)
      .then(value => {
        if (!value) {
          return value;
        }

        return tryJSONParse(value);
      });
  }

  /**
   * Create a new cached item.
   * @param {String} key Key
   * @param {String|Number|Object} val Value
   * @param {Number} ttl [Optional] Time to Live in seconds - defaults to global ttl
   * @returns {*} No Returns.
   */
  set(key, val, ttl) {
    if (!this.core.isClientConnected(this.client)) {
      return Promise.reject(new Error('Redis not connected or ready.'));
    }

    if (typeof val !== 'string' && typeof val !== 'number') {
      if (isObject(val) && val.toObject) {
        val = val.toObject();
      } else if (Array.isArray(val) && val.length && isObject(val[0]) && val[0].toObject) {
        for (let i = 0, iLen = val.length; i < iLen; i++) {
          val[i] = isObject(val[i]) && val[i].toObject ? val[i].toObject() : val[i];
        }
      }
      val = tryJSONStringify(val);
    }

    if (!val) {
      return Promise.reject(new Error('Invalid data type provided for cache.set'));
    }

    return this.client.set(key, val, 'NX', 'EX', ttl);
  }

}

module.exports = MemSet;
