// getApiScripts.js
(function () {
  var offmapcfg = (window.offmapcfg = {
    imgext: '.png', //图片格式------ 根据需要修改，一般是 .png .jpg
    customstyle: '', //自定义样式的地址，为空默认在 offlinemap/customstyle/mapstyle 文件
    tiles_dir: '', //图片瓦片图的地址，为空默认在 offlinemap/tiles/ 目录
    tiles_v_dir: 'http://192.168.0.111:8088/mapv',
    tiles_satellite_dir: '', //卫星图的地址，为空默认在 offlinemap/tiles_satellite/ 目录
    tiles_road_dir: '', //图片路网的地址，为空默认在 offlinemap/tiles_road/ 目录
    tiles_v_road_dir: '' //矢量路网的地址，为空默认在 offlinemap/tiles_v_road/ 目录
  });
  var JS__FILE__ = document.currentScript ? document.currentScript.src : document.scripts[document.scripts.length - 1].src;
  offmapcfg.home = JS__FILE__.substr(0, JS__FILE__.lastIndexOf('/') + 1); //地图API主目录
  window.BMapGL_loadScriptTime = new Date().getTime();
  window.BMapGL = window.BMapGL || {};
  window.BMapGL.apiLoad = function () {
    delete window.BMapGL.apiLoad;
    if (typeof window._initBMap_ == 'function') {
      window._initBMap_();
    }
  };
  var s = document.createElement('script');
  var link = document.createElement('link');
  s.src = offmapcfg.home + '/bmapgl.min.js';
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('type', 'text/css');
  link.setAttribute('href', offmapcfg.home + '/css/bmap.css');
  document.body.appendChild(s);
  document.getElementsByTagName('head')[0].appendChild(link);

  window.BMapGL.apiLoad = function () {
    delete window.BMapGL.apiLoad;
    if (typeof window._initBMap_ == 'function') {
      window._initBMap_();
    }
  };
})();
