import express from 'express';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';

import fs from 'fs';
import Stream from 'stream';

const app = express();

app.get('/pl', async (req, res) => {
    if (typeof(req.query.q) === 'string') {
        const names = await downloadPlaylist(req.query.q)

        res.end(
            names.map(name => '<a href="' + name + '" download> ' + name.substring(8, name.length - 4) + '</a>').join('<br>')
        );
    }
});

app.get('/songs/*', (req, res) => {

    console.log(decodeURI(req.url));

    fs.readFile('.' + decodeURI(req.url), (err, data) => {
        console.log(err);
        res.contentType('audio/mpeg');
        res.end(data.toString());
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

    await Stream.once(fsStream, 'finish')

    return finalFilePath;
}

async function downloadPlaylist(url: string) {

    const playlist = await ytpl(url);

    const downloads: Promise<string>[] = [];


    for (const item of playlist.items) {
        downloads.push(downloadVideo(item.shortUrl));
    }

    const names = await Promise.all(downloads);
    return names;
}

app.listen(3000);