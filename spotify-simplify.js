const artistName = process.argv[2] || "radiohead"
const artist = require(`./output/${artistName}.json`)

const simplifiedArtist = {}
simplifiedArtist.id = artist.id
simplifiedArtist.name = artist.name

const simplifiedAlbums = artist.albums.map(album => {
    const { name, id } = album
    const tracks = album.tracks.map(track => {
        const { name, id, track_number } = track
        const { valence } = track.audio_features
        return { 
            id,
            name,
            track_number,
            valence
        }
    })
    return { id, name, tracks }
})

simplifiedArtist.albums = simplifiedAlbums

module.exports = simplifiedArtist