const ElCol = {
  name: "单列布局",
  className: "ElCol",
  componentName: "ElCol",
  appendPosition: "after",
  isWrapComponent: true,
  needBorder: true,
  properties: [
    {
      name: "栅格数",
      attr: "span",
      type: "input",
      value: 4,
      placeholder: "请输入此列的栅格数",
      inline: true
    },
    {
      name: "高度",
      attr: "height",
      type: "input-select",
      value: "100",
      unitOptions: ["px", "%", "vh"],
      unitValue: "%",
      placeholder: "高度",
      inline: true
    },
    {
      name: "主轴方向",
      attr: "flexDirection",
      type: "select",
      isLabelValue: true,
      value: "column",
      options: [
        {
          label: "水平左到右",
          value: "row"
        },
        {
          label: "水平右到左",
          value: "row-reverse"
        },
        {
          label: "垂直上到下",
          value: "column"
        },
        {
          label: "垂直下到上",
          value: "column-reverse"
        }
      ],
      placeholder: "请选择主轴方向",
      inline: true
    },
    {
      name: "主轴对齐方式",
      attr: "justifyContent",
      type: "select",
      isLabelValue: true,
      value: "flex-start",
      options: [
        {
          label: "首对齐",
          value: "flex-start"
        },
        {
          label: "居中",
          value: "center"
        },
        {
          label: "尾对齐",
          value: "flex-end"
        },
        {
          label: "间隔分散",
          value: "space-between"
        },
        {
          label: "均匀分散",
          value: "space-around"
        }
      ],
      placeholder: "请选择水平对齐方式",
      inline: true
    },
    {
      name: "次轴对齐方式",
      attr: "alignItems",
      type: "select",
      isLabelValue: true,
      value: "center",
      options: [
        {
          label: "拉伸填充",
          value: "stretch"
        },
        {
          label: "首对齐",
          value: "flex-start"
        },
        {
          label: "居中",
          value: "center"
        },
        {
          label: "尾对齐",
          value: "flex-end"
        },
        {
          label: "基线对齐",
          value: "baseline"
        }
      ],
      placeholder: "请选择水平对齐方式",
      inline: true
    },
    {
      name: "背景色",
      attr: "bgcolor",
      type: "color-picker",
      value: "#FFFFFF",
      inline: true
    },
    {
      name: "文字颜色",
      attr: "fontColor",
      type: "color-picker",
      value: "",
      inline: true
    },
    {
      name: "边框",
      attr: "border",
      value: "",
      hidden: true,
      inline: true
    },
    {
      name: "圆角",
      attr: "borderRadius",
      value: "0px",
      hidden: true,
      inline: true
    },
  ],
  // styles: {
  //   marginTop: "0px",
  //   marginBottom: "0px",
  //   marginLeft: "0px",
  //   marginRight: "0px",
  //   paddingTop: "20px",
  //   paddingBottom: "20px",
  //   paddingLeft: "20px",
  //   paddingRight: "20px"
  // },
  render: function (component, type = "render", hasChild = false) {
    const componentId = component.componentId
    let template = type === "render" ? `<el-col data-componentId="${componentId}" data-role-general-layout="${componentId}" ` : `<el-col `
    template += `  
      ${getItemValue(type, 'span', component)}
      style="display:flex;flex-wrap:wrap" 
      :style="{borderRadius:${getItemValue(type, 'borderRadius', component, 'value', true)},border:${getItemValue(type, 'border', component, 'value', true)},color:${getItemValue(type, 'fontColor', component, 'value', true)},backgroundColor:${getItemValue(type, 'bgcolor', component, 'value', true)},flexDirection:${getItemValue(type, 'flexDirection', component, 'value', true)},alignItems:${getItemValue(type, 'alignItems', component, 'value', true)},justifyContent:${getItemValue(type, 'justifyContent', component, 'value', true)},height:${getItemValue(type, 'height', component, 'value', true)}}"
    >`
    template += type === "render" ? `<div class="grid-content line">` : `<div class="grid-content">`
    template += `${hasChild ? "{{childSlot}}" : ""}
      </div> 
    </el-col>`
    return template
  },
  toJSON() {
    return { ...this, render: this.render.toString() }
  }
}

export default JSON.stringify(ElCol)
