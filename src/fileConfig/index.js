import fs from 'fs';
import { resolve } from 'path';
import Chalk from 'chalk';

function validateConfig(config) {
    const commonRequiredFields = ['name', 'imageName', 'serveraddress'];
    const privateRequiredFields = [...commonRequiredFields, 'username', 'password', 'auth', 'email'];
    const errors = [];

    // 检查 public 配置
    if (!Array.isArray(config.public)) {
        errors.push('public 字段必须是数组');
    } else {
        config.public.forEach((item, index) => {
            commonRequiredFields.forEach(field => {
                if (!item[field]) {
                    errors.push(`public[${index}] 缺少必需的 ${field} 字段`);
                }
            });
        });
    }

    // 检查 private 配置（如果存在）
    if (config.hasOwnProperty('private')) {
        if (!Array.isArray(config.private)) {
            errors.push('private 字段必须是数组');
        } else {
            config.private.forEach((item, index) => {
                privateRequiredFields.forEach(field => {
                    if (!item[field]) {
                        errors.push(`private[${index}] 缺少必需的 ${field} 字段`);
                    }
                });
            });
        }
    }

    return errors;
}

export default async function config() {
    const path = resolve("./config.json")
    if (fs.existsSync(path)) {
        try {
            // 读取配置文件
            const configContent = fs.readFileSync(path, "utf8");
            const configJson = JSON.parse(configContent);

            // 验证配置文件
            const validationErrors = validateConfig(configJson);
            if (validationErrors.length > 0) {
                console.log(Chalk.redBright.bold('配置文件验证失败：'));
                validationErrors.forEach(error => {
                    console.log(Chalk.redBright.bold('- ' + error));
                });
                return null;
            }

            return configJson;
        } catch (error) {
            if (error instanceof SyntaxError) {
                console.log(Chalk.redBright.bold('配置文件格式错误：' + error.message));
            } else {
                console.log(Chalk.redBright.bold('读取配置文件失败：' + error.message));
            }
            return null;
        }
    }
    console.log(Chalk.yellowBright.bold('配置文件不存在，请先执行'+Chalk.green.bold('\'maosi init\'')+'初始化配置！！'));
    return null;
}