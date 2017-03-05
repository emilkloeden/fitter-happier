const artist = require('./spotify-simplify')
const { flatten } = require('./utils')

const excludedAlbums = [ 
        'TKOL RMX 1234567', 
        'In Rainbows Disk 2', 
        'Com Lag: 2+2=5', 
        'I Might Be Wrong' 
    ]

const { albums } = artist

const valences = 
    flatten(
        albums
            .filter(album => excludedAlbums.indexOf(album.name) === -1 )
            .map(album => {
                return album.tracks.map(track => {
                    const { name, valence } = track
                    return { name, valence }
                })
            })
    )
    .sort((a, b) => {
        return a.valence - b.valence
    })

console.log(valences)