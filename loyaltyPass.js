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

const { walletobjects, auth: { GoogleAuth } } = require("@googleapis/walletobjects");
const jwt = require("jsonwebtoken");

/**
 * @typedef {object} LoyaltyClass
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

class LoyaltyPass {
  constructor() {
    /**
     * Path to service account key file from Google Cloud Console. Environment
     * variable: GOOGLE_APPLICATION_CREDENTIALS.
     */
    // COMENTARIO: SE PUEDE USAR EL ARCHIVO O PASAR CREDENCIALES EN EL AUTH, YO USO CREDENCIAL PARA USAR VARIABLES DE AMBIENTE Y EVITAR SUBIR ARCHIVOS, PARA TENER MAS SEGURIDAD
    this.keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/path/to/key.json';
    this.issuerId = process.env.WALLET_ISSUER_ID;
    this.credentials = {
      type: process.env.TYPE,
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
      private_key_id: process.env.PRIVATE_KEY_ID,
      project_id: process.env.PROJECT_ID,
      client_id: process.env.CLIENT_ID,
      universe_domain: process.env.UNIVERSE_DOMAIN,
    }
    this.auth();
  }

  /**
   * Create authenticated HTTP client using a service account file.
   */
  auth() {
    const auth = new GoogleAuth({
      // COMENTARIO: ACA PUEDES USAR credentials: this.credentials, PARA PASAR LAS CREDENCIALES DIRECTAMENTE EN VEZ DE USAR EL ARCHIVO keyFile
      credentials: this.credentials,
      scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
    });

    this.client = walletobjects({
      version: "v1",
      auth: auth,
    });
  }

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
}

module.exports = { LoyaltyPass };
