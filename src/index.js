import chalk from "chalk";
import config from './fileConfig/index.js';
import param from './executeConfig/param/index.js';
import dockerConnect from "./dockerService/dockerConnect.js";
import clearUnusedImages from './dockerService/clear/index.js';
import showContainersState from './dockerService/state/index.js';
import rollbackContainer from './dockerService/rollback/index.js';
import deployService from "./dockerService/deploy/index.js";
import deployConfig from "./executeConfig/deploy/index.js";

async function executeAction(action, dockerInstance, configJson) {
    switch (action) {
        case 'clear':
            await clearUnusedImages(dockerInstance);
            break;
        case 'state':
            await showContainersState(dockerInstance);
            break;
        case 'rollback':
            await rollbackContainer(dockerInstance);
            break;
        case 'deploy':
            const deployConfigRes = await deployConfig(configJson);
            if (deployConfigRes) {
                await deployService(dockerInstance, deployConfigRes);
            }
            break;
        default:
            console.log(chalk.redBright.bold('未知的操作类型'));
            process.exit(1);
    }
}

export async function index() {
    try {
        // 获取配置文件
        const configJson = await config();

        // 引导欢迎信息
        console.log(chalk.cyanBright.bold(`
╔══════════════════════════════════════════════╗
║                                              ║
║     🚀 Docker Auto Deploy System v1.0.0      ║
║        Powered by ${chalk.greenBright('Maosi Technology')}           ║
║                                              ║
╚══════════════════════════════════════════════╝
`));
        
        // 获取要执行的操作（从命令行或交互式菜单）
        const action = await param();

        // 连接docker
        const dockerInstance = await dockerConnect(configJson);
        
        // 执行对应的操作
        await executeAction(action, dockerInstance, configJson);
    } catch (error) {
        // console.error(chalk.redBright.bold('执行过程中发生错误：', error.message));
        process.exit(1);
    }
}
