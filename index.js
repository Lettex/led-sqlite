const sqlite3 = require('sqlite3').verbose();
const util = require('util');

module.exports = function (config, logger = null) {
    let db;
    let promisifiedGet;
    let promisifiedRun;
    let promisifiedAll;
    const log = logger || console;

    function connect() {
        return new Promise((resolve, reject) => {
            db = new sqlite3.Database(config.database, (err) => {
                if (err) {
                    log.error('db/connect', {
                        msg: err.message,
                        code: err.code,
                        text: 'Error on initial connection'
                    });
                    reject(err);
                } else {
                    promisifiedGet = util.promisify(db.get).bind(db);
                    promisifiedRun = util.promisify(db.run).bind(db);
                    promisifiedAll = util.promisify(db.all).bind(db);
                    resolve();
                }
            });
        });
    }

    return {
        async query(sql, args = []) {
            log.info('query', sql);
            if (!db) {
                await connect();
            }
            return promisifiedAll(sql, args)
                .catch(err => {
                    log.error('db/query', {
                        args: {sql: sql, args: args},
                        msg: err.message
                    });
                    return null;
                });


        },
        getRow(sql, args = []) {
            return this.query(sql, args).then((res) => {
                return res[0] ? res[0] : null;
            }).catch((e) => {
                log.error('db/getRow', {
                    args: {sql: sql, args: args},
                    msg: e.message
                });
                return null;
            });
        },
        async getVal(sql, args = []) {
            return this.query(sql, args).then((res) => {
                return res[0] && Object.values(res[0])[0] !== undefined ? Object.values(res[0])[0] : null;
            }).catch((e) => {
                log.error('db/getVal', {
                    args: {sql: sql, args: args},
                    msg: e.message
                });
                return null;
            });
        },
        async insert(table, data) {
            try {
                const keys = Object.keys(data).map(key => `\`${key}\``).join(', ');
                const valuesPlaceholder = Object.values(data).map(() => "?").join(',');
                const sql = `INSERT INTO \`${table}\` (${keys})
                             VALUES (${valuesPlaceholder})`;

                let res = await this.query(sql, Object.values(data));
                if (res !== null) {
                    return await this.getVal(`SELECT last_insert_rowid()`);
                } else {
                    return null;
                }
            } catch (e) {
                log.error('db/insert', {
                    args: {table: table, data: data},
                    msg: e.message
                });
                return null;
            }
        },
        async update(table, data = {}, where = {}) {
            const columns = Object.keys(data).map(key => `\`${key}\` = ?`).join(', ');
            const whereClause = Object.keys(where).map(key => `\`${key}\` = ?`).join(' AND ');
            const sql = `UPDATE \`${table}\`
                         SET ${columns}
                         WHERE ${whereClause}`;
            const params = [...Object.values(data), ...Object.values(where)];
            return this.query(sql, params).then((res) => {
                return true;
            }).catch((e) => {
                log.error('db/update', {
                    args: {table: table, data: data, where: where},
                    msg: e.message
                });
                return null;
            });
        },
        close() {
            return util.promisify(db.close).call(db);
        }
    };
}