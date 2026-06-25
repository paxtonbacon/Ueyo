// pages/add/Evaluate_add/Evaluate_add.js
Page({
  data: {
    goodsId: '',
    direction: 'buyer_to_seller',
    ratingType: 'good',
    reviewType: 'goods',       // goods | bounty
    content: '',
    imageList: [],
    imageFileIDs: [],
    isLoading: false,
    statusBarHeight: 20,
    navTotalHeight: 64
  },

  onLoad(options) {
    this.initNavBarHeight();
    if (options.goodsId) this.setData({ goodsId: options.goodsId });
    if (options.direction) this.setData({ direction: options.direction });
    if (options.type) this.setData({ reviewType: options.type });
  },

  initNavBarHeight() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      navTotalHeight: (sysInfo.statusBarHeight || 20) + (/iOS/i.test(sysInfo.system) ? 44 : 48)
    });
  },

  // 评级选择
  onRatingTap(e) {
    this.setData({ ratingType: e.currentTarget.dataset.type });
  },

  // 内容输入
  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  // 图片选择
  async chooseImage() {
    const remain = 9 - this.data.imageList.length;
    if (remain <= 0) { wx.showToast({ title: '最多9张', icon: 'none' }); return; }
    wx.chooseMedia({
      count: remain, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...' });
        const ids = [], paths = [];
        for (const f of res.tempFiles) {
          const cp = `reviews/${Date.now()}_${Math.random().toString(36).slice(2,8)}.jpg`;
          const up = await wx.cloud.uploadFile({ cloudPath: cp, filePath: f.tempFilePath });
          ids.push(up.fileID); paths.push(f.tempFilePath);
        }
        this.setData({ imageList: [...this.data.imageList, ...paths], imageFileIDs: [...this.data.imageFileIDs, ...ids] });
        wx.hideLoading();
      }
    });
  },

  deleteImage(e) {
    const i = e.currentTarget.dataset.index;
    const l = [...this.data.imageList]; l.splice(i, 1);
    const f = [...this.data.imageFileIDs]; f.splice(i, 1);
    this.setData({ imageList: l, imageFileIDs: f });
  },

  // 提交评价
  async onSubmit() {
    if (!this.data.content.trim()) { wx.showToast({ title: '请填写评价内容', icon: 'none' }); return; }
    this.setData({ isLoading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'review/submit',
          data: {
            goodsId: this.data.goodsId,
            direction: this.data.direction,
            ratingType: this.data.ratingType,
            reviewType: this.data.reviewType,
            content: this.data.content.trim(),
            images: this.data.imageFileIDs
          }
        }
      });
      if (res.result.code === 0) {
        wx.showToast({ title: '评价成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        wx.showToast({ title: res.result.msg || '评价失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
    this.setData({ isLoading: false });
  },

  goBack() {
    if (this.data.content || this.data.imageList.length > 0) {
      wx.showModal({ title: '提示', content: '有未保存的内容，确定退出吗？', success: r => { if (r.confirm) wx.navigateBack(); } });
    } else { wx.navigateBack(); }
  }
})
