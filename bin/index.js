import inquirer from 'inquirer';
import shell from 'shelljs';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';

export function index() {
    // 引导欢迎信息
    console.log(chalk.yellowBright.bold('🌟---------------------------------------🌟\n    👏 欢迎使用自动构建部署工具 ---Maosi 👏    \n🌟---------------------------------------🌟'));

    // 链接docker

    // 根据参数执行清空镜像还是回滚还是部署

    // 填写容器镜像[前缀]，保存本地，只需要填一次

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
