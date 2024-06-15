import inquirer from 'inquirer';
import chalk from 'chalk';

import shell from 'shelljs';
import path from 'path';
import fs from 'fs';

import docker from './docker.js';

const actions = Object.freeze({
    'clear': '清空未使用镜像(空间不足时使用)',
    'rollback': '回滚',
    'deploy': '部署'
})

export async function index() {
    // 获取携带参数
    const param = process.argv[2]
    if (param === undefined || !actions.hasOwnProperty(param)) {
        console.log(chalk.yellowBright.bold('参数无效！请检查后重新执行命令！'))
        return
    }

    // 引导欢迎信息
    console.log(chalk.yellowBright.bold('🌟---------------------------------------🌟\n    👏 欢迎使用自动构建部署工具 ---Maosi 👏    \n🌟---------------------------------------🌟'));

    // 链接docker
    let dockerInstance = await docker();

    // 根据参数执行清空镜像还是回滚还是部署
    if (param === 'clear') {
        // 清空未使用镜像
    } else if (param === 'rollback') {
        // 回滚
    } else if (param === 'deploy') {
        // 部署
        // 填写容器镜像[前缀]，保存本地，只需要填一次
        const imageName = 'nginx'

        // 执行部署命令
        const promptList = [{
            type: 'list',
            message: '请选择一种水果:',
            name: 'fruit',
            choices: [
                "Apple",
                "Pear",
                "Banana"
            ],
            filter: function (val) { // 使用filter将回答变为小写
                return val.toLowerCase();
            }
        }];

        inquirer.prompt(promptList).then(answers => {
            console.log(answers);
        })
    }
}
