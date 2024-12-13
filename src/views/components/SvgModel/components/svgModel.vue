<template>
  <div class="svgTemplate-wrap">
    <!-- <el-button @click="changSvg">切换SVG</el-button>
    <el-button @click="onSearch">信通</el-button> -->
    <div id="svgTemplate"></div>
  </div>
</template>

<script setup>
import * as d3 from 'd3';
const props = defineProps({
  houseData: {
    type: Array,
    default: () => []
  }
});

const app = ref(null);
const svgDom = ref(null);
const svgUrl = ref('/public/svg/svgModel.svg');
const AreaLines = ref(null);
const AreaLinesCopy = ref(null);
const childMethods = ref(null);

// 切换svg平面图
const changSvg = () => {
  svgUrl.value = '/public/svg/svgModel.svg';
  if (app.value) app.value.unmount();
  inIt();
};
// 筛序
const onSearch = (userDept) => {
  childMethods.value.onColorChange(userDept);
};
// 根据id获取数据
const getDataById = (id, filedname) => {
  const item = props.houseData.find((item) => String(item.roomid) === id);

  if (!item) return '';

  return filedname ? item[filedname] || '' : item;
};

const svgStyleConvert = () => {
  // 提取所有 style 标签中的样式
  const styleTags = svgDom.value.querySelectorAll('style');
  let styleContent = '';
  styleTags.forEach((style) => {
    styleContent += style.innerHTML;
    style.remove(); // 删除原始的 style 标签
  });

  // 将提取的样式应用到相应的元素上
  const elements = svgDom.value.querySelectorAll('[class]');
  elements.forEach((element) => {
    const classList = element.classList;
    classList.forEach((className) => {
      // 使用正则表达式从 styleContent 中查找每个类的样式
      const match = new RegExp(`\\.${className}\\s*\\{([^}]+)\\}`, 'g').exec(styleContent);
      if (match && match[1]) {
        const inlineStyles = match[1].trim();
        element.setAttribute('style', inlineStyles);
      }
    });
  });
};
const svgAttrAdd = () => {
  // 防止文字被遮挡,复制一份AreaLines放到svg文件最底层,直接操作复制的AreaLines
  AreaLinesCopy.value = AreaLines.value.cloneNode(true);
  AreaLinesCopy.value.setAttribute('id', 'AreaLinesCopy');
  svgDom.value.appendChild(AreaLinesCopy.value);

  // 给AreaLines下面的子元素添加点击事件
  const items = AreaLines.value.querySelectorAll('g');
  items.forEach((item) => {
    item.setAttribute('style', 'pointer-events: all;');
    // SVG html元素添加
    svgHtmlAdd(item);
  });
};
const svgHtmlAdd = (tempEle) => {
  const idx = Array.from(tempEle.parentElement.children).indexOf(tempEle);
  const ele = AreaLinesCopy.value.children[idx];

  const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  foreignObject.setAttribute('style', 'pointer-events: none;');

  const firstElement = ele.children[0];
  const tagName = firstElement.tagName;
  let x, y, width, height;
  const data = getDataById(ele.id);

  if (tagName === 'rect') {
    x = firstElement.getAttribute('x');
    y = firstElement.getAttribute('y');
    width = firstElement.getAttribute('width');
    height = firstElement.getAttribute('height');
  } else if (tagName === 'polygon') {
    const points = firstElement.getAttribute('points').split(' ');
    const xArr = [];
    const yArr = [];
    points.forEach((point) => {
      const [x, y] = point.split(',');
      x && xArr.push(x);
      y && yArr.push(y);
    });
    x = Math.min(...xArr);
    y = Math.min(...yArr);
    width = data.roomwidth ? data.roomwidth : Math.max(...xArr) - x;
    height = data.roomheight ? data.roomheight : Math.max(...yArr) - y;
  } else {
    return;
  }

  // if (['1008', '1009'].includes(ele.id)) {
  //   console.log(ele.id, x, y, width, height, data.roomwidth);
  // }

  foreignObject.setAttribute('x', x);
  foreignObject.setAttribute('y', y);
  foreignObject.setAttribute('width', width);
  foreignObject.setAttribute('height', height);

  const div = document.createElement('div');
  const roomname = getDataById(ele.id, 'roomname');
  const roomarea = getDataById(ele.id, 'roomarea');

  div.innerHTML = `
    <div>${roomname}</div>
    <div>${roomarea}</div>
  `;
  const style = `font-size:3.65px;line-height: 5px;width: 100%; height: 100%;display: flex;justify-content: center;flex-direction:column;align-items: center;color:#FF00FF;`;
  div.setAttribute('style', style);

  foreignObject.appendChild(div);

  ele.appendChild(foreignObject);
};

const VMCreate = () => {
  const oSerializer = new XMLSerializer();
  const sXML = oSerializer.serializeToString(svgDom.value);
  const parentMethod = {
    getDataById
  };

  const setChildMethods = (methods) => {
    childMethods.value = methods;
  };

  const Profile = {
    setup() {
      const AreaLines = ref(null);

      const onAreaClick = (e) => {
        const target = e.target;
        const parent = target.parentElement;
        const id = parent.getAttribute('id');

        if (!parentMethod.getDataById(id, 'roomid')) return;

        const style = target.getAttribute('style');
        const fillRegex = style ? style.match(/fill\s*:\s*([^;]+)/) : null;

        if (fillRegex) {
          target.setAttribute('style', fillRegex[1] === 'none' ? 'fill:rgba(255,0,0,0.5);' : 'fill:none');
        }
      };
      const onColorChange = (userDept) => {
        const items = AreaLines.value.querySelectorAll('g');

        items.forEach((item) => {
          const id = item.getAttribute('id');
          const data = getDataById(id);
          if (data.userDept === userDept) {
            item.children[0].setAttribute('style', 'fill:rgba(255,0,0,0.5);');
          } else {
            item.children[0].setAttribute('style', 'fill:none;');
          }
        });
      };
      const addEvent = () => {
        const items = AreaLines.value.querySelectorAll('g');
        items.forEach((item) => {
          item.addEventListener('click', onAreaClick);
        });
      };

      // 初始化 D3 缩放
      const initZoom = () => {
        // 获取 SVG 元素
        const svgContainer = document.getElementById('svgContainer');
        const svgDom = svgContainer.querySelector('svg');
        const svgElement = d3.select(svgDom);

        const zoom = d3
          .zoom()
          .scaleExtent([0.5, 10])
          .on('start', () => {
            svgElement.style('cursor', 'pointer');
          })
          .on('zoom', (e) => {
            svgElement.attr('transform', e.transform);
          })
          .on('end', () => {
            svgElement.style('cursor', 'default');
          });

        svgElement.call(zoom);
      };
      const inIt = () => {
        AreaLines.value = document.getElementById('AreaLines');
        // 初始化D3缩放
        initZoom();

        addEvent();

        setChildMethods({ onColorChange });
      };

      onMounted(() => {
        inIt();
      });

      return () => {
        return h('div', {
          id: 'svgContainer',
          innerHTML: sXML
        });
      };
    }
  };

  // 创建并挂载应用
  app.value = createApp(Profile);
  app.value.mount('#svgTemplate');
};

const inIt = () => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', svgUrl.value, true);
  xhr.onload = () => {
    // 获取 SVG DOM
    const resXML = xhr.responseXML;
    svgDom.value = resXML.documentElement.cloneNode(true);
    AreaLines.value = svgDom.value.getElementById('AreaLines');

    // SVG 样式转换
    svgStyleConvert();
    // SVG 属性添加
    svgAttrAdd();
    // SVG 转换虚拟 DOM
    VMCreate();
  };
  xhr.send();
};

defineExpose({
  onSearch
});
onMounted(() => {
  inIt();
});
</script>

<style lang="scss">
.svgTemplate-wrap {
  background: #ffffff;
  padding: 16px;
  overflow: hidden;
}
svg {
  // height: 550px;
}
.innerLabel {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
