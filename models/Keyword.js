'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//关键词数据结构
const Keyword = new Schema({
  name: String,
  articles: [String]
}, { toJSON: { virtuals: true } });

Keyword.plugin(require('motime'));

Keyword.index({ name: 1 }, { unique: true });

mongoose.model('Keyword', Keyword);
