#!/usr/bin/env node

const { main } = require('../src');

const defaults = {
  isStudyData: true,
  isGroup: true,
};
main(defaults).then(() => {
  console.log('done');
});
