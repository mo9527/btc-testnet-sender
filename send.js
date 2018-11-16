var httpSync = require('sync-request');
var fs = require("fs");
var childProcess = require('child_process');
var BigNumber = require('bignumber.js').BigNumber;
var args = process.argv.slice(2);

function downloadSigner() {
    let url = "https://raw.githubusercontent.com/blockcypher/btcutils/master/signer/signer.go";

    let response = httpSync('GET', url);
    fs.writeFileSync("./signer.go", response.getBody('utf8'));
}

function buildTx(from, to, value) {
    value = value * 10000000;

    let param = {inputs: [{addresses: [from]}], outputs: [{addresses: [to], value: value}]};

    let url = "http://api.blockcypher.com/v1/btc/test3/txs/new";
    let response = httpSync("POST",url, {
        json: param
    });

    fs.writeFileSync("./send.json", response.getBody('utf8'));
}

function signTx(pk) {
    // childProcess.execSync("go get github.com/btcsuite/btcd/btcec");
    //
    // let goBuild = "go build -o signer.exe";
    // childProcess.execSync(goBuild);

    let toSignStr = getToSign();

    let signCommand = "signer.exe " +  toSignStr + " " + pk;
    let result = childProcess.execSync(signCommand);

    return result.toString();

}

function sendSignTx(signTx, publicKey) {
    let sendJson = require("./send.json");
    sendJson.signatures = [];
    sendJson.signatures[0] = signTx;

    sendJson.pubkeys = [];
    sendJson.pubkeys[0] = publicKey;


    let jsonStr = JSON.stringify(sendJson);
    jsonStr = jsonStr.replace(new RegExp("\\\\n", "g"), "");
    fs.writeFileSync("./send.json", jsonStr);

    let sendCommand = "curl -d @send.json http://api.blockcypher.com/v1/btc/test3/txs/send";
    let result = childProcess.execSync(sendCommand);

    console.log(result.toString())

}

function getToSign() {
    let sendJson = require("./send.json");
    return sendJson.tosign[0];
}



function main() {
    let from = args[0];
    let to = args[1];
    let value = args[2];
    let pk = args[3];
    let publicKey = args[4];

    let bigNumberPk = new BigNumber(pk);
    let hexPk = bigNumberPk.toString(16);

    buildTx(from, to, value);
    let transaction = signTx(hexPk);

    sendSignTx(transaction, publicKey)
}

main();
