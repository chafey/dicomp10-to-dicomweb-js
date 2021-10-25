const asyncIteratorToBuffer = async (readable) => {
    const chunks = []
    for await (let chunk of readable) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
}

module.exports = asyncIteratorToBuffer