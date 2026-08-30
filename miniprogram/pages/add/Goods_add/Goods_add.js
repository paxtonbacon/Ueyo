// pages/add/Goods_add/Goods_add.js
const app = getApp()

function requireAuth() {
  const g = app && app.globalData
  if (!g || !g.isLogin || g.authLevel < 2) {
    wx.showModal({
      title: '需要认证',
      content: '请先完成邮箱验证，才能发布商品',
      confirmText: '去验证',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/register_login/Email_Val/Email_Val' })
        }
      }
    })
    return false
  }
  return true
}

Page({
  data: {
    title: '',
    description: '',
    imageList: [],
    imageFileIDs: [],
    price: '',
    tradeMethod: '',
    quantity: '1',
    condition: '1',
    topicList: [],           // 话题列表 [{ id, title }]
    topicTitles: [],         // 话题标题数组（picker用）
    topicIndex: 0,           // 当前选中的话题索引
    relatedTopicId: '',      // 选中话题的ID，"others"=其他
    statusBarHeight: 20,
    navTotalHeight: 64,
    isGenerating: false,
    aiGenerated: false,
  },

  onLoad() {
    this.initNavBarHeight();
    this.loadTopicList();
  },

  onShow() {
    if (!requireAuth()) {
      wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/self/Myself/Myself' }) });
    }
  },

  // ========== 导航栏高度 ==========
  initNavBarHeight() {
    const sysInfo = wx.getSystemInfoSync();
    const statusBarHeight = sysInfo.statusBarHeight || 20;
    const isIOS = /iOS/i.test(sysInfo.system);
    const navContentHeight = isIOS ? 44 : 48;
    const navTotalHeight = statusBarHeight + navContentHeight;
    this.setData({ statusBarHeight, navTotalHeight });
  },

  // ========== 标题输入 ==========
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  // ========== 描述输入 ==========
  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  // ========== 选择图片（上传到云存储） ==========
  async chooseImage() {
    const remainCount = 9 - this.data.imageList.length;
    if (remainCount <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }

    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...' });

        const tempFiles = res.tempFiles;
        const uploadedFileIDs = [];
        const localPaths = [];

        try {
          // 逐张上传到云存储
          for (const file of tempFiles) {
            const cloudPath = `goods/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
            const uploadRes = await wx.cloud.uploadFile({
              cloudPath: cloudPath,
              filePath: file.tempFilePath
            });
            uploadedFileIDs.push(uploadRes.fileID);
            localPaths.push(file.tempFilePath);
          }

          this.setData({
            imageList: [...this.data.imageList, ...localPaths],
            imageFileIDs: [...this.data.imageFileIDs, ...uploadedFileIDs]
          });

          wx.hideLoading();
          wx.showToast({ title: `上传成功 ${uploadedFileIDs.length} 张`, icon: 'success' });
        } catch (err) {
          wx.hideLoading();
          console.error('上传图片失败:', err);
          wx.showToast({ title: '图片上传失败，请重试', icon: 'none' });
        }
      }
    });
  },

  // ========== 删除图片 ==========
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const newList = [...this.data.imageList];
    const newFileIDs = [...this.data.imageFileIDs];
    newList.splice(index, 1);
    newFileIDs.splice(index, 1);
    this.setData({
      imageList: newList,
      imageFileIDs: newFileIDs
    });
  },

  // ========== AI 一键填充（调用云函数） ==========
  async onAIComplete() {
    // 校验必填字段
    if (!this.data.title || this.data.title.trim().length === 0) {
      wx.showToast({ title: '请先填写商品标题', icon: 'none' });
      return;
    }
    if (!this.data.price || parseFloat(this.data.price) <= 0) {
      wx.showToast({ title: '请先填写有效价格', icon: 'none' });
      return;
    }

    this.setData({ isGenerating: true });
    wx.showLoading({ title: 'AI 生成中...' });

    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'goods/generateDesc',
          data: {
            title: this.data.title.trim(),
            user_brief: this.data.description || '暂无描述',  // 用户已填的描述作为上下文
            price: parseFloat(this.data.price),
            condition: this.data.condition || '1',
          }
        }
      });

      wx.hideLoading();
      this.setData({ isGenerating: false });

      const result = res.result;
      if (result.code === 0 && result.data.generated) {
        // AI 生成成功，回填到描述框
        this.setData({
          description: result.data.description,
          aiGenerated: true
        });
        wx.showToast({ title: 'AI 生成完成', icon: 'success' });
      } else {
        // AI 生成失败
        wx.showToast({
          title: result.data?.message || 'AI 生成失败，请手动填写',
          icon: 'none'
        });
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ isGenerating: false });
      console.error('AI 生成失败:', err);
      wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
    }
  },

  // ========== 价格输入 ==========
  onPriceInput(e) {
    this.setData({ price: e.detail.value });
  },

  // ========== 交易方式输入（自由文本） ==========
  onTradeMethodInput(e) {
    this.setData({ tradeMethod: e.detail.value });
  },

  // ========== 新旧程度选择（picker index → enum值） ==========
  onConditionChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ condition: String(index + 1) });  // 0→'1'全新, 1→'2'几乎全新, 2→'3'轻微痕迹, 3→'4'明显痕迹
  },

  // ========== 售卖量增加 ==========
  increaseQuantity() {
    let num = parseInt(this.data.quantity) || 1;
    num++;
    this.setData({ quantity: num.toString() });
  },

  // ========== 售卖量减少 ==========
  decreaseQuantity() {
    let num = parseInt(this.data.quantity) || 1;
    if (num > 1) {
      num--;
      this.setData({ quantity: num.toString() });
    }
  },

  // ========== 售卖量输入 ==========
  onQuantityInput(e) {
    let val = e.detail.value;
    if (val === '' || parseInt(val) < 1) val = '1';
    this.setData({ quantity: val });
  },

  // ========== 加载话题列表 ==========
  async loadTopicList() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: { action: 'social/topic/list', data: { page: 1, pageSize: 50 } }
      });
      if (res.result && res.result.code === 0) {
        const topics = res.result.data.topic_list || [];
        const titles = topics.map(t => t.title);
        titles.push('其他');  // 添加"其他"选项
        this.setData({
          topicList: topics,
          topicTitles: titles
        });
      }
    } catch (e) {
      console.error('加载话题列表失败:', e);
    }
  },

  // ========== 话题选择 ==========
  onTopicChange(e) {
    const index = parseInt(e.detail.value);
    const topicList = this.data.topicList;
    let relatedTopicId = 'others';
    if (index < topicList.length) {
      relatedTopicId = topicList[index].id;
    }
    this.setData({ topicIndex: index, relatedTopicId });
  },

  // ========== 发布商品（调用云函数） ==========
  async onPublish() {
    // ----- 表单校验 -----
    if (!this.data.title || this.data.title.trim().length < 4) {
      wx.showToast({ title: '标题至少4个字', icon: 'none' });
      return;
    }
    if (!this.data.description || this.data.description.trim().length === 0) {
      wx.showToast({ title: '请填写商品描述', icon: 'none' });
      return;
    }
    if (this.data.imageFileIDs.length === 0) {
      wx.showToast({ title: '请上传商品图片', icon: 'none' });
      return;
    }
    const priceNum = parseFloat(this.data.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      wx.showToast({ title: '请填写有效价格', icon: 'none' });
      return;
    }
    if (!this.data.relatedTopicId) {
      wx.showToast({ title: '请选择话题分类', icon: 'none' });
      return;
    }

    const requestData = {
      title: this.data.title.trim(),
      description: this.data.description.trim(),
      category: this.data.topicTitles[this.data.topicIndex] || '其他',
      subCategory: this.data.topicTitles[this.data.topicIndex] || '其他',
      price: priceNum,
      condition: this.data.condition || '1',
      tradeType: this.data.tradeMethod || '面交',
      images: this.data.imageFileIDs,
      tags: [],
      attrs: {},
      relatedTopics: this.data.relatedTopicId
    };

    wx.showLoading({ title: '发布中...' });

    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          __auth: (app && app.globalData && app.globalData.token) || '',
          action: 'goods/publish',
          data: requestData
        }
      });

      wx.hideLoading();

      const result = res.result;
      if (result.code === 0) {
        wx.showToast({
          title: result.data?.message || '发布成功',
          icon: 'success'
        });
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: result.msg || result.error?.msg || '发布失败',
          icon: 'none'
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('发布失败:', err);
      wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
    }
  },

  // ========== 返回 ==========
  goBack() {
    if (this.data.title || this.data.description || this.data.imageList.length > 0) {
      wx.showModal({
        title: '提示',
        content: '有未保存的内容，确定退出吗？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  }
});