import fs from "fs";
import Chalk from "chalk";
import { resolve } from "path";

export default async function config() {
    const path = resolve("./config.json")
    if (fs.existsSync(path)) {
        // 读取配置文件
        // TODO 验证有效性
        return JSON.parse(fs.readFileSync(path, "utf8"));
    }
    console.log(Chalk.yellowBright.bold('配置文件不存在，请先初始化配置！！'));
    return null;
}