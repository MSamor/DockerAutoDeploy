import Chalk from 'chalk';

import dockerConnect from './dockerService/dockerConnect.js';
import config from './fileConfig/index.js';
import param from './executeConfig/param/index.js';
import deployConfig from "./executeConfig/deploy/index.js";
import deployService from "./dockerService/deploy/index.js";

export async function index() {
    // 获取携带参数
    const scriptParam = await param();

    // 引导欢迎信息
    console.log(Chalk.yellowBright.bold('🌟---------------------------------------🌟\n    👏 欢迎使用自动构建部署工具 ---Maosi 👏    \n🌟---------------------------------------🌟'));

    // 读取配置文件
    let configJson = await config();

    // 链接docker
    let dockerInstance = await dockerConnect();

    // 根据参数执行清空镜像还是回滚还是部署
    if (scriptParam === 'clear') {
        // 清空未使用镜像
        // TODO
    } else if (scriptParam === 'state') {
        // 容器状态
        // TODO
    } else if (scriptParam === 'rollback') {
        // 回滚
        // TODO
    } else if (scriptParam === 'deploy') {
        // 拉取镜像
       const deployConfigRes = await deployConfig(configJson);
       deployService(dockerInstance,deployConfigRes);
    }
}
