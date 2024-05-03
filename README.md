# SQLite Wrapper

SQLite Connection Helper is a wrapper around the `sqlite3` npm package that provides a simple API for SQLite database
operations. It is designed to be used in Node.js projects.

## Installation

```shell
npm install --save led-sqlite
```

## Usage

```javascript
const dbConnection = require('led-sqlite');
const config = {database: 'test.db'};
const db = dbConnection(config);
let data = await db.query('SELECT * FROM table');
```

## Functions

- `query(sql, args)`: Executes a SQL query and returns a promise which resolves with the data.

- `getRow(sql, args)`: Retrieves the first row of the result set from a SQL query.

- `getVal(sql, args)`: Retrieves the first value from the first row of the result set from a SQL query.

- `insert(table, data)`: Inserts data into a table and returns the last inserted ID.

- `update(table, data, where)`: Updates rows in a table and returns the number of affected rows.
