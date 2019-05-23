const models = require('../../models');
/*const config = require('../../config');

const {
  rule: ruleConfig,
} = config;

const {
  page: pageConfig,
} = ruleConfig;
*/
function fun(){/*
    let content = "123";
    if(pageConfig.isSavePostContent){
        let msgBiz = "MzI1MDcxMzM0MA==";
        let msgMid = "2247483700";
        let msgIdx = "1";
        models.Post.findOneAndUpdate(
          { msgBiz, msgMid, msgIdx },
          { content:content },
          function(err){
          if (err) return console.log(err);
          	console.log("成功");
		  },
          { upsert: true },
        ); 
        console.log("content:",content);
        console.log("msgMid:",msgMid,"msgBiz:",msgBiz,"msgIdx:",msgIdx);
        console.log("保存正文成功 msgMid: "+msgMid);
    }*/
	/*models.Keyword.find().forEach(
		function(item) {
			item.articles.forEach(
				function(arr, index) {
					console.log("arr:",arr,"index:",index);
				}
			);
		}
	)*/
	let keyword='开心';
    let conditions = {name:keyword};
    console.log("conditions:",conditions);
   models.Keyword.find(conditions,{},function(err,docs){
        if(err){
            console.log(err);
        }else{
            console.log("docs[0].articles:",docs[0].articles);
        }
            
    });

}
fun();
