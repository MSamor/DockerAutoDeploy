import ora from "ora";
import Chalk from "chalk";
import inquirer from "inquirer";

async function pullImage(dockerInstance, deployConfigRes, spinner) {
    return new Promise((resolve, reject) => {
        const layers = {};
        
        dockerInstance.pull(deployConfigRes.fullImageUrl, function(err, stream) {
            if (err) {
                spinner.fail(Chalk.redBright.bold('镜像拉取失败：' + err.message));
                reject(err);
                return;
            }

            dockerInstance.modem.followProgress(stream, onFinished, onProgress);
            
            function onFinished(err, output) {
                if (err) {
                    spinner.fail(Chalk.redBright.bold('镜像拉取失败：' + err.message));
                    reject(err);
                    return;
                }
                spinner.succeed(Chalk.greenBright.bold('镜像拉取完成'));
                resolve();
            }
            
            function onProgress(event) {
                if (!event.id) {
                    if (event.error) {
                        spinner.fail(Chalk.redBright.bold('镜像拉取出错：' + event.error));
                        reject(new Error(event.error));
                        return;
                    }
                    if (event.status) {
                        spinner.text = Chalk.white(event.status);
                    }
                    return;
                }

                layers[event.id] = event;
                let output = '';

                Object.keys(layers).forEach(layerId => {
                    const layer = layers[layerId];
                    if (layer.status === 'Downloading' && layer.progressDetail) {
                        const progress = layer.progressDetail;
                        if (progress.total) {
                            const percent = ((progress.current / progress.total) * 100).toFixed(1);
                            const downloaded = (progress.current / 1024 / 1024).toFixed(1);
                            const total = (progress.total / 1024 / 1024).toFixed(1);
                            output += Chalk.cyan(`Layer ${layerId.substr(0, 12)}: ${percent}% (${downloaded}MB/${total}MB)\n`);
                        }
                    } else if (layer.status === 'Download complete') {
                        output += Chalk.green(`Layer ${layerId.substr(0, 12)}: 完成\n`);
                    } else if (layer.status === 'Extracting') {
                        output += Chalk.yellow(`Layer ${layerId.substr(0, 12)}: 解压中...\n`);
                    } else if (layer.status) {
                        output += Chalk.white(`Layer ${layerId.substr(0, 12)}: ${layer.status}\n`);
                    }
                });

                if (output) {
                    spinner.text = output;
                }
            }
        });
    })
}

async function createContainer(dockerInstance, deployConfigRes) {
    return new Promise((resolve, reject) => {
        const containerPort = `${deployConfigRes.containerPort}/tcp`;
        const portBindings = {};
        portBindings[containerPort] = [{ HostPort: deployConfigRes.hostPort.toString() }];

        dockerInstance.createContainer({
            Image: deployConfigRes.fullImageUrl,
            ExposedPorts: {
                [containerPort]: {}
            },
            name: deployConfigRes.name,
            Tty: true,
            HostConfig: {
                PortBindings: portBindings
            }
        }, function(err, container) {
            if (err) {
                console.log(Chalk.redBright.bold('容器启动失败！原因：' + err.message));
                reject(err);
                return;
            }
            if (container) {
                container.start(function(err) {
                    if (err) {
                        console.log(Chalk.redBright.bold('容器启动失败！原因：' + err.message));
                        reject(err);
                        return;
                    }
                    console.log(Chalk.greenBright.bold('容器启动成功'));
                    resolve();
                });
            }
        });
    });
}

async function checkImageExists(dockerInstance, imageUrl) {
    return new Promise((resolve) => {
        dockerInstance.listImages((err, images) => {
            if (err) {
                resolve(false);
                return;
            }
            const exists = images.some(img => 
                img.RepoTags && img.RepoTags.includes(imageUrl)
            );
            resolve(exists);
        });
    });
}

export default async function deployService(dockerInstance, deployConfigRes) {
    const imageExists = await checkImageExists(dockerInstance, deployConfigRes.fullImageUrl);
    
    if (!imageExists) {
        const oraLoading = ora(Chalk.yellowBright.bold('容器拉取中,请稍后...\n'))
        oraLoading.start()
        await pullImage(dockerInstance, deployConfigRes, oraLoading);
        oraLoading.stop()
    }

    const deployPrompt = [{
        type: 'confirm',
        message: '容器拉取完成或已存在，需要立即部署吗？',
        name: 'confirmDeploy',
    }];
    const answers = await inquirer.prompt(deployPrompt);
    
    if (answers.confirmDeploy) {
        // 端口配置确认
        const portPrompt = [
            {
                type: 'input',
                message: '请确认主机端口(Host Port)',
                name: 'hostPort',
                default: deployConfigRes.hostPort.toString(),
                validate: function(value) {
                    const port = parseInt(value);
                    if (isNaN(port) || port < 1 || port > 65535) {
                        return '请输入有效的端口号（1-65535）';
                    }
                    return true;
                }
            },
            {
                type: 'input',
                message: '请确认容器端口(Container Port)',
                name: 'containerPort',
                default: deployConfigRes.containerPort.toString(),
                validate: function(value) {
                    const port = parseInt(value);
                    if (isNaN(port) || port < 1 || port > 65535) {
                        return '请输入有效的端口号（1-65535）';
                    }
                    return true;
                }
            }
        ];
        const portAnswers = await inquirer.prompt(portPrompt);
        
        // 更新端口配置
        deployConfigRes.hostPort = parseInt(portAnswers.hostPort);
        deployConfigRes.containerPort = parseInt(portAnswers.containerPort);

        await createContainer(dockerInstance, deployConfigRes);
    } else {
        console.log(Chalk.yellowBright.bold('取消部署,需手动部署'));
    }
}