<template>
  <a-modal
    :title="title"
    :width="1200"
    :visible="visible"
    :confirmLoading="loading"
    @ok="
      () => {
        $emit('ok')
      }
    "
    @cancel="
      () => {
        $emit('cancel')
      }
    "
  >
    <a-spin :spinning="loading">
      <a-form-model
        ref="recordPlanDialogForm"
        :model="model"
        :rules="rules"
        v-bind="formItemLayout"
        class="record-plan-form"
      >
        <a-row>
          <a-col :span="12">
            <a-form-model-item label="名称" prop="name">
              <a-input placeholder v-model="model.name" />
            </a-form-model-item>
          </a-col>
          <a-col :span="12">
            <a-form-model-item label="天数限制" prop="limit_days" help="保存近n天的录像">
              <a-input-number v-model="model.limit_days" :min="1" :max="50" />
            </a-form-model-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :span="12">
            <a-form-model-item label="空间大小限制(GB)" prop="limit_space" help="超过后：删除文件或停止录制">
              <a-input-number v-model="model.limit_space" :min="0.5" :max="500" />
            </a-form-model-item>
          </a-col>
          <a-col :span="12">
            <a-form-model-item label="超出后停止计划" prop="over_step_plan">
              <a-radio-group v-model="model.over_step_plan">
                <a-radio-button value="delFile">删除文件</a-radio-button>
                <a-radio-button value="stopDvr">停止录制</a-radio-button>
              </a-radio-group>
            </a-form-model-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :span="12">
            <a-form-model-item label="是否启用" prop="status">
              <a-switch v-model="model.status" checked-children="是" un-checked-children="否" />
            </a-form-model-item>
          </a-col>
          <a-col :span="12">
            <a-form-model-item label="计划描述" prop="remark">
              <a-textarea v-model="model.remark" :rows="2" />
            </a-form-model-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :span="4">
            <div class="ant-form-item-label" style="padding-left: 72px">
              <label for>计划明细</label>
            </div>
          </a-col>
          <a-col :span="20">
            <div class="ant-form-item-control-wrapper">
              <record-plan ref="recordPlan" />
            </div>
          </a-col>
        </a-row>
      </a-form-model>
    </a-spin>
  </a-modal>
</template>

<script>
import { getRecordPlan } from '@/api/record'
const checkLimitDayRange = (rule, value, callback) => {
    if (value) {
        var val = Number(value)
        if (val < 1 || val > 30) {
            callback(new Error('只能保存1~30天的视频'))
        }
        callback()
    }
    callback(new Error('只能保存1~30天的视频'))
}
const checkLimitSpaceRange = (rule, value, callback) => {
    if (value) {
        var val = Number(value)
        if (val < 1 || val > 500) {
            callback(new Error('只能保存1~500GB的视频'))
        }
        callback()
    }
    callback(new Error('只能保存1~500GB的视频'))
}
const defaultModel = {
    id: undefined,
    name: '',
    status: true,
    remark: '',
    limit_space: 1,
    limit_days: 7,
    over_step_plan: 'delFile',
    plan_ranges: []
}
export default {
    props: {
        visible: {
            type: Boolean,
            default: true
        },
        loading: {
            type: Boolean,
            default: () => false
        }
    },
    components: {
        RecordPlan: () => import('@/components/RecordPlan')
    },
    data () {
        return {
            title: '添加录像计划',
            model: Object.assign(defaultModel, {}),
            nvrItems: {},
            formItemLayout: {
                labelCol: { span: 6 },
                wrapperCol: { span: 14 }
            },
            rules: {
                name: [
                    { required: true, message: '请输入名称', trigger: 'blur' },
                    { min: 2, message: '至少输入2个字符串长度的名称', trigger: 'blur' }
                ],
                limit_days: [
                    { required: true, message: '请输入天数限制', trigger: 'blur' },
                    { trigger: 'change', validator: checkLimitDayRange }
                ],
                limit_space: [
                    { required: true, message: '请输入空间大小限制', trigger: 'blur' },
                    { trigger: 'change', validator: checkLimitSpaceRange }
                ]
            }
        }
    },
    methods: {
        loadPlan (id) {
            getRecordPlan(id).then(response => {
                this.resetForm()
                const { plan } = response
                this.model = {
                    id: plan.id,
                    name: plan.name,
                    status: plan.status,
                    remark: plan.remark,
                    limit_space: plan.limit_space,
                    limit_days: plan.limit_days,
                    over_step_plan: plan.over_step_plan,
                    plan_ranges: plan.plan_ranges
                }
                this.initRecordPlan(JSON.stringify(this.model.plan_ranges))
            })
        },
        resetForm () {
            this.$nextTick(() => {
                if (this.$refs.recordPlanDialogForm) {
                    this.$refs.recordPlanDialogForm.resetFields()
                }
            })
            this.model = Object.assign(defaultModel, {})
        },
        initRecordPlan (val = '') {
            this.$nextTick(() => {
                this.$refs.recordPlan.init(val)
            })
        }
    }
}
</script>
<style lang="less" scoped>
.record-plan-form {
    .ant-input {
        width: 250px;
    }
    .ant-input-number {
        width: 250px;
    }
    .ant-radio-group {
        width: 250px;
    }
    .ant-select {
        width: 250px;
    }
}
</style>
