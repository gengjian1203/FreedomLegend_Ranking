// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
  extends: cc.Component,

  ctor() {
    // 排名类型
    this.constType = ['level', 'power', 'sportsNumber'];

  },

  properties: {
    // 成员项预制体
    m_prefabUserItem: {
      type: cc.Prefab,
      default: null
    },
    // 背景节点
    m_background: {
      type: cc.Node,
      default: null
    },
    // 内容节点
    m_content: {
      type: cc.Node,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  start () {
    wx.onMessage( data => {
      // console.log(data.message);
      if (data.message === 'getRanking') {
        this.setRankingData(data.type, data.openid);
      }
    });
  },

  onEnable () {
    console.log('Ranking onEnable...');
  },

  onDisable () {
    console.log('Ranking onDisable...');
  },

  // update (dt) {},

  //////////////////////////////////////////////////
  // 交互事件
  //////////////////////////////////////////////////
  // 获取排行榜列表数据
  // param: nType 0 - 'level', 1 - 'power', 2 - 'sportsNumber'
  // param: openid
  setRankingData(nType, openid) {
    const strKey = this.constType[nType];
    // 清除原有数据
    if (this.m_content) {
      this.m_content.destroyAllChildren();
    }
    // 获取新数据
    wx.getFriendCloudStorage({
      keyList: [strKey],
      success: (res) => {
        console.log('getFriendCloudStorage', res);
        let nIndexMyself = 0;
        const nLength = res.data.length > 10 ? 10 : res.data.length;

        // 对获取数据进行自检
        this.checkRankingData(res.data, strKey);
        // 对获取数据进行排序 0-降序 1升序
        const nSortType = nType === 2 ? 1 : 0;
        this.sortRankingData(res.data, nType, nSortType);

        for (let i = 0; i < nLength; i++) {
          // 找到自己保存序号
          if (res.data[i % nLength].openid === openid) {
            nIndexMyself = i % nLength;
          }
          console.log('Ranking....', res.data[i % nLength]);
          this.createUserItem(i, res.data[i % nLength], nType);
        }
        // 渲染自身数据
        this.createUserItemMeself(nIndexMyself, res.data[nIndexMyself], nType);
      },
      fail: (res) => {
          console.error(res);
      }
    });
  },

  //////////////////////////////////////////////////
  // 接口函数
  //////////////////////////////////////////////////

  //////////////////////////////////////////////////
  // 自定义函数
  //////////////////////////////////////////////////
  // 通过当前等级，计算当前的境界
  getTasteString(level) {
    let strResult = '';
    const arrTasteHeader = ['筑基', '开光', '融合', '心动', '金丹', '元婴', '出窍', '分神', '合体', '洞虚', '大乘', '渡劫', '散仙', '灵仙', '真仙', '玄仙', '金仙', '准圣', '圣人', '鸿蒙'];
    const arrTasteTail = ['一重', '二重', '三重', '四重', '五重', '六重', '七重', '八重', '九重', '十重'];
    strResult = `${arrTasteHeader[Math.floor(level / 10)]}${arrTasteTail[level % 10]}`
    return strResult;
  },

  // 取到一个安全的Value用来比较
  // nType: Number 0 - 'level', 1 - 'power', 2 - 'sportsNumber'
  getSafeValue(objWxgame, nType) {
    let value = objWxgame[this.constType[0]] || objWxgame[this.constType[1]] || objWxgame[this.constType[2]];
    value = value ? value : 0;
    if (nType === 2) {
      if (value > 9999 || value === 0) {
        value = '10000';
      }
    }
    return value;
  },

  // 取到一个安全的Value用来显示 只有带参数nType才去特殊解析
  // nType: Number 0 - 'level', 1 - 'power', 2 - 'sportsNumber'
  getSafeValueString(objWxgame, nType) {
    let value = objWxgame[this.constType[0]] || objWxgame[this.constType[1]] || objWxgame[this.constType[2]];
    value = value ? value : 0;
    if (nType === 0) {
      if (value > 199) {
        value = 199;
      }
      value = this.getTasteString(value);
    }
    if (nType === 2) {
      if (value > 9999 || value === 0) {
        value = '9999+';
      }
    }
    return value;
  },

  // 检验排行榜数据
  checkRankingData(data, strKey) {
    data.forEach((item) => {
      // 如果没有数值，就置零作为保护数据
      if (item.KVDataList.length === 0) {
        const tmpObj = {
          key: strKey,
          value: `{"wxgame":{"${strKey}":0,"update_time":0}}`
        }
        item.KVDataList.push(tmpObj);
      }
    });
    console.log('checkRankingData', data);
  },

  // 对获取数据进行排序 
  // nType: Number 0 - 'level', 1 - 'power', 2 - 'sportsNumber'
  // nSortType: Number 0-降序 1-升序
  sortRankingData(data, nType, nSortType) {
    data.sort((userA, userB) => {
      const wxgameA = JSON.parse(userA.KVDataList[0].value).wxgame;
      const wxgameB = JSON.parse(userB.KVDataList[0].value).wxgame;

      let valueA = this.getSafeValue(wxgameA, nType);
      let valueB = this.getSafeValue(wxgameB, nType);
      valueA = valueA ? valueA : 0;
      valueB = valueB ? valueB : 0;
      const nResult = nSortType === 1 ? valueA - valueB : valueB - valueA;
      return nResult;
    })
  },  

  // 渲染一个预制体成员
  createUserItem(index, user, nType) {
    console.log('createUserItem', index, user, nType);
    let item = cc.instantiate(this.m_prefabUserItem);
    let wxgame = JSON.parse(user.KVDataList[0].value).wxgame;
    this.m_content.addChild(item);
    item.x = 0;
    item.y = -100 + -index * 100;
    this.m_content.height = index * 100
    
    item.getChildByName('userIndex').getComponent(cc.Label).string = String(index + 1);
    item.getChildByName('userName').getComponent(cc.Label).string = user.nickName || user.nickname;
    item.getChildByName('userValue').getComponent(cc.Label).string = this.getSafeValueString(wxgame, nType);
    cc.loader.load({url: user.avatarUrl, type: 'png'}, (err, texture) => {
      if (err) {
        console.error(err);
      }
      item.getChildByName('userAvatar').getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(texture);
    });
  },

  // 渲染自身
  createUserItemMeself(index, user, nType) {
    console.log('createUserItem', index, user, nType);
    let item = cc.instantiate(this.m_prefabUserItem);
    let wxgame = JSON.parse(user.KVDataList[0].value).wxgame;
    this.m_background.addChild(item);
    item.x = 0;
    item.y = 200;
    
    item.getChildByName('userIndex').getComponent(cc.Label).string = String(index + 1);
    item.getChildByName('userName').getComponent(cc.Label).string = user.nickName || user.nickname;
    item.getChildByName('userValue').getComponent(cc.Label).string = this.getSafeValueString(wxgame, nType);
    cc.loader.load({url: user.avatarUrl, type: 'png'}, (err, texture) => {
      if (err) {
        console.error(err);
      }
      item.getChildByName('userAvatar').getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(texture);
    });
  }
});
