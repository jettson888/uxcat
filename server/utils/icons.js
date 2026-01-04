const { HZB_ICONS } = require('../prompts/icons.js');


/**
* 过滤存在的图标
* @param {Array} iconList - 图标列表
* @returns {Array} 过滤后的图标列表
*/
function filterHzbValidIcons(iconList) {
  return iconList.filter((icon) => HZB_ICONS.includes(icon));
}

module.exports = {
  filterHzbValidIcons
}