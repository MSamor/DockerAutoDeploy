import inquirer from 'inquirer';
import Chalk from 'chalk';

async function selectAction() {
    const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: '请选择要执行的操作：',
        choices: [
            { name: '启动容器', value: 'start' },
            { name: '停止容器', value: 'stop' },
            { name: '删除容器', value: 'remove' }
        ]
    }]);
    return action;
}

async function selectContainer(dockerInstance, action) {
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
            value: container.Id,
            disabled: (action === 'stop' && state !== 'running') || 
                     (action === 'start' && state === 'running') ? 
                     `容器${state === 'running' ? '正在运行' : '未运行'}` : false
        };
    });

    const { selectedContainer } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedContainer',
        message: '请选择要操作的容器：',
        choices
    }]);

    return selectedContainer;
}

async function startContainer(dockerInstance, containerId) {
    const container = dockerInstance.getContainer(containerId);
    console.log(Chalk.yellow.bold('正在启动容器...'));
    
    await new Promise((resolve, reject) => {
        container.start((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    console.log(Chalk.green.bold('容器已启动！'));
}

async function stopContainer(dockerInstance, containerId) {
    const container = dockerInstance.getContainer(containerId);
    console.log(Chalk.yellow.bold('正在停止容器...'));
    
    await new Promise((resolve, reject) => {
        container.stop((err) => {
            if (err && err.statusCode !== 304) reject(err);
            else resolve();
        });
    });
    
    console.log(Chalk.green.bold('容器已停止！'));
}

async function removeContainer(dockerInstance, containerId) {
    const container = dockerInstance.getContainer(containerId);
    
    // 获取容器信息用于显示
    const containerInfo = await new Promise((resolve, reject) => {
        container.inspect((err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });

    // 确认删除操作
    const { confirmRemove } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmRemove',
        message: `确定要删除容器 ${containerInfo.Name.substring(1)} 吗？此操作不可恢复！`,
        default: false
    }]);

    if (!confirmRemove) {
        console.log(Chalk.yellow.bold('已取消删除操作'));
        return;
    }

    if (containerInfo.State.Running) {
        console.log(Chalk.yellow.bold('容器正在运行，需要先停止...'));
        await stopContainer(dockerInstance, containerId);
    }

    console.log(Chalk.yellow.bold('正在删除容器...'));
    await new Promise((resolve, reject) => {
        container.remove((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    console.log(Chalk.green.bold('容器已删除！'));
}

export default async function manageContainer(dockerInstance) {
    try {
        // 1. 选择操作类型
        const action = await selectAction();
        
        // 2. 选择要操作的容器
        const containerId = await selectContainer(dockerInstance, action);
        
        // 3. 执行操作
        if (action === 'start') {
            await startContainer(dockerInstance, containerId);
        } else if (action === 'stop') {
            await stopContainer(dockerInstance, containerId);
        } else if (action === 'remove') {
            await removeContainer(dockerInstance, containerId);
        }
    } catch (error) {
        console.log(Chalk.red.bold('操作失败：' + error.message));
        throw error;
    }
}
