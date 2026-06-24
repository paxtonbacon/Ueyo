// pages/self/Myself/Myself.js
const app = getApp()

Page({
  data: {
    isLogin: false,
    authLevel: 0,          // 0=未注册, 1=已注册待验证, 2=已验证
    userInfo: {
      nickName: '',
      avatarUrl: '',
      email: ''
    },
    
    weekLabels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    monthColumns: [],
    heatmapData: [[], [], [], [], [], [], []],
    weekDays: [],
    weeklyData: [],
    weeklyTrend: 12,
    summaryData: [
      { icon: '📊', value: 108, label: '近7天活跃' },
      { icon: '🔥', value: 12, label: '连续活跃' },
      { icon: '⭐', value: 67, label: '获得点赞' },
      { icon: '✏️', value: 8, label: '新增发布' }
    ],
    insightText: '你通常在下午时段最活跃，建议在这个时间段发布内容，获得更多互动！'
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    // 每次显示时更新登录态（从注册/验证页返回时刷新）
    this.syncFromGlobalData();
  },

  // ========== 从全局数据同步登录态 ==========
  syncFromGlobalData() {
    try {
      const g = app && app.globalData;
      if (!g) return;
      if (g.isLogin && g.token) {
        this.setData({
          isLogin: true,
          authLevel: g.authLevel || 0,
          'userInfo.nickName': g.nickName || '',
          'userInfo.avatarUrl': g.avatarUrl || '',
          'userInfo.email': g.email || ''
        });
        this.updateWeeklyData();
        this.initHeatmapData();
      }
    } catch (e) {
      console.warn('syncFromGlobalData error:', e);
    }
  },

  // ========== 检查登录状态 ==========
  async checkLoginStatus() {
    try {
      const g = app && app.globalData;
      if (!g) { this.setData({ isLogin: false }); return; }

      // 1. 运行时优先
      if (g.isLogin && g.token) {
        this.syncFromGlobalData();
        return;
      }

      // 2. 持久化恢复
      app.restoreAuth();
      if (g.isLogin && g.token) {
        this.syncFromGlobalData();
        return;
      }

      // 3. 未登录
      this.setData({ isLogin: false, authLevel: 0 });
    } catch (e) {
      console.warn('checkLoginStatus error:', e);
      this.setData({ isLogin: false });
    }
  },

  // ========== 点击登录 → 跳转注册页 ==========
  onTapLogin() {
    try {
      const g = app && app.globalData;
      if (g && g.isLogin && g.authLevel >= 2) {
        
        this.loadProfile();
        return;
      }
      if (g && g.isLogin && g.authLevel === 1) {
        wx.navigateTo({ url: '/pages/register_login/Email_Val/Email_Val' });
        return;
      }
    } catch (e) {}
    // 默认：跳转注册页
    wx.navigateTo({ url: '/pages/register_login/UserRegister/UserRegister' });
  },
  // ========== 加载个人信息 ==========
  async loadProfile() {
    try {
      const g = app && app.globalData;
      if (!g || !g.token) return;
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'user/profile',
          data: { __auth: g.token }
        }
      });
      if (res.result && res.result.code === 0) {
        const u = res.result.data;
        this.setData({
          isLogin: true,
          authLevel: g.authLevel || 0,
          'userInfo.nickName': u.nickName || '',
          'userInfo.avatarUrl': u.avatarUrl || '',
          'userInfo.email': u.email || ''
        });
      }
    } catch (err) {
      console.error('加载个人信息失败:', err);
    }
  },
  
  // 更新近7天数据
  updateWeeklyData() {
    const weekDays = [];
    const weeklyData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      weekDays.push(`${month}/${day}`);
      
      const dayOfWeek = date.getDay();
      let value;
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        value = Math.floor(Math.random() * 15) + 15;
      } else {
        value = Math.floor(Math.random() * 10) + 5;
      }
      weeklyData.push(value);
    }
    
    this.setData({ weekDays, weeklyData });
    
    setTimeout(() => {
      this.drawTrendChart();
    }, 200);
  },
  
  // 初始化热力图数据（7行 × 8列）
  // 初始化热力图数据（7行 × 13列）
initHeatmapData() {
  const rows = 7;
  const cols = 13;  // 13周 ≈ 3个月
  
  const heatmapData = [];
  
  // 生成模拟数据
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      const count = Math.floor(Math.random() * 20);
      let level = 0;
      if (count === 0) level = 0;
      else if (count <= 3) level = 1;
      else if (count <= 7) level = 2;
      else if (count <= 12) level = 3;
      else level = 4;
      
      row.push({
        date: `2026-${Math.floor(j / 4.3) + 4}-${j % 30 + 1}`,
        count: count,
        level: level
      });
    }
    heatmapData.push(row);
  }
  
  // 生成月份列标签（只在变化时显示）
  const monthColumns = [];
  let lastMonth = null;
  
  for (let j = 0; j < cols; j++) {
    let monthName = '';
    if (j < 4) monthName = '4月';
    else if (j < 9) monthName = '5月';
    else monthName = '6月';
    
    const show = (monthName !== lastMonth);
    monthColumns.push({
      name: monthName,
      show: show
    });
    lastMonth = monthName;
  }
  
  this.setData({
    heatmapData: heatmapData,
    monthColumns: monthColumns
  });
  
  console.log('热力图初始化完成', heatmapData.length, '行', heatmapData[0]?.length, '列');
},
  
  onReady() {},

  // 绘制折线图
  drawTrendChart() {
    const query = wx.createSelectorQuery();
    query.select('#trendChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          console.error('获取 Canvas 节点失败');
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const { weeklyData } = this.data;
        
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const canvasWidth = res[0].width;
        const canvasHeight = res[0].height;
        
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        ctx.scale(dpr, dpr);
        
        const padding = { top: 30, bottom: 30, left: 45, right: 25 };
        const chartWidth = canvasWidth - padding.left - padding.right;
        const chartHeight = canvasHeight - padding.top - padding.bottom;
        
        const maxValue = Math.max(...weeklyData, 10);
        const minValue = 0;
        const valueRange = maxValue - minValue;
        
        const points = weeklyData.map((value, index) => {
          const x = padding.left + (index / (weeklyData.length - 1)) * chartWidth;
          const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
          return { x, y, value };
        });
        
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        ctx.beginPath();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
          const y = padding.top + (i / 4) * chartHeight;
          ctx.moveTo(padding.left, y);
          ctx.lineTo(padding.left + chartWidth, y);
          ctx.stroke();
        }
        
        ctx.beginPath();
        ctx.strokeStyle = '#40c463';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        
        for (let i = 0; i < points.length; i++) {
          ctx.beginPath();
          ctx.fillStyle = '#40c463';
          ctx.arc(points[i].x, points[i].y, 6, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.beginPath();
          ctx.fillStyle = '#fff';
          ctx.arc(points[i].x, points[i].y, 3, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.fillStyle = '#666';
          ctx.font = '12px sans-serif';
          ctx.fillText(points[i].value, points[i].x - 8, points[i].y - 12);
        }
        
        ctx.fillStyle = '#aaa';
        ctx.font = '11px sans-serif';
        for (let i = 0; i <= 4; i++) {
          const value = Math.round(minValue + (i / 4) * valueRange);
          const y = padding.top + chartHeight - (i / 4) * chartHeight;
          ctx.fillText(value, 8, y + 3);
        }
      });
  },

  // 点击热力图格子
  onTapCell(e) {
    const { date, count } = e.currentTarget.dataset;
    if (!date) return;
    wx.showModal({
      title: date,
      content: `当日活跃次数：${count}次`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 刷新分析建议
  onRefreshInsight() {
    const insights = [
      '你通常在下午时段最活跃，建议在这个时间段发布内容，获得更多互动！',
      '周末你的活跃度更高，多参与热门话题讨论吧！',
      '你晚上浏览商品最多，是不是准备剁手了？',
      '连续活跃12天！保持这个节奏，即将解锁「活跃达人」勋章！',
      '本周点赞量上涨8%，你的内容越来越受欢迎啦！'
    ];
    const random = Math.floor(Math.random() * insights.length);
    this.setData({ insightText: insights[random] });
    wx.showToast({ title: '已更新', icon: 'none', duration: 1000 });
  },

  // ========== 页面跳转方法 ==========
  goToSettings() {
    wx.navigateTo({ url: '/pages/self/Setting/Setting' });
  },

  goToMyPosts() {
    wx.navigateTo({ url: '/pages/self/Publication/Publication' });
  },

  goToOrders() {
    wx.navigateTo({ url: '/pages/self/Order/Order' });
  },

  goToFavorites() {
    wx.navigateTo({ url: '/pages/self/Favorites/Favorites' });
  },

  goToHistory() {
    wx.navigateTo({ url: '/pages/self/History/History' });
  }
});