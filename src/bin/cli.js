#! /usr/bin/env node

import fs from 'fs';
import path from 'path';
import Commander from 'commander';
import Mogront from '../mogront';
import Database from '../database';
import colors from 'colors';
import v8flags from 'v8flags';
import LiftOff from 'liftoff';
import Interpret from 'interpret';
import Minimist from 'minimist';

const argv = Minimist(process.argv.slice(2));

function getConfig(specifiedPath) {
  if (specifiedPath) {
    let filePath = path.join(process.cwd(), specifiedPath);

    if (fs.existsSync(filePath)) {
      return require(filePath);
    } else {
      throw new Error('the specified config file does not exist.');
    }
  } else {
    throw new Error('--config option is required');
  }
}

const invoke = function(env) {
  Commander
    .version('1.0.0', '-v, --version')
    .option('-c, --config <path>', 'specify the configuration file to load')
    .option("-t, --template <stub>", "specify the template to create the migration file from", /^(vanilla|es6)$/i, 'vanilla')
    .action(console.log);

  Commander
    .command('create <name>')
    .description('create a migration file')
    .action(function(name){
      let config = getConfig(Commander.args[1].parent.config);
      let options = {
        template: Commander.args[1].parent.template
      };

      let mogront = new Mogront(null, config);

      mogront.create(name, options).then((fileName) => {
        console.log('The migration '.green + name.yellow + ' has been created as '.green + '[' + fileName.yellow + ']' + ' using the '.green + options.template.yellow + ' template'.green);
        return mogront.dispose();
      }).then(() => {
        process.exit(0);
      }).catch((error) => { console.error(error); process.exit(1); });
    });

  Commander
    .command('state')
    .description('shows the status of all the migrations')
    .option("--pending", "show only the pending migrations")
    .option("--executed", "show only the executed migrations")
    .action(function() {
      let config = getConfig(Commander.args[0].parent.config);
      let mogront = new Mogront(null, config);

      mogront.state().then((state) => {
        if (state.length > 0) {
          state.forEach((k) => {
            if (program.args[0].pending && !program.args[0].executed) {
              if (k.status === 'PENDING') {
                console.log(k.name.yellow + ' is currently ' + k.status.gray);
              }
            } else if (program.args[0].executed && !program.args[0].pending) {
              if (k.status === 'EXECUTED') {
                console.log(k.name.yellow + ' has been ' + k.status.gray);
              }
            } else {
              if (k.status === 'PENDING') {
                console.log(k.name.yellow + ' is currently ' + k.status.gray);
              }
              if (k.status === 'EXECUTED') {
                console.log(k.name.yellow + ' has been ' + k.status.gray);
              }
            }
          });
        } else {
          console.log('No migrations found.'.red);
        }
        return mogront.dispose();
      }).then(() => {
        process.exit(0);
      }).catch((error) => { console.error(error); process.exit(1); });
    });

  Commander
    .command('migrate')
    .description('execute the migrations')
    .action(function() {
      let config = getConfig(Commander.args[0].parent.config);
      let mogront = new Mogront(null, config);

      mogront.migrate().then((state) => {
        if (state.length > 0) {
          state.forEach((k) => {
            console.log(k.name.green + ' has been migrated successfully.');
          });
        } else {
          console.log('Nothing new to migrate.'.green);
        }
        return mogront.dispose();
      }).then(() => {
        process.exit(0);
      }).catch((error) => { console.error(error); process.exit(1); });
    });

  Commander
    .command('rollback')
    .description('rollback the last batch of migrations')
    .option('-a, --all', 'rollback all of the migrations')
    .action(function() {
      let config = getConfig(Commander.args[0].parent.config);
      let mogront = new Mogront(null, config);

      mogront.rollback(Commander.args[0].all).then((state) => {
        if (state.length > 0) {
          state.forEach((k) => {
            console.log(k.name.green + ' has been rolled back successfully.');
          });
        } else {
          console.log('Nothing to rollback'.green);
        }
        return mogront.dispose();
      }).then(() => {
        process.exit(0);
      }).catch((error) => { console.error(error); process.exit(1); });
    });

  Commander.parse(process.argv);

  if (Commander.args.length <= 0) {
    Commander.help();
  }
}

const cli = new LiftOff({
  name: 'mogront',
  extensions: Interpret.jsVariants,
  v8flags: v8flags,
});

cli.launch(
  {
    cwd: argv.cwd,
    config: argv.config,
    require: argv.require,
    completion: argv.completion,
  },
  invoke
);
