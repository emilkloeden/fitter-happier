const fsp = require('fs-promise')

function caseInsensitiveMatch(a, b) {
    return a.toUpperCase() === b.toUpperCase()
}

function findOne(array, field, valueToFind) {
    const filteredArray = array.filter((match) => {
        return caseInsensitiveMatch(match[field], valueToFind)
    })
    if (filteredArray.length) {
        return filteredArray[0]
    }
    else {
        throw Error('No match found')
    }
}

function flatten(arrayOfArrays) {
    const newArray = []
    arrayOfArrays.forEach(array => array.forEach(item => newArray.push(item)))
    return newArray
}

function handleError(err) {
    console.log(err)
    fsp.appendFile('./output/errors.txt', JSON.stringify(err, null, 2) + '\n')
}

module.exports = {
    caseInsensitiveMatch,
    findOne,
    flatten,
    handleError
}