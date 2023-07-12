const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { isAfter } = require('date-fns');

const { OBJECT_STORAGE_IMPLEMENTATION } = require('./config');
const {
  ProfileImagesObjectStorage,
  FloorplansObjectStorage,
} = require('./lib/object-storage');

const app = express();

app.get('/', (req, res) => res.send('Object storage interface example app'));
app.use(morgan('tiny'));

// An example of getting / putting data to object storage directly
app.get('/profile-images/:key', (req, res) => {
  ProfileImagesObjectStorage.get(req.params.key).then(result => {
    if (result) {
      res.set('Content-Type', 'image/png').send(result);
    } else {
      res.status(404).send(`Unknown profile image ${req.params.key}!`);
    }
  }).catch(err => {
    console.error(err);
    res.status(500).end();
  });
});
app.put('/profile-images/:key', bodyParser.raw({ type: 'image/png' }), (req, res) => {
  ProfileImagesObjectStorage.put(req.params.key, req.body).then(result => {
    res.status(204).end();
  }).catch(err => {
    console.error(err);
    res.status(500).send(`Error putting profile image!`);
  });
});

// An example getting a presigned url for an entity
//
// NOTE: This is probably preferrable to proxying a get through to the object store like the profile
// images example above, since all that file traffic can be offloaded to the object storage service
// (s3, etc)
app.get('/floorplans/:id', (req, res) => {
  FloorplansObjectStorage.getSignedUrl(`${req.params.id}.svg`).then(signedUrl => {
    res.send({
      id: req.params.id,
      otherFields: 'probablyGoHere',
      imageSignedUrl: signedUrl,
    });
  }).catch(err => {
    console.error(err);
    res.status(404).send(`Cannot find floorplan image for key ${req.params.id}!`);
  });
});

// This route is used in concert with the code in lib/object-storage.js to make the local object
// store's presigned links work.
app.use('/local-object-signed-links', (req, res, next) => {
  // Disable this endpoint if the local object storage implementation is not enabled
  if (OBJECT_STORAGE_IMPLEMENTATION !== 'local') {
    res.status(404).end();
    return;
  }

  // When generating local signed links, the `expiresAt` parameter is specified to simulate
  // the behavior of a cloud storage generated signed link expiring after a certain amount
  // of time.
  const expiresAt = req.query.expiresAt;
  if (expiresAt) {
    const expiresAtDate = new Date(`${expiresAt}`);
    const now = new Date();
    if (isAfter(now, expiresAtDate)) {
      res.status(403).send({ error: 'Signed link expired!' });
      return;
    }
  }
  next();
}, express.static('.local-object-storage'));

const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, () => {
  console.log(`* Listening on port ${port}`);
});
