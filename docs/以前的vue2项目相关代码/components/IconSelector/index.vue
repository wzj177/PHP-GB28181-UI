<template>
  <el-select
    :value="value"
    :disabled="disabled"
    clearable
    filterable
    @blur="onBlur"
    allow-create
    @clear="clearHandle"
  >
    <template slot="prefix">
      <span class="icon-picker-selected" v-if="value !== '' && value != null">
        <i :class="value"></i>
      </span>
    </template>
    <el-option class="icon-picker-option" :value="value">
      <div>
        <ul>
          <li v-for="icon in icons" :key="icon" @click="iconClick(icon)">
            <span><i :class="icon"></i></span>
          </li>
          <div class="clearfix"></div>
        </ul>
        <hr />
      </div>
    </el-option>
  </el-select>
</template>

<script>
import icons from './icons.js'

export default {
  name: 'icon-selector',
  props: {
    value: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  model: {
    prop: 'value',
    event: 'change'
  },
  data() {
    return {
      icons: icons
    }
  },
  methods: {
    onBlur(e) {
      if (e.target.value) {
        this.$emit('change', e.target.value)
      } else {
        this.$emit('change', '')
      }
    },
    iconClick(className) {
      this.$emit('change', className)
    },
    clearHandle() {
      this.$emit('change', '')
    }
  }
}
</script>

<style scoped>
.clearfix {
  clear: both;
}

.icon-picker-option.el-select-dropdown__item {
  width: 307px;
  height: auto;
  max-height: 200px;
  overflow-y: auto;
  padding: 0;
}

.icon-picker-option.el-select-dropdown__item.hover,
.icon-picker-option.el-select-dropdown__item:hover {
  background-color: #fff;
  cursor: default;
}

.icon-picker-option.el-select-dropdown__item.selected {
  color: #606266;
  font-weight: normal;
}

.icon-picker-option::-webkit-scrollbar {
  width: 7px;
  background-color: #eee;
}

.icon-picker-option::-webkit-scrollbar-track {
  background-color: #eee;
}

.icon-picker-option::-webkit-scrollbar-thumb {
  background: #d7d7d7;
  border-radius: 7px;
}

.icon-picker-option > div {
  cursor: default;
}

.icon-picker-option ul {
  display: block;
  margin: 0;
  padding: 0;
}

.icon-picker-option ul > li {
  display: block;
  margin: 0;
  padding: 0;
  float: left;
  text-align: center;
  cursor: pointer;
  width: 30px;
  height: 30px;
  line-height: 30px;
}

.icon-picker-option ul > li:hover {
  color: #327edb;
  font-size: 16px;
}
.icon-picker-selected > i {
  color: #333333;
  line-height: 40px;
  margin-left: 6px;
  font-size: 14px;
}
</style>
