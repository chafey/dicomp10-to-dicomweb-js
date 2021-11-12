const handler = {
  get: function (obj, key) {
    const ikey = parseInt(key);
    if (ikey == key) return obj.index_get(ikey);
    const handlerFunc = handler[key];
    if (handlerFunc && key != 'get') return handlerFunc(obj, key);
    if (!obj._keys[key]) {
      console.log('New call to', key);
      obj._keys[key] = true;
    }
    return obj[key];
  },

  length: obj => obj.combinedLength,

};

const StreamingFunctions = {
  addChunks: function (chunks) {
    if (!this.chunks) this.chunks = [];
    chunks.forEach(chunk => this.chunks.push(chunk));
    this.combinedLength = 0;
    let i = 0;
    this.chunks.forEach(chunk => {
      chunk.start = this.combinedLength;
      chunk.i = i++;
      (this.combinedLength += chunk.length)
    });
    this.lastChunk = this.chunks[0];
  },

  index_get: function (ikey) {
    const found = this.findChunk(ikey);
    if (!found) throw Error(`index ${ikey} not found between 0..${this.combinedLength}`)
    return found[ikey - found.start];
  },

  findChunk: function (ikey) {
    let i = this.lastChunk.start <= ikey && this.lastChunk.i || 0;
    while (i < this.chunks.length) {
      const chunk = this.chunks[i];
      if (ikey >= chunk.start && ikey < chunk.start + chunk.length) {
        this.lastChunk = chunk;
        return chunk;
      }
      i++;
    }
  },

  slice: function (start, end) {
    const buflen = end - start;
    const ret = Buffer.alloc(buflen);
    let i = 0;
    while (i < buflen) {
      const chunk = this.findChunk(start + i);
      const chunkI = start + i - chunk.start
      const iEnd = Math.min(buflen,chunk.length-chunkI)
      chunk.copy(ret,i,chunkI,iEnd);
      i = iEnd;
    }
    return ret;
  },

  _keys: { then: true, lastChunk: true, slice: true, findChunk: true, chunks: true, index_get: true },

};

const StreamingBuffer = (chunks) => {
  const buf = Buffer.from('NotUsed');
  Object.assign(buf, StreamingFunctions);
  buf.addChunks(chunks);
  return new Proxy(buf, handler);
}

const asyncIteratorToBuffer = async (readable) => {
  const chunks = []
  for await (let chunk of readable) {
    chunks.push(chunk)
  }
  return StreamingBuffer(chunks)
}

module.exports = asyncIteratorToBuffer