[![Coverage Status](https://coveralls.io/repos/github/redibox/schedule/badge.svg?branch=master)](https://coveralls.io/github/redibox/schedule?branch=master)
![Downloads](https://img.shields.io/npm/dt/redibox-hook-cache.svg)
[![npm version](https://img.shields.io/npm/v/redibox-hook-cache.svg)](https://www.npmjs.com/package/redibox-hook-schedule)
[![dependencies](https://img.shields.io/david/redibox/schedule.svg)](https://david-dm.org/redibox/schedule)
[![build](https://travis-ci.org/redibox/schedule.svg)](https://travis-ci.org/redibox/schedule)
[![License](https://img.shields.io/npm/l/redibox-hook-cache.svg)](/LICENSE)

## RediBox Memset

Memset is a synchronous access in-memory cache tool. The main difference between Memset and [Cache](https://github.com/redibox/cache) is that Cache sets and returns data from specified triggers directly from Redis, whereas Memset consistently provides cached data from memory which is set via scheduled [Jobs](https://github.com/redibox/job).

### Installation

First ensure you have [RediBox](https://github.com/redibox/core) install.

Install Memset via npm:

`npm install redibox-hook-memset --save`

### Usage

#### Configure sets

Within your `redibox` config, we'll setup a new `memset` object containing a `sets` array. Each set item consists of a `key` name, `runs` function and `interval`.

- **key**: A property name in which the data will be stored under and accessed within Memset.
- **runs**: A function or string (which returns a function) of the data to store. This must return a promise or data.
- **interval**: A string of the update time, compatible with (Later.js)(https://bunkat.github.io/later/parsers.html#text). Internally this use a similar setup to [Schedule](https://github.com/redibox/schedule).

````javascript
{
  memset: {
    sets: [{
      key: 'categories',
      runs: function(set, sets) {
        // Return a promise or data
        return ProductCategories.find({ active: true });
      },
      interval: 'every 5 minutes',
    }]
  }
}
````

#### Accessing Memset data

When your application boots, all of the sets are run, no matter what the `interval`. This means your data is accessible at all times.

Very simply access the data by key name:

```javascript
// assumes 'RediBox' is your predefined redibox instance
const categories = RediBox.hooks.memset.categories;

// With Sails hook
const categories = Memset.categories;
```

### Gotchas

If your sets require other Memset data to run, bear in mind that on boot the sets run in order synchronously. For example:

**Broken Example:**
```javascript
sets: [{
  key: 'cars',
  runs: function(set, sets) {
    // Return a promise or data
    return Cars
      .find({
        manufacturer: sets.carManufacturers,
      });
  },
  interval: 'every 2 minutes',
}, {
  key: 'carManufacturers',
  runs: function(set, sets) {
    // Return a promise or data
    return CarManufacturers.find({ active: true });
  },
  interval: 'every 5 minutes',
}]
```

This won't work because on boot, the `carManufacturers` data hasn't been set. To fix this, the `carManufacturers` would need to come before `cars`.

### Memset vs Cache

Before diving into Memset, you should first understand when to use Memset over the [Cache](https://github.com/redibox/cache) methods.

Memset should be used for common top level datasets which are accessed across your application, which is not likely to frequently update. Cache should be used for low level specific datasets which are less likely to be accessed and frequently need updating.

**Example**: Imagine a online shopping website, where users are able to browse for products via category, view a single product and login to our website. The website contains around 100 categories and thousands of products.

Memset:

1. The product categories would be commonly accessed dataset on the website, which do not change frequently. In this case we could use Memset to update the categories every 5 minutes, which would be reflected across the site to all users.

Cache:

1. Since a single product is unlikely to be accessed frequently, and could be subject to regularly fluctuating prices changes/stock changes it would not make sense to store this in Memset. Instead Cache should be used for specific product control with low cache times or the cached product data will need to be reset on price change within the application (`Cache.del()`).
2. The amount of users in the application is subject to constant change, along with users data/settings/authentication. This would not make sense to store in Memset, and should be controlled individually with custom Cache levels.
