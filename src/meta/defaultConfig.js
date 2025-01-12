export const defaultConfig = {
  "public": [
    {
      "name": "示例公共镜像",
      "imageName": "nginx",
      "serveraddress": "docker.m.daocloud.io",
    }
  ],
  "private": [
    {
      "name": "示例私有镜像",
      "imageName": "nginx",
      "username": "your-username",
      "password": "your-password",
      "auth": "token",
      "email": "your@email.com",
      "serveraddress": "index.docker.io/v1",
      "hostPort": 80,
      "containerPort": 80,
      "hostVolume": "/path/to/host/private",
      "containerVolume": "/path/to/container/private"
    }
  ],
  "host": "127.0.0.1",
  "port": "2375"
}
