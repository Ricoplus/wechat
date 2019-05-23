const models = require('../../models');
/*const config = require('../../config');

const {
  rule: ruleConfig,
} = config;

const {
  page: pageConfig,
} = ruleConfig;
*/
const fun = async function(){
    const id  = "5ce613f708338c12bf0aab3d";
    //待置为false的msgMid
    const msgMidsArr=[];
    let keywords = await models.Keyword.findById(id);
    if (keywords && keywords.articles&& keywords.articles.length) {
			msgMidsArr.push(keywords.articles);
    }  
    console.log("msgMidsArr[0].length:",msgMidsArr[0].length,"msgMidsArr:",msgMidsArr);
   

    if(msgMidsArr!=0){
    for(let i = 0;i<msgMidsArr[0].length;i++){
	    let msgMid=msgMidsArr[0][i];
	    let isKeyword =false;
        const data = models.Post.findOneAndUpdate(
            {msgMid},
            {isKeyword},
            { new: true, upsert: true },
            function(error){
                if(error) {
                    console.log(error);
                }
            },
         );
        console.log('msgMidsArr[0][',i,']:', msgMidsArr[0][i]);
     }
   }
    const doc = await models.Keyword.findByIdAndRemove(id);
    if (!doc) {
        console.log('不存在此关键词');
    }else {
        console.log('删除关键词成功');
    } 
}
fun();
