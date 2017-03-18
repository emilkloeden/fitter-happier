const nrc = require('./nrc-sadness.json')
const stopwords = require('./stopwords.json')

function removeStopWords(text) {
    const words = text.split(' ')
    const filtered = words.filter(word => !stopwords[word])
    return filtered.join(' ')
}
function analyse(text) {
    const words = text.split(' ')
    const sadnessValues = words.map(word => {
        const value = nrc[word] || 0
        return {word, value}
    })
    const sadness = sadnessValues
        .map(word => word.value)
        .reduce((a, b) => {
            return a + b
        })
    const wordCount = words.length
    return {
        sadness,
        wordCount,
        sadnessValues,
        words
    }
}

module.exports = {
    analyse,
    removeStopWords
}