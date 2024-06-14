import inquirer from 'inquirer';
import shell from 'shelljs';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';

export function index() {
    // 引导欢迎信息
    console.log(chalk.yellowBright.bold('🌟---------------------------------------🌟\n    👏 欢迎使用自动构建部署工具 ---Maosi 👏    \n🌟---------------------------------------🌟'));

    // 链接服务器，上传dockerfile和打包数据

    // 执行构建或部署命令
    const action = process.argv[2]
    if (action === 'build') {

    }

    if (action === 'deploy') {

    }

    // 询问构建还是部署
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
