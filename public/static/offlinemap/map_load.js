/* 离线地图矢量版WebGL v1.0 接口文件
 * 发布: http://www.wmksj.com
 * 网页中只需要加载此JS文件即可
 * 矢量瓦片文件请自行下载
 * 研究学习之用，禁止用于商业用途！
 * 最后修改日期: 2022-08-11
 */

var offmapcfg = {
  imgext: '.png', //图片格式------ 根据需要修改，一般是 .png .jpg
  customstyle: '', //自定义样式的地址，为空默认在 offlinemap/customstyle/mapstyle 文件
  tiles_dir: '', //图片瓦片图的地址，为空默认在 offlinemap/tiles/ 目录
  tiles_v_dir: 'http://192.168.0.111:8088/mapv', //矢量瓦片图的地址，为空默认在 offlinemap/tiles_v/ 目录
  tiles_satellite_dir: '', //卫星图的地址，为空默认在 offlinemap/tiles_satellite/ 目录
  tiles_road_dir: '', //图片路网的地址，为空默认在 offlinemap/tiles_road/ 目录
  tiles_v_road_dir: '' //矢量路网的地址，为空默认在 offlinemap/tiles_v_road/ 目录
};

var JS__FILE__ = document.currentScript ? document.currentScript.src : document.scripts[document.scripts.length - 1].src;
offmapcfg.home = JS__FILE__.substr(0, JS__FILE__.lastIndexOf('/') + 1); //地图API主目录
(function () {
  window.BMap_loadScriptTime = new Date().getTime();
  //加载地图API主文件
  document.write('<script type="text/javascript" src="' + offmapcfg.home + 'bmapgl.min.js"></script>');
})();
