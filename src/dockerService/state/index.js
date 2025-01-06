import Chalk from "chalk";

function formatUptime(uptime) {
    const days = Math.floor(uptime / (60 * 60 * 24));
    const hours = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    
    let result = '';
    if (days > 0) result += `${days}天`;
    if (hours > 0) result += `${hours}小时`;
    if (minutes > 0) result += `${minutes}分钟`;
    return result || '刚刚启动';
}

export default async function showContainersState(dockerInstance) {
    return new Promise((resolve, reject) => {
        dockerInstance.listContainers({ all: true }, (err, containers) => {
            if (err) {
                console.log(Chalk.redBright.bold('获取容器状态失败：' + err.message));
                reject(err);
                return;
            }

            if (containers.length === 0) {
                console.log(Chalk.yellowBright.bold('当前没有任何容器'));
                resolve();
                return;
            }

            console.log(Chalk.cyanBright.bold('\n容器状态列表：'));
            console.log(Chalk.cyanBright.bold('----------------------------------------'));
            
            containers.forEach(container => {
                const name = container.Names[0].substring(1);
                const status = container.State;
                const uptime = container.Status.includes('Up') ? formatUptime(container.Status.match(/Up\s+(\d+)/)[1]) : '已停止';
                const ports = container.Ports.map(p => `${p.PublicPort}:${p.PrivatePort}`).join(', ') || '无';
                
                const statusColor = status === 'running' ? Chalk.green : Chalk.red;
                
                console.log(Chalk.white.bold(`容器名称: ${name}`));
                console.log(`状态: ${statusColor(status)}`);
                console.log(`运行时间: ${uptime}`);
                console.log(`端口映射: ${ports}`);
                console.log(Chalk.cyanBright.bold('----------------------------------------'));
            });
            
            resolve();
        });
    });
}
