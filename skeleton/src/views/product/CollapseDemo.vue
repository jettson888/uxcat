<template>
  <div class="collapse-demo">
    <h2>折叠面板组件演示</h2>
    
    <div class="demo-section">
      <h3>基础用法</h3>
      <CustomCollapse v-model="activeNames" @change="handleChange">
        <CustomCollapseItem name="1" title="一致性 Consistency">
          <div>与现实生活一致：与现实生活的流程、逻辑保持一致，遵循用户习惯的语言和概念；</div>
          <div>在界面中一致：所有的元素和结构需保持一致，比如：设计样式、图标和文本、元素的位置等。</div>
        </CustomCollapseItem>
        <CustomCollapseItem name="2" title="反馈 Feedback">
          <div>控制反馈：通过界面样式和交互动效让用户可以清晰的感知自己的操作；</div>
          <div>页面反馈：操作后，通过页面元素的变化清晰地展现当前状态。</div>
        </CustomCollapseItem>
        <CustomCollapseItem name="3" title="效率 Efficiency">
          <div>简化流程：设计简洁直观的操作流程；</div>
          <div>清晰明确：语言表达清晰且表意明确，让用户快速理解进而作出决策；</div>
          <div>帮助用户识别：界面简单直白，让用户快速识别而非回忆，减少用户认知负担。</div>
        </CustomCollapseItem>
      </CustomCollapse>
    </div>

    <div class="demo-section">
      <h3>手风琴效果</h3>
      <CustomCollapse v-model="activeName" accordion>
        <CustomCollapseItem name="1" title="一致性 Consistency">
          <div>与现实生活一致：与现实生活的流程、逻辑保持一致，遵循用户习惯的语言和概念；</div>
          <div>在界面中一致：所有的元素和结构需保持一致，比如：设计样式、图标和文本、元素的位置等。</div>
        </CustomCollapseItem>
        <CustomCollapseItem name="2" title="反馈 Feedback">
          <div>控制反馈：通过界面样式和交互动效让用户可以清晰的感知自己的操作；</div>
          <div>页面反馈：操作后，通过页面元素的变化清晰地展现当前状态。</div>
        </CustomCollapseItem>
        <CustomCollapseItem name="3" title="效率 Efficiency">
          <div>简化流程：设计简洁直观的操作流程；</div>
          <div>清晰明确：语言表达清晰且表意明确，让用户快速理解进而作出决策；</div>
          <div>帮助用户识别：界面简单直白，让用户快速识别而非回忆，减少用户认知负担。</div>
        </CustomCollapseItem>
      </CustomCollapse>
    </div>

    <div class="demo-section">
      <h3>简洁风格</h3>
      <CustomCollapse v-model="activeNames2" simple>
        <CustomCollapseItem name="1" title="一致性 Consistency">
          <div>与现实生活一致：与现实生活的流程、逻辑保持一致，遵循用户习惯的语言和概念；</div>
          <div>在界面中一致：所有的元素和结构需保持一致，比如：设计样式、图标和文本、元素的位置等。</div>
        </CustomCollapseItem>
        <CustomCollapseItem name="2" title="反馈 Feedback">
          <div>控制反馈：通过界面样式和交互动效让用户可以清晰的感知自己的操作；</div>
          <div>页面反馈：操作后，通过页面元素的变化清晰地展现当前状态。</div>
        </CustomCollapseItem>
      </CustomCollapse>
    </div>

    <div class="demo-section">
      <h3>自定义标题</h3>
      <CustomCollapse v-model="activeNames3">
        <CustomCollapseItem name="1">
          <template #title>
            <strong>自定义标题</strong>
            <i style="margin-left: 10px; color: #409eff;">自定义图标</i>
          </template>
          <div>这是自定义标题的面板内容</div>
        </CustomCollapseItem>
        <CustomCollapseItem name="2" title="带额外内容">
          <template #extra>
            <button style="font-size: 12px; color: #409eff; background: none; border: none; cursor: pointer;" @click.stop="handleExtraClick">
              操作
            </button>
          </template>
          <div>这是带额外内容的面板</div>
        </CustomCollapseItem>
      </CustomCollapse>
    </div>

    <div class="demo-section">
      <h3>禁用状态</h3>
      <CustomCollapse v-model="activeNames4">
        <CustomCollapseItem name="1" title="正常面板">
          <div>这是一个正常的面板</div>
        </CustomCollapseItem>
        <CustomCollapseItem name="2" title="禁用面板" disabled>
          <div>这是一个被禁用的面板</div>
        </CustomCollapseItem>
        <CustomCollapseItem name="3" title="另一个正常面板">
          <div>这是另一个正常的面板</div>
        </CustomCollapseItem>
      </CustomCollapse>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CollapseDemo',
  data() {
    return {
      activeNames: ['2', '3'],
      activeName: '1',
      activeNames2: ['1'],
      activeNames3: ['1'],
      activeNames4: ['1']
    }
  },
  methods: {
    handleChange(val) {
      console.log('collapse change:', val)
    },
    handleExtraClick() {
      alert('点击了额外操作按钮')
    }
  }
}
</script>

<style scoped>
.collapse-demo {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.demo-section {
  margin-bottom: 40px;
}

.demo-section h3 {
  margin-bottom: 20px;
  color: #303133;
}
</style>
