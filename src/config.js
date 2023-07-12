const path = require('path');

// ------------------------------------------------------------------------------
// BASE PROJECT DIRECTORY
//
// This exposes the absolute path of the root of the repository
// ------------------------------------------------------------------------------
const BASE_PROJECT_DIRECTORY = path.dirname(path.dirname(__filename));
exports.BASE_PROJECT_DIRECTORY = BASE_PROJECT_DIRECTORY;

// ------------------------------------------------------------------------------
// PUBLIC BASE URL CONFIGURATION
//
// In production, this environment variable should be configured to be the path
// to the app from outside the local network using any public domain names.
//
// In local development, this could be set to a few things, depending on the situation:
// 1. 'http://localhost:5000' if one is developing the app locally on their system
// 2. 'http://<local ip of system>:5000' if many systems on one's local network are
//    making requests to this server
// 3. Run a tool like `ngrok` locally, and then set this to the url it generates if
//    clients not on one's local network will be making requests
// ------------------------------------------------------------------------------
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || '';
exports.PUBLIC_BASE_URL = PUBLIC_BASE_URL;
if (!PUBLIC_BASE_URL) {
  console.error(`Error parsing environment variable PUBLIC_BASE_URL - found '${PUBLIC_BASE_URL}'. This must be defined!`);
  process.exit(1);
}

// ------------------------------------------------------------------------------
// OBJECT STORAGE CONFIGURATION
//
// Which provider should be used for object storage? Defaults to storing objects
// on the local filesystem.
// ------------------------------------------------------------------------------
const OBJECT_STORAGE_IMPLEMENTATION = (
  process.env.OBJECT_STORAGE_IMPLEMENTATION || 'local'
).toLowerCase();
if (!['local', 's3'].includes(OBJECT_STORAGE_IMPLEMENTATION)) {
  console.error(`Error parsing environment variable OBJECT_STORAGE_IMPLEMENTATION - found '${OBJECT_STORAGE_IMPLEMENTATION}'. This must be either set to 'local' or 's3'.`);
  process.exit(1);
}
exports.OBJECT_STORAGE_IMPLEMENTATION = OBJECT_STORAGE_IMPLEMENTATION;


const OBJECT_STORAGE_DEFAULT_EXPIRE_TIME_MILLSECONDS = 60 * 60 * 1000; // 1 hour
exports.OBJECT_STORAGE_DEFAULT_EXPIRE_TIME_MILLSECONDS = OBJECT_STORAGE_DEFAULT_EXPIRE_TIME_MILLSECONDS;


const OBJECT_STORAGE_PROFILE_IMAGES_S3_BUCKET = process.env.OBJECT_STORAGE_PROFILE_IMAGES_S3_BUCKET || '';
if (OBJECT_STORAGE_IMPLEMENTATION === 's3' && OBJECT_STORAGE_PROFILE_IMAGES_S3_BUCKET.length === 0) {
  console.error(`Error parsing environment variable OBJECT_STORAGE_PROFILE_IMAGES_S3_BUCKET - found '${OBJECT_STORAGE_PROFILE_IMAGES_S3_BUCKET}'. When OBJECT_STORAGE_IMPLEMENTATION is s3, this must be set!`);
  process.exit(1);
}
exports.OBJECT_STORAGE_PROFILE_IMAGES_S3_BUCKET = OBJECT_STORAGE_PROFILE_IMAGES_S3_BUCKET;


const OBJECT_STORAGE_FLOORPLANS_S3_BUCKET = process.env.OBJECT_STORAGE_FLOORPLANS_S3_BUCKET || '';
if (OBJECT_STORAGE_IMPLEMENTATION === 's3' && OBJECT_STORAGE_FLOORPLANS_S3_BUCKET.length === 0) {
  console.error(`Error parsing environment variable OBJECT_STORAGE_FLOORPLANS_S3_BUCKET - found '${OBJECT_STORAGE_FLOORPLANS_S3_BUCKET}'. When OBJECT_STORAGE_IMPLEMENTATION is s3, this must be set!`);
  process.exit(1);
}
exports.OBJECT_STORAGE_FLOORPLANS_S3_BUCKET = OBJECT_STORAGE_FLOORPLANS_S3_BUCKET;
