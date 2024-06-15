import chalk from "chalk";
import inquirer from "inquirer";
import Docker from 'dockerode';
import fs from 'fs';
import ora from 'ora';
const oraLoading = ora('连接中,请稍后...')

export default async function docker() {
    console.log(chalk.yellowBright.bold('正在链接docker...'))

    // 链接docker

    const promptList = [{
        type: 'input',
        message: '请输入服务器地址:',
        name: 'address',
        default: "127.0.0.1", // 默认值
        validate: function(val) {
            if(val.match(/\d{3}/g)) {
                return true;
            }
            return "请输入11位数字";
        }
    },{
        type: 'input',
        message: '请输入端口号:',
        name: 'port',
        validate: function(val) {
            if(val.match(/\d/g)) {
                return true;
            }
            return "请输入数字！";
        }
    }]
    const answers =await inquirer.prompt(promptList)

    var docker = null
    if (fs.existsSync('ca.pem') && fs.existsSync('cert.pem') && fs.existsSync('key.pem')) {
        const httpsOptions = {
            protocol: 'https', //you can enforce a protocol
            host: answers?.address || '127.0.0.1',
            port: answers?.port || 2375,
            ca: fs.readFileSync('ca.pem'),
            cert: fs.readFileSync('cert.pem'),
            key: fs.readFileSync('key.pem')
        }
        docker = new Docker(httpsOptions);
    } else {
        const httpOptions = {
            protocol:'http',
            host: answers?.address || '127.0.0.1',
            port: answers?.port || 2375,
        }
        docker = new Docker(httpOptions);
    }

    oraLoading.start()
    const containers =  new Promise((resolve, reject) => {
        docker.listContainers( {},function (err, containers) {
            if (err) {
                console.log(chalk.yellowBright.bold('Docker服务器连接失败，请重试...'))
                process.exit()
            }
            oraLoading.stop();
            resolve(containers);
        })
    })
    await containers;
    return docker;
}