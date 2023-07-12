const fs = require('fs/promises');
const path = require('path');
const { addMilliseconds } = require('date-fns');
const AWS = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const {
  BASE_PROJECT_DIRECTORY,
  PUBLIC_BASE_URL,
  OBJECT_STORAGE_IMPLEMENTATION,
  OBJECT_STORAGE_DEFAULT_EXPIRE_TIME_MILLSECONDS,
  OBJECT_STORAGE_BEATS_S3_BUCKET,
  OBJECT_STORAGE_FLOORPLANS_S3_BUCKET,
} = require('../config');

// Below, a number of different object storage implementations are defined. Importantly, they all
// have the same signature: A function that accepts the type of data to store which returns an
// object with a bunch of functions inside to get data from object storage, put data to object
// storage, generate presigned urls, etc.
//
// The fact that each of these implementations all have the same set of functions / the same
// interface is critical for this approach to work. If you want to implement a behavior in one
// implementation, be sure to implement the behavior in the rest of them as well.

// ----------------------------------------------------------------------------
// LOCAL OBJECT STORAGE
// For use in local development - stores data to a local filesystem directory alongside the project
// ------------------------------------------------------------------------------
const LOCAL_OBJECT_STORAGE_BASE_DIRECTORY = path.join(BASE_PROJECT_DIRECTORY, '.local-object-storage');
const LocalObjectStorage = (dataType) => {
  console.log(`* LocalObjectStorage in use for ${dataType}`);
  return {
    async get(key) {
      const filePath = path.join(LOCAL_OBJECT_STORAGE_BASE_DIRECTORY, dataType, key);
      try {
        const result = await fs.readFile(filePath);
        return result;
      } catch (err) {
        console.error(err)
        return null;
      }
    },

    async put(key, data) {
      const filePath = path.join(LOCAL_OBJECT_STORAGE_BASE_DIRECTORY, dataType, key);
      const directoryPath = path.dirname(filePath);

      await fs.mkdir(directoryPath, { recursive: true });
      await fs.writeFile(filePath, data, { encoding: 'utf8' });
    },

    async putFromFilesystem(key, filePath) {
      const outputFilePath = path.join(LOCAL_OBJECT_STORAGE_BASE_DIRECTORY, dataType, key);
      const outputDirectoryPath = path.dirname(outputFilePath);


      await fs.mkdir(outputDirectoryPath, { recursive: true });
      await fs.copyFile(filePath, outputFilePath);
    },
    
    async getSignedUrl(
      key,
      expiresInMilliseconds = OBJECT_STORAGE_DEFAULT_EXPIRE_TIME_MILLSECONDS,
    ) {
      // NOTE: storing the expiresAt parameter like this works, but is not very secure to external
      // tampering.
      //
      // If using this in a production / on premise environment is desired, then doing
      // something like storing this expiry time into something like redis / a database under a key,
      // and then specifying that key as a querystring parameter might be a more secure way to
      // handle this.
      const expiresAt = expiresInMilliseconds !== null ? addMilliseconds(new Date(), expiresInMilliseconds) : null;
      return `${PUBLIC_BASE_URL}/local-object-signed-links/${dataType}/${key}${expiresAt ? `?expiresAt=${expiresAt.toISOString()}` : ''}`;
    },
  };
};

// ----------------------------------------------------------------------------
// S3 OBJECT STORAGE
// For use in production - read object store data from s3
// ------------------------------------------------------------------------------
const S3ObjectStorage = (dataType) => {
  console.log(`* S3ObjectStorage in use for ${dataType}`);

  // NOTE: the aws sdk library by default will look in the 
  // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables
  // for credentials. It should also fall back to credentials in
  // ~/.aws/credentials as well.
  const s3 = new AWS.S3({ region: 'us-east-1' });

  let bucket;
  switch (dataType) {
    case 'profileimages':
      bucket = OBJECT_STORAGE_PROFILE_IMAGES_S3_BUCKET;
      break;
    case 'floorplans':
      bucket = OBJECT_STORAGE_FLOORPLANS_S3_BUCKET;
      break;
    default:
      throw new Error(`Unknown dataType value '${dataType}' passed to S3ObjectStorage!`);
  }

  return {
    async get(key) {
      try {
        const response = await s3.getObject({ Bucket: bucket, Key: key });
        if (response.Body) {
          return Buffer.from(await response.Body.transformToByteArray());
        }
        return null;

      } catch (err) {
        console.error(err);
        return null;
      }
    },

    async put(key, data) {
      await s3.putObject({ Bucket: bucket, Key: key, Body: data });
    },

    async putFromFilesystem(key, filePath) {
      const data = await fs.readFile(filePath)
      await s3.putObject({ Bucket: bucket, Key: key, Body: data });
    },
    
    async getSignedUrl(
      key,
      expiresInMilliseconds = OBJECT_STORAGE_DEFAULT_EXPIRE_TIME_MILLSECONDS,
    ) {
      const expiresAt = expiresInMilliseconds ? addMilliseconds(new Date(), expiresInMilliseconds) : undefined;

      try {
        const url = await getSignedUrl(s3, new AWS.GetObjectCommand({
          Bucket: bucket,
          Key: key,
          ResponseExpires: expiresAt,
        }));
        return url;
      } catch (err) {
        console.error(err)
        return null;
      }
    },
  };
};


// Figure out which object storage provider to use, based on the value of
// `OBJECT_STORAGE_IMPLEMENTATION`.
const ConfiguredObjectStorage = {
  local: LocalObjectStorage,
  s3: S3ObjectStorage,
  // Potentially one could add here something like this here:
  // azure: AzureObjectStorage,
}[OBJECT_STORAGE_IMPLEMENTATION];

// But, fall back to `LocalObjectStorage` if no entry can be found for `OBJECT_STORAGE_IMPLEMENTATION`
const ObjectStorage = ConfiguredObjectStorage || LocalObjectStorage;

// Now that the object storage provider is determined, create it for each type of data you'd like to
// store.
//
// For example, with the below:
// 1. Store profile images in one s3 bucket in production
const ProfileImagesObjectStorage = ObjectStorage('profileimages');
exports.ProfileImagesObjectStorage = ProfileImagesObjectStorage;
// 2. Store floorplans in another s3 bucket in production
const FloorplansObjectStorage = ObjectStorage('floorplans');
exports.FloorplansObjectStorage = FloorplansObjectStorage;
