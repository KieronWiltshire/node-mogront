'use strict';

/**
 * The 'up' method is called on migration.
 *
 * @param {Database} database The MongoClient database instance
 * @returns {Promise}
 */
export const up = async function(database) {
  let collection = database.collection('users');

  return collection.insertOne({ hello: 'world' });
};

/**
 * The 'down' method is called on rollback.
 *
 * @param {Database} database The MongoClient database instance
 * @returns {Promise}
 */
export const down = async function(database) {
  let collection = database.collection('users');

  return collection.deleteOne({ hello: 'world' });
};
