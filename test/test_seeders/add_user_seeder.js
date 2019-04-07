'use strict';

/**
 * The 'run' method is called on seed.
 *
 * @param {Database} database The MongoClient database instance
 * @returns {Promise}
 */
export const run = async function(database) {
  let collection = database.collection('users');

  return collection.insertOne({ username: 'kieron' });
};
