# Ueyo

A WeChat platform for second-hand transactions

xzx 到！

daodaodao

Ziti-quan is ready.
Guo hao dao
===========

# 第一次推送测试（未分支方式）

cd 自己选则仓库目录存放位置

git clone https://github.com/paxtonbacon/Ueyo.git

cd Ueyo  #无需自己init一个git仓库

找个IDE重新修改 main.cpp

git add main.cpp

git commit -m "修改了main.cpp，xxx报道"

git push origin main

==================================================

==========================================================================

# 第一次之后的推送

cd 进入已有的仓库目录

git pull                    # 1. 拉取最新代码（获取别人可能的修改）

修改 main.cpp...            # 2. 用编辑器修改文件

git add main.cpp            # 3. 暂存修改

git commit -m "说明"        # 4. 提交到本地

git push                    # 5. 推送到 GitHub，第一次推送时，本地 main 分支还没有关联到远程的 main 分支，Git 不知道它们之间的关系，所以必须明确指定

==========================================================================



# 建立自己的分支

git pull origin main

git branch my-feature(这里取自己的名字)
eg. git branch bacon

git checkout bacon    # 签到自己的分支

修改

git add .

git commit -m ""

git rebase main    # 基于修改过后的main分支进行修改（re-base，基于新的main做自己的修改）

可能会出现git merge手动合并的需求

git push -f bacon

发起PR请求，通过？

git pull origin main

git brach -D bacon + 同时在github仓库delete

--> 再拉新分支