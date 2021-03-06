const fsp = require('fs-promise')
const spotifyWebApi = require('spotify-web-api-node')
const { join } = require('path')
const { caseInsensitiveMatch, findOne, handleError } = require('./utils')
const { spotify } = require('./client.json')

const { clientId, clientSecret } = spotify

let spotifyApi = new spotifyWebApi({ clientId, clientSecret })


const artistName = process.argv[2] || "radiohead"

function downloadArtistToJSON() {
    let Artist;

    const myPromise = 
        spotifyApi
            .clientCredentialsGrant()
            .then(function(data) {
                console.log(data.body['access_token'])
                spotifyApi.setAccessToken(data.body['access_token'])
                
                return spotifyApi.searchArtists(artistName)
            })
            .then(function(data) {
                const { items } = data.body.artists
                
                return findOne(items, 'name', artistName)
            })
            .then(function(data) {
                Artist = data
                options = {limit: 50, "album_type": "album"}
                
                return spotifyApi.getArtistAlbums(data.id, options)
            })
            .then(function(data) {
                const albums = data.body.items
                Artist.albums = albums
                return albums
            })
            .then(function(data) {
                return data
            })
            .then(function(albums) {
                return Promise.all(albums.map((album, index) => {
                    return spotifyApi
                        .getAlbumTracks(album.id)
                        .then(data => {
                            const tracks = data.body.items
                            Artist.albums[index].tracks = tracks
                            return tracks
                        })
                        .then(function(tracks) {
                            const trackIds = tracks.map(track => track.id)
                            return spotifyApi.getAudioFeaturesForTracks(trackIds)
                        })
                        .then(function(data) {
                            const {audio_features} = data.body
                            Artist.albums[index].tracks.map((track, idx) => {
                                Artist.albums[index].tracks[idx].audio_features = {}
                                if (audio_features.filter(song => song.id === track.id).length) {
                                    Artist.albums[index].tracks[idx].audio_features = audio_features.filter(song => song.id === track.id)[0]
                                }
                            })
                            return data
                        })
                    }))
                .then(data => {
                    fsp.writeFile(`./output/${Artist.name.toLowerCase()}.json`, JSON.stringify(Artist, null, 2))
                    return data
                })
                .catch(handleError)
            })
            .catch(handleError)
}
downloadArtistToJSON(artistName)
