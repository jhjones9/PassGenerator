const functions = require("firebase-functions");
const { PKPass } = require("passkit-generator");
const admin = require("firebase-admin");
var fs = require('file-system');
var path = require('path');
var axios = require('axios');
const serviceAccount = require("./certs/business-card-firebase-adminsdk-hcyp8-2eb2b864d4.json")

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gbx-business-card.appspot.com"
});
var storageRef = admin.storage().bucket()

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return "rgb(" + parseInt(result[1], 16).toString() + ", " + parseInt(result[2], 16).toString() + ", " + parseInt(result[3], 16).toString() + ")"
}

exports.pass = functions.https.onRequest((request, response) => {
    PKPass.from({
        model: "./model/custom.pass",
        certificates: {
            wwdr: fs.fs.readFileSync("./certs/wwdr.pem"),
            signerCert: fs.fs.readFileSync("./certs/signerCert.pem"),
            signerKey: fs.fs.readFileSync("./certs/signerKey.pem"),
            signerKeyPassphrase: "test"
        },
    },
        {
            authenticationToken: "21973y18723y12897g31289yge981y2gd89ygasdqsqdwq",
            webServiceURL: "<URL REMOVED>",
            serialNumber: "PASS-213213",
            foregroundColor: hexToRgb("#" + request.body.textColor),
            background: "background@2x.png"
        })
        .then(async (newPass) => {
            newPass.primaryFields.push(
                {
                    key: "primary",
                    value: request.body.primary.value,
                }
            )
            newPass.secondaryFields.push(
                {
                    key: "secondary",
                    value: request.body.secondary.value,
                }
            )
            newPass.setBarcodes(
                {
                    message: request.body.qrText,
                    format: "PKBarcodeFormatQR",
                    messageEncoding: "iso-8859-1",
                }
            )
            newPass.backFields.push(
                {
                    label: "MOBILE",
                    key: "mobile",
                    value: request.body.mobile.value,
                },
                {
                    label: "EMAIL",
                    key: "email",
                    value: request.body.email.value,
                },
                {
                    label: "WEBSITE",
                    key: "website",
                    value: request.body.website.value,
                },
                {
                    label: "ADDRESS",
                    key: "address",
                    value: request.body.address.value,
                },
                {
                    label: "CITY STATE ZIP COUNTRY",
                    key: "cityStateZipCountry",
                    value: request.body.cityStateZipCountry.value,
                },
                {
                    label: "STAY CONNECTED",
                    key: "stayConnected",
                    value: request.body.stayConnected.value,
                }
            )

            const resp = await axios.get(request.body.thumbnail, { responseType: 'arraybuffer' })
            const buffer = Buffer.from(resp.data, "utf-8")
            newPass.addBuffer("thumbnail.png", buffer)
            newPass.addBuffer("thumbnail@2x.png", buffer)
            const bufferData = newPass.getAsBuffer();

            storageRef.file("passes/custom.pkpass")
                .save(bufferData, (error) => {
                    if (!error) {
                        console.log("Pass was uploaded successfully.");
                        response.status(200).send({
                            "pass": request.body,
                            "status": "Pass successfully generated on server.",
                            "result": "SUCCESS",
                        });
                    }
                    else {
                        console.log("Error Uploading pass " + error);
                        response.send({
                            "explanation": error.message,
                            "result": "FAILED",
                        });
                    }
                })
        })
});
