/* Why oh why does it hang? */
const fsp = require('fs-promise')
const songList = require('./output/blah.json')

function printNumberOfSuccesses() {
    const fileList = fsp.readdir('./output/html')
    fileList.then(files => {
        console.log(files.length)
    })
}

function checkMatches() {
    const date = new Date()
    const now = date.getTime()
    const fileList = fsp.readdir('./output/html')
    fileList.then(files => {
        const fin = files
            .map(file => file.replace('.html', '').toLowerCase())
        const songs = songList
            .map(song => song.title.toLowerCase())
            .filter(song => fin.indexOf(song) === -1)
        console.log(songs)
        return songs
        //console.log(fin)
    })
    .then(data => fsp.writeFile(`./output/analysis - ${now}.json`, JSON.stringify(data, null, 2)))
    .catch(a => console.log(a))
}

//printNumberOfSuccesses()
checkMatches()