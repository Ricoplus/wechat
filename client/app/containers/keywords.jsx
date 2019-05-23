import React from 'react';
import { connect } from 'react-redux';
import { fetchKeywords, showMessage, addKeyword,deleteKeyword } from '../actions';
import Loading from '../components/loading.jsx';
import { Link } from 'react-router';
import Paginator from '../components/paginator.jsx';
import RaisedButton from 'material-ui/RaisedButton';
import Search from './search.jsx';

//新建的内容
const addContent = JSON.stringify({
  name: 'name',
}, null, 2);

class Keywords extends React.Component {

  constructor(props) {
    super(props);
	this.state={
	//是否显示新建的操作框
	showAddDiv:false,
	//新建的内容
	addContent:addContent,
	};
	this.onAddSubmit = this.onAddSubmit.bind(this);	
    this.returnCurrentSearchArgs = this.returnCurrentSearchArgs.bind(this);
  }

  componentDidMount() {
    const { dispatch, location } = this.props;
    dispatch(fetchKeywords(location.query));
  }

  // eslint-disable-next-line
  componentWillReceiveProps(nextProps) {
    if (nextProps.location.search !== this.props.location.search) {
      const { dispatch } = this.props;
      dispatch(fetchKeywords(nextProps.location.query));
    }
  }

  returnCurrentSearchArgs() {
    const { location } = this.props;
    const { search } = location;
    const searchArgs = {};
    search.replace('?', '').split('&').forEach(item => {
      let key = item.split('=')[0];
      let value = item.replace(`${key}=`, '');
      if (key && value) searchArgs[key] = value;
    });
    return searchArgs;
  }
  // 删除
  async deleteKeyword(id) {
    const { dispatch } = this.props;
    await dispatch(deleteKeyword(id));
    setTimeout(() => { location.reload(); }, 300); // 手动刷新页面
  }

  // 新建提交
  async onAddSubmit() {
    const { addContent } = this.state;
    const { dispatch } = this.props;
    let doc;
    try {
      doc = JSON.parse(addContent);
      if(doc.name.length<2){
        dispatch(showMessage('关键字至少两个字符以上'));
        return;
      }
    } catch (e) {
      dispatch(showMessage('输入解析错误，请检查'));
      return;
    }
    await dispatch(addKeyword(doc));
    setTimeout(() => { location.reload(); }, 300); // 手动刷新页面
  }

  // 新建
  renderAdd() {
    const { showAddDiv, addContent } = this.state;
    if (!showAddDiv) return null;

    const style = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      width: '500px',
      height: '250px',
      margin: '-125px 0 0 -250px',
      padding: '20px',
      background: '#f9f9f9',
      zIndex: 999,
    };
    return (
      <div style={style}>
        <textarea
          style={{
            width: '100%',
            height: '160px',
            padding: '5px',
            fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier',
            outline: 'none',
            wordBreak: 'break-all',
          }}
          value={addContent}
          onChange={event => {
            this.setState({ addContent: event.target.value });
          }}
        />
        <RaisedButton
          style={{ marginTop: '10px' }}
          primary={true}
          label="提交"
          onClick={this.onAddSubmit}
        />
      </div>
    );
  }
  render() {
    const { keywords, isFetching, history, location } = this.props;
    const { search, pathname } = location;
    if (isFetching || !keywords.data) return <Loading />;

    const { metadata, data } = keywords;

    return (
      <div>
		{this.renderAdd()}
        <RaisedButton
          label="新建关键词"
          onClick={() => {
            this.setState({ showAddDiv: true });
          }}
        />
        <Search
          location={location}
          history={history}
          searchArgs={this.returnCurrentSearchArgs()}
          defaultText="搜索关键词..."
        />
        <table className="table table-striped">
          <thead>
            <tr>
              <th>关键词</th>
              <th>相关文章数量</th>
              <th>文章</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {
              data.map(i => {
               return( 
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.articles?i.articles.length:'0'}</td>
                  <td><Link to={`/posts?mainData=true&keywordId=${i.id}`}>详情</Link></td>
                  <td>
                      <span
                        onClick={() => { this.deleteKeyword(i.id); }}
                        style={{
                          cursor: 'pointer',
                          color: '#337ab7'
                        }}
                      >
                        删除
                      </span>
                 </td> 
                </tr>
                );
                })
            }
          </tbody>
        </table>
        <Paginator {...metadata} history={history} search={search} pathname={pathname} ></Paginator>
      </div>
    );
  }
}

export default connect(state => state)(Keywords);
