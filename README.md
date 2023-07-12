# Object Storage Example

This example demonstrates a web server which communicates with an object storage provider. The
object storage provider is configurable via environment variables, and there are two implementations
currently: Amazon S3, and a local object storage implementation.

## Getting started
```bash
$ # Install dependencies
$ npm install
$
$ # Seeds the local object storage with a bunch of profile images and a floorplan svg
$ npm run setup
$
$ # Start the server - it runs by default on port 5000
$ PUBLIC_BASE_URL=http://localhost:5000 npm start
```

# Object Storage implementations walkthrough
Within `src/lib/object-storage.js`, there are two object storage implementations:
1. `LocalObjectStorage` - an object storage implementation backed by the local filesystem
2. `S3ObjectStorage` - an object storage implementation backed by Amazon S3

### `LocalObjectStorage`
The local object storage mechanism is designed be used in local development, or potentially in a
context where the app is not deployed in the cloud, such as an on premise installation.

The `LocalObjectStorage` implementation utilizes a hidden directory in the root of the project called
`.local-object-storage`. Within it are a list of "buckets" represented as directories, and within
each inner directory is the filesystem structure of the bucket:

```
$ tree .local-object-storage/
.local-object-storage/
├── floorplans
│   └── 15.svg
└── profileimages
    ├── one.png
    ├── three.png
    └── two.png

3 directories, 4 files
```

Note that when configured to use the `LocalObjectStorage` implementation, this server is NOT
horizontally scalable!

### `S3ObjectStorage`
The `S3ObjectStorage`implementation proxies all of its operations directly to Amazon S3. This is
expected to be used in production version of the app hosted in AWS.

For more information on how exact operations are implemented, look at the documentation for the aws
sdk.

## Use case one: Profile Images
The `S3ObjectStorage` and `LocalObjectStorage` object storage implementations in
`src/lib/object-storage.js` both implement `get` and `put` functions that can be used to update the
object store directly.

There are two endpoints on the server that is started up that will let you exercise these. First,
to exercise the get, there is an endpoint `GET /profile-images/:key` that will allow you to get
items in the object storage.

If you were to visit `http://localhost:5000/profile-images/one.png` in a web browser, you should
see the first profile image. Both `http://localhost:5000/profile-images/two.png` and
`http://localhost:5000/profile-images/three.png` also should return images, but
`http://localhost:5000/profile-images/four.png` should not.

Now that you have exercised the get path, let's try out the put path. There is a npm task in the
package.json file that will download a mock image from online, and upload it to the server via `PUT
/profile-images/four.png`. Run it by executing `npm run upload-four` - and then afterwards,
`http://localhost:5000/profile-images/four.png` should now return an image if you visit that url in
a web browser.

Also, give this a try with the S3 object storage implementation!

## Use case two: Floorplan Images
Typically, when returning data out of an object storage system back to a client, it is good practice
to use presigned urls generated by the object storage system, as they expire and provide time
limited access to a file.

Both the `S3ObjectStorage` and `LocalObjectStorage` implementations handle this, and this is used in
a mock `floorplans` REST resource that I have created. If you make a request to
`http://localhost:5000/floorplans/15`, you'll get back an example floorplan instance. Within, under
the key `imageSignedUrl` in the returned JSON object, you'll see a signed url.

For the local object storage implementation, this signed url is a url pointing back to the server
where the client is serving data directly out of the local object storage's `.local-object-storage`
directory.

For the s3 implementation, this signed url is generated by s3 directly.
