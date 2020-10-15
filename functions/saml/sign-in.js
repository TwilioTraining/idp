const fs = require('fs');
const saml = require('saml').Saml20;
const hbs = require('hbs');

const samlFormFile = Runtime.getAssets()['/saml-form.hbs'].path;
const samlFormText = fs.readFileSync(samlFormFile).toString('utf-8');
const samlFormTemplate = hbs.compile(samlFormText);

const samlResponseFile = Runtime.getAssets()['/saml-response.hbs'].path;
const samlResponseText = fs.readFileSync(samlResponseFile).toString('utf-8');
const samlResponseTemplate = hbs.compile(samlResponseText);

const keyPath = Runtime.getAssets()['/idp-private-key.pem'].path;
const certPath = Runtime.getAssets()['/idp-public-cert.pem'].path;
const cert = fs.readFileSync(certPath).toString('utf-8');
const key = fs.readFileSync(keyPath).toString('utf-8');


exports.handler = (context, event, callback) => {
    
    const configPath = Runtime.getFunctions()['saml/config'].path;
    const utilsPath = Runtime.getFunctions()['saml/utils'].path;

    const config = require(configPath);
    const utils = require(utilsPath);

    const authOptions = config.options;

    authOptions.cert = cert;
    authOptions.key = key;

    Object.keys(event).forEach(function(key) {
        // decode _authnRequest and set values on authnRequest in options
        var buffer;
        if (key === '_authnRequest') {
            buffer = Buffer.from(event[key], 'base64');
            event['authnRequest'] = JSON.parse(buffer.toString('utf8'));
            authOptions.inResponseTo = event.authnRequest.id;
            authOptions.acsUrl = event.authnRequest.acsUrl;
            authOptions.recipient = event.authnRequest.acsUrl;
            authOptions.destination = event.authnRequest.acsUrl;
            authOptions.forceAuthn = event.authnRequest.forceAuthn;
            authOptions.RelayState = event.authnRequest.relayState;
        }
    });

    authOptions.nameIdentifier = config.user.email;
    authOptions.attributes = { "email": config.user.email, "roles": event.roles }
    authOptions.sessionIndex = event.sessionIndex;

    saml.create(authOptions, function(err, signedAssertion) {
        if (err) {
            console.log(err);
            return callback('error', err);
        }
        const samlResponseContent = utils.buildSamlResponse(samlResponseTemplate, authOptions, signedAssertion);
        const token = Buffer.from(samlResponseContent).toString('base64');
        const formData = {
            postUrl: authOptions.recipient,
            token: token,
            relayState: authOptions.RelayState,
        }
        const templateContent = samlFormTemplate(formData);
        const response = new Twilio.Response();
        response.appendHeader('Content-Type', 'text/html; charset=utf-8');
        response.setBody(templateContent);
        return callback(null, response);
    });
};