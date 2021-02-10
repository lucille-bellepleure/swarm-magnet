var WebTorrent = require('webtorrent')
var path = require('path')
var util = require('util')
const fs = require('fs').promises;
var axios = require('axios')
var client = new WebTorrent();
var queue = require('queue')
var q = queue()
var results = []
var express = require('express')
const bodyParser = require('body-parser');
const cliProgress = require('cli-progress');
var Bee = require("@ethersphere/bee-js");
const port = 3000
const app = express();

bee = new Bee.Bee("http://localhost:1633");

async function addBee(dirname) {
    try {
        const dirHash = await bee.uploadFilesFromDirectory("./swop/" + dirname, true);
        console.log(dirHash)
        return dirHash
    } catch (error) {
        console.log(error)
    }
}

async function readFile(filePath) {
    try {
        const data = await fs.readFile(filePath);
        console.log(data.toString());
    } catch (error) {
        console.error(`Got an error trying to read the file: ${error.message}`);
    }
}

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/magnet', (req, res) => {
    downloadMagnet(req.body.magnet)
    res.sendStatus(200);
});

app.listen(port, () => console.log(`Started server at http://localhost!`));

async function downloadMagnet(magnetURI) {
    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar1.start(1, 0);

    client.add(magnetURI, { path: './swop' }, function (torrent) {
        torrent.on('metadata', function (torrent) {
            console.log('torrent metadata', torrent)
            console.log('adding: ', torrent.name)
        })
        torrent.on('ready', function (torrent) { console.log('torrent ready', torrent) })
        torrent.on('download', function (bytes) {

            bar1.update(torrent.progress, { filename: torrent.name });
        })
        torrent.on('done', function () {
            console.log(torrent.name, " done")
            // add to swarm 
            addBee(torrent.name).then(fileHash => console.log(fileHash))
        })
    })
}

