// utils/confirm.js
import { ElMessageBox } from 'element-plus'

export async function confirmAction(message, title = '提示') {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: '离开',
      cancelButtonText: '取消',
      type: 'warning',
    });
    return true; // 用户确认
  } catch (error) {
    return false; // 用户取消
  }
}