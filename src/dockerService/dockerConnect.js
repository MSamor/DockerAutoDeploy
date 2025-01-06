import chalk from "chalk";
import inquirer from "inquirer";
import Docker from 'dockerode';
import fs from 'fs';
import ora from 'ora';

async function tryConnect(docker) {
    return new Promise((resolve, reject) => {
        docker.listContainers({}, function (err, containers) {
            if (err) {
                reject(err);
            } else {
                resolve(containers);
            }
        });
    });
}

async function promptDockerConfig() {
    const promptList = [{
        type: 'input',
        message: '请输入服务器地址:',
        name: 'host',
        default: "127.0.0.1",
        validate: function(val) {
            if(val.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^localhost$/)) {
                return true;
            }
            return "请输入有效的IP地址";
        }
    },{
        type: 'input',
        message: '请输入端口号:',
        name: 'port',
        default: "2375",
        validate: function(val) {
            if(val.match(/^\d+$/)) {
                return true;
            }
            return "请输入有效的端口号！";
        }
    }];
    return inquirer.prompt(promptList);
}

async function createDockerInstance(config) {
    if (fs.existsSync('ca.pem') && fs.existsSync('cert.pem') && fs.existsSync('key.pem')) {
        return new Docker({
            protocol: 'https',
            host: config.host,
            port: config.port,
            ca: fs.readFileSync('ca.pem'),
            cert: fs.readFileSync('cert.pem'),
            key: fs.readFileSync('key.pem')
        });
    } else {
        return new Docker({
            protocol: 'http',
            host: config.host,
            port: config.port
        });
    }
}

export default async function dockerConnect(configJson) {
    console.log(chalk.yellowBright.bold('正在连接docker...'));
    const oraLoading = ora(chalk.yellowBright.bold('连接中,请稍后...\n'));

    // 首先尝试使用配置文件中的设置
    if (configJson.host && configJson.port) {
        try {
            oraLoading.start();
            const docker = await createDockerInstance({
                host: configJson.host,
                port: configJson.port
            });
            await tryConnect(docker);
            oraLoading.stop();
            console.log(chalk.greenBright.bold('Docker服务器连接成功!'));
            return docker;
        } catch (error) {
            oraLoading.stop();
            console.log(chalk.yellowBright.bold('使用配置文件连接失败，请重新输入连接信息...'));
        }
    }

    // 如果配置文件连接失败或没有配置，则提示用户输入
    let connected = false;
    let docker = null;

    while (!connected) {
        try {
            const config = await promptDockerConfig();
            oraLoading.start();
            docker = await createDockerInstance(config);
            await tryConnect(docker);
            connected = true;
            oraLoading.stop();
            console.log(chalk.greenBright.bold('Docker服务器连接成功!'));
        } catch (error) {
            oraLoading.stop();
            console.log(chalk.redBright.bold('连接失败：' + error.message));
            const { retry } = await inquirer.prompt([{
                type: 'confirm',
                name: 'retry',
                message: '是否重试？',
                default: true
            }]);
            if (!retry) {
                console.log(chalk.redBright.bold('用户取消连接'));
                process.exit(1);
            }
        }
    }

    return docker;
}