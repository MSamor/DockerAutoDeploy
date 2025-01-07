import Chalk from "chalk";

function formatUptime(status) {
    if (!status.includes('Up')) return '已停止';
    
    const match = status.match(/Up\s+(\d+)\s+(\w+)/);
    if (!match) return '刚刚启动';
    
    const [_, value, unit] = match;
    const num = parseInt(value);
    
    switch(unit) {
        case 'days':
        case 'day':
            return `${num}天`;
        case 'hours':
        case 'hour':
            return `${num}小时`;
        case 'minutes':
        case 'minute':
            return `${num}分钟`;
        case 'seconds':
        case 'second':
            return num > 30 ? `${num}秒` : '刚刚启动';
        default:
            return '刚刚启动';
    }
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
                const uptime = formatUptime(container.Status);
                const ports = container.Ports.map(p => `${p.PublicPort}:${p.PrivatePort}`).join(', ') || '无';
                
                const statusColor = status === 'running' ? Chalk.green : Chalk.red;
                
                console.log(
                    Chalk.white.bold(`${name.padEnd(20)} `) +
                    `[${statusColor(status.padEnd(8))}] ` +
                    `运行时间: ${uptime.padEnd(15)} ` +
                    `端口: ${ports}`
                );
            });
            
            console.log(Chalk.cyanBright.bold('----------------------------------------'));
            resolve();
        });
    });
}
