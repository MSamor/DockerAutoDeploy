import Chalk from "chalk";

export default async function clearUnusedImages(dockerInstance) {
    return new Promise((resolve, reject) => {
        dockerInstance.listImages({ filters: { dangling: ['true'] } }, (err, images) => {
            if (err) {
                console.log(Chalk.redBright.bold('获取未使用镜像失败：' + err.message));
                reject(err);
                return;
            }

            if (images.length === 0) {
                console.log(Chalk.greenBright.bold('没有未使用的镜像需要清理'));
                resolve();
                return;
            }

            console.log(Chalk.yellowBright.bold(`发现 ${images.length} 个未使用镜像，正在清理...`));
            
            const removePromises = images.map(image => {
                return new Promise((resolveRemove) => {
                    dockerInstance.getImage(image.Id).remove((removeErr) => {
                        if (removeErr) {
                            console.log(Chalk.redBright.bold(`清理镜像 ${image.Id.substring(7, 19)} 失败：${removeErr.message}`));
                        } else {
                            console.log(Chalk.greenBright.bold(`清理镜像 ${image.Id.substring(7, 19)} 成功`));
                        }
                        resolveRemove();
                    });
                });
            });

            Promise.all(removePromises).then(() => {
                console.log(Chalk.greenBright.bold('清理完成'));
                resolve();
            });
        });
    });
}
