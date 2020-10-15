const user = {
    email: "joe.owling@example.com",
    full_name: "Joe Owling",
}

const options = {
    issuer: null,
    signResponse: true,
    encryptAssertion: false,
    signatureNamespacePrefix: "",
    encryptionAlgorithm: "http://www.w3.org/2001/04/xmlenc#aes256-cbc",
    keyEncryptionAlgorithm: "http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p",
    lifetimeInSeconds: 3600,
    authnContextClassRef: "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport",
    includeAttributeNameFormat: true,
    attributes: null,
    nameIdentifier: null,
    nameIdentifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    recipient: null,
    inResponseTo: null,
}

const samlData = {
    user: user,
    authnRequest: null,
    idp: options,
}

module.exports = {
    user,
    options,
    samlData
}