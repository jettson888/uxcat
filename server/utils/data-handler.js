function generateCategoryList(workflows) {
  const globalVisited = new Set(); // 全局记录已出现的 pageId
  const result = workflows
    .map((workflow) => {
      const currentFlowPages = [];
      const localVisited = new Set(); // 当前流程内的去重

      // 递归遍历 workflowTree
      function traverse(node) {
        const isNewGlobally = !globalVisited.has(node.pageId);
        const isNewLocally = !localVisited.has(node.pageId);

        if (isNewGlobally && isNewLocally) {
          currentFlowPages.push({
            pageId: node.pageId,
            navigationId: node.navigationId || "",
            position: node.position || {},
          });
          globalVisited.add(node.pageId);
          localVisited.add(node.pageId);
        }

        if (node.children) {
          node.children.forEach((child) => traverse(child));
        }
      }

      traverse(workflow.workflowTree);
      return { title: workflow.name, list: currentFlowPages };
    })
    .filter((flow) => flow.list.length > 0); // 只保留有页面的流程

  return result;
}


function enhanceCategoryListWithPageData(categoryList, contentData) {
  return categoryList.map((flow) => {
    const enhancedList = flow.list.map((page) => {
      // 在 pages 数组中查找匹配的页面数据
      const fullPageData = contentData.pages.find(
        (p) => p.pageId === page.pageId
      );

      // 合并 page 的基础数据 (pageId, navigationId, position) 和 pages 里的完整数据
      return {
        ...page, // 原始数据 (pageId, navigationId, position)
        ...fullPageData, // 覆盖/扩展所有 pages 中的属性
      };
    });

    return {
      title: flow.title,
      list: enhancedList,
    };
  });
}

module.exports = {
  generateCategoryList,
  enhanceCategoryListWithPageData
}