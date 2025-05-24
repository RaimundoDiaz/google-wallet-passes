# Creating a Web Service for Google and Apple Wallet Passes with Node.js

## Introduction

Digital wallet passes are increasingly popular for loyalty programs, event tickets, and more, offering convenience for both users and businesses. While developing a web service for Google and Apple Wallet using Node.js, I noticed a lack of comprehensive resources on this topic. To bridge this gap, I decided to write an article to assist others who are interested in creating similar services.

In this article, I will guide you through the process of creating and updating Google and Apple Wallet passes.

## Table of Contents

This article is structured as follows to guide you step-by-step through the process:

- [Creating a Web Service for Google and Apple Wallet Passes with Node.js](#creating-a-web-service-for-google-and-apple-wallet-passes-with-nodejs)
  - [Introduction](#introduction)
  - [Table of Contents](#table-of-contents)
  - [Google](#google)
    - [Preparation](#preparation)
    - [Creating Pass Classes and Objects](#creating-pass-classes-and-objects)
    - [Generating Add to Wallet Link](#generating-add-to-wallet-link)
    - [Updating Pass Classes and Objects](#updating-pass-classes-and-objects)
    - [Expiring Pass Objects](#expiring-pass-objects)
    - [How to run the code](#how-to-run-the-code)

## Google

We’ll begin with Google Wallet integration, as it is simpler and quicker to implement compared to Apple Wallet. The code examples in this article are based on the Node.js samples from the [Google Wallet repository](https://github.com/google-wallet/rest-samples), which I have customized for this project.

### Preparation

Before writing any code, it’s essential to ensure you have the necessary accounts and tools set up to avoid issues later. Follow the steps outlined in the [Google Wallet prerequisites](https://developers.google.com/wallet/retail/loyalty-cards#requirements).

1. Create a [Google Wallet API Issuer account](https://developers.google.com/wallet/retail/loyalty-cards/getting-started/issuer-onboarding).
2. For non-Android developers: Create a [Google Cloud account](https://console.cloud.google.com/freetrial).
3. For Android developers: [Set up Google Play services](https://developers.google.com/android/guides/setup).

The following dependencies are required to interact with the Google Wallet API and manage environment variables securely:

```
  @googleapis/walletobjects
  dotenv
  jsonwebtoken
```

### Creating Pass Classes and Objects

To create a pass in Google Wallet, you first need to create the Pass Class, which contains information about the pass creator, or _pass issuer_ in Google terms. Once the Pass Class is created, you create the Pass Object, which is the instance of the pass.

Before creating the classes, I defined types to work better:

```js
/**
 * @typedef {object} LoyaltyClass
 * @property {string} programName
 * @property {string} issuerName
 * @property {string} logoUri
 */

/**
 * @typedef {object} LoyaltyObject
 * @property {string} QrCodeLink
 * @property {string} accountId
 * @property {string} FullName
 * @property {int} [points]
 */
```

To work better, I created a class called LoyaltyPass, which handles everything related to passes:

`loyaltyPass.js`

`LoyaltyPass`

```js
/*
 * Copyright 2022 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

class LoyaltyPass {
  constructor() {
    /**
     * Path to service account key file from Google Cloud Console. Environment
     * variable: GOOGLE_APPLICATION_CREDENTIALS.
     */
    this.issuerId = process.env.WALLET_ISSUER_ID;
    this.keyFile =
      process.env.GOOGLE_APPLICATION_CREDENTIALS || "/path/to/key.json"; // You can choose if you want to use the keyFile
    this.credentials = {
      // Or the credentials
      type: process.env.TYPE,
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
      private_key_id: process.env.PRIVATE_KEY_ID,
      project_id: process.env.PROJECT_ID,
      client_id: process.env.CLIENT_ID,
      universe_domain: process.env.UNIVERSE_DOMAIN,
    };
    this.auth();
  }

  /**
   * Create authenticated HTTP client using a service account file.
   */
  auth() {
    const auth = new GoogleAuth({
      // Here instead of using credentials you can use `keyFile: this.keyFile`
      // I rather use credentials to prevent uploading sensitive data as the keyFile where I will be hosting my code
      credentials: this.credentials,
      scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
    });

    this.client = walletobjects({
      version: "v1",
      auth: auth,
    });
  }
}
```

`loyaltyPass.js`

`LoyaltyPass.createClass`

```js
/**
   * Create a class.
   *
   * @param {string} classSuffix Developer-defined unique ID for this pass class.
   * @param {LoyaltyClass} loyaltyClass The properties for the loyalty class to create.
   *
   * @returns {string} The pass class ID: `${issuerId}.${classSuffix}`
   */
async createClass(classSuffix, loyaltyClass) {
    let response;

    // Check if the class exists
    try {
      await this.client.loyaltyclass.get({
        resourceId: `${this.issuerId}.${classSuffix}`,
      });

      console.log(`Class ${this.issuerId}.${classSuffix} already exists!`);

      return `${this.issuerId}.${classSuffix}`;
    } catch (err) {
      if (err.response && err.response.status !== 404) {
        // Something else went wrong...
        console.log(err);
        return `${this.issuerId}.${classSuffix}`;
      }
    }

    // See link below for more information on required properties
    // https://developers.google.com/wallet/retail/loyalty-cards/rest/v1/loyaltyclass
    let newClass = {
      id: `${this.issuerId}.${classSuffix}`,
      issuerName: loyaltyClass.issuerName,
      reviewStatus: "UNDER_REVIEW",
      programName: loyaltyClass.programName,
      programLogo: {
        sourceUri: {
          uri: loyaltyClass.logoUri,
        },
      },
    };

    response = await this.client.loyaltyclass.insert({
      requestBody: newClass,
    });

    console.log("Class insert response status: ", response.status);

    return `${this.issuerId}.${classSuffix}`;
  }
```

After creating the Pass Class we can create the Pass Object:

`loyaltyPass.js`

`LoyaltyPass.createObject`

```js
/**
   * Create an object.
   *
   * @param {string} classSuffix Developer-defined unique ID for the pass class.
   * @param {string} objectSuffix Developer-defined unique ID for the pass object.
   * @param {LoyaltyObject} loyaltyObject The properties for the loyalty object to create.
   *
   * @returns {string} The pass object ID: `${issuerId}.${objectSuffix}`
   */
  async createObject(classSuffix, objectSuffix, loyaltyObject) {
    let response;

    // Check if the object exists
    try {
      await this.client.loyaltyobject.get({
        resourceId: `${this.issuerId}.${objectSuffix}`
      });

      console.log(`Object ${this.issuerId}.${objectSuffix} already exists!`);

      return `${this.issuerId}.${objectSuffix}`;
    } catch (err) {
      if (err.response && err.response.status !== 404) {
        // Something else went wrong...
        console.log(err);
        return `${this.issuerId}.${objectSuffix}`;
      }
    }

    // See link below for more information on required properties
    // https://developers.google.com/wallet/retail/loyalty-cards/rest/v1/loyaltyobject
    let newObject = {
      'id': `${this.issuerId}.${objectSuffix}`,
      'classId': `${this.issuerId}.${classSuffix}`,
      'state': 'ACTIVE',
      'barcode': {
        'type': 'QR_CODE',
        'value': loyaltyObject.QrCodeLink
      },
      'accountId': loyaltyObject.accountId,
      'accountName': loyaltyObject.FullName,
      // Left Column
      'loyaltyPoints': {
        'label': 'Code',
        'balance': {
          'string': loyaltyObject.accountId
        }
      },
      // Right Column (Optional)
        'secondaryLoyaltyPoints': {
          'label': 'Puntos',
          'balance': {
            'int': 0
          }
        },
    };

    response = await this.client.loyaltyobject.insert({
      requestBody: newObject
    });

    console.log('Object insert response status: ', response.status);

    return `${this.issuerId}.${objectSuffix}`;
  }
```

### Generating Add to Wallet Link

Finally we can generate the addToWallet link for the created pass

`loyaltyPass.js`

`LoyaltyPass.createJwtExistingObject`

```js
/**
   * Generate a signed JWT that references an existing pass object.
   *
   * When the user opens the "Add to Google Wallet" URL and saves the pass to
   * their wallet, the pass objects defined in the JWT are added to the
   * user's Google Wallet app. This allows the user to save multiple pass
   * objects in one API call.
   *
   * The objects to add must follow the below format:
   *
   *  {
   *    'id': 'ISSUER_ID.OBJECT_SUFFIX',
   *    'classId': 'ISSUER_ID.CLASS_SUFFIX'
   *  }
   *
   * @param {string} classSuffix Developer-defined unique IDs for the pass classes.
   * @param {string} objectSuffix Developer-defined unique IDs for the pass objects.
   *
   * @returns {string} An "Add to Google Wallet" link.
   */
  createJwtExistingObject(classSuffix, objectSuffix) {
    // Create the JWT claims
    let claims = {
      iss: this.credentials.client_email,
      aud: 'google',
      typ: 'savetowallet',
      payload: {
        loyaltyObjects: [{
          'id': `${this.issuerId}.${objectSuffix}`,
          'classId': `${this.issuerId}.${classSuffix}`
        }]
      }
    };

    // The service account credentials are used to sign the JWT
    let token = jwt.sign(claims, this.credentials.private_key, { algorithm: 'RS256' });

    console.log('Add to Google Wallet link');
    console.log(`https://pay.google.com/gp/v/save/${token}`);

    return `https://pay.google.com/gp/v/save/${token}`;
  }
```

### Updating Pass Classes and Objects

Now that we created our pass we can update the class or the object:

`loyaltyPass.js`

`LoyaltyPass.patchClass`

```js
  /**
   * Patch a class.
   *
   * The PATCH method supports patch semantics.
   *
   * @param {string} classSuffix Developer-defined unique ID for this pass class.
   * @param {LoyaltyClass} loyaltyClass The properties for the loyalty class to patch.
   *
   * @returns {string} The pass class ID: `${issuerId}.${classSuffix}`
   */
  async patchClass(classSuffix, loyaltyClass) {
    let response;

    // Check if the class exists
    try {
      response = await this.client.loyaltyclass.get({
        resourceId: `${this.issuerId}.${classSuffix}`,
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log(`Class ${this.issuerId}.${classSuffix} not found!`);
        return `${this.issuerId}.${classSuffix}`;
      } else {
        // Something else went wrong...
        console.log(err);
        return `${this.issuerId}.${classSuffix}`;
      }
    }

    // Patch the class
    let patchBody = {
      id: `${this.issuerId}.${classSuffix}`,
      issuerName: loyaltyClass.issuerName,
      programName: loyaltyClass.programName,
      programLogo: {
        sourceUri: {
          uri: loyaltyClass.logoUri,
        },
      },
      // Note: reviewStatus must be 'UNDER_REVIEW' or 'DRAFT' for updates
      reviewStatus: "UNDER_REVIEW",
    };

    response = await this.client.loyaltyclass.patch({
      resourceId: `${this.issuerId}.${classSuffix}`,
      requestBody: patchBody,
    });

    console.log("Class patch response status: ", response.status);

    return `${this.issuerId}.${classSuffix}`;
  }
```

`loyaltyPass.js`

`LoyaltyPass.patchObject`

```js
  /**
   * Patch an object.
   *
   * @param {string} objectSuffix Developer-defined unique ID for the pass object.
   * @param {LoyaltyObject} loyaltyObject The properties for the loyalty object to patch.
   *
   * @returns {string} The pass object ID: `${issuerId}.${objectSuffix}`
   */
  async patchObject(objectSuffix, loyaltyObject) {
    let response;

    // Check if the object exists
    try {
      response = await this.client.loyaltyobject.get({
        resourceId: `${this.issuerId}.${objectSuffix}`
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log(`Object ${this.issuerId}.${objectSuffix} not found!`);
        return `${this.issuerId}.${objectSuffix}`;
      } else {
        // Something else went wrong...
        console.log(err);
        return `${this.issuerId}.${objectSuffix}`;
      }
    }

    let patchBody = {
      'barcode': {
        'type': 'QR_CODE',
        'value': loyaltyObject.QrCodeLink
      },
      'accountId': loyaltyObject.accountId,
      'accountName': loyaltyObject.FullName,
      // Left Column
      'loyaltyPoints': {
        'label': 'Code',
        'balance': {
          'string': loyaltyObject.accountId
        }
      },
      // Right Column (Optional)
      'secondaryLoyaltyPoints': {
        'label': 'Points',
        'balance': {
          'int': loyaltyObject.points
        }
      },
    }

    response = await this.client.loyaltyobject.patch({
      resourceId: `${this.issuerId}.${objectSuffix}`,
      requestBody: patchBody
    });

    console.log('Object patch response status: ', response.status);

    return `${this.issuerId}.${objectSuffix}`;
  }
```

### Expiring Pass Objects

We can also expire the pass

`loyaltyPass.js`

`LoyaltyPass.expireObject`

```js
  /**
   * Expire an object.
   *
   * Sets the object's state to Expired. If the valid time interval is
   * already set, the pass will expire automatically up to 24 hours after.
   *
   * @param {string} objectSuffix Developer-defined unique ID for the pass object.
   *
   * @returns {string} The pass object ID: `${issuerId}.${objectSuffix}`
   */
  async expireObject(objectSuffix) {
    let response;

    // Check if the object exists
    try {
      response = await this.client.loyaltyobject.get({
        resourceId: `${this.issuerId}.${objectSuffix}`
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log(`Object ${this.issuerId}.${objectSuffix} not found!`);
        return `${this.issuerId}.${objectSuffix}`;
      } else {
        // Something else went wrong...
        console.log(err);
        return `${this.issuerId}.${objectSuffix}`;
      }
    }

    // Patch the object, setting the pass as expired
    let patchBody = {
      'state': 'EXPIRED'
    };

    response = await this.client.loyaltyobject.patch({
      resourceId: `${this.issuerId}.${objectSuffix}`,
      requestBody: patchBody
    });

    console.log('Object expiration response status: ', response.status);

    return `${this.issuerId}.${objectSuffix}`;
  }
```

### How to run the code

Finally to run the code I created a `main.js` file. You can just do `node main.js` to run it.

`main.js`

```js
require("dotenv").config();

const { LoyaltyPass } = require("./loyaltyPass");

async function main() {
  let loyaltyPass = new LoyaltyPass();

  const class_suffix = "my-loyalty-class";
  const object_suffix = "my-loyalty-object";

  // Create a pass class
  const myClass = await loyaltyPass.createClass(class_suffix, {
    programName: "My Loyalty Program",
    issuerName: "My Company",
    logoUri:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/150px-Google_%22G%22_logo.svg.png",
  });

  // Create a pass object
  const myObject = await loyaltyPass.createObject(class_suffix, object_suffix, {
    accountId: "SQ-13579A",
    FullName: "John Doe",
    QrCodeLink: "https://www.qrstuff.com/images/default_qrcode.png",
  });

  // Generate an Add to Google Wallet link that creates a new pass class and object
  const myJwt = await loyaltyPass.createJwtExistingObject(
    class_suffix,
    object_suffix
  );

  // Update a pass class
  const patchedClass = await loyaltyPass.patchClass(class_suffix, {
    programName: "Loyalty Program Renewed!",
    issuerName: "My Company Renewed",
    logoUri:
      "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  });

  // Update a pass object
  const patchedObject = await loyaltyPass.patchObject(object_suffix, {
    accountId: "SQ-13579A",
    FullName: "John Doe",
    QrCodeLink: "https://www.qrstuff.com/images/default_qrcode.png",
    points: 100,
  });

  // Expire a pass object
  const expiredObject = await loyaltyPass.expireObject(object_suffix);
}

main().catch(console.error);
```
