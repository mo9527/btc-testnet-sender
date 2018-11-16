var httpSync = require('sync-request');
var fs = require("fs");
var childProcess = require('child_process');
var BigNumber = require('bignumber.js').BigNumber;
var args = require('minimist')(process.argv.slice(2));

function downloadSigner() {
    let url = "https://raw.githubusercontent.com/blockcypher/btcutils/master/signer/signer.go";

    let response = httpSync('GET', url);
    fs.writeFileSync("./signer.go", response.getBody('utf8'));
}

function buildTx(from, to, value) {
    value = value * 10000000;

    let url = "http://api.blockcypher.com/v1/btc/test3/txs/new";
    let response = httpSync("POST",url, {
        json: {inputs: [{addresses: [from]}], outputs: [{addresses: [to], value: value}]}
    });

    fs.writeFileSync("./send.json", response.getBody('utf8'));
}

function signTx(pk) {
    // childProcess.execSync("go get github.com/btcsuite/btcd/btcec");
    //
    // let goBuild = "go build -o signer.exe";
    // childProcess.execSync(goBuild);

    let signCommand = "signer.exe " +  getToSign().replace("\n","") + " " + pk;
    let result = childProcess.execSync(signCommand);

    return result.toString();

}

function sendSignTx(signTx, publicKey) {
    let sendJson = require("./send.json");
    sendJson.signatures = [];
    sendJson.signatures[0] = signTx;

    sendJson.pubkeys = [];
    sendJson.pubkeys[0] = publicKey;

    fs.writeFileSync("./send.json", JSON.stringify(sendJson));

    let sendCommand = "curl -d @send.json http://api.blockcypher.com/v1/btc/test3/txs/send";
    let result = childProcess.execSync(sendCommand);

    console.log(result.toString())

}

function getToSign() {
    let sendJson = require("./send.json");
    return sendJson.tosign;
}




function main() {
    let from = args.from;
    let to = args.to;
    let value = args.value;
    let pk = args.pk;
    let publicKey = args.pubkey;

    let bigNumberPk = new BigNumber(pk);

    let hexStr = bigNumberPk.toString(16);

    downloadSigner();
    buildTx(from, to, value);
    let transaction = signTx(hexStr);

    sendSignTx(transaction, publicKey)
}

main();
