import express from 'express';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';

import fs from 'fs';
import Stream from 'stream';

import NodeID3 from 'node-id3';

const app = express();

const COOKIE = {
    headers: {
        'x-youtube-identity-token': 'QUFFLUhqbFNpa05WbldGVzNsN3A3S3dPMzlVSlhlS19oQXw'
    }
}

app.get('/pl', (req, res) => {

    
});

async function downloadVideo(url: string) {

    const filePath = './songs/' + getID(url) + '.mp3';

    const ytStream = ytdl(url, {filter: 'audioonly', requestOptions: COOKIE});
    const fsStream = ytStream.pipe(fs.createWriteStream(filePath));

    const allPromises = await Promise.allSettled([Stream.once(fsStream, 'finish'), ytdl.getInfo(url)]);

    //@ts-ignore
    const ytInfo: ytdl.videoInfo = allPromises[1].value;

    const trackName = ytInfo.videoDetails.media.song;
    const artistName = ytInfo.videoDetails.media.artist;

    let fileTitle = '';

    if (trackName === undefined || artistName === undefined)
        fileTitle = ytInfo.videoDetails.media.song || ytInfo.videoDetails.title.replace(/[/\\?%*:|"<>]/g, '-');   
    else   
        fileTitle = artistName + ' ~ ' + trackName

    NodeID3.update({
        artist: artistName,
        title: trackName
    }, filePath);

    fs.rename(filePath, './songs/' + fileTitle + '.mp3', () => {});

    return;
}

async function downloadPlaylist(url: string) {
    const playlist = await ytpl(url);

    const downloads: Promise<void>[] = [];

    for (const item of playlist.items) {
        downloads.push(downloadVideo(item.shortUrl));
    }

    await Promise.allSettled(downloads);
    return;
}

function getID(url: string): string {
    return url.split('v=')[1];
}

downloadPlaylist('https://www.youtube.com/playlist?list=PLRBp0Fe2GpglkzuspoGv-mu7B2ce9_0Fn');
//downloadVideo('https://www.youtube.com/watch?v=uNfsuth3J74')
app.listen(3000)