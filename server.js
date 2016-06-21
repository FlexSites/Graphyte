'use strict';

const express = require('express');
const config = require('config');
const json = require('body-parser').json;
const { tenants: tenancy } = require('./lib/tenancy');
const cors = require('cors');
const { PLATFORM_HEADER } = require('./constants');
const { BadRequestError } = require('./lib/errors');
const { introspectionQuery } = require('graphql');

const app = express();


app.use(json());
app.use(cors());
app.use((req, res, next) => {
  let platformId = req.get(PLATFORM_HEADER);
  if (!platformId) return next(new BadRequestError(`Header "${PLATFORM_HEADER}" is required.`));
  req.tenant = tenancy.tenant(platformId);
  next();
});


// app.use(staticMiddleware);
// app.use(express.static(path.resolve(__dirname, '../client/dist')));

app.post('/graph', ({ body: { query }, tenant, user }, res, next) => {
  if (!query) query = introspectionQuery;
  tenant
    .connection('graphql')
    .execute(query, { tenant, user })
    .then(res.send.bind(res))
    .catch(next);
});

app.use((err, req, res, next) => {
  console.error(err);

  let status = err.status || 500;

  res
    .status(status)
    .send({
      message: err.message || 'Server Error',
      status: err.status || 500,
    });
})

console.log('listening on ', config.get('port'));
app.listen(
  config.get('port'),
  () => console.log(`Booted on port ${config.get('port')}`)
);
