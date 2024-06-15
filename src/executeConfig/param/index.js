import chalk from "chalk";
import {actions} from "../../meta/constant.js";

export default async function param() {
    // 获取携带参数
    const param = process.argv[2]
    if (param === undefined || !actions.hasOwnProperty(param)) {
        console.log(chalk.yellowBright.bold('参数无效！请检查后重新执行命令！'))
        return
    }
    return param;
}