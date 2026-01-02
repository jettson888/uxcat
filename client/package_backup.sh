#!/bin/bash

# 脚本功能：打包client.zip

echo "=== 项目打包脚本 ==="
echo "开始执行打包和备份操作..."

# 1. 删除旧的 client.zip（如果存在）
if [ -f client.zip ]; then
    echo "删除旧的 client.zip 文件..."
    rm client.zip
fi

# 2. 创建新的 client.zip
echo "正在创建 client.zip..."
zip -r client.zip . -x "client.zip" "*.git*" "node_modules/*" "dist/*" ".DS_Store" ".skybow/*" "package_backup.sh" "package-lock.json"

if [ $? -eq 0 ]; then
    echo "✓ client.zip 创建成功"
    echo "文件大小: $(du -h client.zip | cut -f1)"
else
    echo "✗ client.zip 创建失败"
    exit 1
fi


# 53. 显示结果
echo ""
echo "=== 打包完成 ==="
