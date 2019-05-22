import React from 'react';
import { connect } from 'react-redux';
import { fetchKeywords, showMessage, addKeyword } from '../actions';
import Loading from '../components/loading.jsx';
import { Link } from 'react-router';
import Paginator from '../components/paginator.jsx';
import RaisedButton from 'material-ui/RaisedButton';

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
  // 删除
 // async deleteKeyword(id) {
 //   const { dispatch } = this.props;
 //   await dispatch(deleteKeyword(id));
 //   setTimeout(() => { location.reload(); }, 300); // 手动刷新页面
 // }

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
    console.log("keywords:",keywords,"isFetching:",isFetching);
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
        <table className="table table-striped">
          <thead>
            <tr>
              <th>关键词</th>
            </tr>
          </thead>
          <tbody>
            {
              data.map(i => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <Paginator {...metadata} history={history} search={search} pathname={pathname} ></Paginator>
      </div>
    );
  }
}

export default connect(state => state)(Keywords);
