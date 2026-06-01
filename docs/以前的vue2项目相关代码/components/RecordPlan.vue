<!-- eslint-disable eqeqeq -->
<!-- eslint-disable eqeqeq -->
<!-- eslint-disable camelcase -->
<template>
  <div
    style="-moz-user-select:none;-webkit-user-select:none;user-select:none;overflow-x:auto;overflow-y:hidden;"
  >
    <span style="color:lightgrey;font-style:italic;line-height:24px;">录像计划 配置云端录像开启时段</span>
    <div class="plans">
      <div class="plan-row-header">
        <div
          class="plan-week plan-header"
          @click.prevent="refresh()"
          style="cursor:pointer;"
        >
          <i class="fa fa-refresh" title="点击还原"></i>&nbsp;重置
        </div>
        <div
          class="plan-week plan-header"
          @click.prevent="selectall()"
          style="cursor:pointer;"
        >
          <i class="fa fa-check" title="点击全选"></i>&nbsp;全选
        </div>
        <div
          class="plan-week plan-header"
          @click.prevent="unselectall()"
          style="cursor:pointer;"
        >
          <i class="fa fa-close" title="点击清空"></i>&nbsp;清空
        </div>
      </div>
      <div
        v-for="(day, index) in days"
        class="plan-row"
        :index="index.toString()"
        :key="index"
      >
        <div class="plan-week">星期{{ day }}</div>
        <div class="plan-hours">
          <div
            v-for="hour in maxHour"
            :key="hour.toString()"
            :class="{'plan-title-num': true,'plan-title-num-left': hour <=1 ,'plan-title-num-right': hour >= 10 }"
          >{{ ((hour%2) == 0 || hour == 1 ) ? (hour == 1 ? 0:hour):'' }}</div>
          <div
            v-for="hour in maxHour"
            :key="`${hour}_index`"
            :class="{'plan-title-line': true,'plan-title-line-left': hour <=1 }"
          >|</div>
          <div
            :index="index.toString()"
            class="plan-day"
            @mousedown.prevent="dayClick($event)"
          >
            <span v-for="(d, i) in (durations[index] || [])" :key="i.toString()">
              <a-popover placement="top" title="录像时间段" width="250" trigger="click">
                <template slot="content">
                  <a-input
                    v-model="dstarthh"
                    size="small"
                    :min="0"
                    :max="23"
                    placeholder="时"
                    style="width:46px;"
                  />:
                  <a-input
                    v-model="dstartmm"
                    size="small"
                    :min="0"
                    :max="59"
                    placeholder="分"
                    style="width:46px;"
                  />-
                  <a-input
                    v-model="dendhh"
                    size="small"
                    :min="0"
                    :max="23"
                    placeholder="时"
                    style="width:46px;"
                  />:
                  <a-input
                    v-model="dendmm"
                    size="small"
                    :min="0"
                    :max="59"
                    placeholder="分"
                    style="width:46px;"
                  />
                  <div style="text-align: center; margin: 0">
                    <a-button size="small" @click="removeDuration(index,i)" >删除</a-button>
                    <a-button size="small" @click="saveDuration(index, i)" >保存</a-button>
                  </div>
                </template>
                <div
                  @mousemove.prevent="durationmove($event,index,i)"
                  @mousedown.prevent="durationClick($event,d,index)"
                  :id="'duration'+index+''+i"
                  :dayindex="index"
                  :durationindex="i"
                  :start="d['s'+(index+1)]"
                  :end="d['e'+(index+1)]"
                  class="plan-duration"
                  :style="'width:'+ durationWidth(d,index)+'%;left:'+durationLeft(d,index,i)+'%;'"
                />
              </a-popover>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    props: {
        serial: {
            type: String,
            default: ''
        },
        code: {
            type: String,
            default: ''
        }
    },
    data () {
        return {
            days: ['一', '二', '三', '四', '五', '六', '日'],
            checks: [],
            isclick: false,
            recordPlan: '',
            isDown: false,
            divIndex: 0,
            currentDayWidth: 0,
            isDown: false,
            visible: false,
            currentDuration: null,
            isDownLeft: false,
            isDownLeft: false,
            value1: '',
            durations: [],
            originDurations: [],
            dayindex: 0,
            overIndex: -1,
            durationDatas: [],
            prex: 0,
            durationindex: 0,
            startNum: 0,
            dstarthh: '',
            dstartmm: '',
            dendhh: '',
            dendmm: '',
            moveprex: 0,
            recordPlan: '',
            mouseup: null,
            mousemove: null,
            movePosNum: 0,
            nextStartNum: 0,
            maxHour: 24
        }
    },
    created () {},
    watch: {},
    mounted () {
        this.mouseup = (e) => {
            this.isDown = false
            this.isDownLeft = false
            this.isDownRight = false
            this.moveprex = 0
            this.movePosNum = 0
            this.prex = 0
            this.nextStartNum = 0
            this.checkPlanData(false)
            this.log('mouse up')
        }
        this.mousemove = (e) => {
            if (!this.isDown && !this.isDownLeft && !this.isDownRight) {
                return false
            }
            if (this.isDown) {
                var x = this.getPosX(e)
                this.moveprex = x
                var pos = Math.floor(((x / 656) * 1440) / 60) + ':' + Math.floor(((x / 656) * 1440) % 60)
                // 校准成30的倍数
                var posNum = this.timeToNum(pos)
                posNum = posNum + (30 - (posNum % 30))
                if (posNum > 1440) {
                    posNum = 1440
                }
                if (posNum <= this.movePosNum) {
                    return
                }
                this.movePosNum = posNum
                if (x == this.prex) {
                    return
                }
                if (x > this.prex) {
                    var start_time = this.numToTime(this.startNum)
                    var end_time = this.numToTime(posNum)
                    var start_key = 's' + (this.dayindex + 1)
                    var end_key = 'e' + (this.dayindex + 1)
                    if (this.startNum == posNum || start_time == end_time) {
                        this.log(
                            'right move ignore isDown:' +
                                this.isDown +
                                ',prex=' +
                                this.prex +
                                ',x=' +
                                x +
                                'datalenth=' +
                                this.durationDatas.length +
                                ',durationindex=' +
                                this.durationindex +
                                ',posNum=' +
                                posNum
                        )
                        return
                    }
                    // 判断有没有和其它交界
                    if (this.durationindex + 1 < this.durationDatas.length) {
                        this.nextStartNum = this.timeToNum(this.durationDatas[this.durationindex + 1][start_key])
                        if (posNum > this.nextStartNum) {
                            this.log(
                                'right move ignore 交界 isDown:' +
                                    this.isDown +
                                    ',prex=' +
                                    this.prex +
                                    "',x=" +
                                    x +
                                    ',datalenth=' +
                                    this.durationDatas.length +
                                    ',durationindex=' +
                                    this.durationindex +
                                    ',posNum=' +
                                    posNum +
                                    ',nextStart=' +
                                    this.durationDatas[this.durationindex + 1]['s' + (this.dayindex + 1)]
                            )
                            return
                        }
                    }
                    if (this.nextStartNum != 0 && posNum > this.nextStartNum) {
                        posNum = this.nextStartNum
                        this.movePosNum = posNum
                        end_time = this.numToTime(posNum)
                    }
                    this.durationDatas[this.durationindex][start_key] = start_time
                    this.durationDatas[this.durationindex][end_key] = end_time
                    this.log(
                        'right move log isDown:' +
                            this.isDown +
                            ',prex=' +
                            this.prex +
                            ',x=' +
                            x +
                            ',datalenth=' +
                            this.durationDatas.length +
                            ',durationindex=' +
                            this.durationindex +
                            ',posNum=' +
                            posNum
                    )

                    this.$set(this.durations, this.dayindex, this.durationDatas)
                    // console.log({
                    //     dayindex: this.dayindex,
                    //     durations: this.durations,
                    //     durationDatas: this.durationDatas
                    // })
                }
            }
        }
        document.addEventListener('mouseup', this.mouseup)
        document.addEventListener('mousemove', this.mousemove)
    },
    beforeDestroy () {
        document.removeEventListener('mouseup', this.mouseup)
        document.removeEventListener('mousemove', this.mousemove)
    },
    methods: {
        init (recordPlan) {
            this.originDurations = []
            this.durations = []
            this.durations = recordPlan ? JSON.parse(recordPlan) : []
            this.originDurations = []
            for (var i = 0; i < 7; i++) {
                var el = []
                if (this.durations[i]) {
                    el = this.durations[i]
                } else {
                    this.durations[i] = el
                }
                this.originDurations[i] = el
            }
        },
        isModify () {
            if (this.originDurations.length == 0) {
                return false
            }
            for (var i = 0; i < this.durations.length; i++) {
                if (this.originDurations[i] != this.durations[i]) {
                    return true
                }
            }
            return false
        },
        log (content) {
            // console.log(content)
        },
        durationmove (e, dayindex, durationindex) {
            if (this.isDown && durationindex == this.durationindex && dayindex == this.dayindex) {
                var x = this.getPosX(e)
                var end_num = this.timeToNum(
                    Math.floor((((this.prex + x) / 656) * 1440) / 60) +
                        ':' +
                        Math.floor((((this.prex + x) / 656) * 1440) % 60)
                )
                end_num = end_num + (30 - (end_num % 30))
                if (x == 0) {
                    end_num = this.startNum
                }
                if (end_num > 1440) {
                    end_num = 1440
                }
                this.log(
                    'duration move log moveprex=' +
                        this.moveprex +
                        ',prex=' +
                        this.prex +
                        ',x=' +
                        x +
                        ',startNum=' +
                        this.startNum +
                        ',end_num=' +
                        end_num
                )
                if (end_num >= this.startNum) {
                    if (this.nextStartNum != 0 && end_num > this.nextStartNum) {
                        end_num = this.nextStartNum
                    }
                    this.movePosNum = end_num
                    this.durations[dayindex][durationindex]['e' + (dayindex + 1)] = this.numToTime(end_num)
                }
            }
        },
        removeDuration (dayindex, durationindex) {
            var newdaydurations = []
            for (var i = 0; i < this.durations[dayindex].length; i++) {
                if (i == durationindex) {
                    continue
                }
                newdaydurations.push(this.durations[dayindex][i])
            }
            this.$set(this.durations, dayindex, newdaydurations)
            $('.plan-row-header').click()
        },
        saveDuration (dayindex, durationindex) {
            if (this.dstarthh.length == 1) {
                this.dstarthh = '0' + this.dstarthh
            }
            if (this.dstartmm.length == 1) {
                this.dstartmm = '0' + this.dstartmm
            }
            if (this.dendhh.length == 1) {
                this.dendhh = '0' + this.dendhh
            }
            if (this.dendmm.length == 1) {
                this.dendmm = '0' + this.dendmm
            }
            var start_time = this.dstarthh + ':' + this.dstartmm
            var end_time = this.dendhh + ':' + this.dendmm
            var newdaydurations = []
            var len = this.durations[dayindex].length
            for (var i = 0; i < len; i++) {
                if (i == durationindex) {
                    if (this.timeToNum(start_time) > this.timeToNum(end_time)) {
                        this.$message.warning('结束时间不能小于开始时间')
                        return
                    }
                    if (this.timeToNum(end_time) > 1440) {
                        this.$message.warning('结束时间不能大于24点')
                        return
                    }
                    if (this.timeToNum(start_time) < 0) {
                        this.$message.warning('开始时间不能小于0点')
                        return
                    }
                    if (i > 0) {
                        var pd = this.durations[dayindex][i - 1]
                        if (this.timeToNum(start_time) < this.timeToNum(pd['e' + (dayindex + 1)])) {
                            this.$message.warning('开始时间须大于上一段结束时间')
                            return
                        }
                    }
                    if (i + 1 < len) {
                        var pd = this.durations[dayindex][i + 1]
                        if (this.timeToNum(end_time) > this.timeToNum(pd['s' + (dayindex + 1)])) {
                            this.$message.warning('结束时间须小于下一段开始时间')
                            return
                        }
                    }
                    var ndata = {}
                    ndata['s' + (dayindex + 1)] = start_time
                    ndata['e' + (dayindex + 1)] = end_time
                    newdaydurations.push(ndata)
                } else {
                    newdaydurations.push(this.durations[dayindex][i])
                }
            }
            this.$set(this.durations, dayindex, newdaydurations)
            $('.plan-row-header').click()
        },
        durationClick (e, d, dayindex) {
            this.dstarthh = d['s' + (dayindex + 1)].split(':')[0]
            this.dstartmm = d['s' + (dayindex + 1)].split(':')[1]
            this.dendhh = d['e' + (dayindex + 1)].split(':')[0]
            this.dendmm = d['e' + (dayindex + 1)].split(':')[1]
            if (e && e.stopPropagation) {
                e.stopPropagation()
            } else {
                window.event.cancelBubble = true
            }
        },
        dayClick (event) {
            if (this.durations.length != 7) {
                this.$message.warning('获取录像计划中,请稍后...')
                return
            }
            this.isDown = true
            var x = this.getPosX(event)
            this.prex = x
            this.dayindex = parseInt($(event.currentTarget).attr('index'))
            // console.log('his.dayindex:', this.dayindex)
            var durationDatas = []
            var start = Math.floor(((x / 656) * 1440) / 60) + ':' + Math.floor(((x / 656) * 1440) % 60)
            // 校准成30的倍数
            var snum = this.timeToNum(start)
            if (snum % 30 > 15) {
                this.startNum = snum + (30 - (snum % 30))
            } else {
                this.startNum = snum - (snum % 30)
            }
            var newData = {}
            newData['s' + (this.dayindex + 1)] = this.numToTime(this.startNum)
            newData['e' + (this.dayindex + 1)] = this.numToTime(this.startNum)
            var hasPush = false
            for (var i = 0; i < this.durations[this.dayindex].length; i++) {
                var el = this.durations[this.dayindex][i]
                if (this.startNum < this.timeToNum(el['s' + (this.dayindex + 1)]) && !hasPush) {
                    hasPush = true
                    this.durationindex = i
                    durationDatas.push(newData)
                }
                durationDatas.push(el)
            }
            if (durationDatas.length == 0 || !hasPush) {
                durationDatas.push(newData)
                this.durationindex = durationDatas.length - 1
            }
            this.durationDatas = durationDatas
            this.log(
                'day click log x=' +
                    x +
                    ',dayindex=' +
                    this.dayindex +
                    ',predatalength=' +
                    (this.durations[this.dayindex] || []).length +
                    ',time=' +
                    newData['s' + (this.dayindex + 1)] +
                    'dataarr=' +
                    this.durations[this.dayindex]
            )
        },
        getPosX (event) {
            var x, y
            var event = event || window.event
            if (event.offsetX || event.offsetY) {
                x = event.offsetX
                y = event.offsetY
            } else if (event.layerX || event.layerY) {
                x = event.layerX
                y = event.layerY
            }
            x = parseInt(x)
            if (x < 0) {
                x = 0
            } else if (x > 656) {
                x = 656
            }
            return x
        },
        timeToNum (t) {
            var time = t.split(':')
            var h = parseInt(time[0])
            var m = parseInt(time[1])
            var sum = h * 60 + m
            return sum
        },
        numToTime (sum) {
            var h = Math.floor(sum / 60) < 10 ? '0' + Math.floor(sum / 60) : Math.floor(sum / 60)
            var m = sum % 60 < 10 ? '0' + (sum % 60) : sum % 60
            var t = h + ':' + m
            return t
        },
        durationLeft (d, dayindex, durationindex) {
            var preWidth = 0
            for (var i = 0; i < durationindex; i++) {
                preWidth += this.durationWidth(this.durations[dayindex][i], dayindex)
            }
            if (preWidth < 0) {
                preWidth = 0
            }
            var s = this.timeToNum(d['s' + (dayindex + 1)])
            var ret = (s / 1440) * 100 - preWidth
            return ret
        },
        durationWidth (d, dayindex) {
            var s = this.timeToNum(d['e' + (dayindex + 1)]) - this.timeToNum(d['s' + (dayindex + 1)])
            return (s / 1440) * 100
        },
        refresh () {
            this.$confirm(`恢复初始配置，当前的编辑会丢失，是否继续?`, '提示')
                .then(() => {
                    this.reset()
                })
                .catch(() => {})
        },
        getChecks () {
            var plans = this.checks.join('')
            return plans
        },
        reset () {
            for (var i = 0; i < 7; i++) {
                var el = this.originDurations[i] || []
                this.$set(this.durations, i, el)
            }
        },
        checkPlanData (join) {
            var durationDatas = []
            for (var i = 0; i < 7; i++) {
                var els = []
                if (this.durations[i]) {
                    for (var j = 0; j < this.durations[i].length; j++) {
                        var s_key = 's' + (i + 1)
                        var e_key = 'e' + (i + 1)
                        var s_num = this.timeToNum(this.durations[i][j][s_key])
                        if (s_num < 0 || s_num > 1440) {
                            continue
                        }
                        var e_num = this.timeToNum(this.durations[i][j][e_key])
                        if (e_num < 0 || e_num > 1440) {
                            continue
                        }
                        if (s_num >= e_num) {
                            continue
                        }
                        var _duration = {}
                        if (els.length > 0) {
                            var pre = els[els.length - 1]
                            var e_num_pre = this.timeToNum(pre[e_key])
                            if (s_num < e_num_pre) {
                                s_num = e_num_pre
                            }
                            if (join) {
                                if (s_num == e_num_pre) {
                                    els[els.length - 1][e_key] = this.numToTime(e_num)
                                    continue
                                }
                            }
                        }
                        _duration[s_key] = this.numToTime(s_num)
                        _duration[e_key] = this.numToTime(e_num)
                        els.push(_duration)
                    }
                }
                durationDatas.push(els)
            }
            this.durations = durationDatas
        },
        getPlan () {
            this.checkPlanData(true)
            // var plan = JSON.stringify(this.durations)
            return this.durations
        },
        selectall () {
            for (var i = 0; i < 7; i++) {
                var el = []
                var n = {}
                n['s' + (i + 1)] = '00:00'
                n['e' + (i + 1)] = '24:00'
                el.push(n)
                this.$set(this.durations, i, el)
            }
        },
        unselectall () {
            for (var i = 0; i < 7; i++) {
                var el = []
                this.$set(this.durations, i, el)
            }
        }
    }
}
</script>

<style lang="less" scoped>
@base: #567;
@base-active: darken(@base, 10%);
@base-border: @base-active;
@base-border-active: darken(@base-border, 10%);
@base-light: lighten(@base, 10%);
@siderWidth: 160px;
@siderMenuHoverWidth: 130px;
.plans {
    font-size: 12px;
    text-align: center;
    border: 0;
    width: 800px;
    float: left;
    background-color: #f7f7f7;
    padding: 15px 50px 25px 20px;
}

.plan-week {
    width: 10%;
    height: 100%;
    float: left;
    background-color: #f7f7f7;
    color: #646363;
    line-height: 88px;
    border: 0;
}

.plan-week:hover {
    background-color: lighten(#f7f7f7, 10%);
}

.plan-hours {
    width: 90%;
    height: 100%;
    float: left;
    background-color: #f7f7f7;
}

.plan-title-num {
    font-weight: bold;
    height: 25% !important;
    color: #7f7e7e;
    background-color: #f7f7f7;
    line-height: 20px !important;
    width: 4.166%;
    float: left;
    font-size: 12px;
    border-color: #eee;
    border-style: none none none none;
    text-align: right;
}

.plan-title-num-right {
    margin-left: 2px;
    margin-right: -2px;
}

.plan-title-num-left {
    text-align: left !important;
    margin-left: -10px;
    padding-left: 5px;
    margin-right: 10px;
}

.plan-title-line {
    font-weight: bold;
    height: 15% !important;
    color: #dddddd;
    background-color: #f7f7f7;
    line-height: 14px !important;
    width: 4.167%;
    float: left;
    font-size: 12px;
    border-style: none none none none;
    text-align: right;
}

.plan-title-line-left {
    border-style: none none none solid !important;
    border-color: #dddddd;
    border-left-width: 1px;
    margin-left: -0.4%;
}

.plan-day {
    width: 100%;
    height: 60%;
    float: left;
    background-color: white;
    color: #eee;
    line-height: 40px;
    border: solid;
    border-width: 1px;
    border-color: #dddddd;
    margin-left: -0.5%;
}

.plan-header {
    font-weight: bold;
    height: 24px !important;
    color: #646363;
    background-color: #f7f7f7 !important;
    line-height: 24px !important;
}

.plan-header:hover {
    background-color: lighten(#f7f7f7, 4%) !important;
}

.plan-row-header {
    height: 24px;
    width: 100%;
}

.plan-row {
    height: 60px;
    width: 100%;
    border-top: 1px;
    border-style: none;
    border-color: #eee;
}

.plan-duration {
    display: block;
    height: 100%;
    background-color: @base;
    border-color: black;
    border-style: none none none none;
    font-size: 10px;
    cursor: pointer;
    float: left;
    position: relative;
}

.plan-duration:hover {
    background-color: @base-light;
}
</style>
