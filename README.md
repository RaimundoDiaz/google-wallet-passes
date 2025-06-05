# Google Wallet Node.js

This project is based on the Node.js examples from the Google Wallet repository, which I modified to suit my needs. You can find the original repository here: [google-wallet/rest-samples](https://github.com/google-wallet/rest-samples).

In this article, I will walk you through the process of creating and updating passes for Google Wallet. I also cover the process for [Apple Wallet here](https://github.com/RaimundoDiaz/apple-wallet-passes).

## Prerequisites

* Node.js 18.x
* NPM 8.x
* Follow the steps outlined in the [Google Wallet prerequisites](https://developers.google.com/wallet/generic/web/prerequisites) to create the Google Wallet issuer account and Google Cloud service account.

## Environment Variables

The following environment variables must be set. Alternatively, you can update the code files to set the values directly. They can be found in the constructor for each class file.

| Environment Variable          | Description                                               | Example                                                                                           |
| ----------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `WALLET_ISSUER_ID`            | Issuer ID found in the Google Pay & Google Wallet Console | `1234567890123456789`                                                                             |
| `TYPE`                        | Type of the service account                               | `service_account`                                                                                 |
| `PROJECT_ID`                  | Google Cloud project ID                                   | `example-project-id`                                                                              |
| `PRIVATE_KEY_ID`              | Private key ID                                            | `abcdef1234567890`                                                                                |
| `PRIVATE_KEY`                 | Private key                                               | `-----BEGIN PRIVATE KEY-----\nEXAMPLEKEY\n-----END PRIVATE KEY-----\n`                            |
| `CLIENT_EMAIL`                | Client email                                              | `example-email@project.iam.gserviceaccount.com`                                                   |
| `CLIENT_ID`                   | Client ID                                                 | `123456789012345678901`                                                                           |
| `AUTH_URI`                    | Authentication URI                                        | `https://accounts.google.com/o/oauth2/auth`                                                       |
| `TOKEN_URI`                   | Token URI                                                 | `https://oauth2.googleapis.com/token`                                                             |
| `AUTH_PROVIDER_X509_CERT_URL` | Auth provider X509 certificate URL                        | `https://www.googleapis.com/oauth2/v1/certs`                                                      |
| `CLIENT_X509_CERT_URL`        | Client X509 certificate URL                               | `https://www.googleapis.com/robot/v1/metadata/x509/example-email@project.iam.gserviceaccount.com` |
| `UNIVERSE_DOMAIN`             | Universe domain                                           | `googleapis.com`                                                                                  |

## How to Use the Code

1. Use `npm` to install the dependencies in the [package.json](./package.json):

    ```bash
    # This must be run from the same location as the package.json
    npm install
    ```

2. Make sure to comment out the methods you don't want to use. If you use all of them at the same time, you won't be able to see the changes in the pass.

3. Run the `main.js` file:

    ```bash
    # This must be run from the same location as the main.js
    node main.js
    ```
