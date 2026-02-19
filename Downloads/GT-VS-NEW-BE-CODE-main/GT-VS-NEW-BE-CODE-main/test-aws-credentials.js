require('dotenv').config();
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

console.log('Testing AWS S3 Credentials...\n');

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_STORAGE_BUCKET_NAME;
const region = process.env.REGION;

console.log('Configuration:');
console.log('- Access Key ID:', accessKeyId ? `***${accessKeyId.slice(-4)}` : 'NOT SET');
console.log('- Secret Key:', secretAccessKey ? `***${secretAccessKey.slice(-4)}` : 'NOT SET');
console.log('- Bucket Name:', bucketName || 'NOT SET');
console.log('- Region:', region || 'NOT SET');

if (!accessKeyId || !secretAccessKey || !bucketName || !region) {
  console.log('\n❌ ERROR: Missing AWS credentials in .env file');
  process.exit(1);
}

if (accessKeyId.includes('your_') || secretAccessKey.includes('your_')) {
  console.log('\n❌ ERROR: AWS credentials contain placeholder values');
  process.exit(1);
}

try {
  const s3Client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey
    }
  });

  console.log('\n✓ S3Client created successfully');
  console.log('\nAttempting to list buckets...');

  const command = new ListBucketsCommand({});
  
  s3Client.send(command).then((response) => {
    console.log('\n✓ AWS credentials are valid!');
    console.log('\nAvailable S3 Buckets:');
    if (response.Buckets && response.Buckets.length > 0) {
      response.Buckets.forEach(bucket => {
        const checkmark = bucket.Name === bucketName ? ' ✓' : '';
        console.log(`  - ${bucket.Name}${checkmark}`);
      });

      if (!response.Buckets.find(b => b.Name === bucketName)) {
        console.log(`\n⚠️  WARNING: The configured bucket "${bucketName}" was not found in your account!`);
        console.log('Please create this bucket in your AWS S3 console or update AWS_STORAGE_BUCKET_NAME in .env');
      } else {
        console.log(`\n✓ Bucket "${bucketName}" exists and is accessible!`);
      }
    } else {
      console.log('  No buckets found in your AWS account');
    }
  }).catch((error) => {
    console.error('\n❌ ERROR: Failed to list buckets');
    console.error('Error details:', error.message);
    if (error.message.includes('InvalidAccessKeyId')) {
      console.error('The AWS Access Key ID is invalid');
    } else if (error.message.includes('SignatureDoesNotMatch')) {
      console.error('The AWS Secret Access Key is incorrect');
    }
    process.exit(1);
  });

} catch (error) {
  console.error('\n❌ ERROR: Failed to create S3 client:', error.message);
  process.exit(1);
}
