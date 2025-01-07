import Chalk from "chalk";
import inquirer from "inquirer";

async function selectContainer(dockerInstance) {
    const containers = await new Promise((resolve, reject) => {
        dockerInstance.listContainers({ all: true }, (err, containers) => {
            if (err) reject(err);
            else resolve(containers);
        });
    });

    if (containers.length === 0) {
        throw new Error('没有可用的容器');
    }

    const choices = containers.map(container => {
        const name = container.Names[0].substring(1);
        const state = container.State;
        const image = container.Image;
        // 从镜像字符串中提取名称和标签
        const [imageName, imageTag] = image.split(':').map(s => s.split('/').pop());
        
        return {
            name: `${name} [${state}] (${imageName}:${imageTag || 'latest'})`,
            value: name
        };
    });

    const { selectedContainer } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedContainer',
        message: '请选择要回滚的容器：',
        choices
    }]);

    return selectedContainer;
}

async function getContainerInfo(dockerInstance, containerName) {
    return new Promise((resolve, reject) => {
        dockerInstance.getContainer(containerName).inspect((err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

async function selectVersion(dockerInstance, currentImage) {
    const images = await new Promise((resolve, reject) => {
        dockerInstance.listImages((err, images) => {
            if (err) reject(err);
            else resolve(images);
        });
    });

    const imageVersions = images.filter(img => 
        img.RepoTags && img.RepoTags.some(tag => 
            tag.split(':')[0] === currentImage.split(':')[0]
        )
    );

    if (imageVersions.length <= 1) {
        throw new Error('没有可用的历史版本');
    }

    const choices = imageVersions.map(img => ({
        name: img.RepoTags[0],
        value: img.RepoTags[0]
    }));

    const { selectedVersion } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedVersion',
        message: '请选择要回滚到的版本：',
        choices
    }]);

    return selectedVersion;
}

async function confirmRollback() {
    const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: '确认要执行回滚操作吗？这将重启容器',
        default: false
    }]);

    return confirm;
}

async function performRollback(dockerInstance, containerName, newImage) {
    const container = dockerInstance.getContainer(containerName);
    
    // 获取原容器的配置
    const containerInfo = await new Promise((resolve, reject) => {
        container.inspect((err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });

    console.log(Chalk.yellow.bold('正在停止容器...'));
    await new Promise((resolve, reject) => {
        container.stop((err) => {
            if (err && err.statusCode !== 304) reject(err);
            else resolve();
        });
    });

    console.log(Chalk.yellow.bold('正在删除旧容器...'));
    await new Promise((resolve, reject) => {
        container.remove((err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    console.log(Chalk.yellow.bold('正在创建新容器...'));
    const newContainer = await new Promise((resolve, reject) => {
        // 使用原容器的配置创建新容器，但使用新的镜像
        const createConfig = {
            ...containerInfo.Config,
            Image: newImage,
            HostConfig: containerInfo.HostConfig,
            name: containerName
        };

        dockerInstance.createContainer(createConfig, (err, container) => {
            if (err) reject(err);
            else resolve(container);
        });
    });

    console.log(Chalk.yellow.bold('正在启动新容器...'));
    await new Promise((resolve, reject) => {
        newContainer.start((err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    console.log(Chalk.green.bold('回滚完成！'));
}

export default async function rollbackContainer(dockerInstance) {
    try {
        // 1. 选择容器
        const containerName = await selectContainer(dockerInstance);
        
        // 2. 获取容器信息
        const containerInfo = await getContainerInfo(dockerInstance, containerName);
        const currentImage = containerInfo.Config.Image;
        
        // 3. 选择版本
        const targetVersion = await selectVersion(dockerInstance, currentImage);
        
        // 4. 确认回滚
        const confirmed = await confirmRollback();
        if (!confirmed) {
            console.log(Chalk.yellow.bold('已取消回滚操作'));
            return;
        }
        
        // 5. 执行回滚
        await performRollback(dockerInstance, containerName, targetVersion);

    } catch (error) {
        console.log(Chalk.red.bold('回滚失败：' + error.message));
        throw error;
    }
}
