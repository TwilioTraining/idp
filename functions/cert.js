const fs = require('fs');

exports.handler = (context, event, callback) => {
    try {
        const certPath = Runtime.getAssets()['/idp-public-cert.pem'].path;
        const cert = fs.readFileSync(certPath).toString('utf-8');
        const response = new Twilio.Response();
        response.appendHeader('Content-Type', 'text/plain; charset=utf-8');
        response.setBody(cert);
        return callback(null, response);
    } catch(err) {
        console.log(err);
        return callback('error', err);
    }
};