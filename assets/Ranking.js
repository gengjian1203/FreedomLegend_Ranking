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
    this.constType = ['level', 'gold', 'money'];

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
        this.setRankingData(data.type);
      }
    });
  },

  // update (dt) {},

  //////////////////////////////////////////////////
  // 交互事件
  //////////////////////////////////////////////////
  // 获取排行榜列表数据
  // param: nType 0 - 'level', 1 - 'gold', 2 - 'money'
  setRankingData(nType) {
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
        
        // 对获取数据进行排序
        this.sortRankingData(res.data);
        for (let i = 0; i < res.data.length; i++) {
          console.log('Ranking....', res.data[i]);
          this.createUserItem(i, res.data[i]);
        }
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
  sortRankingData(data) {
    data.sort((userA, userB) => {
      const wxgameA = JSON.parse(userA.KVDataList[0].value).wxgame;
      const wxgameB = JSON.parse(userB.KVDataList[0].value).wxgame;
      const valueA = wxgameA.level || wxgameA.gold || wxgameA.money;
      const valueB = wxgameB.level || wxgameB.gold || wxgameB.money;
      return valueB - valueA;
    })
  },  

  // 渲染一个预制体成员
  createUserItem (index, user) {
    console.log('createUserItem', index, user);
    let item = cc.instantiate(this.m_prefabUserItem);
    let wxgame = JSON.parse(user.KVDataList[0].value).wxgame;
    this.m_content.addChild(item);
    item.x = 0;
    item.y = -660 - index * 100;
    
    item.getChildByName('userIndex').getComponent(cc.Label).string = String(index);
    item.getChildByName('userName').getComponent(cc.Label).string = user.nickName || user.nickname;
    item.getChildByName('userValue').getComponent(cc.Label).string = wxgame.level || wxgame.gold || wxgame.money;
    cc.loader.load({url: user.avatarUrl, type: 'png'}, (err, texture) => {
      if (err) {
        console.error(err);
      }
      item.getChildByName('userAvatar').getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(texture);
    });
  }
});
