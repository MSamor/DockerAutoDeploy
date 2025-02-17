# Changelog

所有重要的更改都将记录在此文件中。

## [1.0.0] - 2025-01-07

### ✨ 新增功能

- 🚀 **容器部署系统**
  - 支持公共和私有镜像的部署
  - 自动拉取最新镜像
  - 灵活的端口映射配置
  - 部署前的配置确认

- 🔄 **版本回滚功能**
  - 支持查看容器历史版本
  - 一键回滚到指定版本
  - 回滚前自动备份当前版本

- 🛠️ **容器管理功能**
  - 启动容器操作
  - 停止容器操作
  - 删除容器（带安全确认）
  - 批量管理支持

- 📊 **状态监控**
  - 实时查看容器运行状态
  - 显示容器运行时间
  - 显示端口映射信息
  - 优化状态显示格式

### 🔧 优化改进

- 📝 **配置系统**
  - 新增配置文件验证
  - 支持可选的端口配置
  - 完善错误提示信息

- 🎨 **用户界面**
  - 优化命令行交互界面
  - 添加彩色提示信息
  - 改进操作流程提示

### 🐛 问题修复

- 修复容器状态显示格式问题
- 修复端口映射配置验证
- 修复回滚操作中的版本选择问题
- 修复删除容器时的并发操作问题

### 📚 文档

- 添加详细的 README.md
- 添加配置文件说明
- 添加使用流程示例
- 添加贡献指南

### 🔒 安全性

- 添加私有仓库认证
- 加强配置文件验证
- 添加危险操作确认提示

## [0.1.0] - 2025-01-01

### 🎉 初始发布

- 基础项目框架
- Docker 连接功能
- 简单的容器管理
- 基础配置系统
