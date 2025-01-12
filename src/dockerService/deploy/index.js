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
        const containerConfig = {
            Image: deployConfigRes.fullImageUrl,
            name: deployConfigRes.name,
            Tty: true,
            HostConfig: {}
        };

        // 只有当设置了端口时才配置端口映射
        if (deployConfigRes.containerPort && deployConfigRes.hostPort) {
            const containerPort = `${deployConfigRes.containerPort}/tcp`;
            const portBindings = {};
            portBindings[containerPort] = [{ HostPort: deployConfigRes.hostPort.toString() }];

            containerConfig.ExposedPorts = {
                [containerPort]: {}
            };
            containerConfig.HostConfig.PortBindings = portBindings;
        }

        // 添加挂载目录配置
        if (deployConfigRes.hostVolume && deployConfigRes.containerVolume) {
            containerConfig.HostConfig.Binds = [
                `${deployConfigRes.hostVolume}:${deployConfigRes.containerVolume}`
            ];
        }

        // 添加环境变量配置
        if (deployConfigRes.env && Array.isArray(deployConfigRes.env)) {
            containerConfig.Env = deployConfigRes.env;
        }

        // 添加重启策略配置
        if (deployConfigRes.restartPolicy) {
            containerConfig.HostConfig.RestartPolicy = {
                Name: deployConfigRes.restartPolicy
            };
        }

        dockerInstance.createContainer(containerConfig, function(err, container) {
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
                    resolve(container);
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
                message: '请确认主机端口(Host Port)，留空则不开放端口',
                name: 'hostPort',
                default: deployConfigRes?.hostPort?.toString() || '',
                validate: function(value) {
                    if (!value || !value.trim()) return true; // 允许空值或空格
                    const port = parseInt(value);
                    if (isNaN(port) || port < 1 || port > 65535) {
                        return '请输入有效的端口号（1-65535）或留空';
                    }
                    return true;
                }
            },
            {
                type: 'input',
                message: '请确认容器端口(Container Port)，留空则不开放端口',
                name: 'containerPort',
                default: deployConfigRes?.containerPort?.toString() || '',
                validate: function(value) {
                    if (!value || !value.trim()) return true; // 允许空值或空格
                    const port = parseInt(value);
                    if (isNaN(port) || port < 1 || port > 65535) {
                        return '请输入有效的端口号（1-65535）或留空';
                    }
                    return true;
                }
            }
        ];

        // 添加挂载目录配置
        const volumePrompt = [
            {
                type: 'input',
                message: '请确认主机挂载目录路径，留空则不挂载',
                name: 'hostVolume',
                default: deployConfigRes?.hostVolume || '',
            },
            {
                type: 'input',
                message: '请确认容器挂载目录路径，留空则不挂载',
                name: 'containerVolume',
                default: deployConfigRes?.containerVolume || '',
                when: (answers) => answers.hostVolume && answers.hostVolume.trim() !== '' // 只有当主机目录不为空且不全是空格时才询问容器目录
            }
        ];
        
        const portAnswers = await inquirer.prompt(portPrompt);
        const volumeAnswers = await inquirer.prompt(volumePrompt);

        // 环境变量配置确认
        let envConfirmPrompt = [];
        if (deployConfigRes.env && Array.isArray(deployConfigRes.env) && deployConfigRes.env.length > 0) {
            envConfirmPrompt = [
                {
                    type: 'confirm',
                    message: '是否需要配置环境变量？',
                    name: 'needEnv',
                    default: true
                }
            ];
            
            const envConfirmAnswer = await inquirer.prompt(envConfirmPrompt);
            
            if (envConfirmAnswer.needEnv) {
                const envPrompt = deployConfigRes.env.map((env, index) => {
                    const [key, defaultValue] = env.split('=');
                    return {
                        type: 'input',
                        message: `请确认环境变量 ${key}`,
                        name: `env_${index}`,
                        default: defaultValue || '',
                    };
                });
                
                const envAnswers = await inquirer.prompt(envPrompt);
                deployConfigRes.env = Object.entries(envAnswers).map((([key, value], index) => {
                    const envKey = deployConfigRes.env[index].split('=')[0];
                    return `${envKey}=${value}`;
                }));
                console.log(Chalk.blueBright.bold('已配置环境变量'));
            } else {
                deployConfigRes.env = undefined;
                console.log(Chalk.blueBright.bold('将不配置环境变量'));
            }
        }

        // 重启策略配置确认
        let restartPolicyConfirmPrompt = [];
        if (deployConfigRes.restartPolicy) {
            restartPolicyConfirmPrompt = [
                {
                    type: 'confirm',
                    message: '是否需要配置重启策略？',
                    name: 'needRestartPolicy',
                    default: true
                }
            ];
            
            const restartConfirmAnswer = await inquirer.prompt(restartPolicyConfirmPrompt);
            
            if (restartConfirmAnswer.needRestartPolicy) {
                const restartPolicyPrompt = {
                    type: 'list',
                    message: '请选择容器重启策略',
                    name: 'restartPolicy',
                    default: deployConfigRes.restartPolicy,
                    choices: [
                        { name: '不自动重启', value: 'no' },
                        { name: '总是重启', value: 'always' },
                        { name: '失败时重启', value: 'on-failure' },
                        { name: '除非手动停止否则总是重启', value: 'unless-stopped' }
                    ]
                };
                
                const restartAnswer = await inquirer.prompt(restartPolicyPrompt);
                deployConfigRes.restartPolicy = restartAnswer.restartPolicy;
                console.log(Chalk.blueBright.bold(`已配置重启策略: ${restartAnswer.restartPolicy}`));
            } else {
                deployConfigRes.restartPolicy = undefined;
                console.log(Chalk.blueBright.bold('将不配置重启策略'));
            }
        }

        // 更新挂载配置
        const hostVolume = volumeAnswers.hostVolume?.trim();
        const containerVolume = volumeAnswers.containerVolume?.trim();
        deployConfigRes.hostVolume = hostVolume || undefined;
        deployConfigRes.containerVolume = containerVolume || undefined;

        if (!deployConfigRes.hostPort || !deployConfigRes.containerPort) {
            console.log(Chalk.blueBright.bold('将以不开放端口的形式运行容器'));
            deployConfigRes.hostPort = undefined;
            deployConfigRes.containerPort = undefined;
        }

        if (!deployConfigRes.hostVolume || !deployConfigRes.containerVolume) {
            console.log(Chalk.blueBright.bold('将以不挂载目录的形式运行容器'));
            deployConfigRes.hostVolume = undefined;
            deployConfigRes.containerVolume = undefined;
        }

        // 更新端口配置
        const hostPort = portAnswers.hostPort?.trim();
        const containerPort = portAnswers.containerPort?.trim();
        deployConfigRes.hostPort = hostPort ? parseInt(hostPort) : undefined;
        deployConfigRes.containerPort = containerPort ? parseInt(containerPort) : undefined;

        try {
            const oraLoading = ora(Chalk.yellowBright.bold('容器部署中,请稍后...\n'))
            oraLoading.start()
            await createContainer(dockerInstance, deployConfigRes);
            oraLoading.succeed(Chalk.greenBright.bold('容器部署成功！'));
        } catch (error) {
            console.error(Chalk.redBright.bold('容器部署失败：'), error);
            throw error;
        }
    } else {
        console.log(Chalk.yellowBright.bold('取消部署,需手动部署'));
    }
}