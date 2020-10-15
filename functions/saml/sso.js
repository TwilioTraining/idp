const zlib = require('zlib');
const parser = require('fast-xml-parser');
const fs = require('fs');
const hbs = require('hbs');
const { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require('constants');

hbs.registerHelper('serialize', function(context) {
    return Buffer.from(JSON.stringify(context)).toString('base64');
});

const file = Runtime.getAssets()['/login.hbs'].path;
const text = fs.readFileSync(file).toString('utf-8');
const template = hbs.compile(text);

const buildResponse = (data, callback) => {
    const result = template(data);
    const response = new Twilio.Response();
    response.appendHeader('Content-Type', 'text/html; charset=utf-8');
    response.setBody(result);
    return callback(null, response);
}

exports.handler = (context, event, callback) => {

    const configPath = Runtime.getFunctions()['saml/config'].path;
    const utilsPath = Runtime.getFunctions()['saml/utils'].path;

    const config = require(configPath);
    const utils = require(utilsPath);

    const xmlOptions = {
        ignoreAttributes: false,
        parseNodeValue: true,
        parseAttributeValue: true,
        trimValues: true,
    }

    config.samlData.idp.issuer = `https://${process.env.ISSUER ? process.env.ISSUER : context.DOMAIN_NAME}/entityid`;

    let input = Buffer.from(event.SAMLRequest, 'base64');
    zlib.inflateRaw(input, function(err, buffer) {
        if (err) {
            console.log(err);
            return callback('error unzipping compressed data', err);
        }
        try {
            const xml = buffer.toString();
            const jsonObj = parser.parse(xml, xmlOptions);
            const samlParsed = jsonObj['samlp:AuthnRequest'];
            const authnRequest = {
                relayState: event.RelayState,
                id: samlParsed['@_ID'],
                issuer: samlParsed['saml:Issuer'],
                destination: samlParsed['@_Destination'],
                acsUrl: samlParsed['@_AssertionConsumerServiceURL'],
                forceAuthn: samlParsed['@_ForceAuthn'] ? true : false,
                sessionIndex: utils.generateUniqueID(),
            }
            config.samlData['authnRequest'] = authnRequest;
            return buildResponse(config.samlData, callback);
        } catch (e) {
            console.log(err);
            callback('caught exception', err);
        }
    });
};