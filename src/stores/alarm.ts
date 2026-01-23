/**
 * 报警模块状态管理
 *
 * 提供报警计划、报警事件和统计数据的状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { alarmApi } from '@/api/alarmApi'
import type { AlarmPlan, AlarmEvent, AlarmStats, AlarmEventQueryParams } from '@/types/alarm'

export const useAlarmStore = defineStore('alarm', () => {
  // ================= 状态 =================

  // 报警计划
  const plans = ref<AlarmPlan[]>([])
  const plansTotal = ref(0)
  const plansLoading = ref(false)

  // 报警事件
  const events = ref<AlarmEvent[]>([])
  const eventsTotal = ref(0)
  const eventsLoading = ref(false)

  // 报警统计
  const stats = ref<AlarmStats>({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  })
  const statsLoading = ref(false)

  // 当前选中的计划/事件
  const currentPlan = ref<AlarmPlan | null>(null)
  const currentEvent = ref<AlarmEvent | null>(null)

  // ================= 报警计划操作 =================

  /**
   * 加载报警计划列表
   */
  const loadPlans = async (params?: {
    page?: number
    limit?: number
    status?: number
  }) => {
    plansLoading.value = true
    try {
      const { data } = await alarmApi.getAlarmPlans(params)
      plans.value = data.list
      plansTotal.value = data.total
      return data
    } catch (error) {
      console.error('加载报警计划失败:', error)
      throw error
    } finally {
      plansLoading.value = false
    }
  }

  /**
   * 加载报警计划详情
   */
  const loadPlanDetail = async (id: number) => {
    try {
      const { data } = await alarmApi.getAlarmPlanDetail(id)
      currentPlan.value = data
      return data
    } catch (error) {
      console.error('加载报警计划详情失败:', error)
      throw error
    }
  }

  /**
   * 创建报警计划
   */
  const createPlan = async (plan: AlarmPlan) => {
    try {
      const { data } = await alarmApi.createAlarmPlan(plan)
      // 重新加载列表
      await loadPlans()
      return data
    } catch (error) {
      console.error('创建报警计划失败:', error)
      throw error
    }
  }

  /**
   * 更新报警计划
   */
  const updatePlan = async (id: number, plan: Partial<AlarmPlan>) => {
    try {
      const { data } = await alarmApi.updateAlarmPlan(id, plan)
      // 重新加载列表
      await loadPlans()
      return data
    } catch (error) {
      console.error('更新报警计划失败:', error)
      throw error
    }
  }

  /**
   * 删除报警计划
   */
  const deletePlan = async (id: number) => {
    try {
      await alarmApi.deleteAlarmPlan(id)
      // 从列表中移除
      plans.value = plans.value.filter(p => p.id !== id)
      plansTotal.value--
    } catch (error) {
      console.error('删除报警计划失败:', error)
      throw error
    }
  }

  /**
   * 绑定通道
   */
  const bindChannels = async (planId: number, deviceId: string, channelIds: string[]) => {
    try {
      await alarmApi.bindChannels(planId, { device_id: deviceId, channel_ids: channelIds })
    } catch (error) {
      console.error('绑定通道失败:', error)
      throw error
    }
  }

  /**
   * 解绑通道
   */
  const unbindChannel = async (planId: number, channelId: string) => {
    try {
      await alarmApi.unbindChannel(planId, channelId)
    } catch (error) {
      console.error('解绑通道失败:', error)
      throw error
    }
  }

  // ================= 报警事件操作 =================

  /**
   * 加载报警事件列表
   */
  const loadEvents = async (params?: AlarmEventQueryParams) => {
    eventsLoading.value = true
    try {
      const { data } = await alarmApi.getAlarmEvents(params)
      events.value = data.list
      eventsTotal.value = data.total
      return data
    } catch (error) {
      console.error('加载报警事件失败:', error)
      throw error
    } finally {
      eventsLoading.value = false
    }
  }

  /**
   * 加载报警事件详情
   */
  const loadEventDetail = async (id: number) => {
    try {
      const { data } = await alarmApi.getAlarmEventDetail(id)
      currentEvent.value = data.data
      return data.data
    } catch (error) {
      console.error('加载报警事件详情失败:', error)
      throw error
    }
  }

  // ================= 报警统计操作 =================

  /**
   * 加载报警统计数据
   */
  const loadStats = async () => {
    statsLoading.value = true
    try {
      const { data } = await alarmApi.getAlarmStats()
      stats.value = data
      return data
    } catch (error) {
      console.error('加载报警统计失败:', error)
      throw error
    } finally {
      statsLoading.value = false
    }
  }

  // ================= 辅助方法 =================

  /**
   * 重置所有状态
   */
  const reset = () => {
    plans.value = []
    plansTotal.value = 0
    plansLoading.value = false

    events.value = []
    eventsTotal.value = 0
    eventsLoading.value = false

    stats.value = {
      today: 0,
      week: 0,
      month: 0,
      total: 0
    }
    statsLoading.value = false

    currentPlan.value = null
    currentEvent.value = null
  }

  return {
    // 状态
    plans,
    plansTotal,
    plansLoading,
    events,
    eventsTotal,
    eventsLoading,
    stats,
    statsLoading,
    currentPlan,
    currentEvent,

    // 报警计划操作
    loadPlans,
    loadPlanDetail,
    createPlan,
    updatePlan,
    deletePlan,
    bindChannels,
    unbindChannel,

    // 报警事件操作
    loadEvents,
    loadEventDetail,

    // 报警统计操作
    loadStats,

    // 辅助方法
    reset
  }
})
