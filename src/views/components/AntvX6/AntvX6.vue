<template>
  <div style="height: 80px" @click="onValueChange"></div>
  <div ref="container" class="container">
    <div id="wrapper" style="height: 100%"></div>
  </div>
  <TeleportContainer />
</template>

<script setup>
import { Graph, Shape } from '@antv/x6';
import vueNode from './components/vueNode.vue';
import { register, getTeleport } from '@antv/x6-vue-shape';

const inputValue = ref('');
const container = ref(null);
const currentNode = ref(null);
const graph = ref(null);
const TeleportContainer = getTeleport();
const getNodePorts = () => {
  return {
    groups: {
      top: {
        position: 'top',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
              visibility: 'hidden'
            }
          }
        }
      },
      right: {
        position: 'right',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
              visibility: 'hidden'
            }
          }
        }
      },
      bottom: {
        position: 'bottom',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
              visibility: 'hidden'
            }
          }
        }
      },
      left: {
        position: 'left',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
              visibility: 'hidden'
            }
          }
        }
      }
    },
    items: [
      {
        group: 'top'
      },
      {
        group: 'right'
      },
      {
        group: 'bottom'
      },
      {
        group: 'left'
      }
    ]
  };
};
// 注册自定义节点
register({
  shape: 'custom-node',
  width: 192,
  height: 80,
  effect: ['color'],
  component: vueNode,
  ports: getNodePorts()
});
const onValueChange = () => {
  console.log('onValueChange', currentNode.value);
  if (currentNode.value) {
    // 更新节点数据
    currentNode.value.setData({
      progress: 'fdsfsdfsdf'
    });
  }
};
const initGraph = () => {
  graph.value = new Graph({
    container: document.getElementById('wrapper'),
    grid: true,
    autoResize: true,
    translating: { restrict: true },
    background: {
      color: '#EAEAEA'
    },
    connecting: {
      router: {
        name: 'manhattan',
        args: {
          padding: 1
        }
      },
      connector: {
        name: 'rounded',
        args: {
          radius: 8
        }
      },
      anchor: 'center',
      connectionPoint: 'anchor',
      allowBlank: false,
      snap: {
        radius: 20
      },
      createEdge() {
        return new Shape.Edge({
          label: {
            position: { distance: 0.5 }, // 位于连线中间
            attrs: {
              text: {
                text: '初始标签', // 默认文本
                fill: '#333',
                fontSize: 12
              }
            }
          },
          attrs: {
            line: {
              stroke: '#A2B1C3',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                width: 12,
                height: 8
              }
            }
          },
          zIndex: 0
        });
      }
    }
  });

  // 鼠标 hover 节点时显示连接点
  graph.value.on('node:mouseenter', ({ node }) => {
    node.getPorts().forEach((port) => {
      node.portProp(port.id, 'attrs/circle/style/visibility', 'visible');
    });
  });

  // 鼠标离开节点时隐藏连接点
  graph.value.on('node:mouseleave', ({ node }) => {
    node.getPorts().forEach((port) => {
      node.portProp(port.id, 'attrs/circle/style/visibility', 'hidden');
    });
  });

  // 连线创建完成时
  graph.value.on('edge:added', ({ edge }) => {
    // 设置初始 label（也可以在 createEdge 中设置）
    // edge.prop('label/attrs/text/text', '#ccc');
    edge.setLabels([
      {
        position: { distance: 0.5 }, // 位于连线中间
        attrs: {
          text: {
            text: '新建连线', // 初始文本
            fill: '#333',
            fontSize: 12
          }
        }
      }
    ]);
  });
  // // 连线编辑时（例如调整端点位置）
  graph.value.on('edge:change:source', ({ edge }) => {});

  graph.value.on('edge:change:target', ({ edge }) => {});

  // 点击编辑
  graph.value.on('cell:click', ({ cell }) => {
    currentNode.value = cell;
  });
  initNodes();
};
const initNodes = () => {
  const node1 = graph.value.addNode({
    x: 320,
    y: 260,
    shape: 'custom-node',
    data: {
      progress: 80
    }
  });
  const node2 = graph.value.addNode({
    x: 620,
    y: 260,
    shape: 'custom-node',
    data: {
      progress: 80
    }
  });
};

onMounted(() => {
  initGraph();
});
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;

  #wrapper {
    width: 100%;
    height: 100%;
  }
}
</style>

<style lang="scss"></style>
