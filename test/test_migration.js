'use strict';

/**
 * The 'up' method is called on migration.
 *
 * @param {Monk} monk The monk database instance
 * @returns {Promise}
 */
module.exports.up = function(monk) {
  return monk.create('users');
};

/**
 * The 'down' method is called on rollback.
 *
 * @param {Monk} monk The monk database instance
 * @returns {Promise}
 */
module.exports.down = function(monk) {
  return monk.get('users').remove({});
};
