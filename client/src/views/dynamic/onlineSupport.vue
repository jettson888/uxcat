<template>
  <div class="online-support-page">
    <!-- 公共导航组件 -->
    <GlobalNavigation />

    <!-- 页面主体内容 -->
    <div class="page-container">
      <!-- 返回按钮区域 -->
      <div class="back-section">
        <hzb-button type="text" @click="goBack" class="back-button">
          <i class="iconfont hzb-icon-back"></i>
          返回客户服务
        </hzb-button>
      </div>

      <!-- 聊天窗口容器 -->
      <div class="chat-container">
        <!-- 聊天记录展示区 -->
        <div class="chat-history" ref="chatHistory">
          <div 
            v-for="(message, index) in chatMessages" 
            :key="index"
            :class="['message-item', message.sender === 'user' ? 'user-message' : 'service-message']"
          >
            <div class="message-content">
              <div class="avatar-wrapper">
                <img 
                  :src="message.sender === 'user' ? userAvatar : serviceAvatar" 
                  :alt="message.sender === 'user' ? '用户头像' : '客服头像'"
                  class="avatar"
                />
              </div>
              <div class="message-text">
                <!-- 文字消息 -->
                <div v-if="message.type === 'text'" class="text-message">
                  {{ message.content }}
                </div>
                
                <!-- 图片消息 -->
                <div v-else-if="message.type === 'image'" class="image-message">
                  <img :src="message.content" alt="图片消息" class="message-image" />
                </div>
                
                <!-- 文件消息 -->
                <div v-else-if="message.type === 'file'" class="file-message">
                  <div class="file-info">
                    <i class="iconfont hzb-icon-document-checked file-icon"></i>
                    <div class="file-details">
                      <div class="file-name">{{ message.fileName }}</div>
                      <div class="file-size">{{ message.fileSize }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 功能按钮区域 -->
        <div class="function-bar">
          <div class="quick-replies">
            <hzb-button 
              v-for="(reply, index) in quickReplies" 
              :key="index"
              type="info" 
              plain 
              size="small"
              @click="sendQuickReply(reply)"
              class="quick-reply-btn"
            >
              {{ reply }}
            </hzb-button>
          </div>
          
          <div class="action-buttons">
            <hzb-button type="primary" @click="requestTransfer" size="small">
              <i class="iconfont hzb-icon-service"></i>
              请求转接
            </hzb-button>
            <hzb-button type="success" @click="showFileUpload" size="small">
              <i class="iconfont hzb-icon-upload2"></i>
              上传文件
            </hzb-button>
            <hzb-button type="warning" @click="showEmojiPicker" size="small">
              <i class="iconfont hzb-icon-picture-outline"></i>
              表情
            </hzb-button>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <hzb-input
            type="textarea"
            :rows="3"
            placeholder="请输入消息内容..."
            v-model="messageInput"
            class="message-input"
          ></hzb-input>
          <hzb-button 
            type="primary" 
            @click="sendMessage"
            :disabled="!messageInput.trim()"
            class="send-button"
          >
            发送
          </hzb-button>
        </div>
      </div>
    </div>

    <!-- 文件上传对话框 -->
    <hzb-dialog
      title="上传文件"
      :visible.sync="uploadDialogVisible"
      width="400px"
    >
      <div class="upload-area">
        <hzb-button type="primary" @click="triggerFileSelect">
          选择文件
        </hzb-button>
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileSelect" 
          style="display: none;"
        />
        <div v-if="selectedFile" class="file-preview">
          <i class="iconfont hzb-icon-document-checked file-icon"></i>
          <span>{{ selectedFile.name }}</span>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <hzb-button @click="uploadDialogVisible = false" size="medium">取 消</hzb-button>
        <hzb-button 
          type="primary" 
          @click="sendFile" 
          size="medium" 
          :disabled="!selectedFile"
          style="margin-left:12px;"
        >
          确 定
        </hzb-button>
      </span>
    </hzb-dialog>

    <!-- 表情选择器对话框 -->
    <hzb-dialog
      title="选择表情"
      :visible.sync="emojiDialogVisible"
      width="300px"
    >
      <div class="emoji-picker">
        <div 
          v-for="(emoji, index) in emojis" 
          :key="index"
          class="emoji-item"
          @click="selectEmoji(emoji)"
        >
          {{ emoji }}
        </div>
      </div>
    </hzb-dialog>
  </div>
</template>

<script>
// 引入截图mixin
import screenshotMixin from "@/common/mixin.js"
// 引入公共导航组件
import GlobalNavigation from '@/components/GlobalNavigation.vue'
// 引入用户和客服头像
import userAvatar from '@/assets/images/avatar.png'
import serviceAvatar from '@/assets/images/avatar.png'

export default {
  name: 'OnlineSupport',
  mixins: [screenshotMixin],
  components: {
    GlobalNavigation
  },
  data() {
    return {
      // 头像资源
      userAvatar,
      serviceAvatar,
      
      // 聊天消息列表
      chatMessages: [
        {
          sender: 'service',
          type: 'text',
          content: '您好！欢迎联系杭州银行在线客服，请问有什么可以帮您的吗？',
          timestamp: '10:00'
        },
        {
          sender: 'user',
          type: 'text',
          content: '我想咨询一下个人贷款的申请条件',
          timestamp: '10:01'
        },
        {
          sender: 'service',
          type: 'text',
          content: '感谢您的咨询。个人贷款申请需要满足以下条件：1. 年满18周岁，具有完全民事行为能力；2. 有稳定的职业和收入来源；3. 个人信用记录良好；4. 能提供有效的身份证明和收入证明。',
          timestamp: '10:02'
        },
        {
          sender: 'service',
          type: 'image',
          content: 'https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=贷款流程图',
          timestamp: '10:03'
        },
        {
          sender: 'user',
          type: 'text',
          content: '好的，谢谢！我还想了解一下企业账户开户流程',
          timestamp: '10:05'
        },
        {
          sender: 'service',
          type: 'file',
          content: '',
          fileName: '企业开户流程说明.pdf',
          fileSize: '2.4MB',
          timestamp: '10:06'
        }
      ],
      
      // 快捷回复选项
      quickReplies: [
        '如何查询账户余额',
        '信用卡还款方式',
        '转账手续费标准',
        '理财产品收益率'
      ],
      
      // 表情列表
      emojis: ['😊', '👍', '👏', '🙏', '🤔', '🎉', '❤️', '😄', '😎', '🤩'],
      
      // 输入消息内容
      messageInput: '',
      
      // 对话框可见性控制
      uploadDialogVisible: false,
      emojiDialogVisible: false,
      
      // 文件上传相关
      selectedFile: null
    }
  },
  methods: {
    // 返回上一页
    goBack() {
      this.$router.push('/customerService')
    },
    
    // 发送文字消息
    sendMessage() {
      if (this.messageInput.trim()) {
        // 添加用户消息到聊天记录
        this.chatMessages.push({
          sender: 'user',
          type: 'text',
          content: this.messageInput,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        })
        
        // 清空输入框
        this.messageInput = ''
        
        // 模拟客服回复
        setTimeout(() => {
          this.chatMessages.push({
            sender: 'service',
            type: 'text',
            content: '感谢您的咨询，我们已收到您的消息，将尽快为您解答。',
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          })
          
          // 滚动到底部
          this.$nextTick(() => {
            this.scrollToBottom()
          })
        }, 1000)
        
        // 滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },
    
    // 发送快捷回复
    sendQuickReply(reply) {
      this.messageInput = reply
      this.sendMessage()
    },
    
    // 请求转接客服
    requestTransfer() {
      this.$hzbMessage({
        message: '正在为您转接专业客服人员，请稍候...',
        type: 'success'
      })
      
      // 模拟转接过程
      setTimeout(() => {
        this.chatMessages.push({
          sender: 'service',
          type: 'text',
          content: '您好，我是专业客服人员小李，很高兴为您服务！',
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        })
        
        // 滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }, 2000)
    },
    
    // 显示文件上传对话框
    showFileUpload() {
      this.uploadDialogVisible = true
    },
    
    // 显示表情选择器
    showEmojiPicker() {
      this.emojiDialogVisible = true
    },
    
    // 触发文件选择
    triggerFileSelect() {
      this.$refs.fileInput.click()
    },
    
    // 处理文件选择
    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.selectedFile = file
      }
    },
    
    // 发送文件
    sendFile() {
      if (this.selectedFile) {
        // 添加文件消息到聊天记录
        this.chatMessages.push({
          sender: 'user',
          type: 'file',
          content: '',
          fileName: this.selectedFile.name,
          fileSize: (this.selectedFile.size / 1024 / 1024).toFixed(2) + 'MB',
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        })
        
        // 关闭对话框并重置文件选择
        this.uploadDialogVisible = false
        this.selectedFile = null
        this.$refs.fileInput.value = ''
        
        // 模拟客服确认接收文件
        setTimeout(() => {
          this.chatMessages.push({
            sender: 'service',
            type: 'text',
            content: '已收到您发送的文件，我们会尽快处理并回复您。',
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          })
          
          // 滚动到底部
          this.$nextTick(() => {
            this.scrollToBottom()
          })
        }, 1000)
        
        // 滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },
    
    // 选择表情
    selectEmoji(emoji) {
      this.messageInput += emoji
      this.emojiDialogVisible = false
    },
    
    // 滚动聊天记录到底部
    scrollToBottom() {
      const container = this.$refs.chatHistory
      container.scrollTop = container.scrollHeight
    }
  },
  mounted() {
    // 页面加载时滚动到底部
    this.$nextTick(() => {
      this.scrollToBottom()
    })
  }
}
</script>

<style scoped lang="scss">
.online-support-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-top: 60px; // 为固定导航留出空间
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.back-section {
  margin-bottom: 24px;
  
  .back-button {
    font-size: 14px;
    color: #606266;
    
    &:hover {
      color: #078BFA;
      transform: translateX(-2px);
      transition: all 0.3s ease;
    }
  }
}

.chat-container {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px);
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f9fafc;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #c0c4cc;
    border-radius: 3px;
  }
}

.message-item {
  margin-bottom: 20px;
  display: flex;
  
  &.user-message {
    justify-content: flex-end;
    
    .message-content {
      flex-direction: row-reverse;
    }
    
    .message-text {
      background-color: #078BFA;
      color: #ffffff;
      border-radius: 16px 4px 16px 16px;
    }
  }
  
  &.service-message {
    justify-content: flex-start;
    
    .message-text {
      background-color: #ffffff;
      color: #333333;
      border: 1px solid #e4e7ed;
      border-radius: 4px 16px 16px 16px;
    }
  }
}

.message-content {
  display: flex;
  align-items: flex-end;
  max-width: 80%;
}

.avatar-wrapper {
  margin: 0 12px;
  
  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
  }
}

.message-text {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  
  .text-message {
    word-wrap: break-word;
  }
  
  .image-message {
    .message-image {
      max-width: 300px;
      max-height: 200px;
      border-radius: 4px;
    }
  }
  
  .file-message {
    .file-info {
      display: flex;
      align-items: center;
      
      .file-icon {
        font-size: 24px;
        color: #078BFA;
        margin-right: 10px;
      }
      
      .file-details {
        .file-name {
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .file-size {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}

.function-bar {
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  background-color: #ffffff;
  
  .quick-replies {
    margin-bottom: 16px;
    
    .quick-reply-btn {
      margin-right: 10px;
      margin-bottom: 10px;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
    }
  }
  
  .action-buttons {
    .hzb-button {
      margin-right: 12px;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
    }
  }
}

.input-area {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  
  .message-input {
    margin-bottom: 16px;
  }
  
  .send-button {
    align-self: flex-end;
    padding: 10px 24px;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
  }
}

.upload-area {
  text-align: center;
  
  .file-preview {
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .file-icon {
      font-size: 24px;
      color: #078BFA;
      margin-right: 8px;
    }
  }
}

.emoji-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  
  .emoji-item {
    font-size: 24px;
    text-align: center;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    
    &:hover {
      background-color: #f0f2f5;
      transform: scale(1.2);
      transition: all 0.2s ease;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }
  
  .message-content {
    max-width: 90%;
  }
  
  .message-text {
    padding: 10px 14px;
    font-size: 13px;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
  }
  
  .function-bar {
    padding: 12px 16px;
    
    .quick-replies {
      .quick-reply-btn {
        margin-right: 8px;
        margin-bottom: 8px;
        font-size: 12px;
        padding: 6px 10px;
      }
    }
    
    .action-buttons {
      .hzb-button {
        margin-right: 8px;
        font-size: 12px;
        padding: 6px 10px;
      }
    }
  }
  
  .input-area {
    padding: 16px;
  }
}
</style>