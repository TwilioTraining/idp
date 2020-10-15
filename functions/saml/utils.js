// Pretty much a direct rip off from https://github.com/mcguinness/saml-idp
const SignedXml = require('xml-crypto').SignedXml;

const generateUniqueID = () => {
    var chars = "abcdef0123456789";
    var uniqueID = "";
    for (var i = 0; i < 20; i++) {
        uniqueID += chars.substr(Math.floor((Math.random() * 15)), 1);
    }
    return uniqueID;
};

const generateInstant = () => {
    var date = new Date();
    return date.getUTCFullYear() + '-' + ('0' + (date.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + date.getUTCDate()).slice(-2) + 'T' + ('0' + date.getUTCHours()).slice(-2) + ":" + ('0' + date.getUTCMinutes()).slice(-2) + ":" + ('0' + date.getUTCSeconds()).slice(-2) + "Z";
};

const removeHeaders = (cert) => {
    var pem = /-----BEGIN (\w*)-----([^-]*)-----END (\w*)-----/g.exec(cert.toString());
    if (pem && pem.length > 0) {
        return pem[2].replace(/[\n|\r\n]/g, '');
    }
    return null;
};

const buildSamlResponse = (samlResponseTemplate, samlOptions, signedAssertion) => {

    const ALGORITHMS_SIGNATURE = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
    const SIGNATURE_LOCATION_PATH = "//*[local-name(.)='Response' and namespace-uri(.)='urn:oasis:names:tc:SAML:2.0:protocol']"

    var samlResponseData = {
        id: '_' + generateUniqueID(),
        issueInstant: generateInstant(),
        destination: samlOptions.destination,
        inResponseTo: samlOptions.inResponseTo,
        issuer: samlOptions.issuer,
        assertion: signedAssertion,
    }

    var SAMLResponse = samlResponseTemplate(samlResponseData);

    var cannonicalized = SAMLResponse
        .replace(/\r\n/g, '')
        .replace(/\n/g, '')
        .replace(/>(\s*)</g, '><') //unindent
        .trim();

    var sig = new SignedXml(null, {
        signatureAlgorithm: ALGORITHMS_SIGNATURE
    });

    sig.addReference(
        SIGNATURE_LOCATION_PATH,
        ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/2001/10/xml-exc-c14n#"],
        "http://www.w3.org/2001/04/xmlenc#sha256");
    sig.signingKey = samlOptions.key;

    var pem = removeHeaders(samlOptions.cert);
    sig.keyInfoProvider = {
        getKeyInfo: function(key, prefix) {
            prefix = prefix ? prefix + ':' : prefix;
            return "<" + prefix + "X509Data><" + prefix + "X509Certificate>" + pem + "</" + prefix + "X509Certificate></" + prefix + "X509Data>";
        }
    };

    sig.computeSignature(cannonicalized, { prefix: samlOptions.signatureNamespacePrefix, location: { action: 'after', reference: "//*[local-name(.)='Issuer']" } });

    SAMLResponse = sig.getSignedXml();
    return SAMLResponse;
}

module.exports = {
    generateUniqueID,
    generateInstant,
    removeHeaders,
    buildSamlResponse
}
