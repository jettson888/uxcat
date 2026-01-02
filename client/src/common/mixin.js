import html2canvas from 'html2canvas';
import MessageUtils from '@/common/utils.js';

export default {
	mounted() {
		// 通过路由meta信息判断是否为dynamic目录下的组件
		// 只有dynamic路由才进行截图
		const isDynamicRoute = this.$route.meta && this.$route.meta.dynamic;
		
		if (isDynamicRoute) {
			const path = this.$route.path;

			this.$nextTick(() => {
				this.captureAndSendScreenshot(path.split('/')[1]);
			})
		}
	},
	methods: {
		async captureAndSendScreenshot(pageId) {
			console.log('进入页面截图方法');
			try {
				// 使用 html2canvas 截取整个页面
				const canvas = await html2canvas(document.body, {
					useCORS: true,
					allowTaint: true,
					scale: 1,
					backgroundColor: '#fff'
				});

				// 将 canvas 转换为 base64 图片数据
				const imageData = canvas.toDataURL('image/jpeg', 0.5);

				// 使用公共方法发送截图数据到父页面
				const screenshotData = {
					imgUrl: imageData,
					pageId: pageId,
				};
				MessageUtils.sendMessage('PAGE_SCREENSHOT', screenshotData);
			} catch (error) {
				console.error('页面截图失败:', error);
			}
		},
	}
};
