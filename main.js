require('dotenv').config();

const { LoyaltyPass } = require('./loyaltyPass');

async function main() {
  let loyaltyPass = new LoyaltyPass();

  const class_suffix = 'my-loyalty-class';
  const object_suffix = 'my-loyalty-object';

  // Create a pass class
  const myClass = await loyaltyPass.createClass(
    class_suffix,
    {
      programName: 'My Loyalty Program',
      issuerName: 'My Company',
      logoUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/150px-Google_%22G%22_logo.svg.png',
    }
  );

  // Create a pass object
  const myObject = await loyaltyPass.createObject(
    class_suffix,
    object_suffix,
    {
      accountId: 'SQ-13579A',
      FullName: 'John Doe',
      QrCodeLink: 'https://www.qrstuff.com/images/default_qrcode.png'
    }
  );

  // Generate an Add to Google Wallet link that creates a new pass class and object
  const myJwt = await loyaltyPass.createJwtExistingObject(
    class_suffix,
    object_suffix
  );

  // Update a pass class
  const patchedClass = await loyaltyPass.patchClass(
    class_suffix,
    {
      programName: 'Loyalty Program Renewed!',
      issuerName: 'My Company Renewed',
      logoUri: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'
    }
  );

  // Update a pass object
  const patchedObject = await loyaltyPass.patchObject(
    object_suffix,
    {
      accountId: 'SQ-13579A',
      FullName: 'John Doe',
      QrCodeLink: 'https://www.qrstuff.com/images/default_qrcode.png',
      points: 100
    }
  );

  // Expire a pass object
  const expiredObject = await loyaltyPass.expireObject(
    object_suffix
  );
}

main().catch(console.error);
