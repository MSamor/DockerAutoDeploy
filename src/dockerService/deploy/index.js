import ora from "ora";
import Chalk from "chalk";
import inquirer from "inquirer";

async function pullImage(dockerInstance,deployConfigRes) {
    return new Promise((resolve, reject) => {
        dockerInstance.pull(deployConfigRes.fullImageUrl, function(err, stream) {
            dockerInstance.modem.followProgress(stream, onFinished, onProgress);
            function onFinished(err, output) {
                console.log(Chalk.yellowBright.bold('镜像拉取完成'))
                resolve();
            }
            function onProgress(event) {
                // console.log(event)
                // console.log('-------')
                // TODO 拉取格式化
            }
        });
    })
}

async function createContainer(dockerInstance,deployConfigRes) {
    return new Promise((resolve, reject) => {
        const hostPort = `${deployConfigRes.hostPort}/tcp`;
        dockerInstance.createContainer({
                // Image: 'docker.m.daocloud.io/nginx:latest',
                Image: deployConfigRes.fullImageUrl,
                ExposedPorts:{hostPort:{}},
                name: deployConfigRes.name, Tty: true,
                HostConfig:{
                    PortBindings:{
                        hostPort:[
                            {
                                "HostPort":deployConfigRes.hostPort
                            }
                        ]
                    }
                }},
            function(err, container) {
                if (container) {
                    container.start()
                    console.log(Chalk.yellowBright.bold('容器启动成功'))
                    resolve();
                }
                if (err) {
                    console.log(Chalk.yellowBright.bold('容器启动失败！原因：' + err.message))
                }
            });
    })
}

export default async function deployService(dockerInstance,deployConfigRes) {
    const oraLoading = ora(Chalk.yellowBright.bold('容器拉取中,请稍后...\n'))
    oraLoading.start()
    await pullImage(dockerInstance,deployConfigRes);
    oraLoading.stop()

    const promp = [{
        type: 'confirm',
        message: '容器拉取完成，需要立即部署吗？',
        name: 'confirmDeploy',
    }]
    const answers =await inquirer.prompt(promp)
    if (answers.confirmDeploy) {
        await createContainer(dockerInstance,deployConfigRes);
    } else {
        console.log(Chalk.yellowBright.bold('取消部署,需手动部署'))
    }
}