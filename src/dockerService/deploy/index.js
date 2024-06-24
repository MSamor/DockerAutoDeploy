import ora from "ora";
import Chalk from "chalk";
import chalk from "chalk";

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
        // TODO 读取配置文件
        dockerInstance.createContainer({
                Image: 'docker.m.daocloud.io/nginx:latest',
                ExposedPorts:{'80/tcp':{}},
                name: 'nginx-test', Tty: true,
                HostConfig:{
                    PortBindings:{
                        "80/tcp":[
                            {
                                "HostPort":"88"
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
    const oraLoading = ora(chalk.yellowBright.bold('容器构建启动中,请稍后...\n'))
    oraLoading.start()
    await pullImage(dockerInstance,deployConfigRes);
    oraLoading.stop()

    await createContainer(dockerInstance,deployConfigRes);


    // ora(Chalk.yellowBright.bold('部署中,请稍后...\n')).start()
}