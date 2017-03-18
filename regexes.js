const meta = /\[(Verse [0-9]|Pre-Chorus [0-9]|Hook [0-9]|Chorus|Outro|Verse|Refrain|Hook|Bridge|Intro|Instrumental)\]|[0-9]|[\.!?\(\)\[\],]/gi
const nl = /\n/gi
const upper = /([A-Z])/gi
const num = / {2,}/gi

module.exports = {
    meta, nl, num, upper
}