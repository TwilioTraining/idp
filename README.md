# Stub IdP functions for fake SSO

### What is this thing?
This repo is a pair of functions that shamelessly rip off a load of code from [this stub saml idp here](https://github.com/mcguinness/saml-idp)


### Prerequisites

    - fast-xml-parser
    - hbs
    - saml
    - xml-crypto
    - zlib

### Environment variables

1. For local development
    - ISSUER=https://[some-ngrok-domain].ngrok.io/entityid

1. When deployed to twilio functions infrastructure you'll need to set ISSUER accordingly
    - ISSUER=https://[servicename-NNNN]-dev.twil.io/entityid


### Functions/Endpoints

These functions fake a SAML 2.0 sign in with HTTP POST bindings.

There are 3 end points / functions of interest in the repo:

    - sso.js on path /saml/sso which just takes a signed SAML SSO request and renders a form that displays some of the information about the request and a contains a hard coded username that will be singed in when the form is submitted

    - sign-in.js on path /saml/sign-in which is the fake sign in process. It does not check the user against any state in the fake idp system (there is no state). Rather it just creates a valid signed SAML response and renders that response back in a self submitting form (i.e. the HTTP POST binding) to the requesting service.

    - cert.js on path /cert which renders the public cert that clients will need for their SSO configuration.

There other js files in the functions directory are config and utility code.

For this to work with an external service you need to generate a key pair and share the public cert with the external service.

### Generating a key pair

```
openssl req -x509 -new -newkey rsa:2048 -nodes -subj '/C=US/ST=California/L=San Francisco/O=Twilip/CN=Test  Identity Provider' -keyout idp-private-key.pem -out idp-public-cert.pem
```

Note keep the names as they are in the sample openssl command above as those filename are what the function expects to find.

Upload the key pair as as private assets for the function.