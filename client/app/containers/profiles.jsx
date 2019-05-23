import React from 'react';
import { connect } from 'react-redux';
import { fetchProfiles, showMessage, addProfile, deleteProfile } from '../actions';
import Loading from '../components/loading.jsx';
import moment from 'moment';
import RaisedButton from 'material-ui/RaisedButton';
import Paginator from '../components/paginator.jsx';
import { Link } from 'react-router';
import Search from './search.jsx';

// 新建的内容
const addContent = JSON.stringify({
  title: 'title',
  wechatId: 'wechatId',
  desc: 'desc',
  msgBiz: 'msgBiz',
  headimg: 'headimg',
}, null, 2);

class Profiles extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      // 是否显示新建的操作框
      showAddDiv: false,
      // 新建的内容
      addContent: addContent,
    };
	this.onAddSubmit = this.onAddSubmit.bind(this);
    this.returnCurrentSearchArgs = this.returnCurrentSearchArgs.bind(this);
  }

  componentDidMount() {
    let { dispatch, location } = this.props;
    dispatch(fetchProfiles(location.query));
  }

  // eslint-disable-next-line
  componentWillReceiveProps(nextProps) {
    if (nextProps.location.search !== this.props.location.search) {
      let { dispatch } = this.props;
      dispatch(fetchProfiles(nextProps.location.query));
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
  async deleteProfile(id) {
    const { dispatch } = this.props;
    await dispatch(deleteProfile(id));
    setTimeout(() => { location.reload(); }, 300); // 手动刷新页面
  }

  // 新建提交
  async onAddSubmit() {
    const { addContent } = this.state;
    const { dispatch } = this.props;
    let doc;
    try {
      doc = JSON.parse(addContent);
    } catch (e) {
      dispatch(showMessage('输入解析错误，请检查'));
      return;
    }
    await dispatch(addProfile(doc));
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
    let { isFetching, profiles, history, location } = this.props;
    let { search, pathname } = location;
    console.log("profiles:",profiles,"isFetching:",isFetching)
    if (isFetching || !profiles.data) return <Loading />;
    let metadata = profiles.metadata;
    return (
      <div>
		{this.renderAdd()}
        <RaisedButton
          label="新建公众号"
          onClick={() => {
            this.setState({ showAddDiv: true });
          }}
        />
        <Search
          location={location}
          history={history}
          searchArgs={this.returnCurrentSearchArgs()}
          defaultText="搜索公众号..."
        />
        <table className="table table-striped">
          <thead>
            <tr>
              <th>更新时间</th>
              <th>头像</th>
              <th>公众号</th>
              <th>最新</th>
              <th>最旧</th>
              <th>文章数</th>
              <th>详情</th>
			  <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {
              profiles.data.map(profile => {
                return (
                  <tr key={profile.id}>
                    <td>{profile.openHistoryPageAt ? moment(profile.openHistoryPageAt).format('YY-MM-DD HH:mm') : ''}</td>
                    <td><img style={{ height: '24px', marginRight: '3px' }} src={profile.headimg} className="img-circle" /></td>
                    <td><Link to={`/posts?msgBiz=${profile.msgBiz}`}>{profile.title}</Link></td>
                    <td>{profile.newestPostTime ? moment(profile.newestPostTime).format('YY-MM-DD'): ''}</td>
                    <td>{profile.oldestPostTime ? moment(profile.oldestPostTime).format('YY-MM-DD'): ''}</td>
                    <td>{profile.postsAllCount}</td>
                    <td><Link to={`/profiles/${profile.id}`}>详情</Link></td>
                    <td>
                      <span
                        onClick={() => { this.deleteProfile(profile.id); }}
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
        <Paginator { ...metadata } history={ history } search={ search } pathname={ pathname } ></Paginator>
      </div>
    );
  }
}

export default connect(state => state)(Profiles);
