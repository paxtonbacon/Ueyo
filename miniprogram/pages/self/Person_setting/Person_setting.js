// pages/self/Person_setting/Person_setting.js
Page({
  data: {
    // 基本信息
    nickname: '',
    gender: '',
    genderText: '',
    meetingPoint: '',
    registerTime: '',
    
    // 开关状态
    msgSwitch: true,
    recSwitch: false,
    
    // 原始数据备份
    originalData: {}
  },

  onLoad(options) {
    // ========== 登录状态检测（测试时可注释掉） ==========
    // const isLogin = wx.getStorageSync('isLogin');
    // if (!isLogin) {
    //   wx.showToast({
    //     title: '请先登录',
    //     icon: 'none',
    //     duration: 1500
    //   });
    //   setTimeout(() => {
    //     wx.navigateTo({
    //       url: '/pages/login/login'
    //     });
    //   }, 1500);
    //   return;
    // }
    // =================================================
    
    this.loadUserInfo();
    // 备份原始数据
    this.setData({
      originalData: this.getCurrentDataSnapshot()
    });
  },

  // 从缓存加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        nickname: userInfo.nickname || '',
        gender: userInfo.gender || '',
        genderText: this.formatGenderText(userInfo.gender),
        meetingPoint: userInfo.meetingPoint || '',
        registerTime: userInfo.registerTime || '',
        msgSwitch: userInfo.msgSwitch !== undefined ? userInfo.msgSwitch : true,
        recSwitch: userInfo.recSwitch !== undefined ? userInfo.recSwitch : false
      });
    }
  },

  // 获取当前数据快照
  getCurrentDataSnapshot() {
    return {
      nickname: this.data.nickname,
      gender: this.data.gender,
      meetingPoint: this.data.meetingPoint,
      msgSwitch: this.data.msgSwitch,
      recSwitch: this.data.recSwitch
    };
  },

  // 检查数据是否有更改
  hasDataChanged() {
    const cur = this.data;
    const orig = this.data.originalData;
    return (
      cur.nickname !== orig.nickname ||
      cur.gender !== orig.gender ||
      cur.meetingPoint !== orig.meetingPoint ||
      cur.msgSwitch !== orig.msgSwitch ||
      cur.recSwitch !== orig.recSwitch
    );
  },

  // 保存更改
  saveChanges(callback) {
    const userInfo = {
      nickname: this.data.nickname,
      gender: this.data.gender,
      genderText: this.data.genderText,
      meetingPoint: this.data.meetingPoint,
      registerTime: this.data.registerTime,
      msgSwitch: this.data.msgSwitch,
      recSwitch: this.data.recSwitch
    };
    wx.setStorageSync('userInfo', userInfo);
    this.setData({
      originalData: this.getCurrentDataSnapshot()
    });
    wx.showToast({
      title: '已保存',
      icon: 'success',
      duration: 1200
    });
    if (callback) setTimeout(callback, 300);
  },

  // 恢复原始数据
  restoreOriginalData() {
    const orig = this.data.originalData;
    this.setData({
      nickname: orig.nickname,
      gender: orig.gender,
      genderText: this.formatGenderText(orig.gender),
      meetingPoint: orig.meetingPoint,
      msgSwitch: orig.msgSwitch,
      recSwitch: orig.recSwitch
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({ url: '/pages/my/my' });
      }
    });
  },

  // 退出页面（左上角返回）
  onExitTap() {
    if (this.hasDataChanged()) {
      wx.showModal({
        title: '提示',
        content: '有未保存的更改，是否保存？',
        confirmText: '保存',
        cancelText: '不保存',
        success: (res) => {
          if (res.confirm) {
            this.saveChanges(() => {
              this.goBack();
            });
          } else {
            this.restoreOriginalData();
            this.goBack();
          }
        }
      });
    } else {
      this.goBack();
    }
  },

  // ========== 编辑功能 ==========
  editNickname() {
    wx.showModal({
      title: '编辑昵称',
      content: '请输入新昵称',
      editable: true,
      placeholderText: this.data.nickname || '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          let newNick = res.content.trim();
          if (newNick.length === 0) {
            wx.showToast({ title: '昵称不能为空', icon: 'none' });
            return;
          }
          if (newNick.length > 20) {
            wx.showToast({ title: '昵称过长', icon: 'none' });
            return;
          }
          this.setData({ nickname: newNick });
        }
      }
    });
  },

  editGender() {
    const genderList = ['女', '男', '保密'];
    const genderValueMap = { '女': 'female', '男': 'male', '保密': 'unknown' };
    const currentGenderText = this.data.genderText || '保密';
    wx.showActionSheet({
      itemList: genderList,
      success: (res) => {
        const selectedText = genderList[res.tapIndex];
        const selectedValue = genderValueMap[selectedText];
        if (selectedValue) {
          this.setData({
            gender: selectedValue,
            genderText: selectedText
          });
        }
      },
      fail: () => {}
    });
  },

  editMeetingPoint() {
    wx.showModal({
      title: '编辑常用面交点',
      content: '输入常用见面地点',
      editable: true,
      placeholderText: this.data.meetingPoint || '请输入地点',
      success: (res) => {
        if (res.confirm && res.content) {
          let newPoint = res.content.trim();
          if (newPoint.length === 0) {
            wx.showToast({ title: '地点不能为空', icon: 'none' });
            return;
          }
          this.setData({ meetingPoint: newPoint });
        }
      }
    });
  },

  // ========== 开关事件 ==========
  onMsgSwitchChange(e) {
    this.setData({ msgSwitch: e.detail.value });
  },

  onRecSwitchChange(e) {
    this.setData({ recSwitch: e.detail.value });
  },

  // ========== 退出登录 ==========
  onLogoutTap() {
    if (this.hasDataChanged()) {
      wx.showModal({
        title: '未保存的更改',
        content: '您有未保存的个人信息，是否先保存再退出登录？',
        confirmText: '保存并退出',
        cancelText: '直接退出',
        success: (modalRes) => {
          if (modalRes.confirm) {
            this.saveChanges(() => {
              this.doLogout();
            });
          } else {
            this.doLogout();
          }
        }
      });
    } else {
      this.doLogout();
    }
  },

  doLogout() {
    // 清除登录状态和用户信息
    wx.setStorageSync('isLogin', false);
    wx.setStorageSync('userInfo', null);
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 1500
    });
    
    // 重置页面数据
    setTimeout(() => {
      this.setData({
        nickname: '',
        gender: '',
        genderText: '',
        meetingPoint: '',
        registerTime: '',
        msgSwitch: true,
        recSwitch: false
      }, () => {
        this.setData({
          originalData: this.getCurrentDataSnapshot()
        });
      });
      
      // 返回我的页面
      setTimeout(() => {
        wx.switchTab({ url: '/pages/my/my' });
      }, 500);
    }, 500);
  },

  // 辅助方法
  formatGenderText(genderVal) {
    if (genderVal === 'male') return '男';
    if (genderVal === 'female') return '女';
    return '保密';
  }
});