const fsp = require('fs-promise')
const { join } = require('path')
const audio_features = require('./output/audio_features.json')
const { flatten } = require('./utils')

const excludedFiles = [
    "audio_features.json",
    "first_attempt.js",
    "TKOL RMX 1234567.json"

]

fsp.readdir(join(__dirname, 'output'))
    .then(files => files.filter(filename => excludedFiles.indexOf(filename) === -1 ))
    .then(files => {
        return Promise.all(
            files.map(file => {
                const filePath = join(__dirname, 'output', file)
                return fsp
                    .readFile(filePath,'utf8')
                    .then(JSON.parse)
                    .then(data => data.body.items)
                    .then(tracks => 
                            tracks.map(
                                track => {
                                    const { id, name } = track
                                    return { id, name }
                    }))
            })
        )
    })
    .then(console.log)

const r = flatten(audio_features.map(track => track.body.audio_features))
const l = r.map(f => f.id)
// console.log(l)
// console.log(l.length)
// console.log(r[0])
