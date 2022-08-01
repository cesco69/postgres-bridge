import test from 'ava';
import {
  Pool,
} from 'pg';
import postgres from 'postgres';
import * as sinon from 'sinon';
import {
  bridge,
} from '../../src/bridge';

const clients = [
  'pg',
  'postgres',
];

const createPool = (clientName: string, poolConfiguration) => {
  if (clientName === 'pg') {
    return new Pool(poolConfiguration);
  }

  return bridge(postgres, {
    ...poolConfiguration,
  });
};

for (const client of clients) {
  test(client + ': connect event is fired when a new connection is made', async (t) => {
    const pool = createPool(client, {
      user: 'postgres',
    });

    const spy = sinon.spy();

    pool.on('connect', spy);

    const connection = await pool.connect();

    t.true(spy.called);

    t.is(spy.firstCall.args[0], connection);
  });

  test(client + ': query method', async (t) => {
    const pool = createPool(client, {
      user: 'postgres',
    });

    const connection = await pool.connect();

    const result = await connection.query('SELECT 1');

    t.is(result.rows.length, 1);
    t.is(result.command, 'SELECT');
    t.like(result.rows[0],
      {
        '?column?': 1,
      });
    t.like(result.fields[0],
      {
        dataTypeID: 23,
        name: '?column?',
      });
  });
}
