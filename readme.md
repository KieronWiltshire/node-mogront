# Mogront

A tool to handle mongodb migrations from within nodejs

---

## Introduction

The package exports methods that can be used to handle mongodb migrations using the cli and nodejs.

## Basic usage

When installing locally to your project, the executable can be found in `./node_modules/.bin/mogront`.

It is highly recommended that you do not install this globally, however it is possible.

Unlike other cli tools, this one does not require you to have yet another config file in
the base of your project. You must pass the config file with each command, reason for this
is down to the recommended use of the cli, see further instructions below.

### Configuration

- `collectionName` - _[Optional]_ The name of the collection that tracks migration state
- `migrationsDir` - _[Optional]_ The path to the migrations directory
- `db` - _[Required]_ The name of the database

These fields are mandatory if you do not pass an instance of the `MongoDB.MongoClient`

You can pass the connection URL, if it is not found, it will then look for other connection parameters.
- `url` - _[Optional]_ The database connection URL
- `user` - _[Required]_ The database login user
- `password` - _[Required]_ The database login password for the specified user
- `host` - _[Required]_ The database host address (_defaults to `127.0.0.1`_)
- `port` - _[Required]_ The database port (_defaults to `27017`_)

#### Example configuration file

This example is a json file, but you can also pass a javascript file which exports the parameters if you wish to do so.

```JavaScript
{
  "host": "127.0.0.1",
  "port": "27017",
  "user": "root",
  "password": "",
  "db": "mogronttest",
  "migrationsDir": "./migrations",
  "collectionName": "_migrations"
}
```

### Using the CLI

The cli tool takes 1 parameter which is required which is `--config`. Below is an example command using babel-node
over the binary. The reason for this is that we can then write our migrations in `ES6` and still write them.

```JavaScript
babel-node ./node_modules/mogront/build/bin/cli.js --config="mogront.config.js" <options> <command> <arguments>
```

Below are the following commands:
- `create <name>` - This will create a migration file in the configured directory
    - `--template` - is an option you can pass to the command, you may specify `vanilla` or `es6` with vanilla being CommonJS.
- `state` - This will show you the state of the migrations in your directory
    - `--pending` - is an option you can pass to the command that will only show you which migrations are pending
    - `--executed` - is an option you can pass to the command that will only show you which migrations have been executed
- `migrate` - This will execute the pending migrations
- `rollback` - This will rollback the previous batch of migrations
    - `--all` - is an option you can pass to the command that will rollback all previously executed migrations

The command became cumbersome, especially sharing between developers, it's recommended that you add it
to your project's `package.json` as a script like so:

```JavaScript
"scripts": {
  "mogront": "babel-node ./node_modules/mogront/build/bin/cli.js --config=\"mogront.config.js\" --template=\"es6\""
}
```

You can then run the command like so `npm run mogront <command> <arguments>`

### Programmatic use

```JavaScript
  const Mogront = require('mogront');
  const mogrontConfig = require('./mogront-config');

  let mogront = new Mogront(null, mogrontConfig);
```

- `Mogront#mongo` - Retrieves the `MongoDB.MongoClient` instance
- `Mogront#dispose` - Disposes the `MongoDB.MongoClient` connection
- `Mogront#isDisposed` - Checks if the connection has been disposed of
- `Mogront#create(name, options)` - Creates a migration in the specified file
    - `options.template` - Specify the migration template to use [`vanilla`, `es6`]
- `Mogront#state` - Retrieves the state of the migrator
- `Mogront#migrate` - Migrate all of the pending migrations
- `Mogront#rollback(all)` - Rollback the last batch of migrations. Specifying true will rollback all of the migrations.

### Migration files

A migration file has to export two functions, an `up` and a `down` function, both functions are passed one parameter
from the migrator, that is the open connection to the database driver set to the specific database.

Here are the list of migration templates you can choose:

- [vanilla][3]
- [es6][4]

## Contributing

Mogront makes use of [mocha][1] and [chai](2) in order to conduct it's unit tests, thus contributions
should be submitted with unit tests relevant to your work. Integration testing requires a database
connection, you should copy the `config.json.example` file to `config.json` and replace the
connection details with your own.

## License

Copyright (c) 2019 Kieron Wiltshire

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[1]: https://www.npmjs.com/package/mocha
[2]: https://www.npmjs.com/package/chai
[3]: https://github.com/KieronWiltshire/node-mogront/blob/master/src/stubs/vanilla.js
[4]: https://github.com/KieronWiltshire/node-mogront/blob/master/src/stubs/es6.js
