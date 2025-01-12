import chalk from "chalk";
import inquirer from "inquirer";
import {actions} from "../../meta/constant.js";

async function promptAction() {
    const choices = Object.entries(actions).map(([key, value]) => ({
        name: `${value} (${key})`,
        value: key
    }));

    const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: '请选择要执行的操作:',
        choices
    }]);

    return action;
}

export default async function param() {
    // 获取携带参数
    const paramFromCli = process.argv[2];
    
    // 如果没有参数或参数无效，显示交互式菜单
    if (!paramFromCli || !actions.hasOwnProperty(paramFromCli)) {
        if (paramFromCli) {
            console.log(chalk.yellowBright.bold('参数无效！将显示可用选项...'));
        }
        return await promptAction();
    }

    return paramFromCli;
}