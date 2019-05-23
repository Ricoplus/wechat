var request = require('request');
const cheerio = require('cheerio');
const models = require('../../models');
const config = require('../../config');

const {
  rule: ruleConfig,
} = config;

const {
  page: pageConfig,
} = ruleConfig;

function fun(){
	//1.获得文章永久链接列表
    models.Post.find({},{link:1,msgMid:1,msgBiz:1,msgIdx:1,title:1},function(error,docs){
        if(error) {console.log("获得文章链接列表出错"+error);return;};
        for(let i =0;i<docs.length;i++){
            if(!docs[i].link||docs[i].link==='') continue;
			console.log("当前文章链接:",docs[i].link);
            request(docs[i].link, function (error, response, body) {
                if(error) console.log("爬取网页内容失败 标题:",docs[i].title,error);
                $ = cheerio.load(body, { decodeEntities: false });
                let content = $('#js_content').text() || '';
                content = content.trim();
                if(pageConfig.isSavePostContent){
                    let msgBiz = docs[i].msgBiz;
                    let msgMid = docs[i].msgMid;
                    let msgIdx = docs[i].msgIdx;
					models.Post.findOneAndUpdate(
					  { msgBiz, msgMid, msgIdx },
					  { content },
                      function(err){
                        if (err) return console.log("保存正文失败"+err);
		                console.log("保存正文成功 msgMid: "+msgMid+"    title:"+docs[i].title);
                      },
					  { upsert: true }
					); 
				}
                if (!error && response.statusCode == 200) {
                	//2.获得关键字列表
                    models.Keyword.find({},{name:1},function(error,keydocs){
                        if(error)console.log("获得关键字列表出错:"+error);
                		//3.遍历关键字列表,如果当前内容符合条件则存入对应关键字下
                        for(let j = 0;j<keydocs.length;j++){
                            if(keydocs[j].name.length<2) {consonle.log("当前关键字过短:"+keydocs[j].name);continue;}
							if(content.indexOf(keydocs[j].name)>-1)
                            {
								//4.找到符合条件,进行更新动作
								let conditions = {name: keydocs[j].name};
								let update = {$addToSet: {articles: docs[i].msgMid}};
								models.Keyword.update(conditions,update,function(error){
									if(error) {
										console.log("符合条件,但更新关键词表[articles]失败"+error);
									}
								});
                                conditions={msgMid:docs[i].msgMid};
                                update ={isKeyword:true};
                                models.Post.update(conditions,update,function(error){
									if(error) {
										console.log("符合条件,但更新文章列表[isKeyword]失败"+error);
									}
								});
                            }
                        
                        }
                    })
                    
                }
            });
        }
    });
}
fun();
