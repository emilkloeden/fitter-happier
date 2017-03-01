const request = require('request')
const fs = require('fs')
const {id, secret} = require('./client.json')

// Global state
let TOKEN;
let globalTrackValences = []
let globalTrackNames = []

const spotifyAPIBaseURL = 'https://api.spotify.com/v1/'







/**
 * convertListOfTrackIDsToListOfAudioFeatureURLs : List {String trackID, String trackName} -> String Token -> List String AudioFeaturesURL 
 * 
 * @param tracks
 * @param token
 * 
 * 
 */

function convertListOfTrackIDsToListOfAudioFeatureURLs(tracks, token) {
    const trackIDs = tracks.map(track => track.id)
    const length = trackIDs.length
    const multiplesOfOneHundred = Math.floor(length / 100) + 1
    const URLs = []
    for (let i = 0; i < multiplesOfOneHundred; i++) {
        let startIndex = i * 100
        let endIndex = startIndex + 100 <= length ? startIndex + 100 : length;
        console.log(`Start: ${startIndex} End: ${endIndex}`)
        let newArray = trackIDs.slice(startIndex, endIndex)
        let URL = `${spotifyAPIBaseURL}audio-features?Authorization=${token}&ids=${newArray.join(",")}`
        URLs.push(URL)
    }
    return URLs

}


    

/**
 * STEPS:

 * getArtistID : artistName -> artistID | Desired call once | (NO AUTH)
 * authorise : {id, secret} -> Token | Desired call once | (NO AUTH)
 * getArtistAlbums : artistID -> List {albumID, albumName}  | Desired call once | (NO AUTH)
 * getAlbumTracks : {albumID, albumName} -> List {trackID, trackName}  | Desired call once per album | (NO AUTH)
 * getTrackValenceForSeveralTracks : List {trackID, trackName} -> Token -> List {trackID, valence}  | Desired call once per onehundred tracks or once per album  | (AUTH)
 */


/**
 * authorise
 */

function authorise(options, cb) {
    console.log('authorise called')
    const {id, secret} = options
    
    const authOptions = {
        url: "https://accounts.spotify.com/api/token",
        headers: {
            "Authorization": `Basic ${new Buffer(id + ':'+ secret).toString('base64')}`
        },
        form: {
            grant_type: 'client_credentials'
        },
        json: true
    }

    
    // Request.post, getArtistID
    request.post(authOptions, function(err, response, body) {
        if (response.statusCode === 200) {
            const token = body.access_token
            //console.log('token', token)
            TOKEN = token
            
            cb("radiohead", getArtistAlbums)           
        }
        else {
            console.log(response.statusCode, err)
        }
    })
}



/**
 * getArtistID
 */
function getArtistID(artistName, cb=getArtistAlbums) {
    console.log('getArtistID called')
    const URIEncodedArtist = encodeURI(artistName)
    const url = `${spotifyAPIBaseURL}search?q=${URIEncodedArtist}&type=artist`
    
    let options = {
        url,
        json: true
    }
    
    request(options, function (err, response, body) {
        if (!(err) && response.statusCode === 200) {

            const artists = body.artists.items
            const artist = artists[0]
            const artistID = artist.id
            const artistDataSet = {
                name: artist.name,
                id: artist.id,
                albums: []
            }
            cb(artistID)
            

        }
        else {
            console.log(response.statusCode, err)
        }
    })
}//("radiohead")



/**
 * TODO:
 * Add logic re pagination - 
 * it's fine without in radiohead's case, 
 * default is 20 results per page
 */
function getArtistAlbums(artistID, cb=getAlbumTracksForListOfAlbums) {
    console.log('getArtistAlbums called')
    const url = `${spotifyAPIBaseURL}artists/${artistID}/albums?album_type=album`
    
    let options = {
        url,
        json: true
    }
    
    request(options, function(err, response, body) {
        if (!(err) && response.statusCode === 200) {
            const albums = body.items.map(album => {
                const  { id, name } = album
                return { id, name }
            })
            cb(albums)
    
        }
        else {
            console.log(response.statusCode, err)
        }
    })
}

/**
 * getAlbumTracksForListOfAlbums : List albums
 */
function getAlbumTracksForListOfAlbums(albums) {
    albums.forEach(album => getAlbumTracks(album, cb))
}



/**
 * getAlbumTracks
 */

function getAlbumTracks(album) {
    
    console.log('getAlbumTracks called for', album.name)
    
    const options = {
        url: `${spotifyAPIBaseURL}albums/${album.id}/tracks`,
        json: true
    }

    const inspectionKeys = {
        topLevelKey: 'items',
        desiredItemKeys: ['id', 'name']
    }

    
    extractedRequest(options, inspectionKeys, getTrackValenceForSeveralTracks)
}

/**
 * extractedRequest
 * @function abstracts away some nested callback logic
 * only works if desired items are in an array one level down
 * from root element
 */

function extractedRequest(options, inspectionKeys, cb, args) {
    const { topLevelKey, desiredItemKeys } = inspectionKeys

    request(options, function (err, response, body) {
        if (!(err) && response.statusCode === 200) {

            const data = body[topLevelKey].map(datum => {
                let outputObject = {}
                
                desiredItemKeys.forEach(key => {
                    outputObject[key] = datum[key]
                })
                
                return outputObject
            })
            cb(data, args)
        }
        else {
            console.log(response.statusCode, err)
        }
    })
}

/**
 * getTrackValence for all tracks in an album
 */

function getTrackValenceForSeveralTracks(tracks) {
    
    const urls = convertListOfTrackIDsToListOfAudioFeatureURLs(tracks)
    
    urls.forEach(url => {
        const headers = { "Authorization": `Bearer ${TOKEN}` }

        const options = {
                url,
                headers,
                json: true
            }

        const inspectionKeys = {
            topLevelKey: 'audio_features',
            desiredItemKeys: ['id', 'valence']
        }

        extractedRequest(options, inspectionKeys, addToLargeGlobalListOfTrackValencesThenConsoleLog)
    })
}

function addToLargeGlobalListOfTrackValencesThenConsoleLog(TrackValences) {
    addToLargeGlobalListOfTrackValences(TrackValences)
    console.log(TrackValences)
}

function addToLargeGlobalListOfTrackValences(TrackValences) {
    globalTrackValences = [...globalTrackValences, ...TrackValences]
}

/**
 * matchTrackValenceToTrackNames : 
 *  List TrackValence {TrackID, String valence} -> 
 *  List TrackName {String id, String name} -> 
 *  List TrackNameAndValence {TrackID, TrackName, TrackValence}
 */

function matchTrackValenceToTrackNames(TrackValences, TrackNames) {
    TrackNamesAndValences = []
    TrackNames.forEach(name => {
        TrackValences.forEach(valence => {
            if (valence.id === name.id) {
                const trackNameAndValence = {
                    id: name.id,
                    name: name.name,
                    valence: valence.valence
                }
            }
        })
    })
    return TrackNamesAndValences
}


function doBusinessLogic() {
    //Step1
    const artistName = "radiohead"
    //Step2
    getArtistID(
        artistName, 
        //Step3
        getArtistAlbums(
            artistID,
            //Step4
            getAlbumTracksForListOfAlbums(
                get
            ))
        )
}


/*
BUSINESS LOGIC
1. get artist name from user
2. get artist ID from api
3. get albums from api
4. get tracks from albums
5. get valences for tracks
6. dump data to json file desired format

{
    artist: {
        id,
        name,
        albums: [
            {
                id,
                name,
                tracks: [
                    {
                        id,
                        name,
                        valence
                    },
                    ...
                ]
            },
            ...
        ]
    }
}



*/


//getArtistID("radiohead", getArtistAlbums, getAlbumTracks, getTrackValence)

//const twoTracks = ["6vuykQgDLUCiZ7YggIpLM9", "3pcCifdPTc2BbqmWpEhtUd"]

