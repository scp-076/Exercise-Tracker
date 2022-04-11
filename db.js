const sqlite3 = require('sqlite3');
const Promise = require('bluebird');

class DB {
    constructor(dbFilePath) {
        this.db = new sqlite3.Database(dbFilePath, (error) => {
            if (error) console.log('Could not connect to database', error);
            else console.log('Connected to database');
        });
    }

    run() {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.log('Error running sql ' + sql);
                    console.log(err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID })
                }
            })
        })
    }

    get() {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) {
                    console.log('Error running sql: ' + sql);
                    console.log(err);
                    reject(err);
                } else resolve(result);
            })
        })
    }

    all() {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.log('Error running sql: ' + sql);
                    console.log(err);
                    reject(err);
                } else resolve(rows);
            })
        })
    }
}

module.exports = DB;