# Ueyo 校园二手交易平台 — 项目分析 & 完成规划

> 最后更新：2026-06-24 | 当前状态：前端组件框架+云函数骨架就绪，核心数据流部分打通

---

## 一、项目概述

**Ueyo** 是一个基于微信小程序的校园二手交易平台，支持：

- 商品买卖（发布/浏览/下单/收藏）
- 悬赏求购（发布/接单）
- 社区论坛（话题/帖子/回复/评论）
- 信用评价体系
- 即时消息

**技术栈：** 微信小程序原生 + 微信云开发（云函数 + 云数据库）

---

## 二、目录结构

```
cloudfunctions/backend/
├── index.js              # 路由注册（31 个路由）
├── constants/
│   ├── enums.js          # 商品状态/新旧程度枚举
│   ├── errors.js
│   └── response.js       # SUCCESS/ERROR 统一响应
├── database/models.js
├── modules/
│   ├── goods/            # 商品：详情/列表/发布/AI描述
│   ├── bounty/           # 悬赏：详情/列表/发布/接单
│   ├── social/           # 社区：话题/帖子/回复/创建话题
│   ├── user/             # 用户：登录/资料/收藏
│   ├── order/            # 订单：创建/列表/详情/取消/确认
│   ├── review/           # 评价：提交/列表
│   └── message/          # 消息：会话/列表/发送
└── utils/
    ├── aiClient.js       # AI 描述生成
    ├── helper.js         # catchAsync 包装
    ├── jwt.js / openid.js / price.js / validator.js

miniprogram/
├── app.js / app.json / app.wxss
├── components/
│   ├── comments/         # 评论组件
│   ├── forums_detail/    # 论坛子组件（topic/post/post_sets）
│   ├── list/             # 列表组件（goods/reward/recommend）
│   ├── navigation-bar/   # 自定义导航栏
│   ├── order_detail/     # 订单卡片（goods×4 + rewards×3）
│   ├── publication_detail/ # 发布卡片（goods×4 + rewards×3）
│   ├── tab-container/    # Tab 容器
│   └── tab-container-no-space/
└── pages/
    ├── add/              # Goods_add/Reward_add/Post_add/Topic_add/Select
    ├── forums/           # Post_detail/Sets/Topic_products
    ├── index/            # 登录引导页
    ├── message/          # People/Message_detail
    ├── register_login/   # UserLogin/UserRegister/Email_Val
    ├── self/             # Favorites/History/Myself/Order/Person_setting/Publication/Setting
    └── ueyo/             # Home/goods-detail/reward-detail
```

---

## 三、云函数 API 清单（31 个）

### 🟢 已完整实现（26 个）

| 路由                      | 功能         | 参数                                                                    |
| ------------------------- | ------------ | ----------------------------------------------------------------------- |
| `test/ping`             | 连通性测试   | —                                                                      |
| `goods/detail`          | 商品详情     | GoodId                                                                  |
| `goods/list`            | 商品列表     | page, pageSize, category, keyword                                       |
| `goods/publish`         | 发布商品     | title, description, category, price, condition, tradeType(文本), images |
| `goods/generateDesc`    | AI生成描述   | title, user_brief, price, condition                                     |
| `bounty/list`           | 悬赏列表     | page, pageSize, category                                                |
| `bounty/detail`         | 悬赏详情     | RewardId                                                                |
| `bounty/publish`        | 发布悬赏     | title, description, category, expectedPrice, images                     |
| `bounty/take`           | 接取悬赏     | RewardId                                                                |
| `social/topic/list`     | 话题列表     | page, pageSize                                                          |
| `social/post/list`      | 帖子列表     | page, pageSize                                                          |
| `social/topic/posts`    | 话题下帖子   | TopicId, page, pageSize                                                 |
| `social/post/detail`    | 帖子详情     | PostId                                                                  |
| `social/post/publish`   | 发布帖子     | title, content, topicId, images                                         |
| `social/reply/submit`   | 提交回复     | ParentId, content                                                       |
| `social/topic/create`   | 创建话题     | title, introduction, images                                             |
| `review/submit`         | 提交评价     | orderId, rating, content, images                                        |
| `review/list`           | 评价列表     | userId, page, pageSize                                                  |
| `user/profile`          | 获取个人资料 | —(OPENID)                                                              |
| `user/updateProfile`    | 更新个人资料 | nickName, avatarUrl, phone, college 等                                  |
| `user/favorites`        | 收藏列表     | —(OPENID)                                                              |
| `user/toggleFavorite`   | 切换收藏     | goodsId                                                                 |
| `order/create`          | 创建订单     | goodsId, tradeType(文本), meetLocation                                  |
| `order/list`            | 订单列表     | role(buyer/seller), page, pageSize                                      |
| `order/detail`          | 订单详情     | orderId                                                                 |
| `order/cancel`          | 取消订单     | orderId                                                                 |
| `order/confirm`         | 确认收货     | orderId                                                                 |
| `message/conversations` | 会话列表     | —(OPENID)                                                              |
| `message/list`          | 消息列表     | targetUserId, page, pageSize                                            |
| `message/send`          | 发送消息     | targetUserId, content                                                   |

### 🟡 占位/未完成（1 个）

| 路由             | 问题                                     |
| ---------------- | ---------------------------------------- |
| `user/wxlogin` | code→openid 交换未实现，返回 mock-token |

### 🔴 待新建（7 个）

| 优先级 | 路由                   | 功能                 | 使用页面             |
| ------ | ---------------------- | -------------------- | -------------------- |
| 🔴     | `user/activity`      | 用户活跃统计(热力图) | Myself               |
| 🔴     | `user/history`       | 浏览历史             | History              |
| 🟡     | `order/pay`          | 订单支付             | Order                |
| 🟡     | `order/refund`       | 订单退款             | Order                |
| 🟢     | `user/emailLogin`    | 邮箱登录             | UserLogin            |
| 🟢     | `user/emailRegister` | 邮箱注册             | UserRegister         |
| 🟢     | `category/list`      | 分类库               | Goods_add/Reward_add |

---

## 四、前端页面数据流分析

### ✅ 已打通的完整链路

| 页面                       | 数据来源         | 云函数                                                        |
| -------------------------- | ---------------- | ------------------------------------------------------------- |
| `ueyo/Home`              | 委托子组件       | goods-list / reward-list / recommend-list                     |
| `ueyo/goods-detail`      | 云函数           | `goods/detail` + `user/toggleFavorite` + `order/create` |
| `ueyo/reward-detail`     | 云函数           | `bounty/detail` + `bounty/take`                           |
| `forums/Sets`            | 委托子组件       | topic / post                                                  |
| `forums/Post_detail`     | 云函数           | `social/post/detail`                                        |
| `forums/Topic_products`  | 委托 post_sets   | `social/topic/posts`                                        |
| `add/Goods_add`          | 本地表单→云函数 | `goods/publish` + `goods/generateDesc`                    |
| `add/Post_add`           | 本地表单→云函数 | `social/post/publish`                                       |
| `add/Reward_add`         | 本地表单→云函数 | `bounty/publish`                                            |
| `add/Topic_add`          | 本地表单→云函数 | `social/topic/create`                                       |
| `self/Setting`           | 云函数           | `user/profile` + `user/updateProfile`                     |
| `self/Person_setting`    | 云函数           | `user/profile` + `user/updateProfile`                     |
| `self/Order`             | 云函数           | `order/list` + `order/cancel` + `order/confirm`         |
| `self/Publication`       | 云函数           | `order/list`(seller)                                        |
| `message/People`         | 云函数           | `message/conversations`                                     |
| `message/Message_detail` | 云函数           | `message/list` + `message/send`                           |
| `index`                  | 云函数           | `user/wxlogin`（测试模式）                                  |

### 🟡 组件级 mock（父页面已传数据即可消除）

| 组件                               | 驱动页面       | 当前 | 消除方式                                    |
| ---------------------------------- | -------------- | ---- | ------------------------------------------- |
| `order_detail/goods/1~4`         | Order.js       | mock | 确认 formatOrder 字段映射，父页面已传 list  |
| `order_detail/rewards/1~3`       | Order.js       | mock | Order.js 增加 rewards 数据获取并格式化      |
| `publication_detail/rewards/1~3` | Publication.js | mock | Publication.js loadAllData 增加悬赏订单获取 |

### 🔴 页面级未完成

| 页面               | 缺失                                 | 所需云函数                                  |
| ------------------ | ------------------------------------ | ------------------------------------------- |
| `self/Myself`    | 热力图/折线图/统计/洞察均为随机 mock | `user/activity`                           |
| `self/Favorites` | 完全空实现，无数据加载               | `user/favorites`(已有) 需前端对接         |
| `self/History`   | 完全空实现                           | `user/history`                            |
| `self/Order`     | 支付/退款/评价按钮只有 toast         | `order/pay` + `order/refund` + 评价跳转 |

### 🟡 硬编码待替换

| 位置                                    | 内容           | 建议                         |
| --------------------------------------- | -------------- | ---------------------------- |
| `Goods_add.js` data.mockCategories    | 8 个硬编码分类 | 新建`category/list` 或保持 |
| `Reward_add.js` data.mockCategories   | 同上           | 同上                         |
| 列表组件中 "用户主页开发中" 等 fallback | —             | 新建统一用户主页             |

---

## 五、数据库集合

| 集合                | 用途           | 关键字段                                                                            |
| ------------------- | -------------- | ----------------------------------------------------------------------------------- |
| `users`           | 用户           | _openid, nickName, avatarUrl, creditScore, favorites[]                              |
| `goods`           | 商品           | title, price, condition, tradeType(文本), images[], sellerInfo, status              |
| `bounties`        | 悬赏           | title, expectedPrice, buyerInfo, takerInfo, status                                  |
| `orders`          | 订单           | orderNo, amount, tradeType(文本), orderStatus, buyerInfo, sellerInfo, goodsSnapshot |
| `topics`          | 话题/帖子/回复 | type(1/2/3), title, content, images[], topicId, postId, authorInfo                  |
| `reviews`         | 评价           | rating, content, reviewerInfo, revieweeInfo, orderId                                |
| `messages`        | 会话摘要       | participants[], lastContent, lastTime                                               |
| `messages_detail` | 消息详情       | from, to, content, createdAt                                                        |

---

## 六、关键设计决策

| 决策             | 说明                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| tradeType 文本化 | 交易方式由 enum(1/2/3) 改为用户自由输入文本字符串                          |
| topics 表三合一  | type=1 话题 / type=2 帖子 / type=3 回复，共用一张表                        |
| 收藏存数组       | favorites 直接存 users 文档数组中（goodsId[]），非独立集合                 |
| 价格存分         | 数据库 price/expectedPrice 以分为单位(*100)，前端显示时 /100               |
| 金额字段名不统一 | goods:`price`, bounties: `expectedPrice`, orders: `amount` — 需注意 |

---

## 七、八大核心系统架构问题

### 7.1 🔐 用户鉴权机制（Authentication & Authorization）

**现状问题：**

- `user/wxlogin` 返回 `mock-token`，未做真实 JWT 签发
- 所有云函数依赖 `event.OPENID` 但未统一校验中间件
- 无角色区分（买家/卖家/管理员）
- 前端未持久化 token 并在每次请求中携带
- 推荐流不区分用户身份，无法个性化

**重构方案：**

```
┌─────────────────────────────────────────────────────┐
│  前端 (miniprogram)                                  │
│  ├── app.js onLaunch: wx.login → user/wxlogin       │
│  ├── 存储: wx.setStorageSync('token', result.token) │
│  └── 每次云函数调用携带: { action, data, __auth }    │
├─────────────────────────────────────────────────────┤
│  云函数中间件 (utils/auth.js 新建)                    │
│  ├── authMiddleware: 验证 JWT → 注入 event.OPENID   │
│  ├── requireLogin: 未登录拒绝 401                    │
│  └── requireRole(role): 角色校验                     │
├─────────────────────────────────────────────────────┤
│  各模块 controller                                    │
│  └── catchAsync 前先通过 authMiddleware              │
└─────────────────────────────────────────────────────┘
```

**待实现：**

| 任务                             | 优先级 | 文件                                 |
| -------------------------------- | ------ | ------------------------------------ |
| 新建`utils/auth.js` 鉴权中间件 | 🔴     | cloudfunctions/backend/utils/auth.js |
| `jwt.js` 实现 sign/verify      | 🔴     | cloudfunctions/backend/utils/jwt.js  |
| `index.js` 统一注入 auth 逻辑  | 🔴     | 修改主入口                           |
| 前端`app.js` 存储+携带 token   | 🔴     | miniprogram/app.js                   |
| 全部云函数加入 requireLogin 检查 | 🔴     | 各 controller                        |
| self 页面按 OPENID 加载个人数据  | 🔴     | Myself/Order/Publication/Favorites   |
| 发布/购买/接单鉴权检查           | 🔴     | goods/bounty/order controller        |

---

### 7.2 🔄 交易全流程状态机（Transaction State Machine）

**现状问题：**

- 商品和悬赏的状态流转未完整定义
- 数据库字段变更（收藏/历史/订单状态）缺乏统一规范
- 前后端状态枚举不一致

**状态机定义（14 个状态）：**

```
商品订单（goods + orders）           悬赏订单（bounties + orders）
┌──────────┐                        ┌──────────┐
│ 1.待付款  │ ← order/create         │ 1.待履约  │ ← bounty/take
└────┬─────┘                        └────┬─────┘
     │ 支付                              │ 接单人履约
     ▼                                   ▼
┌──────────┐                        ┌──────────┐
│ 2.已支付  │                        │ 2.已履约  │
└────┬─────┘                        └────┬─────┘
     │ 卖家发货                          │ 悬赏人确认
     ▼                                   ▼
┌──────────┐                        ┌──────────┐
│ 3.待收货  │                        │ 3.待评价  │ ← 双方皆可评
└────┬─────┘                        └────┬─────┘
     │ 确认收货                          │ 评价完成
     ▼                                   ▼
┌──────────┐                        ┌──────────┐
│ 4.待评价  │ ← review/submit       │ 4.已完成  │
└────┬─────┘                        └──────────┘
     │ 评价完成
     ▼
┌──────────┐     ┌──────────┐
│ 5.已完成  │     │ 6.已取消  │ ← order/cancel（仅待付款时）
└──────────┘     └──────────┘
                      │
                 ┌──────────┐
                 │ 7.已退款  │ ← order/refund（已支付/待收货时）
                 └──────────┘
```

**数据库字段变更规范：**

| 集合         | 状态字段        | 可选值                                                               | 变更触发点          |
| ------------ | --------------- | -------------------------------------------------------------------- | ------------------- |
| `goods`    | `status`      | 1=在售, 2=已预留, 3=已售出, 4=已下架                                 | 下单/支付/取消/完成 |
| `orders`   | `orderStatus` | 1-待付款, 2-已支付, 3-待收货, 4-待评价, 5-已完成, 6-已取消, 7-已退款 | 全流程              |
| `orders`   | `payStatus`   | 1-未支付, 2-已支付, 3-已退款                                         | 支付/退款           |
| `bounties` | `status`      | 1-待接取, 2-已接取, 3-已完成, 4-已取消                               | 接单/完成/取消      |
| `users`    | `favorites`   | goodsId[] 数组                                                       | toggleFavorite      |
| `users`    | `history`     | [{id, type, time}]                                                   | 浏览时写入          |

**待实现：**

| 任务                                       | 云函数                          |
| ------------------------------------------ | ------------------------------- |
| 支付模拟/真实                              | `order/pay`                   |
| 退款                                       | `order/refund`                |
| 卖家发货                                   | `order/deliver`               |
| 商品状态同步（支付→预留，完成→售出）     | 嵌入 order/pay, order/confirm   |
| 悬赏状态同步（接单→已接取，完成→已完成） | 嵌入 bounty/take, order/confirm |
| 浏览历史自动写入                           | `user/history`（浏览时触发）  |

---

### 7.3 💬 评论模块完整实现（Comments System）

topic表，topic的发布，comment发布

goods_detail，rewards_detail 一级评论

以及miniprogram\pages\add\Post_add和miniprogram\pages\add\Topic_add两个

**现状问题：**

- 评论组件 `comments.js` 已改为接收外部 `externalComments` 属性
- 但父页面（goods-detail / reward-detail / Post_detail）未传递评论数据
- 提交走 `social/reply/submit`，但数据未区分 goods 评论 vs 帖子回复
- 无评论分页/加载更多

**重构方案：**

```
评论数据流：
详情云函数（goods/detail, bounty/detail, social/post/detail）
  └→ 返回 comments[] 数组
      └→ 父页面 setData
          └→ <comment-section externalComments="{{comments}}">
              ├── 展示一级评论 + 二级回复
              ├── 点赞/回复 交互
              └── 提交 → social/reply/submit → 触发 refresh 事件
                  └→ 父页面重新调用详情接口刷新
```

**待实现：**

| 任务                                  | 文件                                         |
| ------------------------------------- | -------------------------------------------- |
| goods-detail 传递 comments 到评论组件 | goods-detail.wxml + .js                      |
| reward-detail 传递 comments           | reward-detail.wxml + .js                     |
| Post_detail 传递 comments             | Post_detail.wxml + .js                       |
| 评论分页加载更多                      | 新建`comments/list` 或扩展现有 detail 接口 |
| 评论点赞同步                          | `social/reply/like` 云函数                 |

---

### 7.4 🏞️ 瀑布流展示 + 推荐算法（Feed & Recommendation）

修改读表机制

**现状问题：**

- 首页 `recommend-list` 当前简单混排 goods + bounties
- 无个性化推荐，无用户画像
- 帖子列表瀑布流无内容过滤

**推荐算法设计：**

```
推荐因子（权重可调）：
├── 品类偏好 (40%): 用户浏览/收藏/购买最多的 category
├── 价格区间 (20%): 用户常浏览的价格带
├── 时效性   (20%): 新发布的优先
├── 热度     (15%): likeCount + 浏览量
└── 位置匹配 (5%):  同校区/同宿舍区优先

输出：goods/list + bounty/list 混排，按推荐分数 desc
```

**待实现：**

| 任务                          | 说明                                     |
| ----------------------------- | ---------------------------------------- |
| 新建`recommend/feed` 云函数 | 替代当前双调用混排                       |
| 用户画像记录                  | 浏览/收藏/购买时写入`users.preference` |
| 瀑布流 UI 优化                | 图片懒加载 / 骨架屏 / 下拉刷新动画       |
| 帖子列表内容过滤              | 按 topic/tag 过滤                        |

---

### 7.5 👤 个人主页 + 💬 聊天系统（Profile & Chat）

**现状问题：**

- 用户主页页面不存在（`pages/user/user` 404）
- 点击头像/昵称全部 fallback "用户主页开发中"
- 聊天功能已搭建但无实时推送

**个人主页设计：**

```
pages/user/profile?userId=xxx
├── 头部: 头像 + 昵称 + 信用分 + 认证状态
├── 评价区: review/list (userId)
│   └── 评分分布图 + 评价列表
├── 在售商品: goods/list (sellerId)
├── 发表的帖子: social/post/list (authorId)
└── 按钮: 私信 → 跳转 Message_detail
```

**聊天增强：**

| 任务                            | 说明                         |
| ------------------------------- | ---------------------------- |
| 新建`pages/user/profile` 页面 | 统一用户主页                 |
| 全站头像/昵称点击跳转 profile   | 替换所有 "开发中" fallback   |
| 消息未读红点                    | app.js 定时轮询或 watch 机制 |
| 聊天图片发送                    | message/send 支持图片        |

---

### 7.6 📊 Self 个人中心完善（Myself Completion）

**现状问题：**

- 热力图全随机
- 折线图全随机
- 汇总指标硬编码
- 洞察文案随机轮换

**数据来源设计：**

| 组件           | 数据来源               | 对应云函数                   |
| -------------- | ---------------------- | ---------------------------- |
| 热力图 (7×13) | 近 3 个月每日活跃次数  | `user/activity`            |
| 折线图 (近7天) | 近 7 天每日活跃趋势    | `user/activity`            |
| 汇总指标       | 7天活跃/连续/点赞/发布 | `user/activity`            |
| 洞察文案       | AI 根据数据生成        | `user/activity` 或 AI 服务 |
| 登录态         | user/wxlogin           | ✅(待完善)                   |

**`user/activity` 云函数返回结构：**

```json
{
  "heatmap": [{ "date": "2026-04-01", "count": 5, "level": 2 }],
  "weeklyTrend": [8, 12, 5, 10, 7, 15, 9],
  "stats": { "active7d": 108, "streak": 12, "likes": 67, "posts": 8 },
  "insight": "你通常在下午时段最活跃..."
}
```

---

### 7.7 🔍 搜索页面（Search）

**现状需求：**

- 项目当前无搜索页面
- `goods/list` 已支持 `keyword` 参数但前端未使用
- 需要全局搜索：商品 + 悬赏 + 帖子 + 话题

**搜索页面设计：**

```
pages/search/Search
├── 搜索栏 (顶部固定)
│   ├── 输入框 + 取消按钮
│   └── 搜索历史 (本地存储)
├── Tab: 商品 | 悬赏 | 帖子 | 话题
└── 结果列表 (复用 goods-list / reward-list / post 组件)
```

**待建文件：**

| 任务     | 文件                                        |
| -------- | ------------------------------------------- |
| 搜索页面 | `pages/search/Search.*` (4文件)           |
| 搜索推荐 | 热门搜索词 / 历史搜索                       |
| 后端扩展 | 各 list 接口已支持 keyword ✅，前端对接即可 |

---

### 7.8 📋 Sider 旁栏（Slide Panel）

**现状需求：**

- 项目当前无侧边栏
- 需要在首页或全局添加侧滑面板

**旁栏内容设计：**

```
Sider Panel（左滑或点击触发）
├── 用户信息区
│   ├── 头像 + 昵称
│   ├── 信用分
│   └── 编辑资料 → Setting
├── 功能导航
│   ├── 我的发布 → Publication
│   ├── 我的订单 → Order
│   ├── 我的收藏 → Favorites
│   ├── 浏览历史 → History
│   └── 我的消息 → People
├── 社区入口
│   ├── 论坛广场 → Sets
│   └── 发布 → Select
└── 设置 → Setting
```

**待建文件：**

| 任务       | 文件                                    |
| ---------- | --------------------------------------- |
| Sider 组件 | `components/sider/sider.*` (4文件)    |
| 首页集成   | `pages/ueyo/Home` 添加 sider 触发按钮 |

---

## 八、重构后的执行路线图

```
Phase 1 — 鉴权 + 状态机（基础设施，~3d）
├── ① 新建 utils/auth.js 鉴权中间件
├── ② jwt.js 签发/验证 JWT
├── ③ user/wxlogin: code→openid + JWT 签发
├── ④ 所有云函数接入 requireLogin
├── ⑤ 商品/悬赏/订单 14 状态机完整实现
└── ⑥ 数据库字段变更（favorites/history 规范化）

Phase 2 — 评论 + 数据流（~2d）
├── ⑦ 评论组件与父页面数据对接
├── ⑧ 评论点赞同步
├── ⑨ 全部 order/publication 组件去 mock
├── ⑩ Favorites / History 页面对接
└── ⑪ Order 评价按钮对接 review/submit

Phase 3 — 个人中心 + 用户主页（~2d）
├── ⑫ Myself 热力图: user/activity 云函数
├── ⑬ 新建 pages/user/profile 统一用户主页
├── ⑭ 全站头像/昵称跳转 profile（替换"开发中"）
└── ⑮ self 页面鉴权集成（按 OPENID 展示个人数据）

Phase 4 — 推荐 + 搜索 + 旁栏（~3d）
├── ⑯ recommend/feed 推荐算法云函数
├── ⑰ 搜索页面 pages/search
├── ⑱ Sider 旁栏组件
├── ⑲ 消息实时推送（定时轮询/WebSocket）
└── ⑳ 聊天图片发送

Phase 5 — 支付 + 收尾（~2d）
├── ㉑ 微信支付接入 order/pay
├── ㉒ order/refund 退款
├── ㉓ email 登录/注册
├── ㉔ 性能优化 / 分页 / 错误处理
└── ㉕ 全链路测试
```
