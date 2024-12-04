# 小游戏首帧启动优化



## 项目介绍

该插件主要针对小游戏平台的首帧启动进行优化操作，使项目能快速的进入首帧渲染，该插件目前仅支持2.x版本的CocosCreator

**该插件主要参考(拷贝)B站小游戏的首屏优化代码**

## 使用方法

1.  克隆到项目到本地目录

``````shell
git clone https://github.com/yxx0/minigame-firstframe-optimize.git
``````

2. 将克隆后的项目放入项目根目录下的packages即可

## 注意事项

- 目前首屏渲染图默认是白色全屏，如何调整为其他颜色

​	可以修改插件内的back/first-screen/index.js内的以下代码

``````javascript
function draw() {
    //  r(1.0)g(1.0)b(1.0)a(0.0)
    gl.clearColor(1.0, 1.0, 1.0, 0.0); // 修改该行代码的值即可
  
		...省略
}
``````

- 只想对微信小游戏使用，或者希望对其他小游戏渠道使用

​	可以修改插件内的main.js内的以下代码

``````typescript
const adapterActualPlatform = ['bytedance', 'wechatgame']; // 新增或者减少
``````