export const fullConfig = {
  // Docker守护进程的主机地址
  "host": "127.0.0.1",
  // Docker守护进程的端口
  "port": "2375",

  // 公共镜像配置（可选）
  "public": [
    {
      // 容器名称
      "name": "nginx-server",
      // Docker镜像名称
      "imageName": "nginx:latest",
      // Docker镜像仓库地址
      "serveraddress": "docker.m.daocloud.io",
      // 容器端口映射（可选）
      "hostPort": 80,
      "containerPort": 80,
      // 数据卷挂载配置（可选）
      "hostVolume": "/path/to/host/nginx/conf",
      "containerVolume": "/etc/nginx/conf.d",
      // 容器环境变量（可选）
      "env": [
        "NGINX_HOST=example.com",
        "NGINX_PORT=80"
      ],
      // 容器重启策略（可选）：no, always, on-failure, unless-stopped
      "restartPolicy": "always",
      // 容器资源限制（可选）
      "resources": {
        "memory": "512m",
        "cpus": "0.5"
      }
    }
  ],

  // 私有镜像配置（可选）
  "private": [
    {
      // 容器名称
      "name": "private-app",
      // Docker镜像名称
      "imageName": "private-registry/myapp:1.0.0",
      // 私有仓库认证信息（必填）
      "username": "your-username",
      "password": "your-password",
      "auth": "token",
      "email": "your@email.com",
      // Docker镜像仓库地址
      "serveraddress": "index.docker.io/v1",
      // 容器端口映射（可选）
      "hostPort": 3000,
      "containerPort": 3000,
      // 数据卷挂载配置（可选）
      "hostVolume": "/path/to/host/data",
      "containerVolume": "/app/data",
      // 容器环境变量（可选）
      "env": [
        "NODE_ENV=production",
        "API_KEY=your-api-key"
      ],
      // 容器重启策略（可选）
      "restartPolicy": "unless-stopped",
      // 容器资源限制（可选）
      "resources": {
        "memory": "1g",
        "cpus": "1.0"
      },
    }
  ]
}
