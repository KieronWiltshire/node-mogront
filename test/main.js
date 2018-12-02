'use strict';

import fs from 'fs-extra';
import path from 'path';
import Chai from 'chai';
import Mogront from '../src/mogront';
import * as Database from '../src/database';
import DatabaseConfig from './config.json';

let testOptions = Object.assign({
  collectionName: 'migrations',
  migrationsDir: path.join('./test/migrations')
}, DatabaseConfig);

describe('mogront', function() {

  before(function(done) {
    this.timeout(10000);

    let migrationsDirPath = path.join(process.cwd(), testOptions.migrationsDir);

    let mogront = new Mogront(null, testOptions);

    // Clean the directories and recorded state if any exist
    mogront.mongo().then(function(connection) {
      return connection.db(testOptions.db).dropDatabase();
    }).then(function() {
      if (fs.existsSync(migrationsDirPath)) {
        fs.remove(migrationsDirPath, done);
      } else {
        return done();
      }
    }).catch(done);
  });

  it('should create a new {Mogront} instance without an instance of {MongoDB.MongoClient} present', function(done) {
    try {
      let mogront = new Mogront(null, testOptions);
      return done();
    } catch (error) {
      return done(new Error('An instance of {Mogront} could not be created'));
    }
  });

  it('should create a new {Mogront} instance with an instance of {MongoDB} present', async function() {
    try {
      let connection = await Database.getConnection(testOptions);
      let mogront = new Mogront(connection, testOptions);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  });

  it('should create a migration file with the specified name', function(done) {
    try {
      let mogront = new Mogront(null, testOptions);

      mogront.create('create test collection').then(function(fileName) {
        if ((fileName.indexOf('create') > -1) && (fileName.indexOf('test') > -1) && (fileName.indexOf('collection') > -1)) {
          if (fs.existsSync(path.join(mogront.getMigrationsDirectory(), fileName))) {
            return done();
          }
        }

        throw new Error('Unable to find the migration file');
      }).catch(done);
    } catch (error) {
      return done(error);
    }
  });

  it('should delete the migrations directory and then recreate it so that it clears out the previous migration', function(done) {
    try {
      // Clear the directory to prevent an empty migration from running and giving an error
      let migrationsDirPath = path.join(process.cwd(), testOptions.migrationsDir);

      if (fs.existsSync(migrationsDirPath)) {
        fs.removeSync(migrationsDirPath);
      }

      if (fs.existsSync(migrationsDirPath)) {
        throw new Error('Unable to delete the migrations directory');
      } else {
        let mogront = new Mogront(null, testOptions); // Recreates the migrations directory

        if (fs.existsSync(migrationsDirPath)) {
          return done();
        } else {
          throw new Error('Unable to recreate the migrations directory');
        }
      }
    } catch (error) {
      return done(error);
    }
  });

  it('should copy the test_migrations/create_test_user.js file into the migrations directory', function(done) {
    try {
      let mogront = new Mogront(null, testOptions);

      // Copy the file over into the migrations directory
      let fileName = 'create_test_user.js';
      let currentFilePath = path.resolve(__dirname, 'test_migrations', fileName);
      let newFilePath = path.join(process.cwd(), testOptions.migrationsDir, fileName);

      /**
       * Create the file.
       *
       * There is no need to check if the file already exists withion the directory
       * as the directory shouldn't exist. It is removed before the tests are executed.
       */
      let stream = fs.createReadStream(currentFilePath).pipe(fs.createWriteStream(newFilePath));

      // Catch error on write stream
      stream.on('error', done);

      // Continue
      stream.on('close', done);
    } catch (error) {
      return done(error);
    }
  });

  it('should execute the test_migrations/create_test_user.js file in the migrations directory', function(done) {
    try {
      let mogront = new Mogront(null, testOptions);

      let fileName = 'create_test_user.js';

      // Check the file exists
      if (fs.existsSync(path.join(mogront.getMigrationsDirectory(), fileName))) {
        mogront.migrate().then(function(success) {
          // TODO: check status
          done();
        }).catch(done);
      } else {
        return done(new Error('The test_migration.js file was not found in the new file path'));
      }
    } catch (error) {
      return done(error);
    }
  });

  it('should copy the test_migrations/create_test_profile.js file into the migrations directory', function(done) {
    try {
      let mogront = new Mogront(null, testOptions);

      // Copy the file over into the migrations directory
      let fileName = 'create_test_profile.js';
      let currentFilePath = path.resolve(__dirname, 'test_migrations', fileName);
      let newFilePath = path.join(process.cwd(), testOptions.migrationsDir, fileName);

      /**
       * Create the file.
       *
       * There is no need to check if the file already exists withion the directory
       * as the directory shouldn't exist. It is removed before the tests are executed.
       */
      let stream = fs.createReadStream(currentFilePath).pipe(fs.createWriteStream(newFilePath));

      // Catch error on write stream
      stream.on('error', done);

      // Continue
      stream.on('close', done);
    } catch (error) {
      return done(error);
    }
  });

  it('should execute the test_migrations/create_test_profile.js file in the migrations directory', function(done) {
    try {
      let mogront = new Mogront(null, testOptions);

      let fileName = 'create_test_profile.js';

      // Check the file exists
      if (fs.existsSync(path.join(mogront.getMigrationsDirectory(), fileName))) {
        mogront.migrate().then(function(success) {
          // TODO: check status
          done();
        }).catch(done);
      } else {
        return done(new Error('The test_migration.js file was not found in the new file path'));
      }
    } catch (error) {
      return done(error);
    }
  });


});
