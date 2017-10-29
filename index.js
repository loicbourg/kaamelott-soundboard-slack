require('dotenv').config()

const express = require('express')
const app = express();
const url = require('url');
const FormData = require('form-data');
const axios = require('axios');

const KAAMELOTT_DOMAIN = 'kaamelott-soundboard.2ec0b4.fr';

app.use(express.json());
const uploadFile = (fileStream, channel, fileName) => {
    console.log('upload file');

    const form = new FormData();
    form.append('token', process.env.SLACK_TOKEN);
    form.append('channels', channel);
    form.append('filename', fileName);
    form.append('filetype', 'mp3');
    form.append('file', fileStream);

    axios.post(
        'https://slack.com/api/files.upload',
        form,
        {
            headers: form.getHeaders()
        }
    )
        .catch(err => console.log(err));
};

app.get('/', function(req, res) {
    res.send('IT WORKS !');
});

app.post('/', function (req, res) {
    const webhook = req.body;

    if (webhook.type === 'url_verification') {
        res.send(req.body.challenge);
        return;
    }

    if (webhook.type !== 'event_callback') {
        return;
    }

    const event = webhook.event;
    if (event.type !== 'link_shared') {
        return;
    }

    const kaamelotLink = event
        .links
        .find(link => link.domain === KAAMELOTT_DOMAIN);
    if (!kaamelotLink) {
        return;
    }

    const hash = url.parse(kaamelotLink.url).hash;
    if (!hash) {
        return;
    }

    res.send();

    const file = hash.replace('#son/', '');

    console.log('send file', file);

    axios(
        {
            method: "get",
            url: `http://${KAAMELOTT_DOMAIN}/sounds/${file}.mp3`,
            responseType:'stream'
        }
    )
    .then(response => {
        uploadFile(response.data, event.channel, file)
    });
});

app.listen(3333, function () {
    console.log('Example app listening on port 3333!')
});