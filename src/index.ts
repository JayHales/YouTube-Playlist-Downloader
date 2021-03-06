import express from 'express';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';

import fs from 'fs';
import Stream from 'stream';

const app = express();

app.get('/', (req, res) => {
    res.contentType('text/html');

    res.end(
        `<p>Might take a while after pressing download. Be patient. </p><input placeholder="Enter playlist url..."><button onclick="window.location.href='./pl?q=' + document.querySelector('input').value">Download</button>`
    );

});

app.get('/pl', async (req, res) => {

    console.log(req.query.q);

    if (typeof(req.query.q) === 'string') {
        const names = await downloadPlaylist(req.query.q)
        res.contentType('text/html');

        res.end(
            names.map(name => `<a onclick="this.style.backgroundColor = 'red';" style="display: block; background-color: blue; color: white; padding: 20px;" href="` + name.substring(1) + `" download> ` + name.substring(8, name.length - 4) + '</a>').join('<br>')
        );
    } else {
        res.end('Bad query.');
    }


});

app.get('/songs/*', (req, res) => {

    fs.readFile('.' + decodeURI(req.url), (err, data) => {
        console.log(err);
        console.log(data);
        res.contentType('audio/mpeg');
        res.end(data);
    });    

});

async function downloadVideo(url: string) {

    const ytInfo = await ytdl.getInfo(url);

    const trackName = ytInfo.videoDetails.media.song;
    const artistName = ytInfo.videoDetails.media.artist;

    let fileTitle = artistName + ' ~ ' + trackName;

    if (trackName === undefined || artistName === undefined)
        fileTitle = ytInfo.videoDetails.title.replace(/[/\\?%*:|"<>]/g, '-');  
        

    const finalFilePath = './songs/' + fileTitle + '.mp3';

    const ytStream = ytdl(url, {filter: 'audioonly'});
    const fsStream = ytStream.pipe(fs.createWriteStream(finalFilePath));

    await Stream.once(fsStream, 'finish');

    console.log(finalFilePath);

    return finalFilePath;
}

async function downloadPlaylist(url: string) {

    console.log(url);

    const playlist = await ytpl(url);

    const downloads: Promise<string>[] = [];


    for (const item of playlist.items) {
        downloads.push(downloadVideo(item.shortUrl));
    }

    const names = await Promise.all(downloads);
    return names;
}

app.listen(3000);