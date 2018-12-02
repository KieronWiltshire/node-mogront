'use strict';

/**
 * The 'up' method is called on migration.
 *
 * @param {MongoDB.MongoClient} connection The MongoClient instance
 * @param {String} dbName The name of the database
 * @returns {Promise}
 */
module.exports.up = function(connection, dbName) {
  return new Promise(function(resolve, reject) {
    let db = connection.db(dbName)
    let collection = db.collection('users');

    collection.insert({ hello: 'world' })
    .then(resolve)
    .catch(reject);
  });
};

/**
 * The 'down' method is called on rollback.
 *
 * @param {MongoDB.MongoClient} connection The MongoClient instance
 * @param {String} dbName The name of the database
 * @returns {Promise}
 */
module.exports.down = function(connection, dbName) {
  return new Promise(function(resolve, reject) {
    let db = connection.db(dbName)
    let collection = db.collection('users');

    collection.remove({ hello: 'world' })
      .then(resolve)
      .catch(reject);
  });
};
