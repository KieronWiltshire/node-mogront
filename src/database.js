'use strict';

import Path from 'path';
import MongoDB from 'mongodb';

export const MongoClient = MongoDB.MongoClient;

/**
 * Error codes.
 */
let connection = null;

/**
 * Export getConnection
 */
export const getConnection = async function({ url, user, password, host, port, db } = {}) {
  if (!connection) {
    try {
      if (url) {
        connection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
      } else {
        let connectionURL = null;

        if (user && password) {
          connectionURL = user + ':' + password;
        }

        if (host) {
          if (connectionURL) {
            connectionURL += '@' + host;
          } else {
            connectionURL = host;
          }
        } else {
          throw new Error('You must specify a host in order to establish a database connection');
        }

        if (port) {
          connectionURL += ':' + port;
        }

        if (db) {
          connectionURL += '/' + db;
        }

        connection = await MongoClient.connect('mongodb://' + connectionURL, { useNewUrlParser: true });
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (!connection) {
    throw new Error('A database connection needs to be established');
  }

  return connection;
};

/**
 * Export dispose
 */
export const dispose = async function() {
  if (connection) {
    let result = await connection.close();

    connection = null;

    return result;
  }

  return true;
};

/**
 * Export connection
 */
export default getConnection;
