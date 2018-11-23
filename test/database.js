'use strict';

import path from 'path';
import config from './config.json';
import Monk from 'monk';

/**
 * ..
 */
let connectionURL = null;
let isConnectionEstablished = false;

/**
 * Connection options
 */
let options = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  db: config.database.db,
};

if (options.user && options.password) {
  connectionURL = options.user + ':' + options.password;
}

if (options.host) {
  if (connectionURL) {
    connectionURL += '@' + options.host;
  } else {
    connectionURL = options.host;
  }
} else {
  throw new Error('No database host specified');
}

if (options.port) {
  connectionURL += ':' + options.port;
}

if (options.db) {
  connectionURL += '/' + options.db;
} else {
  throw new Error('No database has been specified');
}

/**
 * Check if a connection to the database exists.
 *
 * @returns {boolean}
 */
export function hasDatabaseConnection() {
  return isConnectionEstablished;
}

/**
 * Create an instance of {Monk}.
 */
let monk = Monk(connectionURL);

monk.then((db) => {
  isConnectionEstablished = true;

  /**
   * When the driver's connection to the database has timed out.
   */
  db.on('timeout', () => {
    isConnectionEstablished = false;
  });

  /**
   * When the driver has closed the connection.
   */
  db.on('close', () => {
    isConnectionEstablished = false;
  });

  /**
   * When the driver has reconnected.
   */
  db.on('reconnect', () => {
    isConnectionEstablished = true;
  });
}).catch((error) => {
  isConnectionEstablished = false;
  throw new Error('Unable to connect to the database');
});

/**
 * Export database functions
 */
export default monk;
