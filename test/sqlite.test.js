const chai = require('chai');
const sinon = require('sinon');
const dbModule = require('../index');
const {expect} = chai;

describe('database module', () => {
    let database;

    before(async () => {
        // Create the database
        database = dbModule({database: 'test.db'});

        // Connect to the database
        //await database.connect();
        await database.query('DROP TABLE IF EXISTS example');
        // Create a table
        const createTableSql = `
            CREATE TABLE example
            (
                id   INTEGER PRIMARY KEY,
                name TEXT
            )
        `;
        await database.query(createTableSql);


        // Insert some rows
        const insertSql = 'INSERT INTO example (name) VALUES (?)';

        await database.query(insertSql, ['Alice']);
        await database.query(insertSql, ['Bob']);
        await database.query(insertSql, ['Charlie']);

    });

// Test suite for getVal
    describe('getVal', () => {
        it('should return the correct value when a SQL query is provided', async () => {
            const query = 'SELECT name FROM example WHERE id = 1';
            database.query(query).then(() => [{id: 1, val: 'test'}]);

            const value = await database.getVal(query);
            expect(value).to.equal('Alice');
        });

        it('should return null when the SQL query does not return any results', async () => {
            const query = 'SELECT * FROM example WHERE id = -1';
            database.query(query).then(() => []);

            const value = await database.getVal(query);
            expect(value).to.be.null;
        });

        it('should return null when there is an error executing the SQL query', async () => {
            const query = 'SELECT * FROM non_existent_table';
            database.query(query).catch(() => new Error('Table does not exist'));

            const value = await database.getVal(query);
            expect(value).to.be.null;
        });
    });

    // Test suite for insert
    describe('insert', () => {
        it('should insert a new row into the table', async () => {
            const name = 'David';
            await database.insert('example', { name });

            // Verify that the new row is in the table
            const result = await database.getVal('SELECT name FROM example WHERE name = ?', [name]);
            expect(result).to.equal(name);
        });

        it('should return the id of the last inserted row', async () => {
            const name = 'Eve';
            const id = await database.insert('example', { name });

            // Verify that the returned id is correct
            const result = await database.getVal('SELECT id FROM example WHERE name = ?', [name]);
            expect(id).to.equal(result);
        });

        it('should return null and log an error when there is a problem with the insertion', async () => {
            // Let's try to insert a row with the same id of an existing one
            // This should violate the PRIMARY KEY constraint
            const existingId = 1;
            const result = await database.insert('example', { id: existingId, name: 'Test'});

            // The insert function should return null when there's a problem
            expect(result).to.be.null;
        });
    });

    // Test suite for update
    describe('update', () => {
        it('should update a row in the table', async () => {
            const newName = 'UpdatedAlice';
            await database.update('example', {name: newName}, {id: 1});

            // Verify that the row was updated
            const result = await database.getVal('SELECT name FROM example WHERE id = 1');
            expect(result).to.equal(newName);
        });
    });

    after(() => {
        // Close the database connection after tests
        database.close();
    });
});