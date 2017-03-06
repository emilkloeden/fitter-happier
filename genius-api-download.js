const fsp = require('fs-promise')
const request = require('request')
const cheerio = require('cheerio')
const { join } = require('path')
const { caseInsensitiveMatch, findOne, handleError } = require('./utils')
const { genius } = require('./client.json')

const { clientId, clientSecret, clientToken } = genius

const artistName = process.argv[2] || "radiohead"

function gw() {
    let Artist;
    const songList = []
    
    function getSongIDs(next_page) {
        
        if (next_page) {
            const options = {
                    url: 'https://api.genius.com/artists/604/songs',
                    headers: {
                        'Authorization': `Bearer ${clientToken}`
                    },
                    qs: {
                        'per_page': 50,
                        'page': next_page
                    }
                }

    
            console.log(options)
            request(options, (err, res, body) => {
                if (err) {
                    handleError(err)
                    next_page = 0
                }
                else {
                    console.log('Request sent')
                    const jsonified = JSON.parse(body)
                    console.log(Object.keys(jsonified))
                    const { response } = jsonified
                    const { songs } = response
                    next_page = response.next_page
                    console.log(next_page)
                    songs.forEach((song, index) => {
                        const { id, title, url } = song
                        songList.push({ id, title, url })
                    })
                    getSongIDs(next_page)
                }
            })
        } 
        else {
            const output = JSON.stringify(songList, null, 2)
            fsp.writeFile(join(__dirname, 'output', 'blah.json'), output)
            doSomething(songList)
        }
    }
    getSongIDs(1)
    
    function doSomething(songList) {
        let songDetails;
        const options = {
            headers: {
                'Authorization': `Bearer ${clientToken}`
            }
        }
        songList = [songList[0], songList[1]]
        songList.map(song => {
            const { id, title, url } = song
            options.url = url
            request(options, (err, res, body) => {
                if (err) handleError
                else {
                    console.log(id, title, url)
                    const htmlFileName = join(__dirname, 'output', 'html', `${id} - ${title}.html`)
                    const lyricsFileName = join(__dirname, 'output', 'lyrics', `${id} - ${title}.html`)

                    const $ = cheerio.load(body)
                    const lyrics = $('lyrics')
                    fsp
                        .writeFile(lyricsFileName, lyrics)
                        .catch(err => handleError(err))
                    fsp
                        .writeFile(htmlFileName, body)
                        .catch(err => handleError(err))
                }
            })
        })
    }
}



gw()