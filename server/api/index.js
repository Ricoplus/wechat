'use strict';

const _ = require('lodash');
const express = require('express');
const api = express();
const config = require('../../config');
const models = require('../../models');
const utils = require('../../utils');
const wrap = require('../wrap');
const conf = require('./conf');
//const { Category } = models;

api.use('/conf', conf);

const nullRes = (page, perPage) => {
  return {
    metadata: {
      count: 0,
      totalPages: 0,
      currentPage: page,
      perPage,
    },
    data: [],
  };
};

// posts api
api.get('/posts', wrap(async (req, res) => {
  // target = true 表示显示目标抓取的公众号的条目
  // mainData
  //   - = true 表示仅显示有阅读量的条目
  //   - = false 表示仅显示无阅读量的条目
  // msgBiz - 筛选特定公众号的条目，逗号分隔
  // category - 根据存储在数据库的 category id 筛选特定公众号组的内容
  // q - 搜索词
  // sortWay - 排序方式: -updateNumAt, updateNumAt, -publishAt, publishAt
  const { target, mainData, msgBiz, sortWay, q, page = 1, perPage = 20 } = req.query;

  const query = {};
  // 取各个筛选条件确定的 msgBiz 交集
  const bizsArr = [];

  if (q) query.title = new RegExp(_.escapeRegExp(q), 'i');
  if (target === 'true') {
    const targetBiz = config.rule.page.targetBiz;
    if (targetBiz && targetBiz.length) bizsArr.push(config.targetBiz);
  }
  if (mainData === 'true') query.readNum = { $exists: true };
  if (mainData === 'false') query.readNum = { $exists: false };
  if (msgBiz) bizsArr.push(msgBiz.split(','));
/*
  if (categoryId && /^\w{24}$/.test(categoryId)) {
    const category = await models.Category.findById(categoryId);
    if (category && category.msgBizs && category.msgBizs.length) {
      bizsArr.push(category.msgBizs);
    }
  }
*/
  if (bizsArr.length) {
    const msgBizs = _.intersection(...bizsArr);
    // 交集为空，返回给前端空数据
    if (!msgBizs.length) {
      return res.json(nullRes(page, perPage));
    }
    query.msgBiz = { $in: msgBizs };
  }

  let sortWayResult;
  switch (sortWay) {
    case '-updateNumAt':
      sortWayResult = { updateNumAt: -1 };
      break;
    case 'updateNumAt':
      sortWayResult = { updateNumAt: 1 };
      break;
    case '-publishAt':
      sortWayResult = { publishAt: -1, msgIdx: 1 };
      break;
    case 'publishAt':
      sortWayResult = { publishAt: 1, msgIdx: 1 };
      break;
    default:
      sortWayResult = { publishAt: -1, msgIdx: 1 };
      break;
  }

  let { metadata, data } = await models.Post.find(query)
    .sort(sortWayResult)
    .populate('profile')
    .paginate({ page, perPage });

  data = data.map(i => {
    let profile = null;
    if (i.profile) {
      profile = {
        title: i.profile.title || '',
        headimg: i.profile.headimg || '',
      };
    }
    return {
      id: i.id,
      title: i.title || '',
      link: i.link || '',
      publishAt: i.publishAt || null,
      msgBiz: i.msgBiz || '',
      msgIdx: i.msgIdx || '',
      readNum: i.readNum || 0,
      likeNum: i.likeNum || 0,
      updateNumAt: i.updateNumAt || null,
      profile,
    };
  });
  res.json({ metadata, data });
}));

// show post api
api.get('/posts/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const post = await models.Post.findById(id);
  res.json({ data: post.toObject() });
}));

// update post api
// TODO: 权限, validate
api.put('/posts/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const fields = ['title', 'link', 'publishAt', 'readNum', 'likeNum', 'msgBiz', 'msgMid', 'msgIdx', 'sourceUrl', 'cover', 'digest', 'isFail', 'wechatId', 'updateNumAt', 'content'];
  const doc = utils.extract(req.body, fields);
  await models.Post.findByIdAndUpdate(id, doc);
  res.json({ state: 1, message: '更新文章成功' });
}));

// profiles api
api.get('/profiles', wrap(async (req, res) => {
  // target = true 表示显示目标抓取的公众号的条目
  // category - 根据存储在数据库的 category id 筛选特定公众号组的内容
  // q - 搜索词
  const { target,  q, page = 1, perPage = 20 } = req.query;

  const query = {};
  // 取各个筛选条件确定的 msgBiz 交集
  const bizsArr = [];

  if (q) query.title = new RegExp(_.escapeRegExp(q), 'i');
  if (target === 'true') {
    const targetBiz = config.rule.profile.targetBiz;
    if (targetBiz && targetBiz.length) bizsArr.push(config.targetBiz);
  }
/*
  if (categoryId && /^\w{24}$/.test(categoryId)) {
    const category = await models.Category.findById(categoryId);
    if (category && category.msgBizs && category.msgBizs.length) {
      bizsArr.push(category.msgBizs);
    }
  }
*/
  if (bizsArr.length) {
    const msgBizs = _.intersection(...bizsArr);
    // 交集为空，返回给前端空数据
    if (!msgBizs.length) {
      return res.json(nullRes(page, perPage));
    }
    query.msgBiz = { $in: msgBizs };
  }

  let { metadata, data } = await models.Profile.find(query)
    .sort({ openHistoryPageAt: -1 })
    .paginate({ page, perPage });

  data = data.map(i => ({
    id: i.id,
    openHistoryPageAt: i.openHistoryPageAt || null,
    headimg: i.headimg || '',
    msgBiz: i.msgBiz || '',
    title: i.title || '',
  }));

  // 一些额外数据，耗时
  for (const item of data) {
    let postsAllCount = 0, postsHasDataCount = 0, newestPostTime = null, oldestPostTime = null;
    if (item.msgBiz) {
      postsAllCount = await models.Post.count({ msgBiz: item.msgBiz });
      postsHasDataCount = await models.Post.count({ msgBiz: item.msgBiz, readNum: { $exists: true } });
      newestPostTime = ((await models.Post.find({ msgBiz: item.msgBiz, publishAt: { $exists: true } }).sort({ publishAt: -1 }).limit(1))[0] || {}).publishAt || null;
      oldestPostTime = ((await models.Post.find({ msgBiz: item.msgBiz, publishAt: { $exists: true } }).sort({ publishAt: 1 }).limit(1))[0] || {}).publishAt || null;
    }
    item.postsAllCount = postsAllCount;
    item.postsHasDataCount = postsHasDataCount;
    item.newestPostTime = newestPostTime;
    item.oldestPostTime = oldestPostTime;
  }

  res.json({ metadata, data });
}));

// single profile api
api.get('/profiles/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const profile = await models.Profile.findById(id);
  res.json({ data: profile.toObject() });
}));

// profile update api
api.put('/profiles/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const fields = ['title', 'wechatId', 'desc', 'msgBiz', 'headimg', 'openHistoryPageAt', 'province', 'city', 'firstPublishAt', 'property'];
  const doc = utils.extract(req.body, fields);
  await models.Profile.findByIdAndUpdate(id, doc);
  res.json({ state: 1, message: '更新公众号成功' });
}));
// profile add api
api.post('/profiles', wrap(async (req, res) => {
  // title, msgBiz 必传
  const {
    title,
    wechatId,
    desc,
    msgBiz,
    headimg,
  } = req.body;
  if (!title) throw new Error('请传入标题');
  if (!msgBiz) throw new Error('请传入 msgBiz');
  let doc = await models.Profile.findOne({ msgBiz });
  if (doc) throw new Error('已存在此公众号');
  doc = await models.Profile.create({
    title,
    wechatId,
    desc,
    msgBiz,
    headimg,
  });
  res.json({ state: 1, message: '创建公众号成功', data: { id: doc.id } });
}));

// profile delete api
api.delete('/profiles/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const doc = await models.Profile.findByIdAndRemove(id);
  if (!doc) throw new Error('不存在此公众号');
  res.json({ state: 1, message: '删除公众号成功' });
}));


// Keyword delete api
api.delete('/keywords/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const doc = await models.Keyword.findByIdAndRemove(id);
  if (!doc) throw new Error('不存在此关键词');
  res.json({ state: 1, message: '删除关键词成功' });
}));

//新建关键词
api.post('/keywords', wrap(async (req, res) => {
  const {
    name,
  } = req.body;
  if(!name)throw new Error('请传入关键字');
  let doc = await models.Keyword.findOne({ name });
  if (doc) throw new Error('已存在此关键字');
  doc = await models.Keyword.create({
    name,
  });
  res.json({ state: 1, message: '创建关键词成功', data: { id: doc.id } });
}));

// keywords api
api.get('/keywords', wrap(async (req, res) => {
  const { q,page = 1, perPage = 20 } = req.query;
  const query = {};
  if(q) query.name = new RegExp(_.escapeRegExp(q), 'i');
  let { metadata, data } = await models.Keyword.find(query).paginate({ page, perPage });
  data = data.map(i => ({
    id: i.id,
    name: i.name || '',
  }));
  res.json({ metadata, data });
}));

// show keyword api
api.get('/keywords/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const keyword = await models.Keyword.findById(id);
  res.json({ data: keyword.toObject() });
}));

// update keyword api
api.put('/keywords/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const fields = ['name'];
  const doc = utils.extract(req.body, fields);
  await models.Keyword.findByIdAndUpdate(id, doc);
  res.json({ state: 1, message: '更新分类成功' });
}));

module.exports = api;
