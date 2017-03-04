const request = require('request')
const { join } = require('path')
const fsp = require('fs-promise')
const spotifyWebApi = require('spotify-web-api-node')
const { id, secret } = require('./client.json')
const { caseInsensitiveMatch, findOne } = require('./utils')

let spotifyApi = new spotifyWebApi({
    clientId: id,
    clientSecret: secret
})
let Artist;

const artistName = "radiohead"

const handleError = 
    function(err) {
        console.error(err)
    }

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
            //Artist.albums = albums
            return albums
        })
        .then(function(albums) {
            return Promise.all(albums.map(album => {
                return spotifyApi
                    .getAlbumTracks(album.id)
                    .then(data => {
                        fsp.writeFile(
                            join(__dirname, 'output', album.name + '.json')
                            , JSON.stringify(data, null, 2)
                        )
                        return data
                    })
                    .then(function(data) {
                        const tracks  = data.body.items
                        return tracks
                    })
                    .then(function(tracks) {
                        const trackIds = tracks.map(track => track.id)
                        return spotifyApi.getAudioFeaturesForTracks(trackIds)
                    })
                }))
            .then(function(data) {
                return fsp.writeFile('./output/audio_features.json', JSON.stringify(data, null, 2))
            })
            .catch(handleError)
        })
        .catch(handleError)
    
