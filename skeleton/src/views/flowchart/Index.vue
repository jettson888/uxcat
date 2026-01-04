<template>
  <div class="flowchart-wrapper">
    <Header :project-name="projectName" />
    <div class="flowchart-inner">
      <!-- 左侧画布区域 -->
      <div class="flowchart-container" v-if="!loading">
        <svg
          ref="canvas"
          class="flowchart-canvas"
          :class="{ 'is-panning': isPanning || isSpacePressed }"
          @mousedown="onCanvasMouseDown"
          @mousemove="onCanvasMouseMove"
          @mouseup="onCanvasMouseUp"
          @wheel="onCanvasWheel"
        >
          <!-- 应用缩放和平移变换 -->
          <g
            :transform="`translate(${translateX}, ${translateY}) scale(${scale})`"
          >
            <!-- 连线 -->
            <g class="connections">
              <g
                v-for="(connection, index) in connections"
                :key="'conn-' + index"
              >
                <path
                  :d="getConnectionPath(connection)"
                  class="connection-line"
                  :class="{
                    'connection-selected': connection.selected,
                    'connection-highlighted':
                      highlightedConnectionIds.has(index),
                  }"
                  @click="selectConnection(connection, $event)"
                />
                <!-- 连线删除按钮（选中时显示） -->
                <g
                  v-if="connection.selected"
                  :transform="`translate(${
                    getConnectionMidPoint(connection).x
                  }, ${getConnectionMidPoint(connection).y})`"
                  class="connection-delete-btn"
                  @click.stop="deleteConnection(connection)"
                  @mouseenter="connection.deleteHovered = true"
                  @mouseleave="connection.deleteHovered = false"
                >
                  <circle
                    :r="connection.deleteHovered ? 14 : 12"
                    fill="#ff4d4f"
                  />
                  <text
                    text-anchor="middle"
                    dominant-baseline="middle"
                    fill="white"
                    font-size="14"
                    font-weight="bold"
                  >
                    ×
                  </text>
                </g>
              </g>
            </g>
            <!-- 节点 -->
            <g
              v-for="node in nodes"
              :key="node.pageId"
              :transform="`translate(${node.x}, ${node.y})`"
              class="node-group"
              @mousedown="onNodeMouseDown(node, $event)"
            >
              <!-- 流程描述信息（仅根节点且左侧无连线时显示） -->
              <g v-if="isRootNode(node) && node.flowDescription">
                <!-- 背景 -->
                <rect
                  x="0"
                  y="-70"
                  :width="node.width"
                  height="40"
                  rx="8"
                  fill="white"
                  stroke="#91D5FF"
                  stroke-width="1"
                  class="flow-description-bg"
                />
                <!-- 流程勾选框 -->
                <foreignObject x="10" y="-63" width="30" height="32">
                  <div
                    @click.stop
                    @mousedown.stop
                    style="
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      height: 100%;
                    "
                  >
                    <el-checkbox
                      v-model="node.flowDescriptionChecked"
                      @change="onFlowDescriptionCheckChange(node)"
                      style="margin: 0"
                      title="勾选此流程（将同时勾选所有后代节点）"
                    />
                  </div>
                </foreignObject>
                <!-- 流程描述文本 -->
                <foreignObject
                  x="45"
                  y="-64"
                  :width="node.width - 60"
                  height="32"
                >
                  <div
                    style="
                      color: #1890ff;
                      font-size: 13px;
                      font-weight: 500;
                      line-height: 32px;
                      text-align: left;
                    "
                  >
                    <template v-if="node.flowDescriptionEditing">
                      <el-input
                        v-model="node.flowDescription"
                        @click.stop
                        @mousedown.stop
                        @blur="node.flowDescriptionEditing = false"
                        @keyup.enter="node.flowDescriptionEditing = false"
                        size="mini"
                        style="line-height: normal"
                        placeholder="请输入流程描述"
                      />
                    </template>
                    <template v-else>
                      <div
                        @click.stop="node.flowDescriptionEditing = true"
                        :title="node.flowDescription"
                        style="
                          overflow: hidden;
                          text-overflow: ellipsis;
                          white-space: nowrap;
                          cursor: text;
                        "
                      >
                        {{ node.flowDescription }}
                      </div>
                    </template>
                  </div>
                </foreignObject>
              </g>
              <!-- 节点边框 -->
              <rect
                :width="node.width"
                :height="node.height"
                rx="12"
                class="node-border"
                :class="{
                  'node-selected': node.selected,
                  'node-clicked': node.clicked,
                }"
              />
              <!-- 标题区域背景 -->
              <rect
                :width="node.width"
                :height="60"
                rx="12"
                class="node-header"
                :class="{ 'node-header-checked': node.checked }"
              />
              <rect
                :width="node.width"
                :height="48"
                y="12"
                class="node-header-bottom"
                :class="{ 'node-header-bottom-checked': node.checked }"
              />
              <!-- 左侧图标 -->
              <rect
                x="15"
                y="20"
                width="28"
                height="28"
                rx="6"
                fill="rgba(24, 144, 255, 0.1)"
              />
              <image :href="pageIcon" x="21" y="26" width="16" height="16" />
              <!-- 标题文本 -->
              <foreignObject x="55" y="15" :width="node.width - 95" height="40">
                <div
                  style="
                    color: #262626;
                    font-size: 16px;
                    font-weight: 500;
                    line-height: 40px;
                  "
                >
                  <template v-if="node.editing">
                    <el-input
                      v-model="node.name"
                      @click.stop
                      @mousedown.stop
                      size="small"
                      style="line-height: normal"
                    />
                  </template>
                  <template v-else>
                    {{ node.name }}
                  </template>
                </div>
              </foreignObject>
              <!-- 添加节点图标 -->
              <g
                @click.stop="addNodeByButton(node)"
                style="cursor: pointer"
                @mousedown.stop
              >
                <title>添加节点</title>
                <image
                  :href="addNodeIcon"
                  :x="node.width - 51"
                  y="15"
                  width="16"
                  height="16"
                />
              </g>
              <!-- 右上角勾选框 -->
              <foreignObject :x="node.width - 35" y="15" width="30" height="30">
                <div
                  @click.stop
                  @mousedown.stop
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  "
                >
                  <el-checkbox
                    v-model="node.checked"
                    :disabled="
                      node.status === 'done' || node.status === 'generating'
                    "
                    @change="onNodeCheckChange(node)"
                    style="margin: 0"
                    :title="
                      node.status === 'done' || node.status === 'generating'
                        ? '已完成或生成中的页面不可取消勾选'
                        : '勾选后可生成页面'
                    "
                  />
                </div>
              </foreignObject>
              <!-- 左上角连接终点 -->
              <circle
                cx="-5"
                cy="30"
                :r="highlightedTargetNodeIds.has(node.pageId) ? 10 : 6"
                class="node-anchor target-anchor"
                :class="{
                  'anchor-active': connectingFrom !== null,
                  'anchor-highlighted': highlightedTargetNodeIds.has(
                    node.pageId
                  ),
                }"
                @mousedown.stop
                @mouseup.stop="
                  onAnchorMouseUp(node, { id: 'target', x: -5, y: 30 }, $event)
                "
              />
              <!-- 右上角外部工具按钮（hover 时显示） -->
              <g
                class="node-tools"
                :transform="`translate(${node.width / 2 - 30}, -30)`"
                @mouseenter="node.toolsHovered = true"
                @mouseleave="node.toolsHovered = false"
              >
                <!-- 透明背景区域，扩大鼠标感应范围 -->
                <rect
                  x="-5"
                  y="-5"
                  width="182"
                  height="38"
                  fill="transparent"
                />
                <!-- 统一工具栏背景 -->
                <rect
                  x="70"
                  y="0"
                  width="105"
                  height="28"
                  fill="#358AFF"
                  rx="8"
                  ry="8"
                  class="toolbar-bg"
                  filter="url(#toolbar-shadow)"
                />
                <!-- 底部遮罩，去除下半部分圆角 -->
                <rect
                  x="70"
                  y="14"
                  width="105"
                  height="14"
                  fill="#358AFF"
                  class="toolbar-bg-bottom"
                />

                <!-- 查看页面按钮（使用图片） -->
                <g
                  @click.stop="viewPage(node)"
                  class="tool-btn"
                  @mousedown.stop
                  v-if="node.status === 'done'"
                >
                  <title>查看页面</title>
                  <rect
                    x="76"
                    y="4"
                    width="28"
                    height="20"
                    fill="transparent"
                    rx="4"
                    class="tool-btn-hover"
                  />
                  <image :href="viewIcon" x="82" y="8" width="16" height="16" />
                </g>

                <!-- 垂直分隔线 -->
                <line
                  x1="108"
                  y1="6"
                  x2="108"
                  y2="22"
                  stroke="rgba(255,255,255,0.2)"
                  stroke-width="1"
                  v-if="node.status === 'done'"
                />
                <!-- 生成页面按钮 -->
                <g
                  @click.stop="generatePage(node)"
                  class="tool-btn"
                  @mousedown.stop
                  v-if="node.status === 'pending' || !node.status"
                >
                  <title>生成页面</title>
                  <rect
                    x="76"
                    y="4"
                    width="28"
                    height="20"
                    fill="transparent"
                    rx="4"
                    class="tool-btn-hover"
                  />
                  <image
                    :href="generateIcon"
                    x="82"
                    y="8"
                    width="16"
                    height="16"
                  />
                </g>

                <!-- 垂直分隔线 -->
                <line
                  v-if="node.status === 'pending' || !node.status"
                  x1="108"
                  y1="6"
                  x2="108"
                  y2="22"
                  stroke="rgba(255,255,255,0.2)"
                  stroke-width="1"
                />
                <!-- 编辑按钮 -->
                <!-- <g
                  @click.stop="
                    node.status === 'done' || node.status === 'generating'
                      ? null
                      : toggleNodeEdit(node)
                  "
                  :class="{
                    'tool-btn-disabled':
                      node.status === 'done' || node.status === 'generating',
                  }"
                  @mousedown.stop
                >
                  <title>
                    {{
                      node.status === "done" || node.status === "generating"
                        ? "已生成页面无法编辑"
                        : "编辑"
                    }}
                  </title>
                  <rect
                    x="76"
                    y="4"
                    width="28"
                    height="20"
                    fill="transparent"
                    rx="4"
                    class="tool-btn-hover"
                  />
                  <image
                    :href="editIcon"
                    x="82"
                    y="8"
                    width="16"
                    height="16"
                  />
                </g> -->

                <!-- 垂直分隔线 -->
                <!-- <line
                  x1="108"
                  y1="6"
                  x2="108"
                  y2="22"
                  stroke="rgba(255,255,255,0.2)"
                  stroke-width="1"
                /> -->
                <!-- 复制按钮 -->
                <g
                  @click.stop="copyNode(node)"
                  class="tool-btn"
                  @mousedown.stop
                >
                  <title>复制</title>
                  <rect
                    x="112"
                    y="4"
                    width="28"
                    height="20"
                    fill="transparent"
                    rx="4"
                    class="tool-btn-hover"
                  />
                  <image
                    :href="copyIcon"
                    x="118"
                    y="8"
                    width="16"
                    height="16"
                  />
                </g>

                <!-- 垂直分隔线 -->
                <line
                  x1="144"
                  y1="6"
                  x2="144"
                  y2="22"
                  stroke="rgba(255,255,255,0.2)"
                  stroke-width="1"
                />
                <!-- 删除按钮 -->
                <g
                  @click.stop="deleteNode(node)"
                  class="tool-btn"
                  @mousedown.stop
                >
                  <title>删除</title>
                  <rect
                    x="148"
                    y="4"
                    width="20"
                    height="20"
                    fill="transparent"
                    rx="4"
                    class="tool-btn-hover"
                  />
                  <image
                    :href="deleteIcon"
                    x="152"
                    y="8"
                    width="16"
                    height="16"
                  />
                </g>

                <!-- 阴影滤镜定义 -->
                <defs>
                  <filter
                    id="toolbar-shadow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                    <feOffset dx="0" dy="2" result="offsetblur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.2" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </g>

              <!-- 描述区域背景 -->
              <rect
                x="0"
                y="60"
                :width="node.width"
                height="90"
                fill="white"
                class="description-area"
                :class="{ 'description-area-checked': node.checked }"
              />

              <!-- 描述区域 -->
              <foreignObject
                x="16"
                y="70"
                :width="node.width - 32"
                :height="80"
              >
                <div
                  style="
                    color: #8c8c8c;
                    font-size: 12px;
                    line-height: 1.5;
                    height: 80px;
                    overflow-y: auto;
                  "
                >
                  <template v-if="node.editing">
                    <el-input
                      v-model="node.description"
                      type="textarea"
                      :rows="3"
                      @click.stop
                      @mousedown.stop
                      placeholder="添加描述信息..."
                      resize="none"
                    />
                  </template>
                  <template v-else>
                    {{ node.description }}
                  </template>
                </div>
              </foreignObject>
              <!-- 功能列表 -->
              <g v-for="(func, index) in node.functions" :key="'func-' + index">
                <rect
                  :y="150 + index * 40"
                  :rx="
                    func.editing
                      ? 0
                      : index == node.functions.length - 1
                      ? 12
                      : 0
                  "
                  :width="node.width"
                  height="40"
                  fill="white"
                  class="function-item"
                  :class="{ 'function-item-checked': node.checked }"
                />
                <rect
                  v-if="index == node.functions.length - 1"
                  :y="150 + index * 40"
                  :width="node.width"
                  height="30"
                  fill="white"
                  class="function-item"
                  :class="{ 'function-item-checked': node.checked }"
                />
                <foreignObject
                  x="16"
                  :y="150 + index * 40 + 5"
                  :width="node.width - 32"
                  height="40"
                >
                  <div
                    style="
                      color: #262626;
                      font-size: 13px;
                      line-height: 26px;
                      font-weight: 400;
                      border: 1px solid rgba(239, 239, 239, 1);
                      border-radius: 4px;
                      padding: 4px 8px;
                      display: flex;
                      align-items: center;
                      height: 34px;
                      justify-content: space-between;
                    "
                  >
                    <template v-if="func.editing">
                      <el-input
                        v-model="func.name"
                        @click.stop
                        @mousedown.stop
                        @blur="func.editing = false"
                        @keyup.enter="func.editing = false"
                        ref="funcInput"
                        size="mini"
                        style="flex: 1; margin-right: 4px"
                      />
                    </template>
                    <template v-else>
                      <span
                        @click.stop="node.editing && (func.editing = true)"
                        :style="{
                          cursor: node.editing ? 'text' : 'default',
                          flex: 1,
                        }"
                        >{{ func.name }}</span
                      >
                    </template>
                    <!-- 删除按钮（仅在编辑模式且未连接时显示） -->
                    <span
                      v-if="
                        node.editing &&
                        !isFunctionConnected(node.page_id, index)
                      "
                      @click.stop="deleteFunction(node, index)"
                      style="
                        cursor: pointer;
                        color: #ff4d4f;
                        font-size: 16px;
                        padding: 0 4px;
                        line-height: 1;
                        user-select: none;
                      "
                      title="删除功能"
                    >
                      ×
                    </span>
                  </div></foreignObject
                ><!-- 功能连接点（位于功能内容右边框上） -->
                <image
                  :href="
                    isFunctionConnected(node.pageId, index)
                      ? connectedIcon
                      : disconnectedIcon
                  "
                  :x="node.width - 26"
                  :y="150 + index * 40 + 12"
                  width="16"
                  height="16"
                  class="node-anchor function-anchor"
                  :class="{ 'anchor-active': connectingFrom !== null }"
                  @mousedown.stop="
                    onAnchorMouseDown(
                      node,
                      {
                        id: 'func-' + index,
                        x: node.width - 20,
                        y: 150 + index * 40 + 19.5,
                      },
                      $event
                    )
                  "
                  @mouseup.stop="
                    onAnchorMouseUp(
                      node,
                      {
                        id: 'func-' + index,
                        x: node.width - 20,
                        y: 150 + index * 40 + 19.5,
                      },
                      $event
                    )
                  "
                />
              </g>
              <!-- 添加功能按钮（仅在编辑模式显示） -->
              <g
                v-if="node.editing"
                :transform="`translate(0, ${150 + node.functions.length * 40})`"
                @click.stop="addFunction(node)"
                @mousedown.stop
                class="add-function-btn"
              >
                <rect
                  :width="node.width"
                  height="50"
                  fill="white"
                  rx="12"
                  class="add-btn-bg"
                  :class="{ 'add-btn-bg-checked': node.checked }"
                />
                <rect
                  :width="node.width"
                  height="30"
                  fill="white"
                  class="add-btn-bg"
                  :class="{ 'add-btn-bg-checked': node.checked }"
                />
                <text
                  :x="node.width / 2"
                  y="30"
                  text-anchor="middle"
                  fill="#1890ff"
                  font-size="13"
                  font-weight="500"
                >
                  + 添加功能
                </text>
              </g>
            </g>
            <!-- 临时连线 -->
            <path
              v-if="tempConnection"
              :d="getTempConnectionPath()"
              class="temp-connection-line"
            />
          </g>
        </svg>
        <!-- 缩放控制工具栏 -->
        <div class="zoom-controls">
          <el-button
            @click="zoomIn($event)"
            @mousedown="$event.target.blur()"
            @keydown.space.prevent
            tabindex="-1"
            class="zoom-btn"
            title="放大"
          >
            <span>+</span>
          </el-button>
          <div class="zoom-display">{{ Math.round(scale * 100) }}%</div>
          <el-button
            tabindex="-1"
            @click="zoomOut($event)"
            @mousedown="$event.target.blur()"
            @keydown.space.prevent
            class="zoom-btn"
            title="缩小"
          >
            <span>−</span>
          </el-button>
          <el-button
            tabindex="-1"
            @click="resetZoom($event)"
            @mousedown="$event.target.blur()"
            @keydown.space.prevent
            class="zoom-btn zoom-btn-reset"
            title="重置"
          >
            <span>⟲</span>
          </el-button>
        </div>

        <!-- 空状态按钮（画布右上方） -->
        <div class="empty-state-btn" v-if="showEmptyBtn">
          <button @click="handleEmptyStateClick" class="btn-generate-pages">
            重新生成流程图
          </button>
        </div>
      </div>
      <!-- loading -->
      <div class="flowchart-loading" v-if="loading">
        <img :src="loadingImage" />
      </div>
      <!-- 右侧节点工具栏 -->
      <div v-if="!clickedNode" class="node-toolbar">
        <!-- 添加节点按钮 -->
        <!-- <button @click="addNodeByButton()" class="btn btn-add-node">
          + 添加节点
        </button> -->
        <!-- 文本显示区域 -->
        <div class="text-display-area">
          <div class="text-prompt-container">
            <div
              class="text-prompt"
              :class="{ 'text-prompt-collapsed': isPromptCollapsed }"
              ref="promptElement"
            >
              {{ prompt }}
            </div>
            <div
              v-if="showPromptExpand"
              class="text-prompt-expand"
              @click="togglePromptExpand"
            >
              {{ isPromptCollapsed ? "展开全部" : "收起" }}
              <el-icon v-if="isPromptCollapsed"><ArrowDown /></el-icon>
              <el-icon v-else><ArrowUp /></el-icon>
            </div>
          </div>
          <div class="text-content">{{ writeText }}</div>
          <!-- 工作流导航 -->
          <ul v-if="workflows.length" class="flowchart-nav">
            点击查看产品流程图
            <template v-for="(node, i) in nodes">
              <li
                v-if="isRootNode(node) && node.flowDescription"
                :key="i"
                :class="{ select: selectedWorkflow === node }"
                @click="selectWorkflow(node)"
              >
                <span>{{ node.flowDescription }}</span>
                <el-icon><View /></el-icon>
              </li>
            </template>
          </ul>
        </div>
        <!-- 底部生成区域 -->
        <div class="select-bottom">
          <div class="text-tip">
            请在左侧流程图中勾选节点，勾选的节点将会生成对应的产品页面
          </div>
          <div class="text-tip">
            已勾选
            <span style="color: #1890ff; font-size: 16px; font-weight: 500">
              {{ ischeckedNodes }}</span
            >
            个节点
          </div>
          <!-- 全选复选框 -->
          <div class="select-all-wrapper">
            <el-checkbox
              v-model="selectAllNodes"
              @change="onSelectAllChange"
              :indeterminate="isIndeterminate"
            >
              全选
            </el-checkbox>
          </div>
          <!-- 模型选择 -->
          <div>
            <!-- <label class="form-label">模型</label> -->
            <el-select v-model="model" style="width: 100%">
              <el-option
                v-for="item in modelList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </el-select>
          </div>
          <!-- 生成产品页面按钮 -->
          <button @click="generateProductPages" class="btn-generate-pages">
            生成产品页面
          </button>
        </div>
      </div>
      <!-- 编辑选中节点 -->
      <div v-else class="flowchart-edit">
        <div class="breadcrumb">
          <span class="breadcrumb-all">流程图</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">编辑页面</span>
        </div>
        <div class="edit-info">
          <div class="input-group">
            <label class="form-label">页面名称</label>
            <input
              v-model="clickedNode.name"
              class="input-field"
              placeholder="请输入页面名称"
              :disabled="
                clickedNode.status === 'done' ||
                clickedNode.status === 'generating'
              "
            />
          </div>
          <div class="input-group">
            <label class="form-label">页面描述</label>
            <textarea
              v-model="clickedNode.description"
              class="textarea-field"
              placeholder="请输入页面描述"
              :disabled="
                clickedNode.status === 'done' ||
                clickedNode.status === 'generating'
              "
            ></textarea>
          </div>
        </div>
        <div class="edit-feature">
          <p>功能</p>
          <ul>
            <li v-for="(item, i) in clickedNode.functions" :key="i">
              <input
                v-model="item.name"
                :disabled="
                  clickedNode.status === 'done' ||
                  clickedNode.status === 'generating'
                "
              />
              <el-icon
                v-if="clickedNode.status === 'pending'"
                @click="deleteFunction(clickedNode, i)"
                ><Close
              /></el-icon>
            </li>
          </ul>
          <div
            v-if="clickedNode.status === 'pending'"
            class="edit-add"
            @click="addFunction(clickedNode)"
          >
            <el-icon><Plus /></el-icon>添加新功能
          </div>
        </div>
      </div>
      <!-- 左侧悬浮的工作流导航 -->
      <div
        v-if="workflows.length"
        class="flowchart-sidenav"
        :class="{ collapsed: isListCollapsed }"
      >
        <ul v-show="!isListCollapsed" class="flowchart-sidenav-inner">
          <!-- 点击查看产品流程图 -->
          <template v-for="(node, i) in nodes">
            <li
              v-if="isRootNode(node) && node.flowDescription"
              :key="i"
              :class="{ select: selectedWorkflow === node }"
              @click="selectWorkflow(node)"
            >
              <template v-if="editingWorkflow && editingWorkflow == node">
                <el-input
                  v-model="node.flowDescription"
                  @click.stop
                  @mousedown.stop
                  @blur="editingWorkflow = null"
                  @keyup.enter="editingWorkflow = null"
                  size="mini"
                  style="line-height: normal"
                  placeholder="请输入流程描述"
                />
              </template>
              <template v-else>
                <span>{{ node.flowDescription }}</span>
              </template>
              <div>
                <el-icon @click.stop="editWorkflow(node)"><Edit /></el-icon>
                <el-icon
                  @click.stop="deleteWorkflow(node)"
                  style="margin-left: 5px"
                  ><Delete
                /></el-icon>
              </div>
            </li>
          </template>
          <div class="flowchart-sidenav-add" @click="addNodeByButton">
            <el-icon><Plus /></el-icon>添加业务模块
          </div>
        </ul>
        <div
          class="flowchart-sidenav-toggle"
          :class="{ collapsed: isListCollapsed }"
          @click="toggleSideNav"
        >
          <el-icon v-if="isListCollapsed"><ArrowRight /></el-icon>
          <el-icon v-else><ArrowLeft /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import Header from "@/common/components/Header.vue";
import request from "@/common/request.js";
import createApiEndpoints from "@/common/api.js";
import writerVue from "./writer.vue";
import { modelList } from "@/common/modelConfig.js";

// 图片资源导入
import pageIcon from "@/assets/images/flowchart/页面.png";
import addNodeIcon from "@/assets/images/flowchart/新增节点.svg";
import viewIcon from "@/assets/images/flowchart/查看.png";
import generateIcon from "@/assets/images/flowchart/生成.svg";
import editIcon from "@/assets/images/flowchart/编辑.png";
import copyIcon from "@/assets/images/flowchart/复制.png";
import deleteIcon from "@/assets/images/flowchart/删除.png";
import connectedIcon from "@/assets/images/flowchart/已连接.png";
import disconnectedIcon from "@/assets/images/flowchart/未连接节点.png";
import loadingImage from "@/assets/images/flowchart/loading.webp";

// 响应式数据
let api;
const route = useRoute();
const router = useRouter();

// 打字机文本
const writeText = ref("");
const pollingInterval = ref(null); // 轮询定时器
const pollingDelay = 5000; // 轮询间隔5秒
const projectId = ref(""); // 项目ID
const nodes = ref([]);
const connections = ref([]);
const draggedNode = ref(null);
const dragOffset = ref({ x: 0, y: 0 });
const connectingFrom = ref(null);
const tempConnection = ref(null);
const tempMousePos = ref({ x: 0, y: 0 });
const storageKey = "flowchart-data"; // localStorage 存储键名
const selectAllNodes = ref(false); // 全选节点状态
const projectName = ref("");
// 画布缩放和平移相关
const scale = ref(1); // 缩放比例
const translateX = ref(0); // 平移X
const translateY = ref(0); // 平移Y
const isPanning = ref(false); // 是否正在平移
const panStart = ref({ x: 0, y: 0 }); // 平移起始位置
const isSpacePressed = ref(false); // 空格键是否按下

// 加载中
const loading = ref(false);
// 模型选择相关
const model = ref("qwen-coder");
const modelListRef = modelList;
// 保存数据相关
const saveDebounceTimer = ref(null);
const isDragging = ref(false);
const ischeckedNodes = ref(0);
// showEmptyBtn展示重新生成流程图按钮
const showEmptyBtn = ref(false);
const prompt = ref("");
const workflows = ref([]);
const selectedWorkflow = ref(null); // 选中的工作流

// 文本提示折叠相关
const isPromptCollapsed = ref(true);
const showPromptExpand = ref(false);

const isListCollapsed = ref(false); // 控制左侧悬浮的工作流导航是否收起
const editingWorkflow = ref(null); // 正在编辑的工作流

// refs
const canvas = ref(null);
const promptElement = ref(null);
const funcInput = ref(null);

// 计算属性
const clickedNode = computed(() => {
  return nodes.value.find((n) => n.clicked);
});

// 获取选中节点连接的目标节点ID集合
const highlightedTargetNodeIds = computed(() => {
  const selectedNode = nodes.value.find((n) => n.selected);
  if (!selectedNode) return new Set();
  const targetNodeIds = new Set();
  connections.value.forEach((conn) => {
    // 如果连接的起点是选中节点的功能点
    if (
      conn.from.nodeId === selectedNode.pageId &&
      conn.from.anchorId.startsWith("func-")
    ) {
      targetNodeIds.add(conn.to.nodeId);
    }
  });

  return targetNodeIds;
});

// 获取被点击节点相关的连线ID集合
const highlightedConnectionIds = computed(() => {
  const clickedNode = nodes.value.find((n) => n.clicked);
  if (!clickedNode) return new Set();

  const connectionIds = new Set();
  connections.value.forEach((conn, index) => {
    // 如果连线的起点或终点是被点击的节点
    if (
      conn.from.nodeId === clickedNode.pageId ||
      conn.to.nodeId === clickedNode.pageId
    ) {
      connectionIds.add(index);
    }
  });

  return connectionIds;
});

// 计算半选状态（部分节点被勾选）
const isIndeterminate = computed(() => {
  if (nodes.value.length === 0) return false;
  const checkedCount = nodes.value.filter((n) => n.checked).length;
  return checkedCount > 0 && checkedCount < nodes.value.length;
});

// 监听器
watch(model, (newVal) => {
  // 当model改变时，保存到localStorage
  localStorage.setItem("pageModel", newVal);
});

// 生命周期钩子
onMounted(async () => {
  api = await createApiEndpoints();
  const projectId = route.query.projectId;
  if (!projectId) {
    return;
  }

  window.electronAPI?.sendMessage("initial-uxbot", { type: "client" });

  handleProjectId();

  startPolling();

  // 监听键盘事件
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  // 从localStorage获取保存的model值
  const pageModel = localStorage.getItem("pageModel");
  if (pageModel) {
    // 验证保存的model是否在modelList中
    const isValidModel = modelListRef.some((item) => item.value === pageModel);
    if (isValidModel) {
      model.value = pageModel;
    }
  }
});

onBeforeUnmount(() => {
  // 移除键盘事件监听
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  // 清理轮询定时器
  stopPolling();
});

// 方法定义
// 调用替换所有内容接口
const handleProjectId = async () => {
  const projectId = route.query.projectId;
  const storedProjectId = sessionStorage.getItem("projectId");

  sessionStorage.setItem("projectId", projectId);
  if (!storedProjectId || (storedProjectId && storedProjectId !== projectId)) {
    try {
      await request({
        url: api.initial,
        method: "POST",
        data: {
          projectId: projectId,
        },
      });
    } catch (error) {
      console.error("调用替换接口失败:", error);
    }
  }
};

const handleEmptyStateClick = () => {
  const { target, projectId, resolution } = route.query;
  // let prompt = localStorage.getItem('aiPromptTextarea')
  try {
    const response = request({
      url: api.chatCompletions,
      method: "POST",
      data: {
        prompt: prompt.value,
        target: target,
        resolution: resolution,
        projectId: projectId,
        isRerender: true,
      },
    });
    startPolling();
  } catch (error) {
    console.error("Error:", error);
    // renderError = error.message;
    loading.value = false;
  } finally {
    // loading.value = false;
  }
};

// 判断节点是否为根节点（左侧没有连线指向它）
const isRootNode = (node) => {
  return !connections.value.some((conn) => conn.to.nodeId === node.pageId);
};

// 流程描述勾选框变化事件（级联勾选当前节点和所有后代节点）
const onFlowDescriptionCheckChange = (node) => {
  const checked = node.flowDescriptionChecked;

  // 首先勾选或取消勾选当前根节点本身
  if (node.status !== "done" && node.status !== "generating") {
    node.checked = checked;
  }

  // 获取所有后代节点
  const descendantNodes = getDescendantNodes(node);

  // 勾选或取消勾选所有后代节点
  descendantNodes.forEach((descendantNode) => {
    if (
      descendantNode.status !== "done" &&
      descendantNode.status !== "generating"
    ) {
      descendantNode.checked = checked;
    }
  });

  // 更新全选状态
  updateSelectAllState();

  console.log(
    `流程 ${node.flowDescription} 勾选状态: ${checked}, 影响了当前节点和 ${descendantNodes.length} 个后代节点`
  );
};

// 获取节点的所有后代节点（递归）
const getDescendantNodes = (node) => {
  const descendants = [];
  const visited = new Set(); // 防止循环引用

  const traverse = (currentNode) => {
    if (visited.has(currentNode.pageId)) {
      return;
    }
    visited.add(currentNode.pageId);

    // 查找从当前节点出发的所有连线
    connections.value.forEach((conn) => {
      if (conn.from.nodeId === currentNode.pageId) {
        const targetNode = nodes.value.find((n) => n.pageId === conn.to.nodeId);
        if (targetNode) {
          descendants.push(targetNode);
          traverse(targetNode); // 递归查找
        }
      }
    });
  };

  traverse(node);
  return descendants;
};

// 保存页面数据到后端// 编辑，删除，新增调用
const savePageData = async (useWorkflows) => {
  console.log("savePageDatasavePageData");

  try {
    const { pages, workflows } = getWorkflow();
    const { projectId } = route.query;
    const response = await request({
      url: api.updateWorkflow,
      method: "POST",
      data: {
        pages,
        projectId,
        workflows: useWorkflows || workflows, // 告诉服务端全量替换/
      },
    });
  } catch (error) {
    console.error("请求失败:", error);
  }
};

// 立即保存（用于新增、编辑、删除、连线、复制操作）
const savePageDataImmediate = () => {
  savePageData();
};

// 延迟保存（用于拖动操作，3秒防抖）
const savePageDataDebounced = () => {
  // 清除之前的定时器
  if (saveDebounceTimer.value) {
    clearTimeout(saveDebounceTimer.value);
  }
  // 设置新的定时器
  saveDebounceTimer.value = setTimeout(() => {
    savePageData();
  }, 3000); // 3秒防抖
};

// 开始轮询
const startPolling = () => {
  // 先立即执行一次查询
  loading.value = true;
  fetchTaskStatus();
  // fetchWorkflowDetail();
  
  // 设置定时器定期查询
  pollingInterval.value = setInterval(() => {
    fetchTaskStatus();
    // fetchWorkflowDetail();
  }, pollingDelay);
};

// 停止轮询
const stopPolling = () => {
  loading.value = false;
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
};

const fetchTaskStatus = async ()=>{
  try {
    const response = await request({
      url: api.getTaskStatus,
      method: "post",
      data: {
        projectId: route.query.projectId,
        type: 'flow',
      },
    });
    const { task } = response
    if (
      task.status === "completed" ||
      task.status === "timeout" ||
      task.status === "failed"
    ) {
      stopPolling();
    }
    if (task.status === "completed") {
      fetchWorkflowDetail()
    }
  } catch (error) {
    
  }
}

// 获取工作流详情
const fetchWorkflowDetail = async () => {
  try {
    const response = await request({
      url: api.getWorkflowDetail,
      method: "post",
      data: {
        projectId: route.query.projectId,
      },
    });
    if (
      response.data.content.status === "done" ||
      response.data.content.status === "error"
    ) {
      stopPolling();
    }
    if (
      response.data.content.status === "error" ||
      (response.data.content.status === "done" &&
        !response.data.content.workflows.length)
    ) {
      prompt.value = response.data.prompt;
      showEmptyBtn.value = true;
      ElMessage({
        message: "项目生成失败，请重新生成",
        type: "error",
        duration: 5 * 1000,
      });
      return;
    } else {
      showEmptyBtn.value = false;
    }
    // 处理返回数据
    console.log("工作流详情:", response.data);
    projectName.value = response.data.content.projectName;
    prompt.value = response.data.prompt;
    // prompt.value = '发送到发送到发送到发的说法发送到发送到发送到发的说法发送到发送到发送到发的说法发送到发送到发送到发的说法发送到发送到发送到发的说法发送到发送到发送到发的说法发送到发送到发送到发的说法发送到发送到发送到发的说法发送到发送到发送到发的说法发送到发送到发送到发的说法'
    writeText.value = response.data.content.description;
    const importData = {
      pages: response.data.content.pages,
      workflows: response.data.content.workflows,
    };
    importFromWorkflowJSON(importData);
    // 获取计算过后的workflows数据
    const { workflows: fetchedWorkflows } = getWorkflow();
    workflows.value = fetchedWorkflows;
    // 在prompt赋值后检查是否需要显示展开按钮
    nextTick(() => {
      const el = promptElement.value;
      // 判断内容是否超过3行高度
      showPromptExpand.value = el.scrollHeight > el.clientHeight;
    });
  } catch (error) {
    console.error("获取工作流详情失败:", error);
    // 可以根据错误类型决定是否停止轮询
    stopPolling();
  }
};

// 判断功能点是否已连接
const isFunctionConnected = (nodeId, funcIndex) => {
  const anchorId = "func-" + funcIndex;
  return connections.value.some(
    (conn) => conn.from.nodeId === nodeId && conn.from.anchorId === anchorId
  );
};

// 通过按钮添加节点
const addNodeByButton = async (node) => {
  if (node) {
    // 在当前点击节点的右下位置创建节点
    const centerX = node.x + 350;
    const centerY = node.y + 100;
    await createNode(centerX, centerY);
  } else {
    // 在画布中心位置创建节点
    const canvasEl = canvas.value;
    const rect = canvasEl.getBoundingClientRect();
    const centerX = rect.width / 2 - 150 + Math.random() * 100 - 50; // 添加随机偏移避免重叠
    const centerY = rect.height / 2 - 150 + Math.random() * 100 - 50;
    await createNode(centerX, centerY);
  }
  // setTimeout(() => {
  //   fetchWorkflowDetail();
  // }, 500)
};

// 画布拖放处理
const onCanvasMouseDown = (event) => {
  // 如果按下空格键或者点击画布空白处，进入平移模式

  if (
    isSpacePressed.value ||
    (event.target === canvas.value && event.button === 0)
  ) {
    if (isSpacePressed.value) {
      isPanning.value = true;
      panStart.value = {
        x: event.clientX - translateX.value,
        y: event.clientY - translateY.value,
      };
      event.preventDefault();
      return;
    }
  }

  if (event.target === canvas.value) {
    deselectAll();
    // 取消所有节点的点击状态
    nodes.value.forEach((node) => {
      node.clicked = false;
    });
    // const hasEditingNode = nodes.value.some(
    //   (node) => node.editing || node.flowDescriptionEditing
    // );
    // console.log("--------77777", hasEditingNode);

    // if (hasEditingNode) {
    savePageDataImmediate();
    // }
  }
  // 取消所有节点的编辑状态
  nodes.value.forEach((node) => {
    node.editing = false;
    node.flowDescriptionEditing = false; // 退出流程描述编辑状态
    node.functions.forEach((func) => {
      func.editing = false;
    });
    // 更新节点高度
    updateNodeHeight(node);
  });
  // 检查是否有节点正在编辑
};

const onCanvasMouseMove = (event) => {
  // 如果正在平移画布
  if (isPanning.value) {
    translateX.value = event.clientX - panStart.value.x;
    translateY.value = event.clientY - panStart.value.y;
    return;
  }

  if (draggedNode.value && !connectingFrom.value) {
    // 只有在不处于连接模式时才允许拖拽节点
    const rect = canvas.value.getBoundingClientRect();
    // 考虑缩放和平移的坐标转换
    draggedNode.value.x =
      (event.clientX - rect.left - translateX.value) / scale.value -
      dragOffset.value.x;
    draggedNode.value.y =
      (event.clientY - rect.top - translateY.value) / scale.value -
      dragOffset.value.y;
    // 标记正在拖动
    isDragging.value = true;
  } else if (connectingFrom.value) {
    // 连接模式下更新临时连线位置
    const rect = canvas.value.getBoundingClientRect();
    // 考虑缩放和平移的坐标转换
    tempMousePos.value.x =
      (event.clientX - rect.left - translateX.value) / scale.value;
    tempMousePos.value.y =
      (event.clientY - rect.top - translateY.value) / scale.value;
  }
};

const onCanvasMouseUp = (event) => {
  // 停止平移
  if (isPanning.value) {
    isPanning.value = false;
    return;
  }

  if (draggedNode.value) {
    // 如果刚刚拖动了节点，触发保存（3秒防抖）
    if (isDragging.value) {
      savePageDataDebounced();
      isDragging.value = false;
    }
    draggedNode.value = null;
  } else if (connectingFrom.value) {
    connectingFrom.value = null;
    tempConnection.value = null;
  }
};

// 节点拖拽和选中
const onNodeMouseDown = (node, event) => {
  // 检查是否点击了连接点或其他交互元素
  const target = event.target;
  const tagName = target.tagName.toLowerCase();

  // 如果点击的是 circle（连接点）或在功能项上，不触发节点拖拽
  if (tagName === "circle" || target.classList.contains("node-anchor")) {
    return;
  }

  event.stopPropagation();

  // 取消所有节点的选中状态
  nodes.value.forEach((n) => (n.selected = false));
  connections.value.forEach((c) => (c.selected = false));

  // 切换节点的点击状态
  // 如果当前节点已经是点击状态，则取消点击
  // 否则，取消所有其他节点的点击状态，并设置当前节点为点击状态
  if (node.clicked) {
    node.clicked = false;
  } else {
    // 取消所有节点的点击状态
    nodes.value.forEach((n) => (n.clicked = false));
    // 设置当前节点为点击状态
    node.clicked = true;
  }
  draggedNode.value = node;
  const rect = canvas.value.getBoundingClientRect();
  // 考虑缩放和平移
  dragOffset.value.x =
    (event.clientX - rect.left - translateX.value) / scale.value - node.x;
  dragOffset.value.y =
    (event.clientY - rect.top - translateY.value) / scale.value - node.y;
};

// 画布滚轮缩放
const onCanvasWheel = (event) => {
  if (!event.ctrlKey) {
    return;
  }
  event.preventDefault();

  const rect = canvas.value.getBoundingClientRect();
  // 鼠标在画布中的位置
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // 缩放前鼠标指向的画布坐标
  const beforeX = (mouseX - translateX.value) / scale.value;
  const beforeY = (mouseY - translateY.value) / scale.value;

  // 缩放系数
  const delta = event.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.1, Math.min(3, scale.value * delta));

  // 缩放后鼠标指向的画布坐标
  const afterX = (mouseX - translateX.value) / newScale;
  const afterY = (mouseY - translateY.value) / newScale;

  // 调整平移，保持鼠标指向同一点
  translateX.value += (afterX - beforeX) * newScale;
  translateY.value += (afterY - beforeY) * newScale;
  scale.value = newScale;
};

// 放大
const zoomIn = (event) => {
  const newScale = Math.min(3, scale.value * 1.2);
  scale.value = newScale;
  // 移除按钮焦点,防止拖动时重复触发
  if (event && event.target) {
    event.target.blur();
  }
};

// 缩小
const zoomOut = (event) => {
  const newScale = Math.max(0.1, scale.value / 1.2);
  scale.value = newScale;
  // 移除按钮焦点,防止拖动时重复触发
  if (event && event.target) {
    event.target.blur();
  }
};

// 重置缩放
const resetZoom = (event) => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
  // 移除按钮焦点,防止拖动时重复触发
  if (event && event.target) {
    event.target.blur();
  }
};

// 连接点拖拽
const onAnchorMouseDown = (node, anchor, event) => {
  event.stopPropagation();
  // 阻止节点拖拽
  draggedNode.value = null;
  // 开始连接
  connectingFrom.value = { node, anchor };
  tempConnection.value = {
    from: { nodeId: node.pageId, anchorId: anchor.id },
  };
  const rect = canvas.value.getBoundingClientRect();
  // 考虑缩放和平移
  tempMousePos.value.x =
    (event.clientX - rect.left - translateX.value) / scale.value;
  tempMousePos.value.y =
    (event.clientY - rect.top - translateY.value) / scale.value;
};

// 连接点释放（创建连线）
const onAnchorMouseUp = (targetNode, targetAnchor, event) => {
  event.stopPropagation();
  if (
    connectingFrom.value &&
    targetNode.pageId !== connectingFrom.value.node.pageId
  ) {
    // 只允许从功能点连接到终点
    if (
      !connectingFrom.value.anchor.id.startsWith("func-") ||
      targetAnchor.id !== "target"
    ) {
      // 如果不是从功能点连接到终点，清除连接状态
      connectingFrom.value = null;
      tempConnection.value = null;
      return;
    }

    // 检查目标节点是否已有连接到其终点的线，如果有则删除旧连接
    const oldConnection = connections.value.find(
      (conn) =>
        conn.to.nodeId === targetNode.pageId && conn.to.anchorId === "target"
    );

    if (oldConnection) {
      // 删除旧连接
      connections.value = connections.value.filter((c) => c !== oldConnection);
    }

    // 创建新连线
    connections.value.push({
      from: {
        nodeId: connectingFrom.value.node.pageId,
        anchorId: connectingFrom.value.anchor.id,
      },
      to: { nodeId: targetNode.pageId, anchorId: targetAnchor.id },
      selected: false,
      deleteHovered: false,
    });
  }
  savePageDataImmediate();
  // 清除连接状态
  connectingFrom.value = null;
  tempConnection.value = null;
};

// 连接点悬停
const onAnchorHover = (anchor) => {
  // 可以在这里添加悬停效果
};

const onAnchorLeave = (anchor) => {
  // 可以在这里添加离开效果
};

// 获取连线路径
const getConnectionPath = (connection) => {
  const fromNode = nodes.value.find((n) => n.pageId === connection.from.nodeId);
  const toNode = nodes.value.find((n) => n.pageId === connection.to.nodeId);
  if (!fromNode || !toNode) return "";

  // 计算起点位置（功能点）
  let x1, y1;
  if (connection.from.anchorId.startsWith("func-")) {
    const index = parseInt(connection.from.anchorId.split("-")[1]);
    const descriptionHeight = 0;
    x1 = fromNode.x + fromNode.width + 5;
    y1 = fromNode.y + 150 + descriptionHeight + index * 40 + 20;
  } else {
    return "";
  }

  // 计算终点位置（左上角）
  let x2, y2;
  if (connection.to.anchorId === "target") {
    x2 = toNode.x - 5;
    y2 = toNode.y + 30;
  } else {
    return "";
  }

  const dx = Math.abs(x2 - x1) / 2;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
};

// 获取连线中点位置
const getConnectionMidPoint = (connection) => {
  const fromNode = nodes.value.find((n) => n.pageId === connection.from.nodeId);
  const toNode = nodes.value.find((n) => n.pageId === connection.to.nodeId);
  if (!fromNode || !toNode) return { x: 0, y: 0 }; // 计算起点位置（功能点）
  let x1, y1;
  if (connection.from.anchorId.startsWith("func-")) {
    const index = parseInt(connection.from.anchorId.split("-")[1]);
    const descriptionHeight = 0;
    x1 = fromNode.x + fromNode.width + 5;
    y1 = fromNode.y + 150 + descriptionHeight + index * 40 + 20;
  } else {
    return { x: 0, y: 0 };
  }

  // 计算终点位置（左上角）
  let x2, y2;
  if (connection.to.anchorId === "target") {
    x2 = toNode.x - 5;
    y2 = toNode.y + 30;
  } else {
    return { x: 0, y: 0 };
  }

  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
  };
};

// 获取临时连线路径
const getTempConnectionPath = () => {
  if (!connectingFrom.value) return "";
  const node = connectingFrom.value.node;
  const anchor = connectingFrom.value.anchor;
  const x1 = node.x + anchor.x;
  const y1 = node.y + anchor.y;
  const x2 = tempMousePos.value.x;
  const y2 = tempMousePos.value.y;
  const dx = Math.abs(x2 - x1) / 2;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
};

// 选中连线
const selectConnection = (connection, event) => {
  event.stopPropagation();
  deselectAll();
  connection.selected = true;
};

// 删除功能项
const deleteFunction = (node, funcIndex) => {
  // 检查该功能是否已连接
  if (isFunctionConnected(node.page_id, funcIndex)) {
    ElMessage.warning("该功能已连接，无法删除！请先删除相关连线。");
    return;
  }

  // 确认删除
  ElMessageBox.confirm(
    `确定要删除功能"${node.functions[funcIndex].name}"吗？`,
    "删除功能",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(() => {
      // 删除功能项
      node.functions.splice(funcIndex, 1);

      // 更新节点高度
      updateNodeHeight(node);

      // 更新连线索引（将大于删除索引的连接点索引减1）
      connections.value.forEach((conn) => {
        if (conn.from.nodeId === node.page_id) {
          const anchorId = conn.from.anchorId;
          if (anchorId.startsWith("func-")) {
            const index = parseInt(anchorId.split("-")[1]);
            if (index > funcIndex) {
              conn.from.anchorId = `func-${index - 1}`;
            }
          }
        }
      });

      ElMessage.success("删除成功！");

      // 保存数据
      savePageDataImmediate();
    })
    .catch(() => {
      ElMessage.info("已取消删除");
    });
};

// 删除节点
const deleteNode = (node) => {
  ElMessageBox.confirm(
    "你确定要删除该节点吗？删除节点也会删除对应的产品页面",
    "删除节点",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(() => {
      // 删除相关连线
      connections.value = connections.value.filter(
        (conn) =>
          conn.from.nodeId !== node.pageId && conn.to.nodeId !== node.pageId
      ); // 删除节点
      nodes.value = nodes.value.filter((n) => n.pageId !== node.pageId);
      ElMessage({
        type: "success",
        message: "删除成功!",
      });
      // 更新全选状态
      updateSelectAllState();

      // 保存数据
      savePageDataImmediate();
    })
    .catch(() => {
      ElMessage({
        type: "info",
        message: "已取消删除",
      });
    });
};

// 删除连线
const deleteConnection = (connection) => {
  connections.value = connections.value.filter((c) => c !== connection);
  // 保存数据
  savePageDataImmediate();
};

// 取消所有选中
const deselectAll = () => {
  nodes.value.forEach((n) => (n.selected = false));
  connections.value.forEach((c) => (c.selected = false));
};

// 创建新节点
const createNode = (x, y) => {
  const node = {
    pageId: `createPage_${Date.now()}`,
    type: "default",
    name: "新节点",
    description: "",
    x,
    y,
    width: 300,
    height: 200,
    selected: false,
    editing: false,
    toolsHovered: false,
    checked: false, // 添加勾选状态
    clicked: false, // 添加点击状态
    flowDescription: "流程名称", // 流程描述（仅根节点使用）- 设置默认值
    flowDescriptionChecked: false, // 流程描述勾选状态
    flowDescriptionEditing: false, // 流程描述编辑状态
    functions: [{ name: "功能", editing: false }],
    anchors: [],
    status: "pending",
    imgUrl: "",
  };

  // 如果状态是 done 或 generating，默认勾选
  if (node.status === "done" || node.status === "generating") {
    node.checked = true;
  }

  // 计算节点高度
  node.height = 150 + node.functions.length * 40 + (node.editing ? 50 : 0);

  // 不再需要手动设置 anchors，因为连接点是动态计算的
  nodes.value.push(node);

  // 更新全选状态
  updateSelectAllState();
  // 保存数据
  savePageDataImmediate();
};

// 添加功能
const addFunction = (node) => {
  if (!node.functions) {
    node.functions = [];
  }
  node.functions.push({
    name: "新功能",
    editing: true,
    targetPageId: "",
    navigationType: "",
  });
  // 更新节点高度
  updateNodeHeight(node);
};

// 更新节点高度
const updateNodeHeight = (node) => {
  const descriptionHeight = 0;
  const addButtonHeight = node.editing ? 50 : 0;
  const functionsLength = node.functions ? node.functions.length : 0;
  node.height =
    150 + descriptionHeight + functionsLength * 40 + addButtonHeight;
};

// 切换节点编辑状态
const toggleNodeEdit = (node) => {
  const wasEditing = node.editing;
  node.editing = !node.editing;
  console.log("000000000", wasEditing, node.editing);
  // 如果是从编辑状态退出，则保存数据
  if (wasEditing && !node.editing) {
    console.log("123123123");

    savePageDataImmediate();
  }

  // 更新节点高度
  updateNodeHeight(node);
};

// 切换节点勾选状态
const toggleNodeChecked = (node) => {
  node.checked = !node.checked;
};

// Element UI 勾选框变化事件
const onNodeCheckChange = (node) => {
  // 可以在这里添加额外的逻辑
  if (node.status === "done" || node.status === "generating") {
    node.checked = true;
    ElMessage.warning("已完成或生成中的页面不可取消勾选");
    return;
  }
  console.log(`节点 ${node.name} 勾选状态: ${node.checked}`);
  // 更新全选状态
  updateSelectAllState();
};

// 全选/取消全选节点
const onSelectAllChange = (checked) => {
  nodes.value.forEach((node) => {
    if (node.status !== "done" && node.status !== "generating") {
      node.checked = checked;
    }
  });
  const seenPageIds = new Set();
  const checkedNodes = nodes.value.reduce((result, node) => {
    // 只处理勾选且非完成/生成中的节点
    if (
      node.checked &&
      node.status !== "done" &&
      node.status !== "generating"
    ) {
      const pageId = getExportPageId(node);
      // 使用 Set 去重
      if (!seenPageIds.has(pageId)) {
        seenPageIds.add(pageId);
        result.push({
          ...node,
          pageId,
        });
      }
    }
    return result;
  }, []);
  ischeckedNodes.value = checkedNodes.length;
  console.log(`全选状态: ${checked}`);
};

// 更新全选复选框状态（根据当前节点勾选情况）
const updateSelectAllState = () => {
  if (nodes.value.length === 0) {
    selectAllNodes.value = false;
    return;
  }
  // 只统计非 done 和非 generating 状态的节点
  const enabledNodes = nodes.value.filter(
    (n) => n.status !== "done" && n.status !== "generating"
  );
  const seenPageIds = new Set();
  const checkedNodes = nodes.value.reduce((result, node) => {
    // 只处理勾选且非完成/生成中的节点
    if (
      node.checked &&
      node.status !== "done" &&
      node.status !== "generating"
    ) {
      const pageId = getExportPageId(node);
      // 使用 Set 去重
      if (!seenPageIds.has(pageId)) {
        seenPageIds.add(pageId);
        result.push({
          ...node,
          pageId,
        });
      }
    }
    return result;
  }, []);
  ischeckedNodes.value = checkedNodes.length;
  console.log("触发了勾选12312312", ischeckedNodes.value);

  if (enabledNodes.length === 0) {
    selectAllNodes.value = false;
    return;
  }
  const checkedCount = enabledNodes.filter((n) => n.checked).length;
  selectAllNodes.value = checkedCount === enabledNodes.length;
};

const generateAndSaveComponents = async ({
  pages,
  checkedNodes,
  workflows,
}) => {
  try {
    // 根据checkedNodes里的pageId，将pages数组中对应项的status改成'generating'
    // const checkedPageIds = checkedNodes.map((node) => node.pageId);
    const checkedPageIds = [];
    const checkedObj = {};

    checkedNodes.forEach((node) => {
      checkedPageIds.push(node.pageId);

      // 重新生成navigationList
      const newFuncs = [];
      node.functions.forEach((func) => {
        newFuncs.push({
          name: func.name || "",
          navigationId:
            func.originalNavigationId ||
            `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 新创建的功能点，生成新的 navigation_id
          navigationType: func.navigationType || "页面导航", // 新创建的功能点，默认都是页面导航
          targetPageId: func.targetPageId || "",
          trigger: func.trigger || "",
        });
      });
      node.navigationList = newFuncs;

      // 方便传给pages
      checkedObj[node.pageId] = node;
    });

    let newarr = pages.map((page) => {
      if (checkedPageIds.includes(page.pageId)) {
        return {
          ...page,
          status: "generating",
          navigationList: checkedObj[page.pageId].navigationList,
        };
      } else {
        return page;
      }
    });
    console.log("check", newarr, checkedNodes);

    const { target, projectId, resolution } = route.query;
    const response = await request({
      url: api.generateCode,
      method: "POST",
      data: {
        pages: newarr,
        target,
        projectId,
        resolution,
        workflows, // 告诉服务端全量替换
        checkedNodes, // 生成代码的页面
        model: model.value, // 添加模型参数
      },
    });
    // 跳转到产品页面
    router.push({
      path: "product",
      query: {
        projectId: projectId,
        resolution: resolution,
        target: target,
      },
    });
  } catch (error) {
    console.error("请求失败:", error);
  }
};

// 生成产品页面
const generateProductPages = () => {
  // 获取所有勾选的节点，并过滤掉 done 和 generating 状态的节点，同时去重
  const seenPageIds = new Set();
  const checkedNodes = nodes.value.reduce((result, node) => {
    // 只处理勾选且非完成/生成中的节点
    if (
      node.checked &&
      node.status !== "done" &&
      node.status !== "generating"
    ) {
      const pageId = getExportPageId(node);
      // 使用 Set 去重
      if (!seenPageIds.has(pageId)) {
        seenPageIds.add(pageId);
        result.push({
          ...node,
          pageId,
        });
      }
    }
    return result;
  }, []);
  try {
    loading.value = true;

    if (checkedNodes.length === 0) {
      ElMessage.warning("请先勾选需要生成产品页面的节点");
      return;
    }

    ElMessageBox.confirm(
      `您已勾选 ${checkedNodes.length} 个节点，确认要为这些节点生成产品页面吗？`,
      "生成产品页面",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      }
    ).then(() => {
      // TODO: 调用后端 API 生成产品页面
      const { pages, workflows } = getWorkflow();
      generateAndSaveComponents({
        pages,
        checkedNodes,
        workflows,
      });
    });
  } catch (error) {
    console.log(error);
    ElMessage.info("已取消生成");
  } finally {
    // 关闭 loading
    loading.value = false;
  }
};

// 复制节点
const copyNode = (node) => {
  const newNode = {
    pageId: `copyPage_${Date.now()}`,
    type: node.type,
    name: node.name + " (副本)",
    description: node.description,
    x: node.x + 50,
    y: node.y + 50,
    width: node.width,
    height: node.height,
    selected: false,
    editing: false,
    toolsHovered: false,
    checked: false, // 复制的节点默认不勾选
    clicked: false, // 复制的节点默认不点击
    flowDescription: node.flowDescription || "流程名称", // 复制流程描述
    flowDescriptionChecked: false, // 复制的节点流程描述默认不勾选
    flowDescriptionEditing: false, // 复制的节点流程描述编辑状态
    status: node.status || "",
    imgUrl: node.imgUrl || "",
    functions: node.functions.map((func) => ({
      name: func.name,
      editing: false,
    })),
    anchors: [],
  };

  // 如果状态是 done 或 generating，默认勾选
  if (newNode.status === "done" || newNode.status === "generating") {
    newNode.checked = true;
  }

  nodes.value.push(newNode);

  // 更新全选状态
  updateSelectAllState();
  savePageDataImmediate();
};

// 生成页面(单个)
const generatePage = (node) => {
  // 如果节点状态是 done 或 generating，不允许生成
  if (node.status === "done" || node.status === "generating") {
    ElMessage.warning("已完成或生成中的页面无需再次生成");
    return;
  }

  // 处理单个节点（单页生成不需要去重逻辑）
  const checkedNodes = [
    {
      ...node,
      pageId: getExportPageId(node),
    },
  ];
  try {
    loading.value = true;

    const { pages, workflows } = getWorkflow();
    generateAndSaveComponents({
      pages,
      checkedNodes,
      workflows,
    });
  } catch (error) {
    console.log(error);
  } finally {
    // 关闭 loading
    loading.value = false;
  }
};

// 查看页面
const viewPage = (node) => {
  const { target, projectId, resolution } = route.query;
  console.log("----------", target, projectId, resolution);
  const pageId = getExportPageId(node);
  router.push({
    path: "product",
    query: {
      projectId: projectId,
      resolution: resolution,
      target: target,
      pageId: pageId,
    },
  });
};

// 获取导出用的page_id（处理时间戳）
const getExportPageId = (node) => {
  const pageId = node.pageId;

  // 优先使用 original_page_id（如果存在，说明是从导入的JSON中来的）
  if (node.original_page_id) {
    return node.original_page_id;
  }

  // 如果没有 original_page_id，判断是否是新创建或复制的节点
  // createPage_ 和 copyPage_ 开头的节点，保持原样（包含时间戳）
  if (pageId.startsWith("createPage_") || pageId.startsWith("copyPage_")) {
    return pageId;
  }

  // 其他情况，保持原样
  return pageId;
};

// 导出流程JSON（按照指定格式）
const getWorkflow = () => {
  // 构建所有节点的基础信息（pages数组）- 先收集所有节点
  const navigationIdMap = new Map();
  const allPages = nodes.value.map((node) => {
    const navigationList = node.functions.map((func, index) => {
      const anchorId = `func-${index}`;
      const connection = connections.value.find(
        (conn) =>
          conn.from.nodeId === node.pageId && conn.from.anchorId === anchorId
      );

      // 查找目标页面
      // let targetPageId = "";
      // if (connection) {
      //   const targetNode = nodes.value.find(
      //     (n) => n.pageId === connection.to.nodeId
      //   );
      //   if (targetNode) {
      //     // 如果目标节点有original_page_id，使用它；否则使用page_id
      //     targetPageId = getExportPageId(targetNode);
      //   }
      // }

      // 生成随机字符串作为navigation_id
      // 使用原始的 navigation_id（如果存在），否则生成新的
      let navigationId;
      if (func.originalNavigationId) {
        // 从后端导入的节点，使用原始 navigation_id
        navigationId = func.originalNavigationId;
      } else {
        // 新创建的功能点，生成新的 navigation_id
        navigationId = `nav_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      }
      navigationIdMap.set(`${node.pageId}_${index}`, navigationId);

      return {
        navigationId: navigationId,
        name: func.name,
        trigger: func.name,
        targetPageId: func.targetPageId || "",
        navigationType: func.navigationType || "",
      };
    });

    // 使用original_page_id（如果存在）作为page_id
    // const originalPageId = node.original_page_id || node.pageId;
    const exportPageId = getExportPageId(node);
    return {
      pageId: exportPageId,
      name: node.name,
      description: node.description || "",
      navigationList: navigationList,
      status: node.status || "",
      imgUrl: node.imgUrl || "",
    };
  });

  // 对pages数组去重（按page_id）
  const pagesMap = new Map();
  allPages.forEach((page) => {
    if (!pagesMap.has(page.pageId)) {
      pagesMap.set(page.pageId, page);
    }
  });
  const pages = Array.from(pagesMap.values());

  // 构建工作流数组（每个工作流是一个独立的流程图）
  // 找出所有根节点（没有被任何连线指向的节点）
  const targetNodeIds = new Set(
    connections.value.map((conn) => conn.to.nodeId)
  );
  const rootNodes = nodes.value.filter(
    (node) => !targetNodeIds.has(node.pageId)
  ); // 递归构建流程树
  const buildWorkflowTree = (
    currentNode,
    parentNavigationId = "",
    visited = new Set()
  ) => {
    // 防止循环引用
    if (visited.has(currentNode.pageId)) {
      return null;
    }
    visited.add(currentNode.pageId);

    // 使用original_page_id（如果存在）作为导出的page_id
    const exportPageId = getExportPageId(currentNode);

    const workflowNode = {
      pageId: exportPageId,
      navigationId: parentNavigationId,
      position: { x: currentNode.x, y: currentNode.y },
      children: [],
    };

    // 查找从当前节点出发的所有连线
    currentNode.functions.forEach((func, index) => {
      const anchorId = `func-${index}`;
      const connection = connections.value.find(
        (conn) =>
          conn.from.nodeId === currentNode.pageId &&
          conn.from.anchorId === anchorId
      );

      if (connection) {
        const childNode = nodes.value.find(
          (n) => n.pageId === connection.to.nodeId
        );
        if (childNode) {
          // 从navigationIdMap中获取对应的navigation_id
          const navigationId = navigationIdMap.get(
            `${currentNode.pageId}_${index}`
          );
          const childWorkflowNode = buildWorkflowTree(
            childNode,
            navigationId,
            new Set(visited)
          );
          if (childWorkflowNode) {
            workflowNode.children.push(childWorkflowNode);
          }
        }
      }
    });

    return workflowNode;
  }; // 为每个根节点构建一个独立的工作流
  const workflows = rootNodes.map((rootNode, index) => {
    return {
      workflowId: `workflow_${index + 1}`,
      name: rootNode.flowDescription || `${rootNode.name}流程`,
      description:
        rootNode.flowDescription || `从${rootNode.name}开始的业务流程`,
      workflowTree: buildWorkflowTree(rootNode),
    };
  });

  // 如果没有根节点（所有节点都在循环中），使用第一个节点作为起点
  if (workflows.length === 0 && nodes.value.length > 0) {
    workflows.push({
      workflowId: "workflow_1",
      name: nodes.value[0].flowDescription || `${nodes.value[0].name}流程`,
      description: nodes.value[0].flowDescription || "主流程",
      workflowTree: buildWorkflowTree(nodes.value[0]),
    });
  }

  return {
    pages,
    workflows,
  };
};

const exportWorkflowJSON = () => {
  if (nodes.value.length === 0) {
    ElMessage.warning("当前画布为空，无法导出流程JSON");
    return;
  }
  try {
    const { workflows, pages } = getWorkflow();

    // 构建最终输出
    const output = {
      system_name: "系统名称待填写",
      pages: pages,
      workflows: workflows,
    };
  } catch (error) {
    ElMessage.error("导出失败：" + error.message);
    console.error("导出流程JSON失败：", error);
  }
};

// 从后端API加载流程JSON
// 从流程JSON格式导入并回显
const importFromWorkflowJSON = (data) => {
  // 清空现有数据
  nodes.value = [];
  connections.value = [];

  if (!data.pages || data.pages.length === 0) return;
  if (!data.workflows || data.workflows.length === 0) return;

  // 创建一个pages的映射，方便查找
  const pagesMap = new Map();
  data.pages.forEach((page) => {
    pagesMap.set(page.pageId, page);
  }); // 用于记录已创建的节点，避免重复创建
  const createdNodesMap = new Map(); // key: pageId, value: 实际渲染的节点对象

  // 用于记录navigationId到节点和功能索引的映射
  const navigationIdMap = new Map(); // key: navigationId, value: {node, funcIndex}

  // 布局配置
  const layoutConfig = {
    startX: 100, // 每个workflow起始X坐标
    startY: 100, // 第一个workflow起始Y坐标
    levelWidth: 450, // 每层之间的水平间距（增加以避免水平重叠）
    nodeHeight: 300, // 节点垂直间距（增加以避免垂直重叠）
    workflowGap: 350, // workflow之间的垂直间距（增加间距）
  };
  let currentWorkflowY = layoutConfig.startY; // 当前workflow的Y起始位置
  let workflowMaxY = layoutConfig.startY; // 当前workflow使用的最大Y坐标

  // 全局记录所有节点占用的坐标范围（包括所有workflow），避免任何节点重叠
  const globalNodePositions = []; // 数组元素: {x, y, width, height, minX, maxX, minY, maxY}

  // 检查位置是否与现有节点冲突（全局检测）
  const checkPositionConflict = (x, y, width = 300, height = 250) => {
    const padding = 30; // 节点之间的最小间距
    const proposedMinX = x - width / 2 - padding;
    const proposedMaxX = x + width / 2 + padding;
    const proposedMinY = y - height / 2 - padding;
    const proposedMaxY = y + height / 2 + padding;

    for (const pos of globalNodePositions) {
      // 检查矩形是否重叠（考虑padding）
      const xOverlap = !(proposedMaxX < pos.minX || proposedMinX > pos.maxX);
      const yOverlap = !(proposedMaxY < pos.minY || proposedMinY > pos.maxY);

      if (xOverlap && yOverlap) {
        return true; // 有冲突
      }
    }
    return false; // 无冲突
  };

  // 记录节点占用的坐标范围（全局记录）
  const recordNodePosition = (x, y, width = 300, height = 250) => {
    const padding = 30; // 保持一致的padding
    globalNodePositions.push({
      x,
      y,
      width,
      height,
      minX: x - width / 2 - padding,
      maxX: x + width / 2 + padding,
      minY: y - height / 2 - padding,
      maxY: y + height / 2 + padding,
    });
  }; // 递归遍历workflow树，创建节点和连线
  const traverseWorkflowTree = (
    treeNode,
    parentNavigationId = "",
    level = 0,
    parentY = 0,
    siblingIndex = 0,
    totalSiblings = 1
  ) => {
    const pageInfo = pagesMap.get(treeNode.pageId);
    if (!pageInfo) {
      console.warn(`找不到页面信息: ${treeNode.pageId}`);
      return null;
    }

    // 生成唯一的节点ID（因为同一个page可能在多个workflow中出现）
    const uniqueNodeId = `${treeNode.pageId}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`; // 确定节点位置
    let position = treeNode.position;
    if (
      !position ||
      typeof position.x === "undefined" ||
      typeof position.y === "undefined"
    ) {
      // 根据层级自动生成位置
      // X坐标：根据层级向右展开
      const x = layoutConfig.startX + level * layoutConfig.levelWidth;

      // Y坐标：根据父节点位置和兄弟节点数量计算
      let y;
      if (level === 0) {
        // 根节点使用当前workflow的Y位置
        y = currentWorkflowY;
      } else {
        // 子节点根据兄弟节点数量和索引计算偏移
        const totalHeight = totalSiblings * layoutConfig.nodeHeight;
        const offsetY = siblingIndex * layoutConfig.nodeHeight;
        y = parentY + offsetY - totalHeight / 2 + layoutConfig.nodeHeight / 2;
      }

      // 预估节点尺寸
      const estimatedWidth = 300;
      const estimatedHeight = 250;

      // 检查并避免与所有现有节点冲突（全局检测）
      let attemptCount = 0;
      while (
        checkPositionConflict(x, y, estimatedWidth, estimatedHeight) &&
        attemptCount < 50
      ) {
        // 如果有冲突，优先向下偏移，如果下方空间不足则向右偏移
        if (attemptCount < 30) {
          // 前30次尝试：向下偏移
          y += layoutConfig.nodeHeight * 0.4;
        } else {
          // 后20次尝试：向右偏移（同时重置Y坐标）
          const extraOffset = Math.floor((attemptCount - 30) / 10) + 1;
          const newX =
            layoutConfig.startX +
            (level + extraOffset * 0.5) * layoutConfig.levelWidth;
          if (attemptCount === 30) {
            // 第一次向右偏移时，重置Y坐标
            y = parentY + siblingIndex * layoutConfig.nodeHeight * 0.5;
          }
        }
        attemptCount++;
      }

      // 如果尝试多次后仍有冲突，强制分配一个位置（向下大幅偏移）
      if (attemptCount >= 50) {
        console.warn(`节点 ${treeNode.pageId} 无法找到无冲突位置，强制放置`);
        y += layoutConfig.nodeHeight * 2;
      }

      position = { x, y };
    } else {
      // 如果有预设位置，检查是否冲突
      let x =
        treeNode.position.x !== undefined
          ? treeNode.position.x
          : layoutConfig.startX + level * layoutConfig.levelWidth;
      let y =
        treeNode.position.y !== undefined
          ? treeNode.position.y
          : currentWorkflowY;

      const estimatedWidth = 300;
      const estimatedHeight = 250;

      // 如果预设位置有冲突，尝试调整
      let attemptCount = 0;
      while (
        checkPositionConflict(x, y, estimatedWidth, estimatedHeight) &&
        attemptCount < 30
      ) {
        y += layoutConfig.nodeHeight * 0.4;
        attemptCount++;
      }

      position = { x, y };
    } // 创建节点
    const node = {
      pageId: uniqueNodeId, // 使用唯一ID作为实际渲染的节点ID
      original_page_id: treeNode.pageId, // 保存原始pageId用于查找连接
      type: "default",
      name: pageInfo.name,
      description: pageInfo.description || "",
      x: position.x,
      y: position.y,
      width: 300,
      height: 200,
      selected: false,
      editing: false,
      toolsHovered: false,
      checked: false,
      clicked: false,
      flowDescription: "流程名称", // 流程描述（仅根节点使用）
      flowDescriptionChecked: false, // 流程描述勾选状态
      flowDescriptionEditing: false,
      functions: pageInfo.navigationList.map((nav) => ({
        name: nav.name,
        editing: false,
        originalNavigationId: nav.navigationId, // 保存原始 navigationId
        navigationType: nav.navigationType,
        targetPageId: nav.targetPageId,
        trigger: nav.trigger,
      })),
      anchors: [],
      status: pageInfo.status || "", // 从后端数据读取页面状态参数
      imgUrl: pageInfo.imgUrl || "", // 从后端数据读取图片URL参数
    };

    // 如果状态是 done 或 generating，默认勾选
    if (node.status === "done" || node.status === "generating") {
      node.checked = true;
    }

    updateNodeHeight(node);
    nodes.value.push(node);
    createdNodesMap.set(treeNode.pageId, node);

    // 记录该节点占用的全局坐标范围（使用实际高度和宽度）
    recordNodePosition(position.x, position.y, node.width, node.height);

    // 更新workflow使用的最大Y坐标
    const nodeBottomY = position.y + node.height / 2;
    if (nodeBottomY > workflowMaxY) {
      workflowMaxY = nodeBottomY;
    }

    // 建立navigationId到节点和功能索引的映射
    pageInfo.navigationList.forEach((nav, index) => {
      if (nav.navigationId) {
        navigationIdMap.set(nav.navigationId, {
          node: node,
          funcIndex: index,
        });
      }
    });

    // 如果有父节点的navigationId，创建连线
    if (parentNavigationId) {
      // 通过navigationIdMap查找父节点和功能索引
      const parentInfo = navigationIdMap.get(parentNavigationId);
      if (parentInfo) {
        connections.value.push({
          from: {
            nodeId: parentInfo.node.pageId,
            anchorId: `func-${parentInfo.funcIndex}`,
          },
          to: {
            nodeId: node.pageId,
            anchorId: "target",
          },
          selected: false,
          deleteHovered: false,
        });
      }
    } // 递归处理子节点
    if (treeNode.children && treeNode.children.length > 0) {
      const childrenCount = treeNode.children.length;
      treeNode.children.forEach((child, index) => {
        traverseWorkflowTree(
          child,
          child.navigationId,
          level + 1,
          position.y,
          index,
          childrenCount
        );
      });
    }

    // 返回创建的节点（用于根节点设置flowDescription）
    return node;
  }; // 遍历所有workflow，渲染节点
  data.workflows.forEach((workflow, workflowIndex) => {
    if (workflow.workflowTree) {
      // 重置创建节点映射（每个workflow独立）
      createdNodesMap.clear();

      // 注意：不再清空 globalNodePositions，保持全局冲突检测

      // 为每个workflow设置起始Y坐标
      if (workflowIndex > 0) {
        // 计算所有已存在节点的最低Y坐标（考虑节点高度）
        const minYBelowAllNodes = globalNodePositions.reduce((maxY, pos) => {
          return Math.max(maxY, pos.maxY);
        }, layoutConfig.startY);

        // 新流程的根节点起始Y坐标应该在所有现有节点的最低点之下
        currentWorkflowY = minYBelowAllNodes + layoutConfig.workflowGap;
      }

      // 重置当前workflow的最大Y坐标
      workflowMaxY = currentWorkflowY; // 遍历workflow树并设置根节点的flowDescription
      const rootNode = traverseWorkflowTree(
        workflow.workflowTree,
        "",
        0,
        currentWorkflowY,
        0,
        1
      );

      // 为根节点设置流程描述（优先使用description，其次name，如果都为空则使用根节点名称）
      if (rootNode) {
        // 优先使用 workflow.description，如果为空则使用 workflow.name，如果还为空则使用根节点的name
        rootNode.flowDescription = workflow.name || rootNode.name || "流程";
        rootNode.flowDescriptionChecked = false; // 默认不勾选
      }
    }
  }); // 更新全选状态
  updateSelectAllState();
};

// 键盘按下事件
const handleKeyDown = (event) => {
  if (event.code === "Space" && !isSpacePressed.value) {
    isSpacePressed.value = true;
    event.preventDefault();
  }
};

// 键盘松开事件
const handleKeyUp = (event) => {
  if (event.code === "Space") {
    isSpacePressed.value = false;
    isPanning.value = false;
  }
};

// 选择工作流并定位到对应节点
const selectWorkflow = (node) => {
  // 清空编辑中的工作流
  editingWorkflow.value = null;

  // 设置选中的工作流
  selectedWorkflow.value = node;

  // 将工作流所在节点平移到画布左上角100,100位置
  if (node.x && node.y) {
    // 考虑当前缩放因子，计算正确的平移量
    translateX.value = 100 - node.x * scale.value;
    translateY.value = 100 - node.y * scale.value;
  }
};

// 切换prompt展开/收起状态
const togglePromptExpand = () => {
  isPromptCollapsed.value = !isPromptCollapsed.value;
};

// 切换侧边栏工作流导航显示状态
const toggleSideNav = () => {
  isListCollapsed.value = !isListCollapsed.value;
};

// 点击编辑工作流
const editWorkflow = (node) => {
  editingWorkflow.value = node;
};

// 点击删除工作流
const deleteWorkflow = (node) => {
  ElMessageBox.confirm("删除后无法恢复, 是否继续?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    const { workflows } = getWorkflow();
    const index = workflows.findIndex(
      (item) => item.name === node.flowDescription
    );

    workflows.splice(index, 1);
    await savePageData(workflows);
    setTimeout(() => {
      fetchWorkflowDetail();
    }, 500);
  });
};
</script>

<style lang="scss" scoped>
.tool-btn-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tool-btn-disabled:hover .tool-btn-hover {
  fill: transparent !important;
}
.empty-state-btn {
  position: fixed;
  top: 75px;
  right: 435px;
}
/* 最外层包装器 - 使用 flex 布局 */
.flowchart-wrapper {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  flex-direction: column;
}
.flowchart-inner {
  display: flex;
  width: 100%;
  height: calc(100vh - 56px);
  overflow: hidden;
}

/* 左侧画布容器 - 占据剩余空间 */
.flowchart-container {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: hidden;
}

/* lodiang */
.flowchart-loading {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
/* SVG 画布 */
.flowchart-canvas {
  width: 100%;
  height: 100%;
  background-image: url("@/assets/images/back.svg");
  background-color: #f6f8f9;
  cursor: default;
}

/* 平移模式光标 */
.flowchart-canvas.is-panning {
  cursor: grab;
}

.flowchart-canvas.is-panning:active {
  cursor: grabbing;
}

/* 缩放控制工具栏 */
.zoom-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #595959;
  transition: all 0.2s;
  padding: 0;
}

.zoom-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #e6f7ff;
}

.zoom-btn:active {
  transform: scale(0.95);
}

.zoom-btn-reset {
  font-size: 20px;
}

.zoom-display {
  min-width: 50px;
  text-align: center;
  font-size: 14px;
  color: #595959;
  font-weight: 500;
  padding: 0 4px;
}

/* 节点边框 */
.node-border {
  fill: white;
  /* stroke: #e8e8e8;
  stroke-width: 1; */
  cursor: move;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08));
}

.node-selected .node-border {
  stroke: #1890ff !important;
  stroke-width: 2 !important;
  filter: drop-shadow(0 4px 16px rgba(24, 144, 255, 0.25));
}

/* 节点点击状态样式 */
.node-clicked .node-border {
  stroke: rgba(53, 138, 255, 1) !important;
  stroke-width: 2 !important;
  filter: drop-shadow(0 2px 10px rgba(53, 138, 255, 0.3)) !important;
}

/* 确保点击状态的边框显示 */
.node-border.node-clicked {
  stroke: rgba(53, 138, 255, 1) !important;
  stroke-width: 2 !important;
  filter: drop-shadow(0 2px 10px rgba(53, 138, 255, 0.3)) !important;
}

.node-header {
  fill: #e7f4ff;
  cursor: move;
  transition: fill 0.2s ease;
}

.node-header-checked {
  fill: #cde8fe;
}

.node-header-bottom {
  fill: #e7f4ff;
  transition: fill 0.2s ease;
}

.node-header-bottom-checked {
  fill: #cde8fe;
}

/* 描述区域样式 */
.description-area {
  fill: white;
  transition: fill 0.2s ease;
}

.description-area-checked {
  fill: #e7f4ff;
}

/* 节点外工具按钮 */
.node-tools {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  pointer-events: none;
}

.node-group:hover .node-tools,
.node-tools:hover {
  opacity: 1;
  pointer-events: auto;
}

/* 统一工具栏背景 */
.toolbar-bg,
.toolbar-bg-bottom {
  transition: fill 0.2s;
}

.node-tools:hover .toolbar-bg,
.node-tools:hover .toolbar-bg-bottom {
  fill: #2673d9;
}

/* 工具按钮 */
.tool-btn {
  cursor: pointer;
}

.tool-btn-hover {
  transition: fill 0.2s;
}

.tool-btn:hover .tool-btn-hover {
  fill: rgba(255, 255, 255, 0.15);
}

.function-item {
  cursor: pointer;
  transition: fill 0.15s ease;
}

.function-item:hover {
  fill: #f5f5f5;
}

.function-item-checked {
  fill: #e7f4ff;
}

.function-item-checked:hover {
  fill: #d6ebff;
}

.add-function-btn {
  cursor: pointer;
}

.add-btn-bg {
  transition: fill 0.15s ease;
}

.add-function-btn:hover .add-btn-bg {
  fill: #f5f5f5;
}

.add-btn-bg-checked {
  fill: #e7f4ff;
}

.add-function-btn:hover .add-btn-bg-checked {
  fill: #d6ebff;
}

.add-function-btn:hover text {
  fill: #40a9ff;
}

/* 连接点样式 */
.node-anchor {
  cursor: crosshair;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: all;
  z-index: 100;
}

.node-group:hover .node-anchor,
.node-clicked .node-anchor {
  opacity: 1;
  pointer-events: all;
}

.node-anchor:hover {
  filter: brightness(1.2);
}

/* 突出显示的连接点 - 当节点被选中时，显示并放大其连接的目标节点的连接点 */
.node-anchor.anchor-highlighted {
  opacity: 1 !important;
  stroke-width: 3;
  filter: drop-shadow(0 0 8px rgba(82, 196, 26, 0.8));
  animation: highlight-pulse 1.5s infinite;
}

@keyframes highlight-pulse {
  0%,
  100% {
    filter: drop-shadow(0 0 8px rgba(82, 196, 26, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(82, 196, 26, 1));
  }
}

.node-anchor.anchor-active {
  opacity: 1;
  animation: anchor-pulse 1s infinite;
}

@keyframes anchor-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 终点样式（左上角） */
.target-anchor {
  fill: #358aff;
  stroke: white;
  stroke-width: 2;
}

.target-anchor:hover {
  fill: #40a9ff;
}

/* 流程描述样式 */
.flow-description-bg {
  transition: all 0.2s ease;
}

.flow-description-bg:hover {
  fill: #d4efff;
  stroke: #69c0ff;
}

/* 连线样式 */
.connection-line {
  fill: none;
  stroke: #666;
  stroke-width: 2;
  cursor: pointer;
  transition: stroke 0.2s;
}

.connection-line:hover {
  stroke: #1890ff;
  stroke-width: 3;
}

.connection-selected {
  stroke: #ff4d4f;
  stroke-width: 3;
}

/* 节点被点击时，相关连线高亮 */
.connection-highlighted {
  stroke: #358aff !important;
  stroke-width: 3;
}

.temp-connection-line {
  fill: none;
  stroke: #1890ff;
  stroke-width: 2;
  stroke-dasharray: 5, 5;
  pointer-events: none;
}

/* 删除按钮 */
.delete-btn {
  cursor: pointer;
  transition: transform 0.2s;
}

.delete-btn:hover {
  transform: scale(1.2);
}

/* 连线删除按钮 */
.connection-delete-btn {
  cursor: pointer;
}

.connection-delete-btn circle {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: all 0.2s;
}

/* 工具栏样式 - 右侧固定宽度 */
.node-toolbar {
  display: flex;
  flex-direction: column;
  width: 370px;
  flex-shrink: 0;
  background: white;
  border-left: 1px solid #d9d9d9;
  height: calc(100vh - 56px);
}

/* 添加节点按钮 */
.btn-add-node {
  width: 100%;
  padding: 15px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.btn-add-node:hover {
  background: #40a9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

.btn-add-node:active {
  transform: translateY(0);
}

/* 文本显示区域 */
.text-display-area {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.text-content {
  margin-top: 12px;
  font-size: 14px;
  color: #1f2b44;
  line-height: 1.8;
}

.text-content::-webkit-scrollbar {
  width: 6px;
}

.text-content::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}

.text-content::-webkit-scrollbar-thumb {
  background: #bfbfbf;
  border-radius: 3px;
}

.text-content::-webkit-scrollbar-thumb:hover {
  background: #8c8c8c;
}

.text-content p {
  margin: 8px 0;
  word-wrap: break-word;
}

/* 文本提示折叠样式 */
.text-prompt-container {
  position: relative;
}

.text-prompt {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  color: #1f2b44;
  line-height: 1.5;
}
.text-prompt:not(.text-prompt-collapsed) {
  -webkit-line-clamp: unset;
  display: block;
}

.text-prompt-expand {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: #358aff;
  font-size: 14px;
  cursor: pointer;
}

.expand-icon {
  margin-left: 4px;
  font-size: 12px;
}

/* 底部生成区域 */
.select-bottom {
  padding: 0 16px 16px;
  border-top: 1px solid #e8e8e8;
  .text-tip {
    margin-top: 12px;
    font-size: 14px;
    color: #000000;
    font-weight: 400;
    line-height: 1.6;
    text-align: left;
  }

  .text-tip i {
    font-size: 14px;
    margin-top: 2px;
    flex-shrink: 0;
    color: #000000;
  }
}

/* 全选复选框 */
.select-all-wrapper {
  padding: 12px 0;
}

.select-all-wrapper .el-checkbox {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

/* 表单标签 */
.form-label {
  margin-bottom: 10px;
  font-size: 12px;
}

/* 生成产品页面按钮 */
.btn-generate-pages {
  width: 100%;
  margin-top: 16px;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background-image: linear-gradient(90deg, #426fff 0%, #a054ff 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(66, 111, 255, 0.3);
}

.btn-generate-pages:hover {
  box-shadow: 0 4px 12px rgba(66, 111, 255, 0.5);
  transform: translateY(-2px);
}

.btn-generate-pages:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(66, 111, 255, 0.3);
}

.btn-generate-pages:disabled {
  background-image: linear-gradient(90deg, #d9d9d9 0%, #d9d9d9 100%);
  cursor: not-allowed;
  box-shadow: none;
}

/* 工作流导航 */
.flowchart-nav {
  margin-top: 16px;
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 46px;
    padding: 0 12px;
    margin-top: 8px;
    border-radius: 8px;
    background: #f2f5f6;
    cursor: pointer;
    span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    &:hover {
      background: #e7f4ff;
    }
    &.select {
      background: #358aff;
      color: #fff;
    }
  }
}

/* 提示信息 */
.tips {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-size: 12px;
  max-width: 300px;
}

.tips p {
  margin: 5px 0;
}

/* 操作按钮样式 */
.action-buttons {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  max-width: 600px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-secondary {
  background: #52c41a;
  color: white;
}

.btn-secondary:hover {
  background: #73d13d;
}

.flowchart-edit {
  width: 370px;
  flex-shrink: 0;
  background: white;
  border-left: 1px solid #d9d9d9;
  overflow-y: auto;
  height: calc(100vh - 56px);
  .breadcrumb {
    padding-left: 16px;
    line-height: 42px;
    border-bottom: 1px solid #efefef;
    color: #999;

    .breadcrumb-separator {
      margin: 0 8px;
    }

    .breadcrumb-current {
      color: #1f1f1f;
      font-weight: 700;
    }
  }
  .edit-info {
    padding: 0 16px;
  }
  .input-group {
    display: flex;
    flex-direction: column;
    margin-top: 16px;

    .form-label {
      margin-bottom: 10px;
      font-size: 12px;
    }

    .input-field {
      border: 1px solid rgba(230, 230, 230, 1);
      border-radius: 4px;
      padding: 12px 16px;
      outline: none;
    }

    .textarea-field {
      border: 1px solid rgba(230, 230, 230, 1);
      border-radius: 4px;
      padding: 12px 16px;
      min-height: 200px;
      white-space: pre-wrap;
      outline: none;
    }
  }
  .action-button {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 36px;
    margin: 0 16px;
    border-radius: 8px;
    font-size: 14px;
    color: #fff;
    background: linear-gradient(90deg, #426fff 0%, #a054ff 100%);
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      background: linear-gradient(90deg, #5b5bff 0%, #b35bff 100%);
      box-shadow: 0 4px 12px rgba(123, 97, 255, 0.3);
    }

    img {
      width: 16px;
      height: 16px;
      margin-right: 8px;
    }
  }

  .edit-feature {
    padding: 24px 16px 0;
    li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 36px;
      padding: 0 12px;
      margin-top: 8px;
      border: 1px solid rgba(230, 230, 230, 1);
      border-radius: 4px;
      input {
        flex: 1;
        outline: none;
        &:disabled {
          background: #fff;
        }
      }
      i {
        cursor: pointer;
      }
    }
    .edit-add {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 36px;
      margin-top: 8px;
      border: 1px solid rgba(230, 230, 230, 1);
      border-radius: 4px;
      color: #358aff;
      cursor: pointer;
      i {
        color: #358aff;
        margin-right: 2px;
      }
    }
  }
}

/* Element UI 组件在 SVG 中的样式调整 */
foreignObject .el-checkbox {
  display: flex;
  align-items: center;
  height: 100%;
}

foreignObject .el-checkbox__input {
  line-height: 1;
}

foreignObject .el-input__inner {
  font-size: 16px;
  height: 32px;
  line-height: 32px;
}

foreignObject .el-textarea__inner {
  font-size: 12px;
  padding: 8px;
}

foreignObject .el-input--small .el-input__inner {
  height: 28px;
  line-height: 28px;
  font-size: 13px;
}

/* 功能点输入框 - 去除边框 */
.function-item .el-input__inner {
  border: none !important;
  padding: 0;
  background: transparent;
}

.function-item .el-input__inner:focus {
  border: none !important;
  box-shadow: none !important;
}

/* 左侧悬浮的工作流导航 */
.flowchart-sidenav {
  position: fixed;
  top: calc(50% - 56px);
  transform: translateY(-50%);
  z-index: 1;
  width: 236px;
  background: #fff;
  box-sizing: border-box;
  transition: width 0.3s ease;
  &.collapsed {
    width: 0;
  }
}
.flowchart-sidenav-inner {
  padding: 8px;
  box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.1);
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 38px;
    padding: 0 12px;
    border-radius: 4px;
    cursor: pointer;
    &:first-child {
      margin-top: 0;
    }
    &:hover {
      background: #e7f4ff;
    }
    &.select {
      background: #358aff;
      color: #fff;
      div i {
        color: #fff;
      }
    }
    span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    div {
      display: flex;
      align-items: center;
      i {
        color: #999;
      }
    }
  }
}
.flowchart-sidenav-add {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 38px;
  margin-top: 8px;
  background: #fff;
  color: #358aff;
  border: 1px solid #358aff;
  border-radius: 4px;
  cursor: pointer;
  i {
    margin-right: 2px;
  }
}
.flowchart-sidenav-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  right: -14px;
  // left: 306px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 100px;
  border-radius: 0 10px 10px 0;
  background: #fff;
  cursor: pointer;
}
</style>
