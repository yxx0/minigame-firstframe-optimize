'use strict';

const mfs = require('./util/mfs');

const adapterActualPlatform = ['bytedance', 'wechatgame'];

function onBuildFinish(options, callback) {
  if ('mini-game' === options.platform) {
    if (adapterActualPlatform.indexOf(options.actualPlatform) === -1) {
      callback && callback();
      return;
    }

    Editor.log('[minigame-firstframe-optimize]', '首帧渲染优化开始');

    // 复制首屏文件
    mfs.copySync(mfs.join(__dirname, 'back', 'first-screen'), mfs.join(options.dest, 'first-screen'));

    // 读取 main.js 文件内容
    let mainJsPath = mfs.join(options.dest, 'main.js');
    let content = mfs.readFileSync(mainJsPath, "utf8");

    // 在文件开头添加 require 语句
    const requireStatement = "const firstScreen = require('./first-screen/index');\n";
    content = requireStatement + content;

    // 插入 firstScreen.start('default', 'default') 在 window.boot 函数的起始位置
    const bootStartIndex = content.indexOf("window.boot = function () {");
    if (bootStartIndex !== -1) {
      const insertPosition = bootStartIndex + "window.boot = function () {".length;
      content = content.slice(0, insertPosition) +
        `\n  firstScreen.start('default', 'default', 'fullscreen');` +
        content.slice(insertPosition);
    }

    // 找到 cc.director.loadScene 及第一个配对的闭合 });
    const loadSceneIndex = content.indexOf("cc.director.loadScene");
    if (loadSceneIndex !== -1) {
      // 找到与 loadScene 语句配对的第一个 `});`
      const endIndex = content.indexOf("});", loadSceneIndex);
      if (endIndex !== -1) {
        // 在 `});` 后面插入 `firstScreen.end();`
        content = content.slice(0, endIndex + 3) +
          `\n  firstScreen.end();` +
          content.slice(endIndex + 3);
      }
    }

    mfs.writeFileSync(mainJsPath, content);


    Editor.log('[game-firstframe]', '首帧渲染优化完成');
  }
  callback();
}


module.exports = {
  load() {
    Editor.Builder.on('build-finished', onBuildFinish);
  },

  unload() {
    Editor.Builder.removeListener('build-finished', onBuildFinish);
  }
};