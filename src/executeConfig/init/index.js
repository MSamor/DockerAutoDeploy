import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { defaultConfig } from '../../meta/defaultConfig.js';

export default async function init() {
    const configPath = path.join(process.cwd(), 'config.json');
    
    // Check if config.json already exists
    if (fs.existsSync(configPath)) {
        console.log(chalk.yellow('配置文件已存在！如需重新初始化，请先删除现有的 config.json 文件。'));
        return;
    }

    try {
        // Write default config to config.json
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
        console.log(chalk.green('✓ 配置文件已成功创建！'));
        console.log(chalk.cyan('请编辑 config.json 文件，填写您的实际配置信息。'));
    } catch (error) {
        console.error(chalk.red('创建配置文件时出错：'), error.message);
    }
}
