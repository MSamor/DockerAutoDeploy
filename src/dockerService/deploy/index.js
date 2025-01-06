import ora from "ora";
import Chalk from "chalk";
import inquirer from "inquirer";

async function pullImage(dockerInstance, deployConfigRes, spinner) {
    return new Promise((resolve, reject) => {
        const layers = {};
        
        dockerInstance.pull(deployConfigRes.fullImageUrl, function(err, stream) {
            dockerInstance.modem.followProgress(stream, onFinished, onProgress);
            
            function onFinished(err, output) {
                console.log(Chalk.yellowBright.bold('镜像拉取完成'))
                resolve();
            }
            
            function onProgress(event) {
                if (!event.id) return;

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
        const containerPort = `${deployConfigRes.hostPort}/tcp`;
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

    const promp = [{
        type: 'confirm',
        message: '容器拉取完成，需要立即部署吗？',
        name: 'confirmDeploy',
    }]
    const answers = await inquirer.prompt(promp)
    if (answers.confirmDeploy) {
        await createContainer(dockerInstance, deployConfigRes);
    } else {
        console.log(Chalk.yellowBright.bold('取消部署,需手动部署'))
    }
}