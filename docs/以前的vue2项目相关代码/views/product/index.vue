<template>
  <div class="product-container">
    <div class="header">
      <div class="header-tabs">
        <div class="header-tabs-nav">
          <div class="header-tabs-nav-wrap">
            <div class="header-tabs-nav-item active">全 部</div>
            <div class="header-tabs-nav-item">全景图</div>
            <div class="header-tabs-nav-item">全景视频</div>
            <div class="header-tabs-nav-item">3D环物</div>
            <div class="tab-divider"></div>
            <div class="header-tabs-nav-item recycle-bin">回收站</div>
          </div>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="filter-wrapper">
        <div class="filter-form">
          <el-form :inline="true" :model="listQuery" class="demo-form-inline">
            <el-form-item>
              <el-select v-model="listQuery.status" placeholder="请选择状态">
                <el-option
                  v-for="item in options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-cascader
                :options="catalogTreeItems"
                :props="{ checkStrictly: true }"
                placeholder="请选择作品分类"
                clearable
                filterable
              ></el-cascader>
            </el-form-item>
            <el-form-item>
              <el-date-picker
                v-model="listQuery.date_span"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              >
              </el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-input
                placeholder="搜索关键词"
                v-model="listQuery.keyword"
                class="input-with-select"
              >
                <el-button slot="append" icon="el-icon-search"></el-button>
              </el-input>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div class="panel-content-list">
        <div class="genre-item" v-for="item in products" :key="item.id">
          <div class="product-card">
            <div class="product-card-wrap">
              <el-image :src="item.src" lazy />
              <!-- <el-skeleton class="image-skeleton" :loading="loading" animated>
                <template slot="template">
                  <el-skeleton-item variant="image" />
                </template>
                <template>
                  <el-image
                    :src="item.src"
                    scroll-container=".el-table__body-wrapper"
                    lazy
                  />
                </template>
              </el-skeleton> -->
              <div class="product-card-bone">
                <div class="title-wrap">
                  <a href="#" class="title"></a>
                  <span class="label create-time">07-19 23:43</span>
                </div>
                <div class="status-wrap">
                  <el-tag size="small" class="product-tag" type="success"
                    >已发布</el-tag
                  >
                  <el-tag size="small" class="product-tag" type="danger"
                    >已下架</el-tag
                  >
                  <el-tag size="small" class="product-tag" type="warning"
                    >首页推荐</el-tag
                  >
                  <div class="divider"></div>
                  <div class="icon">
                    <el-tooltip
                      class="item"
                      effect="dark"
                      content="已添加至：城市 分类"
                      placement="top-start"
                    >
                      <i
                        class="el-icon-s-order"
                        title="已添加至：城市 分类"
                      ></i>
                    </el-tooltip>
                  </div>
                </div>
                <div class="count-wrap">
                  <ul class="count">
                    <li>浏览 10000</li>
                    <li>点赞 10000</li>
                    <li>收藏 10000</li>
                  </ul>
                  <div class="action-list">
                    <span>
                      <el-link :underline="false">查看数据</el-link>
                    </span>
                    <span>
                      <el-link :underline="false" type="primary"
                        >设为推荐</el-link
                      >
                    </span>
                    <span
                      ><el-link :underline="false" type="warning"
                        >下 架</el-link
                      ></span
                    >
                    <span
                      ><el-link :underline="false" type="danger"
                        >删 除</el-link
                      ></span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductIndex',

  data() {
    return {
      options: [
        {
          value: '选项1',
          label: '黄金糕'
        },
        {
          value: '选项2',
          label: '双皮奶'
        },
        {
          value: '选项3',
          label: '蚵仔煎'
        },
        {
          value: '选项4',
          label: '龙须面'
        },
        {
          value: '选项5',
          label: '北京烤鸭'
        }
      ],
      catalogTreeItems: [
        {
          value: 'zhinan',
          label: '指南',
          children: [
            {
              value: 'shejiyuanze',
              label: '设计原则',
              children: [
                {
                  value: 'yizhi',
                  label: '一致'
                },
                {
                  value: 'fankui',
                  label: '反馈'
                },
                {
                  value: 'xiaolv',
                  label: '效率'
                },
                {
                  value: 'kekong',
                  label: '可控'
                }
              ]
            },
            {
              value: 'daohang',
              label: '导航',
              children: [
                {
                  value: 'cexiangdaohang',
                  label: '侧向导航'
                },
                {
                  value: 'dingbudaohang',
                  label: '顶部导航'
                }
              ]
            }
          ]
        },
        {
          value: 'zujian',
          label: '组件',
          children: [
            {
              value: 'basic',
              label: 'Basic',
              children: [
                {
                  value: 'layout',
                  label: 'Layout 布局'
                },
                {
                  value: 'color',
                  label: 'Color 色彩'
                },
                {
                  value: 'typography',
                  label: 'Typography 字体'
                },
                {
                  value: 'icon',
                  label: 'Icon 图标'
                },
                {
                  value: 'button',
                  label: 'Button 按钮'
                }
              ]
            },
            {
              value: 'form',
              label: 'Form',
              children: [
                {
                  value: 'radio',
                  label: 'Radio 单选框'
                },
                {
                  value: 'checkbox',
                  label: 'Checkbox 多选框'
                },
                {
                  value: 'input',
                  label: 'Input 输入框'
                },
                {
                  value: 'input-number',
                  label: 'InputNumber 计数器'
                },
                {
                  value: 'select',
                  label: 'Select 选择器'
                },
                {
                  value: 'cascader',
                  label: 'Cascader 级联选择器'
                },
                {
                  value: 'switch',
                  label: 'Switch 开关'
                },
                {
                  value: 'slider',
                  label: 'Slider 滑块'
                },
                {
                  value: 'time-picker',
                  label: 'TimePicker 时间选择器'
                },
                {
                  value: 'date-picker',
                  label: 'DatePicker 日期选择器'
                },
                {
                  value: 'datetime-picker',
                  label: 'DateTimePicker 日期时间选择器'
                },
                {
                  value: 'upload',
                  label: 'Upload 上传'
                },
                {
                  value: 'rate',
                  label: 'Rate 评分'
                },
                {
                  value: 'form',
                  label: 'Form 表单'
                }
              ]
            },
            {
              value: 'data',
              label: 'Data',
              children: [
                {
                  value: 'table',
                  label: 'Table 表格'
                },
                {
                  value: 'tag',
                  label: 'Tag 标签'
                },
                {
                  value: 'progress',
                  label: 'Progress 进度条'
                },
                {
                  value: 'tree',
                  label: 'Tree 树形控件'
                },
                {
                  value: 'pagination',
                  label: 'Pagination 分页'
                },
                {
                  value: 'badge',
                  label: 'Badge 标记'
                }
              ]
            },
            {
              value: 'notice',
              label: 'Notice',
              children: [
                {
                  value: 'alert',
                  label: 'Alert 警告'
                },
                {
                  value: 'loading',
                  label: 'Loading 加载'
                },
                {
                  value: 'message',
                  label: 'Message 消息提示'
                },
                {
                  value: 'message-box',
                  label: 'MessageBox 弹框'
                },
                {
                  value: 'notification',
                  label: 'Notification 通知'
                }
              ]
            },
            {
              value: 'navigation',
              label: 'Navigation',
              children: [
                {
                  value: 'menu',
                  label: 'NavMenu 导航菜单'
                },
                {
                  value: 'tabs',
                  label: 'Tabs 标签页'
                },
                {
                  value: 'breadcrumb',
                  label: 'Breadcrumb 面包屑'
                },
                {
                  value: 'dropdown',
                  label: 'Dropdown 下拉菜单'
                },
                {
                  value: 'steps',
                  label: 'Steps 步骤条'
                }
              ]
            },
            {
              value: 'others',
              label: 'Others',
              children: [
                {
                  value: 'dialog',
                  label: 'Dialog 对话框'
                },
                {
                  value: 'tooltip',
                  label: 'Tooltip 文字提示'
                },
                {
                  value: 'popover',
                  label: 'Popover 弹出框'
                },
                {
                  value: 'card',
                  label: 'Card 卡片'
                },
                {
                  value: 'carousel',
                  label: 'Carousel 走马灯'
                },
                {
                  value: 'collapse',
                  label: 'Collapse 折叠面板'
                }
              ]
            }
          ]
        },
        {
          value: 'ziyuan',
          label: '资源',
          children: [
            {
              value: 'axure',
              label: 'Axure Components'
            },
            {
              value: 'sketch',
              label: 'Sketch Templates'
            },
            {
              value: 'jiaohu',
              label: '组件交互文档'
            }
          ]
        }
      ],
      loading: true,
      products: [],
      listQuery: {
        status: '',
        date_span: '',
        keyword: ''
      }
    }
  },

  mounted() {
    setTimeout(() => {
      this.products = [
        {
          id: 1,
          src: 'https://cdn.x360.cn/234/media/img/88b1c9fa5523e177.jpg'
        },
        {
          id: 2,
          src: 'https://p3-sign.toutiaoimg.com/tos-cn-i-qvj2lq49k0/ec842a32eacd4eab8465640c07907a8e~tplv-tt-shrink:640:0.image?traceid=20230813153224E04E0B07EAA4CA92E40D&x-expires=2147483647&x-signature=%2F7V8jH9ub%2B8EzuDyt8BNu1qPsEw%3D'
        },
        {
          id: 3,
          src: 'https://p3-sign.toutiaoimg.com/tos-cn-i-qvj2lq49k0/a3c50a7d30354d02b02b5b326a74f8b9~tplv-tt-shrink:640:0.image?traceid=20230813153224E04E0B07EAA4CA92E40D&x-expires=2147483647&x-signature=XTGhAkMteMIxyeHfQro%2BhC%2By%2B2I%3D'
        },
        {
          id: 4,
          src: 'https://p3-sign.toutiaoimg.com/tos-cn-i-qvj2lq49k0/dc749d4681fb4c3db909850191e74f53~tplv-tt-shrink:640:0.image?traceid=20230813153224E04E0B07EAA4CA92E40D&x-expires=2147483647&x-signature=uEfCK2ERIa1jm3%2F6dFh0uqSwCSo%3D'
        },
        {
          id: 5,
          src: 'https://p3-sign.toutiaoimg.com/tos-cn-i-qvj2lq49k0/dc749d4681fb4c3db909850191e74f53~tplv-tt-shrink:640:0.image?traceid=20230813153224E04E0B07EAA4CA92E40D&x-expires=2147483647&x-signature=uEfCK2ERIa1jm3%2F6dFh0uqSwCSo%3D'
        },
        {
          id: 6,
          src: 'https://p3-sign.toutiaoimg.com/tos-cn-i-qvj2lq49k0/dc749d4681fb4c3db909850191e74f53~tplv-tt-shrink:640:0.image?traceid=20230813153224E04E0B07EAA4CA92E40D&x-expires=2147483647&x-signature=uEfCK2ERIa1jm3%2F6dFh0uqSwCSo%3D'
        },
        {
          id: 7,
          src: 'https://p3-sign.toutiaoimg.com/tos-cn-i-qvj2lq49k0/dc749d4681fb4c3db909850191e74f53~tplv-tt-shrink:640:0.image?traceid=20230813153224E04E0B07EAA4CA92E40D&x-expires=2147483647&x-signature=uEfCK2ERIa1jm3%2F6dFh0uqSwCSo%3D'
        },
        {
          id: 8,
          src: 'https://p3-sign.toutiaoimg.com/tos-cn-i-qvj2lq49k0/dc749d4681fb4c3db909850191e74f53~tplv-tt-shrink:640:0.image?traceid=20230813153224E04E0B07EAA4CA92E40D&x-expires=2147483647&x-signature=uEfCK2ERIa1jm3%2F6dFh0uqSwCSo%3D'
        },
        {
          id: 9,
          src: 'https://p3-sign.toutiaoimg.com/tos-cn-i-qvj2lq49k0/dc749d4681fb4c3db909850191e74f53~tplv-tt-shrink:640:0.image?traceid=20230813153224E04E0B07EAA4CA92E40D&x-expires=2147483647&x-signature=uEfCK2ERIa1jm3%2F6dFh0uqSwCSo%3D'
        },
        {
          id: 10,
          src: 'https://p3-sign.toutiaoimg.com/tos-cn-i-qvj2lq49k0/dc749d4681fb4c3db909850191e74f53~tplv-tt-shrink:640:0.image?traceid=20230813153224E04E0B07EAA4CA92E40D&x-expires=2147483647&x-signature=uEfCK2ERIa1jm3%2F6dFh0uqSwCSo%3D'
        }
      ]
      this.loading = false
    }, 1000)
  },

  methods: {}
}
</script>

<style lang="scss" scoped>
.product-container {
  .header {
    padding: 0;
    margin: 0;
    background-color: #fff;
    .header-tabs {
      position: relative;
      overflow: hidden;
      .header-tabs-nav {
        position: relative;
        background: #fff;
        padding-left: 48px;
        .header-tabs-nav-wrap {
          display: inline-block;
          transition: transform 0.3s ease;
          white-space: nowrap;
          padding: 6px 0;
          .header-tabs-nav-item {
            box-sizing: border-box;
            height: 42px;
            line-height: 42px;
            margin: 0 20px;
            cursor: pointer;
            display: inline-block;
            transition: color 0.3s;
            font-size: 16px;
            position: relative;

            :first-child {
              margin-left: 0;
            }
            &.active {
              color: #222222;
              font-weight: 500;
            }
            &.recycle-bin {
              color: #f56c6c;
            }
            &.active::after {
              content: '';
              position: absolute;
              left: 0;
              bottom: 0;
              right: auto;
              top: auto;
              width: 100%;
              height: 2px;
              background-color: #f04142;
              transition: left 0.3s ease;
            }
          }
        }
      }
      .tab-divider {
        margin: -4px 4px 0 20px;
        display: inline-block;
        width: 1px;
        height: 20px;
        background: #d8d8d8;
        vertical-align: middle;
      }
    }
  }
  .panel {
    font-size: 14px;
    padding: 32px 0 64px 48px;
    .filter-wrapper {
      display: flex;
      justify-content: space-between;
      padding-left: 20px;
      padding-right: 20px;
      .filter-form {
        display: flex;
        flex-grow: 1;
        justify-content: flex-start;
        .el-form--inline {
          .el-input {
            width: 320px;
          }
          .el-select {
            width: 200px;
          }
          ::v-deep.el-range-separator {
            padding-right: 30px;
          }
        }
      }
    }
    .panel-content-list {
      min-height: 80px;
      padding-left: 20px;
      padding-right: 20px;
      position: relative;
      overflow: auto;
      overflow-x: hidden;
      @media screen and (min-width: 1001px) and (max-width: 1679px) {
        .genre-item {
          margin: 0 -48px;
          padding: 0 48px;
        }
      }
      .genre-item {
        transition: background-color 1s ease-in-out;
        margin: 0 -32px;
        padding: 0 32px;

        .product-card {
          padding: 24px 0;
          line-height: 1;
          font-size: 14px;
          color: #666;
          position: relative;
          border-bottom: 1px solid #e8e8e8;
          .product-card-wrap {
            position: relative;
            display: flex;
            .el-image,
            .image-skeleton {
              width: 168px;
              min-width: 168px;
              height: 108px;
              margin-right: 24px;
              position: relative;
              overflow: hidden;
              border-radius: 4px;
              border: 1px solid #e8e8e8;
              ::v-deep.el-skeleton {
                height: 100%;
              }
              ::v-deep.el-skeleton__image {
                height: 100%;
              }
            }
            .product-card-bone {
              width: 100%;
              display: flex;
              flex-direction: column;
              min-width: 0;
              .title-wrap {
                display: flex;
                justify-content: space-between;
                margin-top: 0;
                .title {
                  font-size: 16px;
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                  line-height: 24px;
                  font-weight: 600;
                  display: block;
                  color: #222;
                }
                .label {
                  color: #999;
                  line-height: 24px;
                  margin-left: 12px;
                  flex-shrink: 0;
                  .create-time {
                  }
                }
              }
              .status-wrap {
                line-height: 20px;
                margin-top: 12px;
                height: 20px;
                display: flex;
                align-items: flex-end;
                .product-tag {
                  margin-right: 8px;
                }
                .divider {
                  width: 1px;
                  height: 12px;
                  margin: 4px 10px 4px 4px;
                  background: #bfbfbf;
                  background: #bfbfbf;
                }
                .icon {
                  margin-right: 8px;
                }
              }
              .count-wrap {
                margin-top: 32px;
                display: flex;
                justify-content: space-between;

                .count {
                  line-height: 20px;
                  position: relative;
                  list-style: none;
                  li {
                    display: inline-block;
                    margin-right: 24px;
                    ::after {
                      content: '\ff65';
                      font-size: 20px;
                      margin: 0 8px;
                      line-height: 0;
                      position: absolute;
                      top: 10px;
                      color: #666666;
                    }
                  }
                }
                .action-list {
                  display: flex;
                  line-height: 20px;
                  flex: 1 0 auto;
                  justify-content: flex-end;
                  span {
                    cursor: pointer;
                    font-size: 14px;
                    line-height: 20px;
                    display: flex;
                    color: #222222;
                    font-weight: 400;
                    margin-left: 24px;
                    :first-child {
                      margin-left: 0;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
