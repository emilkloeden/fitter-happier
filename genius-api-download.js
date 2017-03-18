const cheerio = require('cheerio')
const fsp = require('fs-promise')
const rimraf = require('rimraf')
const rp = require('request-promise-native')
const promiseRetry = require('promise-retry')

const { analyse, removeStopWords } = require('./sentiment')
const { caseInsensitiveMatch, findOne, handleError } = require('./utils')
const { genius } = require('./client.json')
const { join } = require('path')
const { meta, nl, num, upper } = require('./regexes')


const { clientId, clientSecret, clientToken } = genius

const artistName = process.argv[2] || "radiohead"

function doGenius() {
    let Artist = {}
    Artist.name = artistName
    Artist.songs = []
    const songList = []
    
    function getSongIDs(next_page) {
        
        if (next_page) {
            /* There are still results on another page... */
            const options = {
                    url: 'https://api.genius.com/artists/604/songs',
                    headers: {
                        'Authorization': `Bearer ${clientToken}`
                    },
                    json: true,
                    qs: {
                        'per_page': 50,
                        'page': next_page
                    }
                }

    
            console.log(options)
            rp(options)
                .then(body => {
                    console.log('Request sent')
                    const { response } = body
                    const { songs } = response
                    next_page = response.next_page

                    songs.forEach((song, index) => {
                        const { id, title, url } = song
                        songList.push({ id, title, url })
                    })
                    getSongIDs(next_page)
                })
                .catch(handleError)

        } 
        else {
            /* We've found all songs for the artist */
            //const output = JSON.stringify(songList, null, 2)
            //fsp.writeFile(join(__dirname, 'output', 'blah.json'), output)
            console.log(`Genius API has found ${songList.length} songs`)
            getSongs(songList)
        }
    }

    function processRequest(song, index) {
        const { id, title, url } = song
        const options = {
            url,
            headers: { 
                'Authorization': `Bearer ${clientToken}`,
                'Connection': 'Keep-Alive',
                'Keep-Alive': 'timeout=100, max=1000'
            },
            transform: scrape
        }

        return rp(options)
            .then(body => {
                console.log(index, title, url)
                return body
            })
            .then(body => {
                writeHTML(index, id, title, 'html', body)
                return body
            })
            .then(initialApplicationOfRegexes)
            .then(removeStopWords)
            .then(analyse)
            .then(body => {
                console.log('Sadness:', body.sadness)
                const newSong = song
                newSong['friendly_name'] = 
                    song
                    .title
                    .replace(/[^\d\s\w]/gi, '')
                    .toLowerCase()
                newSong.analysis = body
                Artist.songs.push(newSong)
                return body
            })
            .catch(handleError)
    }

    function getSongs(songList) {
        rimraf.sync('./output/html/*.html')

        return Promise
            .all(promisifySongList(songList))
            .then(data => {
                writeArtistToJSONFile()
                return data
            })
            .then(results => console.log('results.length: ', results.length))
            .then(data => console.log('Artist.songs[0]: ', Artist.songs[0]))
            
            .catch(err => {
                console.log('\n\n\nERROR IN PROMISE.ALL\n\n\n', err, '\n***********\n\n\n')
            })
    }

    function promisifySongList(songList) {
        return songList.map((song, index) => {
                return promiseRetry((retry, number) => {
                    return processRequest(song, index)
                        .then(body => {
                            console.log('Attempt #', number) 
                            return body
                        })
                        .catch(retry)
                })
            })
    }

    function writeArtistToJSONFile() {
        filename = join(__dirname, 'output', `${Artist.name}.json`)
        return fsp
            .writeFile(filename, JSON.stringify(Artist, null, 2))
            .then(data => {
                console.log('DONE')
                return data
            })
    }

    getSongIDs(1)
    
}





function scrapeAndAnalyse(options) {
    const { id, title, body } = options

    const lyrics = initialApplicationOfRegexes(body)
    const removedStopWords = removeStopWords(lyrics)
    const analysis = analyse(removedStopWords)
    console.log(analysis.sadness)
    return analysis
}

function writeHTML(index, id, title, directory, element) {
    const outputFileName = `${title.replace('/','-')}.html`
    const outputFilePath = join(__dirname, 'output', directory, outputFileName)
    fsp.writeFile(outputFilePath, element).catch(handleError)
}

function scrape(body) {
    const $ = cheerio.load(body)
    return $('lyrics').text()
}

function initialApplicationOfRegexes(text) {
    return (
        text
        .replace(meta, '')
        .replace(nl, ' ')
        .replace(num, ' ')
        //.replace(upper, ' \\1')
        .trim()
        .toLowerCase()
    )
}




doGenius()